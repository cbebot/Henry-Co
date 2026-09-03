import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  LEDGER_ACCOUNTS,
  assertBalanced,
  LedgerImbalanceError,
  buildChargeSettlementLinesWithFee,
  buildSaleRevenueLines,
  buildSaleRevenueReversalLines,
  computeProportionalVatReversal,
  buildPartialSaleRevenueReversalLines,
  type JournalLine,
} from "../ledger";

/**
 * V3-VAT-01 — the TS half (in-process mirror) of the VAT-aware ledger postings.
 * Pure line assembly: the fee + fee-VAT are pre-resolved (the DB RPC computes the
 * statutory split; pricing's splitVatInclusive proves the math). These prove the
 * ASSEMBLY: the right accounts on the right sides, balanced, with the debit total
 * still equal to the gross so the V3-18 receipt + wallet reconciliations are intact.
 */

const debitTotal = (lines: JournalLine[]) => lines.reduce((s, l) => s + l.debitMinor, 0);
const creditTotal = (lines: JournalLine[]) => lines.reduce((s, l) => s + l.creditMinor, 0);
const byAccount = (lines: JournalLine[]) => Object.fromEntries(lines.map((l) => [l.accountCode, l]));

describe("VAT chart of accounts", () => {
  it("has vat_output_payable (liability/credit) and fee_vat_recoverable (asset/debit)", () => {
    assert.equal(LEDGER_ACCOUNTS.vat_output_payable.type, "liability");
    assert.equal(LEDGER_ACCOUNTS.vat_output_payable.normalBalance, "credit");
    assert.equal(LEDGER_ACCOUNTS.fee_vat_recoverable.type, "asset");
    assert.equal(LEDGER_ACCOUNTS.fee_vat_recoverable.normalBalance, "debit");
  });

  it("retires the V3-17 vat_payable placeholder (renamed to vat_output_payable)", () => {
    assert.ok(!("vat_payable" in LEDGER_ACCOUNTS));
  });
});

describe("buildChargeSettlementLinesWithFee — Phase 1 split (owner absorbs the fee)", () => {
  it("splits the debit: cash_net + processor_fees + fee_vat_recoverable; debit total === gross", () => {
    // REAL Paystack sample: gross 40333, fee 10283 (VAT-inclusive). 10283/1.075=9565.58
    // → 9566 ex + 717 VAT (proven in @henryco/pricing). net = 40333 − 10283 = 30050.
    const lines = buildChargeSettlementLinesWithFee({ grossMinor: 40333, feeMinor: 10283, feeVatMinor: 717 });
    assert.doesNotThrow(() => assertBalanced(lines));
    assert.equal(debitTotal(lines), 40333, "debit total MUST equal gross (receipt reconciliation tie)");
    assert.equal(creditTotal(lines), 40333);
    const acct = byAccount(lines);
    assert.equal(acct.cash_settlement.debitMinor, 30050);
    assert.equal(acct.processor_fees.debitMinor, 9566);
    assert.equal(acct.fee_vat_recoverable.debitMinor, 717);
    assert.equal(acct.payments_clearing.creditMinor, 40333);
  });

  it("degrades to gross-to-cash when the fee is unknown (0) — never fabricates a fee", () => {
    const lines = buildChargeSettlementLinesWithFee({ grossMinor: 40333, feeMinor: 0, feeVatMinor: 0 });
    assert.deepEqual(lines, [
      { accountCode: "cash_settlement", debitMinor: 40333, creditMinor: 0 },
      { accountCode: "payments_clearing", debitMinor: 0, creditMinor: 40333 },
    ]);
  });

  it("omits a zero VAT line (fee with no reported/derived VAT): cash_net + processor_fees only", () => {
    const lines = buildChargeSettlementLinesWithFee({ grossMinor: 10000, feeMinor: 150, feeVatMinor: 0 });
    assert.doesNotThrow(() => assertBalanced(lines));
    const acct = byAccount(lines);
    assert.equal(acct.cash_settlement.debitMinor, 9850);
    assert.equal(acct.processor_fees.debitMinor, 150);
    assert.ok(!("fee_vat_recoverable" in acct), "no zero-amount VAT line");
    assert.equal(debitTotal(lines), 10000);
  });

  it("rejects a fee >= gross (a fee can never meet or exceed the money received)", () => {
    assert.throws(() => buildChargeSettlementLinesWithFee({ grossMinor: 1000, feeMinor: 1000, feeVatMinor: 70 }), LedgerImbalanceError);
    assert.throws(() => buildChargeSettlementLinesWithFee({ grossMinor: 1000, feeMinor: 1500, feeVatMinor: 100 }), LedgerImbalanceError);
  });

  it("rejects fee VAT greater than the fee itself", () => {
    assert.throws(() => buildChargeSettlementLinesWithFee({ grossMinor: 10000, feeMinor: 150, feeVatMinor: 200 }), LedgerImbalanceError);
  });
});

describe("buildSaleRevenueLines — Phase 2b VATable sale revenue recognition", () => {
  it("credits platform_revenue (ex-VAT) + vat_output_payable; DR clearing gross", () => {
    const lines = buildSaleRevenueLines({ grossMinor: 1075, outputVatMinor: 75 });
    assert.doesNotThrow(() => assertBalanced(lines));
    const acct = byAccount(lines);
    assert.equal(acct.payments_clearing.debitMinor, 1075);
    assert.equal(acct.platform_revenue.creditMinor, 1000);
    assert.equal(acct.vat_output_payable.creditMinor, 75);
  });

  it("non-VATable sale (outputVat 0): DR clearing / CR revenue (2 lines, no VAT line)", () => {
    const lines = buildSaleRevenueLines({ grossMinor: 1000, outputVatMinor: 0 });
    assert.deepEqual(lines, [
      { accountCode: "payments_clearing", debitMinor: 1000, creditMinor: 0 },
      { accountCode: "platform_revenue", debitMinor: 0, creditMinor: 1000 },
    ]);
  });

  it("rejects output VAT >= gross", () => {
    assert.throws(() => buildSaleRevenueLines({ grossMinor: 1000, outputVatMinor: 1000 }), LedgerImbalanceError);
  });
});

