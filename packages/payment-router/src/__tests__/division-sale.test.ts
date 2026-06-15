import { test } from "node:test";
import assert from "node:assert/strict";

import {
  decideSaleReconcile,
  reconcileDivisionSale,
  type DivisionSaleAttempt,
  type DivisionSaleIntent,
  type DivisionSaleReconcilePort,
} from "../division-sale";

/* ------------------------------------------------------------------ */
/*  In-memory fake port — models the order/attempt rows + a confirmed  */
/*  intent, so every race in reconcileDivisionSale is unit-testable.   */
/* ------------------------------------------------------------------ */

type Row = DivisionSaleAttempt & { settledByEntry: boolean; finalized: boolean };

class FakePort implements DivisionSaleReconcilePort {
  applyCalls = 0;
  finalizeCalls = 0;
  settledFresh = 0;
  onSettledCalls = 0;
  /** Force applySaleSettlement to throw once (a transient DB error). */
  failNextApply = false;

  constructor(
    private readonly rows: Row[],
    private readonly intents: Record<string, DivisionSaleIntent | null>,
  ) {}

  async listClaimable(): Promise<DivisionSaleAttempt[]> {
    return this.rows
      .filter((r) => r.phase === "pending" || r.phase === "settling")
      .map((r) => ({ ...r }));
  }
  async findIntentByReference(reference: string): Promise<DivisionSaleIntent | null> {
    return this.intents[reference] ?? null;
  }
  async claim(attemptId: string): Promise<boolean> {
    const row = this.rows.find((r) => r.id === attemptId);
    if (!row || row.phase !== "pending") return false; // CAS: only pending wins
    row.phase = "settling";
    return true;
  }
  async revertClaim(attemptId: string): Promise<void> {
    const row = this.rows.find((r) => r.id === attemptId);
    if (row && row.phase === "settling") row.phase = "pending";
  }
  async saleEntryExists(intentId: string): Promise<boolean> {
    return this.rows.some((r) => r.settledByEntry && this.intents[r.reference]?.id === intentId);
  }
  async applySaleSettlement(input: {
    attempt: DivisionSaleAttempt;
    intentId: string;
  }): Promise<{ settled: boolean }> {
    this.applyCalls += 1;
    if (this.failNextApply) {
      this.failNextApply = false;
      throw new Error("transient db error");
    }
    const row = this.rows.find((r) => r.id === input.attempt.id)!;
    // Idempotent by the intent: a second post for an existing entry is a no-op.
    const already = row.settledByEntry;
    row.settledByEntry = true;
    if (!already) this.settledFresh += 1;
    return { settled: !already };
  }
  async finalizeSettled(input: { attempt: DivisionSaleAttempt; intentId: string }): Promise<void> {
    this.finalizeCalls += 1;
    const row = this.rows.find((r) => r.id === input.attempt.id)!;
    row.finalized = true;
  }
  async onSettled(): Promise<void> {
    this.onSettledCalls += 1;
  }
}

const NGN = "NGN";
function attempt(over: Partial<Row> = {}): Row {
  return {
    id: "att-1",
    reference: "ref-1",
    grossMinor: 2_500_000,
    outputVatMinor: 0,
    currency: NGN,
    phase: "pending",
    settledByEntry: false,
    finalized: false,
    ...over,
  };
}
function succeededIntent(over: Partial<DivisionSaleIntent> = {}): DivisionSaleIntent {
  return { id: "int-1", status: "succeeded", amountMinor: 2_500_000, currency: NGN, ...over };
}

/* ------------------------------------------------------------------ */
/*  decideSaleReconcile — the pure money decision                     */
/* ------------------------------------------------------------------ */

test("decide: succeeded + matching → settle", () => {
  assert.deepEqual(decideSaleReconcile(attempt(), succeededIntent()), { action: "settle" });
});

test("decide: no intent yet → skip(no_intent)", () => {
  assert.deepEqual(decideSaleReconcile(attempt(), null), { action: "skip", reason: "no_intent" });
});

test("decide: intent not yet succeeded → skip(intent_not_succeeded)", () => {
  assert.deepEqual(decideSaleReconcile(attempt(), succeededIntent({ status: "pending" })), {
    action: "skip",
    reason: "intent_not_succeeded",
  });
});

