import { test } from "node:test";
import assert from "node:assert/strict";

import {
  decideTopupReconcile,
  reconcileWalletTopups,
  validateFundingAmountKobo,
  WALLET_FUNDING_MIN_KOBO,
  WALLET_FUNDING_MIN_NAIRA,
  RAIL_TOPUP_METHODS,
  TOPUP_FUNDING_STATUS,
  TOPUP_LEDGER_REFERENCE_TYPE,
  type TopupRequest,
  type IntentRow,
  type WalletTopupReconcilePort,
} from "./wallet-topup";

/* -------------------------------------------------------------------------- */
/*  validateFundingAmountKobo — the shared min floor with NO upper bound       */
/* -------------------------------------------------------------------------- */

test("funding min: floor is NGN 100 (10,000 kobo) and the naira derivation matches", () => {
  assert.equal(WALLET_FUNDING_MIN_KOBO, 10_000);
  assert.equal(WALLET_FUNDING_MIN_NAIRA, 100);
});

test("validate: an amount exactly at the floor is accepted", () => {
  assert.equal(validateFundingAmountKobo(WALLET_FUNDING_MIN_KOBO), null);
});

test("validate: an amount below the floor is rejected (below_min)", () => {
  assert.equal(validateFundingAmountKobo(WALLET_FUNDING_MIN_KOBO - 1), "below_min");
  assert.equal(validateFundingAmountKobo(0), "not_integer");
});

test("validate: a non-integer / non-positive / non-finite amount is rejected (not_integer)", () => {
  assert.equal(validateFundingAmountKobo(150.5), "not_integer");
  assert.equal(validateFundingAmountKobo(-50_000), "not_integer");
  assert.equal(validateFundingAmountKobo(Number.NaN), "not_integer");
  assert.equal(validateFundingAmountKobo(Number.POSITIVE_INFINITY), "not_integer");
});

test("validate: there is NO fixed maximum — very large safe-integer amounts pass", () => {
  // Owner decision: no ceiling here; R1 reauth + provider limits are the guardrails.
  assert.equal(validateFundingAmountKobo(5_000_000_00), null); // NGN 5,000,000
  assert.equal(validateFundingAmountKobo(Number.MAX_SAFE_INTEGER), null);
});

/* -------------------------------------------------------------------------- */
/*  decideTopupReconcile — the pure money decision                            */
/* -------------------------------------------------------------------------- */

function req(over: Partial<TopupRequest> = {}): TopupRequest {
  return {
    id: "fr-1",
    amountKobo: 500000,
    currency: "NGN",
    paymentReference: "key-1",
    status: TOPUP_FUNDING_STATUS.pending,
    railTopup: true,
    ...over,
  };
}

function intent(over: Partial<IntentRow> = {}): IntentRow {
  return { id: "pi-1", status: "succeeded", amountMinor: 500000, currency: "NGN", ...over };
}

test("decide: succeeded intent with matching amount/currency → credit", () => {
  assert.deepEqual(decideTopupReconcile(req(), intent()), { action: "credit" });
});

test("decide: non-rail funding request → skip not_rail (never auto-credit a manual transfer)", () => {
  assert.deepEqual(decideTopupReconcile(req({ railTopup: false }), intent()), {
    action: "skip",
    reason: "not_rail",
  });
});

test("decide: no linked intent → skip no_intent", () => {
  assert.deepEqual(decideTopupReconcile(req(), null), { action: "skip", reason: "no_intent" });
});

test("decide: intent still pending/processing → skip intent_not_succeeded", () => {
  assert.deepEqual(decideTopupReconcile(req(), intent({ status: "pending" })), {
    action: "skip",
    reason: "intent_not_succeeded",
  });
  assert.deepEqual(decideTopupReconcile(req(), intent({ status: "processing" })), {
    action: "skip",
    reason: "intent_not_succeeded",
  });
});

test("decide: intent failed → skip intent_not_succeeded (never credit a failed charge)", () => {
  assert.deepEqual(decideTopupReconcile(req(), intent({ status: "failed" })), {
    action: "skip",
    reason: "intent_not_succeeded",
  });
});

test("decide: amount mismatch → flag, never credit", () => {
  assert.deepEqual(decideTopupReconcile(req({ amountKobo: 400000 }), intent({ amountMinor: 500000 })), {
    action: "flag",
    reason: "amount_mismatch",
  });
});

