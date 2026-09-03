import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  LEDGER_ACCOUNTS,
  LEDGER_CURRENCY,
  assertBalanced,
  isValidLedgerCurrency,
  LedgerImbalanceError,
  buildChargeSettlementLines,
  buildChargeSettlementLinesWithFee,
  buildWalletTopupLines,
  buildRefundLines,
  buildWithdrawalReserveLines,
  buildWithdrawalSettlementLines,
  buildWithdrawalReleaseLines,
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

describe("V3-MONEY-MC — the in-currency ledger (currency is an entry property, not a line one)", () => {
  it("accepts any valid ISO-4217 code and rejects malformed ones (mirrors the DB CHECK)", () => {
    for (const good of ["NGN", "USD", "GBP", "EUR", "GHS", "KES"]) {
      assert.equal(isValidLedgerCurrency(good), true, good);
    }
    for (const bad of ["ngn", "US", "USDD", "US1", "", "$$$", "12A", "N G"]) {
      assert.equal(isValidLedgerCurrency(bad), false, JSON.stringify(bad));
    }
  });

  it("the balance invariant is currency-agnostic — the same lines balance for NGN or USD", () => {
    // The line math carries no currency; a USD charge (cents) and an NGN charge (kobo) produce
    // the same balanced shape. The currency lives on the ENTRY (post_ledger_entry), so per-entry
    // balance gives per-currency balance for free — the design's core safety property.
    const usdCents = buildChargeSettlementLines(4999); // $49.99
    assert.doesNotThrow(() => assertBalanced(usdCents));
    assert.deepEqual(usdCents, [dr("cash_settlement", 4999), cr("payments_clearing", 4999)]);
  });

  it("a foreign fee with no reported VAT is a plain fee expense — never a fabricated NG VAT split", () => {
    // The caller (post_charge_settlement) passes feeVat=0 for a non-NGN fee with no provider
    // breakdown, so the fee is wholly processor_fees and no fee_vat_recoverable line appears.
    const lines = buildChargeSettlementLinesWithFee({ grossMinor: 10_000, feeMinor: 300, feeVatMinor: 0 });
    assert.doesNotThrow(() => assertBalanced(lines));
    assert.deepEqual(lines, [
      dr("cash_settlement", 9_700),
      dr("processor_fees", 300),
      cr("payments_clearing", 10_000),
    ]);
    assert.ok(!lines.some((l) => l.accountCode === "fee_vat_recoverable"), "no VAT-recoverable line");
  });

  it("a provider-reported fee VAT still splits out — honoured for any currency", () => {
    const lines = buildChargeSettlementLinesWithFee({ grossMinor: 10_000, feeMinor: 300, feeVatMinor: 20 });
    assert.doesNotThrow(() => assertBalanced(lines));
    assert.deepEqual(lines, [
      dr("cash_settlement", 9_700),
      dr("processor_fees", 280),
      dr("fee_vat_recoverable", 20),
      cr("payments_clearing", 10_000),
    ]);
  });

  it("NGN stays the reporting base constant (books are currency-neutral, presentation is NGN)", () => {
    assert.equal(LEDGER_CURRENCY, "NGN");
  });
});

