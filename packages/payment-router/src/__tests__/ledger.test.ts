import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  LEDGER_ACCOUNTS,
  LEDGER_CURRENCY,
  assertBalanced,
  LedgerImbalanceError,
  buildChargeSettlementLines,
  buildWalletTopupLines,
  buildRefundLines,
  type JournalLine,
} from "../ledger";

/**
 * V3-17 — the pure TS half of the double-entry balance invariant. This is the
 * in-process mirror of the DB deferred-constraint trigger (defense in depth): the
 * DB is the unbypassable guard, this catches an imbalance before the round-trip.
 */

const dr = (accountCode: JournalLine["accountCode"], n: number): JournalLine => ({
  accountCode,
  debitMinor: n,
  creditMinor: 0,
});
const cr = (accountCode: JournalLine["accountCode"], n: number): JournalLine => ({
  accountCode,
  debitMinor: 0,
  creditMinor: n,
});

describe("ledger chart of accounts", () => {
  it("ledger currency is the NGN system base", () => {
    assert.equal(LEDGER_CURRENCY, "NGN");
  });

  it("every account's normal balance matches its type", () => {
    for (const [code, account] of Object.entries(LEDGER_ACCOUNTS)) {
      const debitNormal = account.type === "asset" || account.type === "expense";
      assert.equal(
        account.normalBalance,
        debitNormal ? "debit" : "credit",
        `${code} (${account.type}) should be ${debitNormal ? "debit" : "credit"}-normal`,
      );
    }
  });

  it("defines every account the wired money edges post across", () => {
    for (const code of [
      "cash_settlement",
      "payments_clearing",
      "customer_wallet_liability",
      "platform_revenue",
      "refunds",
      "processor_fees",
      "vat_output_payable",
      "fee_vat_recoverable",
    ]) {
      assert.ok(code in LEDGER_ACCOUNTS, `missing account ${code}`);
    }
  });
});

describe("assertBalanced — the core money invariant", () => {
  it("accepts a balanced two-line entry", () => {
    assert.doesNotThrow(() => assertBalanced([dr("cash_settlement", 5000), cr("payments_clearing", 5000)]));
  });

  it("accepts a balanced multi-line entry (sum of debits === sum of credits)", () => {
    assert.doesNotThrow(() =>
      assertBalanced([
        dr("cash_settlement", 5000),
        cr("platform_revenue", 4500),
        cr("vat_output_payable", 500),
      ]),
    );
  });

  it("rejects when debits do not equal credits", () => {
    assert.throws(
      () => assertBalanced([dr("cash_settlement", 5000), cr("payments_clearing", 4999)]),
      LedgerImbalanceError,
    );
  });

  it("rejects an entry with fewer than two lines", () => {
    assert.throws(() => assertBalanced([dr("cash_settlement", 5000)]), LedgerImbalanceError);
    assert.throws(() => assertBalanced([]), LedgerImbalanceError);
  });

  it("rejects a zero-total entry (every line zero)", () => {
    assert.throws(
      () => assertBalanced([dr("cash_settlement", 0), cr("payments_clearing", 0)]),
      LedgerImbalanceError,
    );
  });

  it("rejects a line that is BOTH a debit and a credit", () => {
    assert.throws(
      () =>
        assertBalanced([
          { accountCode: "cash_settlement", debitMinor: 5000, creditMinor: 5000 },
          cr("payments_clearing", 5000),
        ]),
      LedgerImbalanceError,
    );
  });

  it("rejects a negative amount", () => {
    assert.throws(
      () => assertBalanced([dr("cash_settlement", -5000), cr("payments_clearing", -5000)]),
      LedgerImbalanceError,
    );
  });

  it("rejects a non-integer amount (kobo must be whole — no float, no ×100 drift)", () => {
    assert.throws(
      () => assertBalanced([dr("cash_settlement", 50.5), cr("payments_clearing", 50.5)]),
      LedgerImbalanceError,
    );
  });

  it("rejects an unsafe-integer amount (beyond JS safe-integer precision)", () => {
    const huge = Number.MAX_SAFE_INTEGER + 2;
    assert.throws(
      () => assertBalanced([dr("cash_settlement", huge), cr("payments_clearing", huge)]),
      LedgerImbalanceError,
    );
  });

  it("rejects a line referencing an unknown account code", () => {
    assert.throws(
      () =>
        assertBalanced([
          { accountCode: "not_an_account" as JournalLine["accountCode"], debitMinor: 5000, creditMinor: 0 },
          cr("payments_clearing", 5000),
        ]),
      LedgerImbalanceError,
    );
  });
});

describe("entry builders — balanced + correctly directed", () => {
  it("charge settlement = DR cash_settlement / CR payments_clearing", () => {
    const lines = buildChargeSettlementLines(7500);
    assert.doesNotThrow(() => assertBalanced(lines));
    assert.deepEqual(lines, [dr("cash_settlement", 7500), cr("payments_clearing", 7500)]);
  });

  it("wallet top-up = DR payments_clearing / CR customer_wallet_liability", () => {
    const lines = buildWalletTopupLines(12345);
    assert.doesNotThrow(() => assertBalanced(lines));
    assert.deepEqual(lines, [dr("payments_clearing", 12345), cr("customer_wallet_liability", 12345)]);
  });

  it("refund = DR payments_clearing / CR cash_settlement (reverses the charge)", () => {
    const lines = buildRefundLines(7500);
    assert.doesNotThrow(() => assertBalanced(lines));
    assert.deepEqual(lines, [dr("payments_clearing", 7500), cr("cash_settlement", 7500)]);
  });

  it("builders reject a non-positive or non-integer amount", () => {
    for (const bad of [0, -1, 10.5, Number.NaN, Number.MAX_SAFE_INTEGER + 2]) {
      assert.throws(() => buildChargeSettlementLines(bad), LedgerImbalanceError);
      assert.throws(() => buildWalletTopupLines(bad), LedgerImbalanceError);
      assert.throws(() => buildRefundLines(bad), LedgerImbalanceError);
    }
  });
});