test("decide: currency mismatch → flag, never credit", () => {
  assert.deepEqual(decideTopupReconcile(req({ currency: "USD" }), intent({ currency: "NGN" })), {
    action: "flag",
    reason: "currency_mismatch",
  });
});

test("rail methods are exactly card, bank_transfer, ussd", () => {
  assert.deepEqual([...RAIL_TOPUP_METHODS], ["card", "bank_transfer", "ussd"]);
});

/* -------------------------------------------------------------------------- */
/*  In-memory port — models the ATOMIC credit RPC (balance + wallet log +     */
/*  double-entry journal in one idempotent transaction) so we can prove the   */
/*  orchestration + every money invariant.                                    */
/* -------------------------------------------------------------------------- */

type StoreReq = {
  id: string;
  userId: string;
  amountKobo: number;
  currency: string;
  paymentReference: string;
  status: string;
  railTopup: boolean;
};

class FakeStore implements WalletTopupReconcilePort {
  requests = new Map<string, StoreReq>();
  intents = new Map<string, IntentRow>(); // key: `${userId}:${paymentReference}`
  balanceKobo = 0;
  ledger = new Set<string>(); // requestIds with a credit applied (== wallet_transactions row exists)
  ledgerRows: Array<{ requestId: string; amountKobo: number; balanceAfterKobo: number; intentId: string }> = [];
  credited: Array<{ requestId: string; intentId: string; balanceAfterKobo: number }> = [];

  // test knobs
  forceClaimLose = new Set<string>(); // simulate losing the CAS race
  failApplyOnce = false; // simulate a transient DB failure of the atomic credit

  seedReq(r: StoreReq) {
    this.requests.set(r.id, r);
  }
  seedIntent(userId: string, i: IntentRow, paymentReference: string) {
    this.intents.set(`${userId}:${paymentReference}`, i);
  }

  async listClaimable(userId: string): Promise<TopupRequest[]> {
    return [...this.requests.values()]
      .filter(
        (r) =>
          r.userId === userId &&
          r.railTopup &&
          (r.status === TOPUP_FUNDING_STATUS.pending || r.status === TOPUP_FUNDING_STATUS.crediting),
      )
      .map((r) => ({
        id: r.id,
        amountKobo: r.amountKobo,
        currency: r.currency,
        paymentReference: r.paymentReference,
        status: r.status,
        railTopup: r.railTopup,
      }));
  }

  async findIntentByReference(userId: string, paymentReference: string): Promise<IntentRow | null> {
    return this.intents.get(`${userId}:${paymentReference}`) ?? null;
  }

  async claim(requestId: string): Promise<boolean> {
    if (this.forceClaimLose.has(requestId)) return false;
    const r = this.requests.get(requestId);
    if (!r || r.status !== TOPUP_FUNDING_STATUS.pending) return false; // CAS
    r.status = TOPUP_FUNDING_STATUS.crediting;
    return true;
  }

  async revertClaim(requestId: string): Promise<void> {
    const r = this.requests.get(requestId);
    if (r && r.status === TOPUP_FUNDING_STATUS.crediting) r.status = TOPUP_FUNDING_STATUS.pending;
  }

  async ledgerExists(requestId: string): Promise<boolean> {
    return this.ledger.has(requestId);
  }

  // The atomic credit: balance + wallet log + double-entry journal in ONE txn,
  // idempotent by the funding request. Mirrors payments_private.credit_wallet_topup.
  async applyTopupCredit(input: {
    userId: string;
    requestId: string;
    intentId: string;
    amountKobo: number;
    currency: string;
  }): Promise<{ credited: boolean; balanceAfterKobo: number }> {
    if (this.failApplyOnce) {
      this.failApplyOnce = false;
      throw new Error("simulated transient DB failure");
    }
    if (this.ledger.has(input.requestId)) {
      return { credited: false, balanceAfterKobo: this.balanceKobo }; // idempotent no-op
    }
    this.ledger.add(input.requestId);
    this.balanceKobo += input.amountKobo;
    this.ledgerRows.push({
      requestId: input.requestId,
      amountKobo: input.amountKobo,
      balanceAfterKobo: this.balanceKobo,
      intentId: input.intentId,
    });
    return { credited: true, balanceAfterKobo: this.balanceKobo };
  }

  async finalizeVerified(requestId: string): Promise<void> {
    const r = this.requests.get(requestId);
    if (r) r.status = TOPUP_FUNDING_STATUS.verified;
  }

