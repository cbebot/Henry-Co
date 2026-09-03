import { test } from "node:test";
import assert from "node:assert/strict";

import {
  reservePredictiveAiSpend,
  resolvePredictiveBudgetKobo,
  PREDICTIVE_SPEND_BUDGET_KEY,
  PREDICTIVE_AI_DAILY_BUDGET_KOBO_DEFAULT,
  type PredictiveSpendLedger,
} from "../budget";

/**
 * A serialized atomic daily counter — models `internal_ai_spend_add` exactly:
 * atomic upsert increment returning the NEW total, negative deltas clamped.
 * Concurrency is modelled by chaining, the way the Postgres row lock serializes
 * concurrent upserts.
 */
function ledgerFake(initial = 0): PredictiveSpendLedger & { total: () => number } {
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

test("reserve BEFORE run: under the ceiling the estimate is already counted", async () => {
  const ledger = ledgerFake(100);
  const outcome = await reservePredictiveAiSpend({ ledger, estimateKobo: 50, ceilingKobo: 500 });
  assert.deepEqual(outcome, { allowed: true, totalAfterKobo: 150 });
  assert.equal(ledger.total(), 150, "spend is durable before the provider is called");
});

test("ceiling: a reservation that would exceed it is refused and stays burned", async () => {
  const ledger = ledgerFake(480);
  const outcome = await reservePredictiveAiSpend({ ledger, estimateKobo: 50, ceilingKobo: 500 });
  assert.deepEqual(outcome, { allowed: false, reason: "ceiling" });
  assert.equal(ledger.total(), 530, "the refused reservation is NOT refunded — conservative");
});

test("ABSOLUTE: two concurrent runs cannot each spend the ceiling", async () => {
  // Headroom is 100; each run wants 60. Exactly one may proceed.
  const ledger = ledgerFake(400);
  const [a, b] = await Promise.all([
    reservePredictiveAiSpend({ ledger, estimateKobo: 60, ceilingKobo: 500 }),
    reservePredictiveAiSpend({ ledger, estimateKobo: 60, ceilingKobo: 500 }),
  ]);
  assert.equal([a, b].filter((r) => r.allowed).length, 1, "exactly one of two racing reserves runs");
  assert.equal(ledger.total(), 520, "both reservations counted; only one call runs");
});

test("many concurrent runs: never more than floor(ceiling / estimate) proceed", async () => {
  const ledger = ledgerFake(0);
  const outcomes = await Promise.all(
    Array.from({ length: 20 }, () =>
      reservePredictiveAiSpend({ ledger, estimateKobo: 100, ceilingKobo: 500 }),
    ),
  );
  assert.equal(outcomes.filter((r) => r.allowed).length, 5);
});

test("degrade CLOSED: an unreachable/unmigrated ledger refuses the call", async () => {
  const ledger: PredictiveSpendLedger = {
    add: async () => {
      throw new Error('relation "internal_ai_spend_ledger" does not exist');
    },
  };
  const outcome = await reservePredictiveAiSpend({ ledger, estimateKobo: 10, ceilingKobo: 500 });
  assert.deepEqual(outcome, { allowed: false, reason: "ledger_unavailable" });
});

test("degrade CLOSED: a non-numeric ledger total refuses the call", async () => {
  const ledger: PredictiveSpendLedger = { add: async () => Number.NaN };
  const outcome = await reservePredictiveAiSpend({ ledger, estimateKobo: 10, ceilingKobo: 500 });
  assert.deepEqual(outcome, { allowed: false, reason: "ledger_unavailable" });
});

test("disabled: a zero/negative ceiling or estimate never touches the ledger", async () => {
  let touched = false;
  const ledger: PredictiveSpendLedger = {
    add: async (k) => {
      touched = true;
      return k;
    },
  };
  for (const input of [
    { estimateKobo: 0, ceilingKobo: 500 },
    { estimateKobo: -5, ceilingKobo: 500 },
    { estimateKobo: 10, ceilingKobo: 0 },
    { estimateKobo: 10, ceilingKobo: -1 },
    { estimateKobo: Number.NaN, ceilingKobo: 500 },
  ]) {
    assert.deepEqual(await reservePredictiveAiSpend({ ledger, ...input }), {
      allowed: false,
      reason: "disabled",
    });
  }
  assert.equal(touched, false);
});

test("budget key is V3-41's own on the UNIFIED ledger — not a new counter, not V3-40's", () => {
  assert.equal(PREDICTIVE_SPEND_BUDGET_KEY, "predictive_ops");
  assert.notEqual(PREDICTIVE_SPEND_BUDGET_KEY, "risk_predictive");
  assert.notEqual(PREDICTIVE_SPEND_BUDGET_KEY, "free_ai");
});

test("ceiling resolves from env with a safe default", () => {
  assert.equal(resolvePredictiveBudgetKobo({}), PREDICTIVE_AI_DAILY_BUDGET_KOBO_DEFAULT);
  assert.equal(resolvePredictiveBudgetKobo({ PREDICTIVE_AI_DAILY_BUDGET_KOBO: "250000" }), 250_000);
  for (const bad of ["", "abc", "-1", "0", "Infinity"]) {
    assert.equal(
      resolvePredictiveBudgetKobo({ PREDICTIVE_AI_DAILY_BUDGET_KOBO: bad }),
      PREDICTIVE_AI_DAILY_BUDGET_KOBO_DEFAULT,
      `"${bad}" must fall back to the default, never to unbounded`,
    );
  }
});
