import { test } from "node:test";
import assert from "node:assert/strict";

import { reservePlatformAiSpend, type PlatformSpendLedger } from "../budget";

/** An atomic serialized daily counter — models the ai_free_spend_add RPC exactly
 *  (atomic upsert increment returning the new total; negative deltas clamped). */
function ledgerFake(initial = 0): PlatformSpendLedger & { total: () => number } {
  let total = initial;
  let chain: Promise<unknown> = Promise.resolve();
  return {
    add(kobo: number): Promise<number> {
      const next = chain.then(() => {
        total += Math.max(0, kobo);
        return total;
      });
      chain = next.catch(() => undefined);
      return next;
    },
    total: () => total,
  };
}

test("reserve under the ceiling: allowed, estimate counted BEFORE the run", async () => {
  const ledger = ledgerFake(100);
  const outcome = await reservePlatformAiSpend({ ledger, estimateKobo: 50, ceilingKobo: 500 });
  assert.deepEqual(outcome, { allowed: true, totalAfterKobo: 150 });
  assert.equal(ledger.total(), 150);
});

test("reserve at the ceiling: refused, reservation stays burned (fail-safe overcount)", async () => {
  const ledger = ledgerFake(480);
  const outcome = await reservePlatformAiSpend({ ledger, estimateKobo: 50, ceilingKobo: 500 });
  assert.deepEqual(outcome, { allowed: false, reason: "ceiling" });
  assert.equal(ledger.total(), 530, "the refused reservation is NOT refunded — conservative");
});

test("ABSOLUTE: two concurrent runs cannot each spend the ceiling", async () => {
  // Remaining headroom 100, each run wants 60 — only ONE may proceed.
  const ledger = ledgerFake(400);
  const [a, b] = await Promise.all([
    reservePlatformAiSpend({ ledger, estimateKobo: 60, ceilingKobo: 500 }),
    reservePlatformAiSpend({ ledger, estimateKobo: 60, ceilingKobo: 500 }),
  ]);
  const allowedCount = [a, b].filter((r) => r.allowed).length;
  assert.equal(allowedCount, 1, "exactly one of two racing reserves may run");
  assert.equal(ledger.total(), 520, "both reservations counted; only one call runs");
});

test("many concurrent runs: total spend never exceeds ceiling + one estimate of overshoot", async () => {
  const ledger = ledgerFake(0);
  const outcomes = await Promise.all(
    Array.from({ length: 20 }, () => reservePlatformAiSpend({ ledger, estimateKobo: 100, ceilingKobo: 500 })),
  );
  const allowed = outcomes.filter((r) => r.allowed).length;
  assert.equal(allowed, 5, "floor(ceiling / estimate) runs proceed, never more");
});

test("degrade CLOSED: a throwing ledger refuses the call", async () => {
  const ledger: PlatformSpendLedger = { add: async () => { throw new Error("relation does not exist"); } };
  const outcome = await reservePlatformAiSpend({ ledger, estimateKobo: 10, ceilingKobo: 500 });
  assert.deepEqual(outcome, { allowed: false, reason: "ledger_unavailable" });
});

test("degrade CLOSED: a non-numeric ledger total refuses the call", async () => {
  const ledger: PlatformSpendLedger = { add: async () => Number.NaN };
  const outcome = await reservePlatformAiSpend({ ledger, estimateKobo: 10, ceilingKobo: 500 });
  assert.deepEqual(outcome, { allowed: false, reason: "ledger_unavailable" });
});

test("disabled: zero/negative ceiling or estimate never runs and never touches the ledger", async () => {
  let touched = false;
  const ledger: PlatformSpendLedger = { add: async (k) => { touched = true; return k; } };
  for (const input of [
    { estimateKobo: 0, ceilingKobo: 500 },
    { estimateKobo: -5, ceilingKobo: 500 },
    { estimateKobo: 10, ceilingKobo: 0 },
    { estimateKobo: 10, ceilingKobo: -1 },
    { estimateKobo: Number.NaN, ceilingKobo: 500 },
  ]) {
    const outcome = await reservePlatformAiSpend({ ledger, ...input });
    assert.deepEqual(outcome, { allowed: false, reason: "disabled" });
  }
  assert.equal(touched, false);
});