  async onCredited(input: { request: TopupRequest; intentId: string; balanceAfterKobo: number }): Promise<void> {
    this.credited.push({
      requestId: input.request.id,
      intentId: input.intentId,
      balanceAfterKobo: input.balanceAfterKobo,
    });
  }
}

const U = "user-1";
function seedHappyPath(store: FakeStore, opts: { amountKobo?: number; startBalance?: number } = {}) {
  const amountKobo = opts.amountKobo ?? 500000;
  store.balanceKobo = opts.startBalance ?? 0;
  store.seedReq({
    id: "fr-1",
    userId: U,
    amountKobo,
    currency: "NGN",
    paymentReference: "key-1",
    status: TOPUP_FUNDING_STATUS.pending,
    railTopup: true,
  });
  store.seedIntent(U, { id: "pi-1", status: "succeeded", amountMinor: amountKobo, currency: "NGN" }, "key-1");
}

/* -------------------------------------------------------------------------- */
/*  reconcileWalletTopups — orchestration + the money invariants              */
/* -------------------------------------------------------------------------- */

test("reconcile: succeeded top-up credits the wallet exactly once and verifies the request", async () => {
  const store = new FakeStore();
  seedHappyPath(store, { startBalance: 100000 });

  const out = await reconcileWalletTopups(U, store);

  assert.equal(out.credited.length, 1);
  assert.equal(store.balanceKobo, 600000); // 100000 + 500000
  assert.equal(store.ledgerRows.length, 1);
  assert.equal(store.ledgerRows[0]?.balanceAfterKobo, 600000);
  assert.equal(store.credited.length, 1); // onCredited side effect fired once
  assert.equal(store.requests.get("fr-1")?.status, TOPUP_FUNDING_STATUS.verified);
  assert.equal(TOPUP_LEDGER_REFERENCE_TYPE, "wallet_topup");
});

test("reconcile: running twice credits ONLY once (idempotent — the core money invariant)", async () => {
  const store = new FakeStore();
  seedHappyPath(store, { startBalance: 0 });

  await reconcileWalletTopups(U, store);
  const out2 = await reconcileWalletTopups(U, store);

  assert.equal(out2.credited.length, 0);
  assert.equal(store.balanceKobo, 500000); // not 1,000,000
  assert.equal(store.ledgerRows.length, 1);
});

test("reconcile: intent not yet succeeded → no credit, request stays pending (self-heals later)", async () => {
  const store = new FakeStore();
  store.balanceKobo = 0;
  store.seedReq({
    id: "fr-1",
    userId: U,
    amountKobo: 500000,
    currency: "NGN",
    paymentReference: "key-1",
    status: TOPUP_FUNDING_STATUS.pending,
    railTopup: true,
  });
  store.seedIntent(U, { id: "pi-1", status: "processing", amountMinor: 500000, currency: "NGN" }, "key-1");

  const out = await reconcileWalletTopups(U, store);

  assert.equal(out.credited.length, 0);
  assert.equal(store.balanceKobo, 0);
  assert.equal(store.requests.get("fr-1")?.status, TOPUP_FUNDING_STATUS.pending);

  // later the webhook confirms → succeeded → a subsequent reconcile credits
  store.intents.set(`${U}:key-1`, { id: "pi-1", status: "succeeded", amountMinor: 500000, currency: "NGN" });
  const out2 = await reconcileWalletTopups(U, store);
  assert.equal(out2.credited.length, 1);
  assert.equal(store.balanceKobo, 500000);
});

test("reconcile: manual bank-transfer-proof request (not rail) is never auto-credited", async () => {
  const store = new FakeStore();
  store.balanceKobo = 0;
  store.seedReq({
    id: "fr-manual",
    userId: U,
    amountKobo: 500000,
    currency: "NGN",
    paymentReference: "HCW-MANUAL",
    status: TOPUP_FUNDING_STATUS.pending,
    railTopup: false, // manual proof flow
  });
  store.seedIntent(U, { id: "pi-x", status: "succeeded", amountMinor: 500000, currency: "NGN" }, "HCW-MANUAL");

  const out = await reconcileWalletTopups(U, store);

  assert.equal(out.credited.length, 0);
  assert.equal(store.balanceKobo, 0);
  assert.equal(store.requests.get("fr-manual")?.status, TOPUP_FUNDING_STATUS.pending);
});

