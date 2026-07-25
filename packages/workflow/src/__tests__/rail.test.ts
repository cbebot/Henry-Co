import { test } from "node:test";
import assert from "node:assert/strict";

import {
  acquireWorkflowLock,
  backoffMs,
  BUDGET_KEYS,
  DEFAULT_RETRY_POLICY,
  disposeFailure,
  evaluateBudget,
  InMemoryJobStore,
  InMemoryLockStore,
  InMemorySpendStore,
  LOCK_KEYS,
  releaseWorkflowLock,
  runDrain,
  type WorkflowHandler,
  type WorkflowRegistry,
} from "../index";

/**
 * V3-43 durability proofs — the properties the rail must guarantee, provable
 * against the in-memory stores (identical semantics to the DB backing):
 * at-least-once, bounded retry + dead-letter, idempotent re-enqueue, crash
 * reclaim, single-flight, and — the load-bearing one — concurrent ticks can
 * NOT each spend the daily ceiling (SA-3's proven lesson, re-proven on the rail).
 */

const AT = (iso: string) => new Date(iso);

// ── retry math (pure) ────────────────────────────────────────────────────────

test("V3-43 retry: exponential backoff, capped, deterministic jitter", () => {
  const p = { maxAttempts: 8, baseMs: 1000, maxMs: 100_000, jitter: 0 };
  assert.equal(backoffMs(p, "j", 1), 1000);
  assert.equal(backoffMs(p, "j", 2), 2000);
  assert.equal(backoffMs(p, "j", 4), 8000);
  assert.equal(backoffMs(p, "j", 20), 100_000, "capped at maxMs");
  // Jitter is deterministic per (job, attempt) — same seed ⇒ same value.
  const j = { ...p, jitter: 0.2 };
  assert.equal(backoffMs(j, "job-a", 3), backoffMs(j, "job-a", 3));
  assert.notEqual(backoffMs(j, "job-a", 3), backoffMs(j, "job-b", 3), "jitter de-correlates by job");
});

