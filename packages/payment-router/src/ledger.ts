// ---------------------------------------------------------------------------
// V3-17 — Double-entry ledger: the pure TypeScript contract.
//
// This is the IN-PROCESS half of the balance invariant (defense in depth). The
// unbypassable guard is the DB deferred-constraint trigger in the ledger
// migration; this module catches an imbalance before the round-trip and is the
// single source of truth for the chart of accounts + the balanced line sets the
// proven money edges post. It mirrors the payment state machine's TS/SQL pairing:
// the SQL is a transcription of these rules, kept in lockstep deliberately.
//
// Amounts are kobo (NGN minor units) as whole integers — never float, never ×100.
// The ledger currency is always the NGN system base (FX is display-only).
// ---------------------------------------------------------------------------

/** ISO 4217 — the platform accounting base. Mirrors @henryco/pricing SYSTEM_BASE_CURRENCY. */
export const LEDGER_CURRENCY = "NGN" as const;

/** Double-entry account classes and their normal (increase) balance side. */
export type LedgerAccountType = "asset" | "liability" | "revenue" | "expense" | "equity";
export type NormalBalance = "debit" | "credit";

export interface LedgerAccount {
  readonly type: LedgerAccountType;
  readonly normalBalance: NormalBalance;
  readonly label: string;
}

/**
 * THE chart of accounts (A: source of truth, mirrored by the SQL seed). Normal
 * balance is derived from type — asset/expense increase on the debit side,
 * liability/revenue/equity on the credit side — and stored explicitly so a
 * mismatch is a compile/test error, not a silent money bug.
 */
export const LEDGER_ACCOUNTS = {
  cash_settlement: { type: "asset", normalBalance: "debit", label: "Cash / settlement" },
  payments_clearing: { type: "liability", normalBalance: "credit", label: "Payments clearing (received, unallocated)" },
  customer_wallet_liability: { type: "liability", normalBalance: "credit", label: "Customer wallet balances" },
  platform_revenue: { type: "revenue", normalBalance: "credit", label: "Platform revenue" },
  processor_fees: { type: "expense", normalBalance: "debit", label: "Payment processor fees" },
  refunds: { type: "expense", normalBalance: "debit", label: "Refunds issued" },
  vat_payable: { type: "liability", normalBalance: "credit", label: "VAT payable (placeholder)" },
} as const satisfies Record<string, LedgerAccount>;

export type LedgerAccountCode = keyof typeof LEDGER_ACCOUNTS;

/** One leg of a journal entry. Exactly one of debit/credit is a positive integer. */
export interface JournalLine {
  accountCode: LedgerAccountCode;
  debitMinor: number;
  creditMinor: number;
}

/** Raised whenever a line set violates the double-entry invariant. */
export class LedgerImbalanceError extends Error {
  constructor(
    message: string,
    readonly reason:
      | "too_few_lines"
      | "unknown_account"
      | "invalid_amount"
      | "not_one_sided"
      | "unbalanced"
      | "zero_total",
  ) {
    super(`[ledger] ${message}`);
    this.name = "LedgerImbalanceError";
  }
}

function isWholeKobo(value: number): boolean {
  // Number.isSafeInteger rejects floats, NaN, ±Infinity, and values beyond the
  // 2^53 precision boundary; the explicit >= 0 then rejects negatives (which are
  // themselves safe integers). Kobo are always non-negative whole numbers.
  return Number.isSafeInteger(value) && value >= 0;
}

/**
 * Assert a set of journal lines is a valid, balanced double-entry: at least two
 * lines, every line one-sided and a whole non-negative kobo amount against a known
 * account, and sum(debits) === sum(credits) > 0. Throws {@link LedgerImbalanceError}.
 *
 * This is the TS mirror of the DB deferred balance trigger — the same rules, so a
 * divergence between them would be a money bug.
 */
export function assertBalanced(lines: readonly JournalLine[]): void {
  if (lines.length < 2) {
    throw new LedgerImbalanceError(`an entry needs at least two lines, got ${lines.length}`, "too_few_lines");
  }

  let totalDebit = 0;
  let totalCredit = 0;
  for (const line of lines) {
    if (!(line.accountCode in LEDGER_ACCOUNTS)) {
      throw new LedgerImbalanceError(`unknown account code "${line.accountCode}"`, "unknown_account");
    }
    if (!isWholeKobo(line.debitMinor) || !isWholeKobo(line.creditMinor)) {
      throw new LedgerImbalanceError(
        `amounts must be whole non-negative kobo (debit=${line.debitMinor}, credit=${line.creditMinor})`,
        "invalid_amount",
      );
    }
    // Exactly one side is non-zero (mirrors the DB CHECK `(debit=0) <> (credit=0)`).
    if ((line.debitMinor === 0) === (line.creditMinor === 0)) {
      throw new LedgerImbalanceError(
        `a line must be exactly one of debit or credit (account ${line.accountCode})`,
        "not_one_sided",
      );
    }
    totalDebit += line.debitMinor;
    totalCredit += line.creditMinor;
  }

  if (totalDebit !== totalCredit) {
    throw new LedgerImbalanceError(`debits (${totalDebit}) must equal credits (${totalCredit})`, "unbalanced");
  }
  if (totalDebit <= 0) {
    throw new LedgerImbalanceError("entry total must be positive", "zero_total");
  }
}

function requirePositiveKobo(amountKobo: number): void {
  if (!isWholeKobo(amountKobo) || amountKobo <= 0) {
    throw new LedgerImbalanceError(`amount must be a positive whole kobo value, got ${amountKobo}`, "invalid_amount");
  }
}

const debit = (accountCode: LedgerAccountCode, amountKobo: number): JournalLine => ({
  accountCode,
  debitMinor: amountKobo,
  creditMinor: 0,
});
const credit = (accountCode: LedgerAccountCode, amountKobo: number): JournalLine => ({
  accountCode,
  debitMinor: 0,
  creditMinor: amountKobo,
});

/**
 * Charge succeeded (any confirmed intent): money received into settlement, held in
 * clearing until allocated. Posted in the SAME txn as `apply_payment_webhook`
 * moving the intent to `succeeded`.
 */
export function buildChargeSettlementLines(amountKobo: number): JournalLine[] {
  requirePositiveKobo(amountKobo);
  return [debit("cash_settlement", amountKobo), credit("payments_clearing", amountKobo)];
}

/**
 * Wallet top-up allocation: move the received money from clearing into what we owe
 * the customer. Posted in the SAME txn as the atomic wallet balance credit, so the
 * wallet balance reconciles to the ledger liability by construction. The net of
 * charge + allocation is DR cash / CR wallet-liability (clearing returns to zero).
 */
export function buildWalletTopupLines(amountKobo: number): JournalLine[] {
  requirePositiveKobo(amountKobo);
  return [debit("payments_clearing", amountKobo), credit("customer_wallet_liability", amountKobo)];
}

/**
 * Refund (reversing): return money from settlement and release the clearing hold.
 * Reverses {@link buildChargeSettlementLines}. Posted in the SAME txn as
 * `apply_payment_webhook` moving the intent to `refunded`.
 */
export function buildRefundLines(amountKobo: number): JournalLine[] {
  requirePositiveKobo(amountKobo);
  return [debit("payments_clearing", amountKobo), credit("cash_settlement", amountKobo)];
}