test("reconcile: lost claim race → this worker credits nothing (single-winner)", async () => {
  const store = new FakeStore();
  seedHappyPath(store, { startBalance: 0 });
  store.forceClaimLose.add("fr-1"); // another worker won the claim

  const out = await reconcileWalletTopups(U, store);

  assert.equal(out.credited.length, 0);
  assert.equal(store.balanceKobo, 0);
  assert.equal(store.ledgerRows.length, 0);
});

test("reconcile: atomic credit fails transiently → reverts claim, no partial credit, retries clean next pass", async () => {
  const store = new FakeStore();
  seedHappyPath(store, { startBalance: 0 });
  store.failApplyOnce = true; // first atomic credit attempt throws (e.g. transient DB error)

  const out = await reconcileWalletTopups(U, store);

  assert.equal(out.credited.length, 0);
  assert.equal(store.balanceKobo, 0); // no balance moved (atomic — all or nothing)
  assert.equal(store.ledgerRows.length, 0);
  // claim was reverted so the request is claimable again
  assert.equal(store.requests.get("fr-1")?.status, TOPUP_FUNDING_STATUS.pending);

  const out2 = await reconcileWalletTopups(U, store);
  assert.equal(out2.credited.length, 1);
  assert.equal(store.balanceKobo, 500000); // credited exactly once on retry
});

test("reconcile recovery: crash left request 'processing_credit' WITH ledger → finalize only, no re-credit", async () => {
  const store = new FakeStore();
  store.balanceKobo = 500000; // money already credited before the crash
  store.seedReq({
    id: "fr-1",
    userId: U,
    amountKobo: 500000,
    currency: "NGN",
    paymentReference: "key-1",
    status: TOPUP_FUNDING_STATUS.crediting, // stuck mid-credit
    railTopup: true,
  });
  store.ledger.add("fr-1"); // atomic credit had completed (balance + ledger together)
  store.seedIntent(U, { id: "pi-1", status: "succeeded", amountMinor: 500000, currency: "NGN" }, "key-1");

  const out = await reconcileWalletTopups(U, store);

  assert.equal(out.credited.length, 0); // no NEW credit
  assert.equal(store.balanceKobo, 500000); // unchanged — not double credited
  assert.equal(store.requests.get("fr-1")?.status, TOPUP_FUNDING_STATUS.verified);
});

test("reconcile recovery: crash left request 'processing_credit' WITHOUT ledger → revert to pending, credit on next pass exactly once", async () => {
  const store = new FakeStore();
  store.balanceKobo = 0; // atomic credit never ran (claim won, then crashed before the credit)
  store.seedReq({
    id: "fr-1",
    userId: U,
    amountKobo: 500000,
    currency: "NGN",
    paymentReference: "key-1",
    status: TOPUP_FUNDING_STATUS.crediting,
    railTopup: true,
  });
  store.seedIntent(U, { id: "pi-1", status: "succeeded", amountMinor: 500000, currency: "NGN" }, "key-1");

  const out = await reconcileWalletTopups(U, store);
  assert.equal(out.credited.length, 0); // recovery pass only reverts
  assert.equal(store.requests.get("fr-1")?.status, TOPUP_FUNDING_STATUS.pending);

  const out2 = await reconcileWalletTopups(U, store);
  assert.equal(out2.credited.length, 1);
  assert.equal(store.balanceKobo, 500000); // credited exactly once
});

test("reconcile: amount mismatch is flagged and never credited", async () => {
  const store = new FakeStore();
  store.balanceKobo = 0;
  store.seedReq({
    id: "fr-1",
    userId: U,
    amountKobo: 500000,
    currency: "NGN",
    paymentReference: "key-1",
    status: TOPUP_FUNDING_STATUS.pending,
    railTopup: true,
  });
  // intent confirms a DIFFERENT amount than the funding request claims
  store.seedIntent(U, { id: "pi-1", status: "succeeded", amountMinor: 400000, currency: "NGN" }, "key-1");

  const out = await reconcileWalletTopups(U, store);

  assert.equal(out.credited.length, 0);
  assert.equal(out.flagged.length, 1);
  assert.equal(out.flagged[0]?.reason, "amount_mismatch");
  assert.equal(store.balanceKobo, 0);
  assert.equal(store.requests.get("fr-1")?.status, TOPUP_FUNDING_STATUS.pending);
});