test("V3-43 retry: dead-letter at maxAttempts OR non-retryable", () => {
  const base = {
    id: "j",
    workflowKey: "k",
    payload: {},
    idempotencyKey: null,
    state: "claimed" as const,
    maxAttempts: 3,
    runAfter: "2026-01-01T00:00:00.000Z",
    claimedBy: "w",
    claimedAt: "2026-01-01T00:00:00.000Z",
    visibleAfter: null,
    lastError: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
  const policy = DEFAULT_RETRY_POLICY;
  assert.equal(disposeFailure({ job: { ...base, attempts: 1 }, policy, retryable: true, now: AT(base.runAfter) }).state, "failed");
  assert.equal(
    disposeFailure({ job: { ...base, attempts: 1 }, policy: { ...policy, maxAttempts: 1 }, retryable: true, now: AT(base.runAfter) }).state,
    "dead_letter",
    "attempts>=maxAttempts ⇒ dead_letter",
  );
  assert.equal(disposeFailure({ job: { ...base, attempts: 1 }, policy, retryable: false, now: AT(base.runAfter) }).state, "dead_letter", "non-retryable ⇒ immediate dead_letter");
});

// ── drain engine (at-least-once, idempotency, reclaim) ───────────────────────

function reg(handlers: Record<string, WorkflowHandler>): WorkflowRegistry {
  return new Map(Object.entries(handlers));
}

test("V3-43 drain: a job runs its handler exactly once and succeeds", async () => {
  const store = new InMemoryJobStore();
  const now = AT("2026-07-24T00:00:00.000Z");
  await store.enqueue({ id: "1", workflowKey: "k", payload: { x: 1 }, idempotencyKey: null, maxAttempts: 8, runAfter: now.toISOString(), now });
  let ran = 0;
  const summary = await runDrain({ registry: reg({ k: async () => { ran += 1; return { ok: true }; } }), store, worker: "w1", now });
  assert.equal(ran, 1);
  assert.equal(summary.succeeded, 1);
  assert.equal(store.get("1")?.state, "succeeded");
});

test("V3-43 idempotency: re-enqueue of the same (key, idempotencyKey) is a no-op; the job runs once", async () => {
  const store = new InMemoryJobStore();
  const now = AT("2026-07-24T00:00:00.000Z");
  const a = await store.enqueue({ id: "1", workflowKey: "k", payload: {}, idempotencyKey: "same", maxAttempts: 8, runAfter: now.toISOString(), now });
  const b = await store.enqueue({ id: "2", workflowKey: "k", payload: {}, idempotencyKey: "same", maxAttempts: 8, runAfter: now.toISOString(), now });
  assert.equal(a.enqueued, true);
  assert.equal(b.enqueued, false, "duplicate (key, idem) must not create a second job");
  assert.equal(store.snapshot().length, 1);
  let ran = 0;
  await runDrain({ registry: reg({ k: async () => { ran += 1; return { ok: true }; } }), store, worker: "w1", now });
  assert.equal(ran, 1, "the deduped work runs exactly once");
});

test("V3-43 replay: a re-delivered/duplicate drain does not re-run a succeeded job", async () => {
  const store = new InMemoryJobStore();
  const now = AT("2026-07-24T00:00:00.000Z");
  await store.enqueue({ id: "1", workflowKey: "k", payload: {}, idempotencyKey: null, maxAttempts: 8, runAfter: now.toISOString(), now });
  let ran = 0;
  const handler: WorkflowHandler = async () => { ran += 1; return { ok: true }; };
  await runDrain({ registry: reg({ k: handler }), store, worker: "w1", now });
  await runDrain({ registry: reg({ k: handler }), store, worker: "w2", now: AT("2026-07-24T00:05:00.000Z") });
  assert.equal(ran, 1, "a succeeded job is never re-claimed");
});

test("V3-43 retry→dead-letter: a failing job backs off then dead-letters at the cap", async () => {
  const store = new InMemoryJobStore();
  const policy = { maxAttempts: 3, baseMs: 1000, maxMs: 10_000, jitter: 0 };
  let now = AT("2026-07-24T00:00:00.000Z");
  await store.enqueue({ id: "1", workflowKey: "k", payload: {}, idempotencyKey: null, maxAttempts: 3, runAfter: now.toISOString(), now });
  const failing: WorkflowHandler = async () => ({ ok: false, error: "boom", retryable: true });
  // Drain repeatedly, advancing the clock past each backoff, until terminal.
  for (let i = 0; i < 5; i += 1) {
    await runDrain({ registry: reg({ k: failing }), store, worker: "w", now, policy });
    now = AT(new Date(now.getTime() + 20_000).toISOString());
  }
  const job = store.get("1");
  assert.equal(job?.state, "dead_letter");
  assert.equal(job?.attempts, 3, "exactly maxAttempts tries before dead-letter");
});

test("V3-43 unknown handler ⇒ dead-letter (never an infinite spin)", async () => {
  const store = new InMemoryJobStore();
  const now = AT("2026-07-24T00:00:00.000Z");
  await store.enqueue({ id: "1", workflowKey: "ghost", payload: {}, idempotencyKey: null, maxAttempts: 8, runAfter: now.toISOString(), now });
  const s = await runDrain({ registry: reg({}), store, worker: "w", now });
  assert.equal(s.unknownHandler, 1);
  assert.equal(store.get("1")?.state, "dead_letter");
});

test("V3-43 reclaim: a crash between claim and complete makes the job reclaimable after the visibility timeout", async () => {
  const store = new InMemoryJobStore();
  const t0 = AT("2026-07-24T00:00:00.000Z");
  await store.enqueue({ id: "1", workflowKey: "k", payload: {}, idempotencyKey: null, maxAttempts: 8, runAfter: t0.toISOString(), now: t0 });
  // Worker A claims but "crashes" (never completes).
  const claimed = await store.claimOne({ worker: "A", now: t0, visibilityMs: 90_000 });
  assert.ok(claimed);
  // Before the timeout, B cannot claim it.
  assert.equal(await store.claimOne({ worker: "B", now: AT("2026-07-24T00:01:00.000Z"), visibilityMs: 90_000 }), null);
  // After the timeout, B reclaims it.
  const reclaimed = await store.claimOne({ worker: "B", now: AT("2026-07-24T00:02:00.000Z"), visibilityMs: 90_000 });
  assert.equal(reclaimed?.id, "1");
  assert.equal(reclaimed?.attempts, 2, "the reclaim is a second attempt (at-least-once)");
});

// ── single-flight lock ───────────────────────────────────────────────────────

test("V3-43 single-flight: of two concurrent acquirers, exactly ONE wins", async () => {
  const store = new InMemoryLockStore();
  const now = AT("2026-07-24T00:00:00.000Z");
  const a = await acquireWorkflowLock(store, { key: LOCK_KEYS.studioAgencyTick, ttlSeconds: 90, worker: "A", now });
  const b = await acquireWorkflowLock(store, { key: LOCK_KEYS.studioAgencyTick, ttlSeconds: 90, worker: "B", now });
  assert.equal(a, true);
  assert.equal(b, false, "the second concurrent tick must lose and no-op");
  // Not re-acquirable until TTL expiry.
  assert.equal(await acquireWorkflowLock(store, { key: LOCK_KEYS.studioAgencyTick, ttlSeconds: 90, worker: "C", now: AT("2026-07-24T00:01:00.000Z") }), false);
  // After TTL, re-acquirable.
  assert.equal(await acquireWorkflowLock(store, { key: LOCK_KEYS.studioAgencyTick, ttlSeconds: 90, worker: "C", now: AT("2026-07-24T00:02:00.000Z") }), true);
});

test("V3-43: two DIFFERENT lock keys never contend (studio tick vs operator tick)", async () => {
  const store = new InMemoryLockStore();
  const now = AT("2026-07-24T00:00:00.000Z");
  assert.equal(await acquireWorkflowLock(store, { key: LOCK_KEYS.studioAgencyTick, ttlSeconds: 90, worker: "A", now }), true);
  assert.equal(await acquireWorkflowLock(store, { key: LOCK_KEYS.hubOperatorTick, ttlSeconds: 90, worker: "B", now }), true, "distinct keys are independent single-flights");
});

// ── the load-bearing proof: concurrent ticks can't each spend the ceiling ────

test("V3-43 budget: reserve-before-run — N calls in one tick each see the prior reservation", () => {
  const ceiling = 500_000;
  // First call: nothing spent/committed yet.
  assert.equal(evaluateBudget({ spentTodayKobo: 0, committedKobo: 0, nextEstimateKobo: 200_000, ceilingKobo: ceiling }), "allow");
  // Third call in the same tick, with 400k already reserved this tick: exhausted.
  assert.equal(evaluateBudget({ spentTodayKobo: 0, committedKobo: 400_000, nextEstimateKobo: 200_000, ceilingKobo: ceiling }), "exhausted");
});

test("V3-43 budget: a broken ledger read degrades CLOSED (null ⇒ exhausted)", () => {
  assert.equal(evaluateBudget({ spentTodayKobo: null, committedKobo: 0, nextEstimateKobo: 1, ceilingKobo: 500_000 }), "exhausted");
});

test("V3-43 PROOF: two concurrent ticks, serialized by the lock, do NOT each spend the daily ceiling", async () => {
  const ceiling = 500_000; // ₦5,000/day
  const perCall = 120_000;
  const lock = new InMemoryLockStore();
  const spend = new InMemorySpendStore();
  const now = AT("2026-07-24T09:00:00.000Z");

  // A tick: acquire the single-flight lock; only the winner reads the fresh
  // baseline + reserves-before-run + spends up to the ceiling. The loser no-ops.
  async function tick(worker: string): Promise<number> {
    const won = await acquireWorkflowLock(lock, { key: LOCK_KEYS.hubOperatorTick, ttlSeconds: 90, worker, now });
    if (!won) return 0;
    try {
      // Read the durable baseline ONCE at tick start (the SA-4 pattern); the
      // in-tick reservation is `committed`, settled to the ledger after each call.
      const baseline = await spend.spentToday({ budgetKey: BUDGET_KEYS.operator, now });
      let committed = 0;
      let spentCalls = 0;
      for (let i = 0; i < 100; i += 1) {
        if (evaluateBudget({ spentTodayKobo: baseline, committedKobo: committed, nextEstimateKobo: perCall, ceilingKobo: ceiling }) !== "allow") break;
        committed += perCall; // RESERVE before "running"
        await spend.add({ budgetKey: BUDGET_KEYS.operator, addKobo: perCall, now }); // settle
        spentCalls += 1;
      }
      return spentCalls;
    } finally {
      await releaseWorkflowLock(lock, { key: LOCK_KEYS.hubOperatorTick, worker, now });
    }
  }

  // Run two ticks "concurrently" (both attempt the lock at the same instant).
  const [a, b] = await Promise.all([tick("A"), tick("B")]);
  const loser = Math.min(a, b);
  const winner = Math.max(a, b);
  assert.equal(loser, 0, "the losing tick spends NOTHING");
  assert.equal(winner, 4, "the winner spends ⌊500000/120000⌋ = 4 calls, never more");
  const total = await spend.spentToday({ budgetKey: BUDGET_KEYS.operator, now });
  assert.ok((total ?? 0) <= ceiling, `total spend ${total} must not exceed the ceiling ${ceiling}`);
  assert.equal(total, 4 * perCall);
});