describe("V3-MONEY-PAYOUT — the withdrawal (payout) rail, top-up in reverse", () => {
  it("reserve = DR customer_wallet_liability / CR withdrawals_payable (reclassify, no cash)", () => {
    const lines = buildWithdrawalReserveLines(50_000);
    assert.doesNotThrow(() => assertBalanced(lines));
    assert.deepEqual(lines, [dr("customer_wallet_liability", 50_000), cr("withdrawals_payable", 50_000)]);
  });

  it("release exactly reverses reserve, so a failed withdrawal nets to zero everywhere", () => {
    const reserve = buildWithdrawalReserveLines(50_000);
    const release = buildWithdrawalReleaseLines(50_000);
    assert.doesNotThrow(() => assertBalanced(release));
    assert.deepEqual(release, [dr("withdrawals_payable", 50_000), cr("customer_wallet_liability", 50_000)]);
    // reserve + release net to zero on every account — the failed withdrawal leaves no trace.
    const net = new Map<string, number>();
    for (const l of [...reserve, ...release]) {
      net.set(l.accountCode, (net.get(l.accountCode) ?? 0) + l.debitMinor - l.creditMinor);
    }
    assert.equal(net.get("customer_wallet_liability"), 0);
    assert.equal(net.get("withdrawals_payable"), 0);
  });

  it("settle with no fee = DR withdrawals_payable / CR cash_settlement (cash leaves)", () => {
    const lines = buildWithdrawalSettlementLines({ amountKobo: 50_000, feeKobo: 0 });
    assert.doesNotThrow(() => assertBalanced(lines));
    assert.deepEqual(lines, [dr("withdrawals_payable", 50_000), cr("cash_settlement", 50_000)]);
  });

  it("settle with a fee: company absorbs it — DR payable + DR processor_fees / CR cash (amount+fee)", () => {
    const lines = buildWithdrawalSettlementLines({ amountKobo: 50_000, feeKobo: 4500 });
    assert.doesNotThrow(() => assertBalanced(lines));
    assert.deepEqual(lines, [
      dr("withdrawals_payable", 50_000),
      dr("processor_fees", 4500),
      cr("cash_settlement", 54_500),
    ]);
    // The user withdrew 50000 and receives 50000; the company's cash out is 54500 (fee absorbed).
    const cashOut = lines.filter((l) => l.accountCode === "cash_settlement").reduce((s, l) => s + l.creditMinor, 0);
    assert.equal(cashOut, 54_500);
  });

  it("reserve → settle nets to DR wallet_liability / DR fee / CR cash (the money genuinely left)", () => {
    // Across a successful withdrawal the two entries combine: the payable is raised then cleared,
    // so it nets to zero, leaving wallet-liability down by amount and cash down by amount+fee.
    const reserve = buildWithdrawalReserveLines(50_000);
    const settle = buildWithdrawalSettlementLines({ amountKobo: 50_000, feeKobo: 4500 });
    const net = new Map<string, number>();
    for (const l of [...reserve, ...settle]) {
      net.set(l.accountCode, (net.get(l.accountCode) ?? 0) + l.debitMinor - l.creditMinor);
    }
    assert.equal(net.get("withdrawals_payable"), 0, "payable is transient — nets to zero");
    assert.equal(net.get("customer_wallet_liability"), 50_000, "we owe the user 50000 less (DR)");
    assert.equal(net.get("processor_fees"), 4500, "fee expense (DR)");
    assert.equal(net.get("cash_settlement"), -54_500, "cash left: amount + fee (CR)");
  });

  it("withdrawal builders reject a non-positive amount / non-whole fee", () => {
    for (const bad of [0, -1, 10.5, Number.NaN]) {
      assert.throws(() => buildWithdrawalReserveLines(bad), LedgerImbalanceError);
      assert.throws(() => buildWithdrawalReleaseLines(bad), LedgerImbalanceError);
      assert.throws(() => buildWithdrawalSettlementLines({ amountKobo: bad, feeKobo: 0 }), LedgerImbalanceError);
    }
    assert.throws(() => buildWithdrawalSettlementLines({ amountKobo: 50_000, feeKobo: -1 }), LedgerImbalanceError);
    assert.throws(() => buildWithdrawalSettlementLines({ amountKobo: 50_000, feeKobo: 4.5 }), LedgerImbalanceError);
  });

  it("withdrawals_payable is a credit-normal liability in the chart", () => {
    assert.equal(LEDGER_ACCOUNTS.withdrawals_payable.type, "liability");
    assert.equal(LEDGER_ACCOUNTS.withdrawals_payable.normalBalance, "credit");
  });
});