test("decide: amount mismatch → flag (never silently settle)", () => {
  assert.deepEqual(decideSaleReconcile(attempt(), succeededIntent({ amountMinor: 9_999 })), {
    action: "flag",
    reason: "amount_mismatch",
  });
});

test("decide: currency mismatch → flag", () => {
  assert.deepEqual(decideSaleReconcile(attempt({ currency: "USD" }), succeededIntent()), {
    action: "flag",
    reason: "currency_mismatch",
  });
});

/* ------------------------------------------------------------------ */
/*  reconcileDivisionSale — orchestration + money invariants          */
/* ------------------------------------------------------------------ */

test("settles a confirmed sale exactly once", async () => {
  const port = new FakePort([attempt()], { "ref-1": succeededIntent() });
  const out = await port.listClaimable().then(() => reconcileDivisionSale(port));
  assert.equal(out.settled.length, 1);
  assert.equal(port.settledFresh, 1);
  assert.equal(port.finalizeCalls, 1);
  assert.equal(port.onSettledCalls, 1);
});

test("idempotent: a second pass posts no second settlement", async () => {
  const rows = [attempt()];
  const port = new FakePort(rows, { "ref-1": succeededIntent() });
  await reconcileDivisionSale(port);
  // The row is now finalized/settled; mark it terminal so it is no longer claimable.
  rows[0]!.phase = "settling"; // simulate a still-claimable row that already has its entry
  const out2 = await reconcileDivisionSale(port);
  // Recovery path: entry exists → finalize, no fresh settlement.
  assert.equal(out2.settled.length, 0);
  assert.equal(port.settledFresh, 1);
});

test("skips while the intent is not yet succeeded (self-heals later)", async () => {
  const rows = [attempt()];
  const intents: Record<string, DivisionSaleIntent | null> = {
    "ref-1": succeededIntent({ status: "processing" }),
  };
  const port = new FakePort(rows, intents);
  const out1 = await reconcileDivisionSale(port);
  assert.equal(out1.skipped, 1);
  assert.equal(port.applyCalls, 0);
  assert.equal(rows[0]!.phase, "pending"); // untouched, still claimable

  // The webhook lands; the next reconcile-on-read settles it.
  intents["ref-1"] = succeededIntent();
  const out2 = await reconcileDivisionSale(port);
  assert.equal(out2.settled.length, 1);
});

test("recovery: a 'settling' attempt whose entry exists is finalized, not re-posted", async () => {
  const rows = [attempt({ phase: "settling", settledByEntry: true })];
  const port = new FakePort(rows, { "ref-1": succeededIntent() });
  const out = await reconcileDivisionSale(port);
  assert.equal(port.applyCalls, 0); // never re-posts
  assert.equal(port.finalizeCalls, 1); // finalized
  assert.equal(out.settled.length, 0);
});

test("recovery: a 'settling' attempt with no entry is reverted for a clean retry", async () => {
  const rows = [attempt({ phase: "settling", settledByEntry: false })];
  const port = new FakePort(rows, { "ref-1": succeededIntent() });
  await reconcileDivisionSale(port);
  assert.equal(port.applyCalls, 0);
  assert.equal(rows[0]!.phase, "pending"); // released → claimable again
});

test("a transient apply failure releases the claim (no partial state)", async () => {
  const rows = [attempt()];
  const port = new FakePort(rows, { "ref-1": succeededIntent() });
  port.failNextApply = true;
  const out = await reconcileDivisionSale(port);
  assert.equal(out.settled.length, 0);
  assert.equal(rows[0]!.phase, "pending"); // claim released for retry
  assert.equal(rows[0]!.finalized, false);

  // Next pass succeeds.
  const out2 = await reconcileDivisionSale(port);
  assert.equal(out2.settled.length, 1);
  assert.equal(rows[0]!.finalized, true);
});

test("amount mismatch is flagged, money is never posted", async () => {
  const rows = [attempt()];
  const port = new FakePort(rows, { "ref-1": succeededIntent({ amountMinor: 1 }) });
  const out = await reconcileDivisionSale(port);
  assert.equal(out.flagged.length, 1);
  assert.equal(out.flagged[0]!.reason, "amount_mismatch");
  assert.equal(port.applyCalls, 0);
  assert.equal(rows[0]!.phase, "pending");
});
