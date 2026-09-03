import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { dispatchSweepThroughRail } from "../dispatch";
import { InMemoryJobStore } from "../store";
import { LOCK_KEYS } from "../lock";
import type { HandlerResult, WorkflowContext } from "../types";

/**
 * V3-43 — the SWEEP-on-rail dispatch seam. Proves that retiring a cron tick onto
 * the rail preserves the pre-rail behavior: the sweep runs at most once per
 * trigger, a peer that already claimed the job makes this fire no-op (loser
 * no-ops), and a failing sweep dead-letters instead of retry-storming.
 */

const NOW = new Date("2026-07-24T09:00:00.000Z");

describe("V3-43 dispatch: retire a sweep onto the rail, behavior-preserving", () => {
  it("runs the registered handler exactly once and dispositions it succeeded", async () => {
    const store = new InMemoryJobStore();
    let runs = 0;
    const handler = async (_ctx: WorkflowContext): Promise<HandlerResult> => {
      runs += 1;
      return { ok: true };
    };
    const summary = await dispatchSweepThroughRail({
      store,
      key: LOCK_KEYS.studioAgencyTick,
      handler,
      worker: "w1",
      now: NOW,
      idempotencyKey: "studio.agency.tick:2026-07-24T09:00",
      newJobId: "job-1",
    });
    assert.equal(runs, 1);
    assert.equal(summary.claimed, 1);
    assert.equal(summary.succeeded, 1);
    assert.equal(summary.deadLettered, 0);
  });

  it("no-ops when a peer already holds this trigger's job (single-flight loser)", async () => {
    const store = new InMemoryJobStore();
    // A peer enqueued + claimed the same idempotency key moments ago.
    await store.enqueue({
      id: "peer-job",
      workflowKey: LOCK_KEYS.studioAgencyTick,
      payload: {},
      idempotencyKey: "studio.agency.tick:2026-07-24T09:00",
      maxAttempts: 1,
      runAfter: NOW.toISOString(),
      now: NOW,
    });
    await store.claimOne({ worker: "peer", now: NOW, visibilityMs: 90_000 });

    let runs = 0;
    const handler = async (): Promise<HandlerResult> => {
      runs += 1;
      return { ok: true };
    };
    const summary = await dispatchSweepThroughRail({
      store,
      key: LOCK_KEYS.studioAgencyTick,
      handler,
      worker: "w2",
      now: NOW, // same visibility window — the peer's claim has not lapsed
      idempotencyKey: "studio.agency.tick:2026-07-24T09:00",
      newJobId: "job-2",
    });
    assert.equal(runs, 0, "the sweep must NOT run a second time this trigger");
    assert.equal(summary.claimed, 0);
  });

  it("a throwing sweep dead-letters (maxAttempts:1) — no retry storm", async () => {
    const store = new InMemoryJobStore();
    const handler = async (): Promise<HandlerResult> => {
      throw new Error("sweep blew up");
    };
    const summary = await dispatchSweepThroughRail({
      store,
      key: LOCK_KEYS.hubOperatorTick,
      handler,
      worker: "w1",
      now: NOW,
      idempotencyKey: "hub.operator.tick:2026-07-24T09:00",
      newJobId: "job-3",
    });
    assert.equal(summary.deadLettered, 1);
    assert.equal(summary.requeued, 0);
  });
});