describe("buildSaleRevenueReversalLines — refund-ready hook (V3-19): reverses revenue + output VAT", () => {
  it("is the exact reverse of buildSaleRevenueLines (each side swapped), balanced", () => {
    const fwd = buildSaleRevenueLines({ grossMinor: 1075, outputVatMinor: 75 });
    const rev = buildSaleRevenueReversalLines({ grossMinor: 1075, outputVatMinor: 75 });
    assert.doesNotThrow(() => assertBalanced(rev));
    for (const f of fwd) {
      const r = rev.find((x) => x.accountCode === f.accountCode);
      assert.ok(r, `reversal must touch ${f.accountCode}`);
      assert.equal(r.debitMinor, f.creditMinor);
      assert.equal(r.creditMinor, f.debitMinor);
    }
  });
});

describe("computeProportionalVatReversal — V3-19 partial-refund math (mirror of apply_refund_webhook)", () => {
  it("40% partial of 1075 (VAT 75) reverses VAT 30 + revenue 400", () => {
    const r = computeProportionalVatReversal({
      refundMinor: 430, grossMinor: 1075, originalVatMinor: 75,
      remainingVatMinor: 75, remainingRevenueMinor: 1000,
    });
    assert.deepEqual(r, { vatMinor: 30, revenueMinor: 400 });
  });

  it("the FINAL partial reverses the EXACT remainders (no rounding drift)", () => {
    const r = computeProportionalVatReversal({
      refundMinor: 645, grossMinor: 1075, originalVatMinor: 75,
      remainingVatMinor: 45, remainingRevenueMinor: 600,
    });
    assert.deepEqual(r, { vatMinor: 45, revenueMinor: 600 });
  });

  it("adversarial rounding: a final partial can be ALL VAT (revenue exhausted first) — still exact", () => {
    // gross 100 = VAT 60 + revenue 40. Partial 99: prop = 59.4 → 59, floor
    // 99−40 = 59 → vat 59, rev 40 (revenue now exhausted). Final 1: ALL VAT.
    const p1 = computeProportionalVatReversal({
      refundMinor: 99, grossMinor: 100, originalVatMinor: 60,
      remainingVatMinor: 60, remainingRevenueMinor: 40,
    });
    assert.deepEqual(p1, { vatMinor: 59, revenueMinor: 40 });
    const p2 = computeProportionalVatReversal({
      refundMinor: 1, grossMinor: 100, originalVatMinor: 60,
      remainingVatMinor: 1, remainingRevenueMinor: 0,
    });
    assert.deepEqual(p2, { vatMinor: 1, revenueMinor: 0 });
  });

  it("non-VATable sale: every partial is pure revenue", () => {
    const r = computeProportionalVatReversal({
      refundMinor: 500, grossMinor: 1000, originalVatMinor: 0,
      remainingVatMinor: 0, remainingRevenueMinor: 1000,
    });
    assert.deepEqual(r, { vatMinor: 0, revenueMinor: 500 });
  });

  it("a refund the sale remainders cannot cover FAILS LOUDLY (mis-posted sale, never half-reverse)", () => {
    assert.throws(
      () => computeProportionalVatReversal({
        refundMinor: 100, grossMinor: 100, originalVatMinor: 60,
        remainingVatMinor: 10, remainingRevenueMinor: 10,
      }),
      LedgerImbalanceError,
    );
  });
});

describe("buildPartialSaleRevenueReversalLines — V3-19 conditional legs (a zero line is never emitted)", () => {
  it("normal partial: DR revenue + DR vat / CR clearing, balanced", () => {
    const lines = buildPartialSaleRevenueReversalLines({ refundMinor: 430, vatMinor: 30 });
    assert.doesNotThrow(() => assertBalanced(lines));
    const acct = byAccount(lines);
    assert.equal(acct.platform_revenue.debitMinor, 400);
    assert.equal(acct.vat_output_payable.debitMinor, 30);
    assert.equal(acct.payments_clearing.creditMinor, 430);
  });

  it("ALL-VAT partial: NO zero revenue line (2 lines, still balanced)", () => {
    const lines = buildPartialSaleRevenueReversalLines({ refundMinor: 1, vatMinor: 1 });
    assert.doesNotThrow(() => assertBalanced(lines));
    assert.deepEqual(lines, [
      { accountCode: "vat_output_payable", debitMinor: 1, creditMinor: 0 },
      { accountCode: "payments_clearing", debitMinor: 0, creditMinor: 1 },
    ]);
  });

  it("all-revenue partial (no VAT): NO zero VAT line", () => {
    const lines = buildPartialSaleRevenueReversalLines({ refundMinor: 500, vatMinor: 0 });
    assert.deepEqual(lines, [
      { accountCode: "platform_revenue", debitMinor: 500, creditMinor: 0 },
      { accountCode: "payments_clearing", debitMinor: 0, creditMinor: 500 },
    ]);
  });

  it("rejects VAT above the refund amount", () => {
    assert.throws(() => buildPartialSaleRevenueReversalLines({ refundMinor: 100, vatMinor: 101 }), LedgerImbalanceError);
  });
});
