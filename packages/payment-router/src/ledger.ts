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
  // V3-VAT-01 — the two VATs, modelled explicitly (replaces the V3-17 vat_payable
  // placeholder). Output VAT we collect on sales is a liability owed to FIRS; input
  // VAT on the processor fee the owner absorbs is a recoverable asset.
  vat_output_payable: { type: "liability", normalBalance: "credit", label: "VAT output payable (collected on sales, owed to FIRS)" },
  fee_vat_recoverable: { type: "asset", normalBalance: "debit", label: "Input VAT recoverable (on processor fees)" },
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

// ---------------------------------------------------------------------------
// V3-VAT-01 — VAT-aware postings.
//
// These are pure line ASSEMBLY mirrors of the DB RPCs (post_charge_settlement /
// post_sale_revenue). The fee + fee-VAT are pre-resolved by the caller (the DB is
// the authority for the statutory split; @henryco/pricing's splitVatInclusive proves
// the math). No rate lives here, so payment-router stays rate-free + dependency-light.
// ---------------------------------------------------------------------------

function requireWholeKoboNamed(value: number, label: string): void {
  if (!isWholeKobo(value)) {
    throw new LedgerImbalanceError(`${label} must be a whole non-negative kobo value, got ${value}`, "invalid_amount");
  }
}

/**
 * Charge settled, fee absorbed by the owner (V3-VAT-01). Splits the DEBIT side so the
 * real money trail is on the books while the credit (and therefore the debit TOTAL)
 * stays the gross — so the V3-18 receipt tie (`receipt.total === settlement debit
 * total === gross`) and the wallet reconciliation are untouched:
 *
 *   DR cash_settlement      net  (= gross − fee)        the real amount that settles
 *   DR processor_fees       fee − feeVat                the fee expense (ex-VAT)
 *   DR fee_vat_recoverable  feeVat                      input VAT we can reclaim
 *   CR payments_clearing    gross                       the obligation the customer paid
 *
 * `feeMinor` is the REAL total fee the provider deducted (never assumed). When it is
 * 0/unknown we post the plain gross-to-cash entry rather than fabricate a fee.
 */
export function buildChargeSettlementLinesWithFee(input: {
  grossMinor: number;
  /** Real total processor fee deducted (VAT-inclusive), from the provider payload. */
  feeMinor: number;
  /** VAT portion within the fee (provider-reported or statutory split). */
  feeVatMinor: number;
}): JournalLine[] {
  const { grossMinor, feeMinor, feeVatMinor } = input;
  requirePositiveKobo(grossMinor);
  requireWholeKoboNamed(feeMinor, "feeMinor");
  requireWholeKoboNamed(feeVatMinor, "feeVatMinor");

  // Fee unknown / not reported by the provider — never invent one.
  if (feeMinor === 0) return buildChargeSettlementLines(grossMinor);

  if (feeMinor >= grossMinor) {
    throw new LedgerImbalanceError(`processor fee (${feeMinor}) must be less than gross (${grossMinor})`, "invalid_amount");
  }
  if (feeVatMinor > feeMinor) {
    throw new LedgerImbalanceError(`fee VAT (${feeVatMinor}) cannot exceed the fee (${feeMinor})`, "invalid_amount");
  }

  const feeExVatMinor = feeMinor - feeVatMinor;
  const cashNetMinor = grossMinor - feeMinor;
  const lines: JournalLine[] = [debit("cash_settlement", cashNetMinor)];
  if (feeExVatMinor > 0) lines.push(debit("processor_fees", feeExVatMinor));
  if (feeVatMinor > 0) lines.push(debit("fee_vat_recoverable", feeVatMinor));
  lines.push(credit("payments_clearing", grossMinor));
  return lines;
}

/**
 * VATable sale revenue recognition (V3-VAT-01 Phase 2b). Allocates clearing to
 * revenue, splitting out the output VAT we collected on the platform's behalf:
 *
 *   DR payments_clearing  gross
 *   CR platform_revenue   gross − outputVat   (revenue, ex-VAT)
 *   CR vat_output_payable outputVat           (liability owed to FIRS)
 *
 * A non-VATable sale (outputVat 0) is the plain DR clearing / CR revenue pair.
 */
export function buildSaleRevenueLines(input: { grossMinor: number; outputVatMinor: number }): JournalLine[] {
  const { grossMinor, outputVatMinor } = input;
  requirePositiveKobo(grossMinor);
  requireWholeKoboNamed(outputVatMinor, "outputVatMinor");
  if (outputVatMinor >= grossMinor) {
    throw new LedgerImbalanceError(`output VAT (${outputVatMinor}) must be less than gross (${grossMinor})`, "invalid_amount");
  }
  const revenueMinor = grossMinor - outputVatMinor;
  const lines: JournalLine[] = [debit("payments_clearing", grossMinor), credit("platform_revenue", revenueMinor)];
  if (outputVatMinor > 0) lines.push(credit("vat_output_payable", outputVatMinor));
  return lines;
}

/**
 * The exact reverse of {@link buildSaleRevenueLines} — the refund-ready hook for
 * V3-19. A sale refund reverses the revenue recognition, which CLEANLY reverses the
 * output VAT too (DR vat_output_payable), so the FIRS liability is reduced by the
 * refunded VAT. Not wired here (V3-19 owns the refund flow); provided + proven so the
 * reversal is structurally guaranteed when it lands.
 */
export function buildSaleRevenueReversalLines(input: { grossMinor: number; outputVatMinor: number }): JournalLine[] {
  const { grossMinor, outputVatMinor } = input;
  requirePositiveKobo(grossMinor);
  requireWholeKoboNamed(outputVatMinor, "outputVatMinor");
  if (outputVatMinor >= grossMinor) {
    throw new LedgerImbalanceError(`output VAT (${outputVatMinor}) must be less than gross (${grossMinor})`, "invalid_amount");
  }
  const revenueMinor = grossMinor - outputVatMinor;
  const lines: JournalLine[] = [debit("platform_revenue", revenueMinor)];
  if (outputVatMinor > 0) lines.push(debit("vat_output_payable", outputVatMinor));
  lines.push(credit("payments_clearing", grossMinor));
  return lines;
}

// ---------------------------------------------------------------------------
// V3-19 — partial-refund reversal math (MIRROR of apply_refund_webhook).
// ---------------------------------------------------------------------------

/**
 * The PROPORTIONAL VAT/revenue split for a (possibly partial) refund's
 * sale-revenue reversal — the executable spec `payments_private.
 * apply_refund_webhook` transcribes. Clamp-based:
 *
 *   vat = clamp( round(originalVat · refund / gross),
 *                lower: refund − remainingRevenue,   // revenue can't over-reverse
 *                upper: min(remainingVat, refund) )  // VAT can't over-reverse
 *   revenue = refund − vat
 *
 * Under these clamps every leg stays >= 0, cumulative reversals can never
 * exceed what was posted, and the FINAL partial reverses the exact remainders
 * (vat = remainingVat, revenue = remainingRevenue) with NO special case —
 * per-partial rounding can never drift the books. A refund the remainders
 * cannot cover means a mis-posted sale: fail loudly, never half-reverse.
 */
export function computeProportionalVatReversal(input: {
  refundMinor: number;
  grossMinor: number;
  originalVatMinor: number;
  remainingVatMinor: number;
  remainingRevenueMinor: number;
}): { vatMinor: number; revenueMinor: number } {
  const { refundMinor, grossMinor, originalVatMinor, remainingVatMinor, remainingRevenueMinor } = input;
  requirePositiveKobo(refundMinor);
  requirePositiveKobo(grossMinor);
  requireWholeKoboNamed(originalVatMinor, "originalVatMinor");
  requireWholeKoboNamed(remainingVatMinor, "remainingVatMinor");
  requireWholeKoboNamed(remainingRevenueMinor, "remainingRevenueMinor");
  if (remainingVatMinor + remainingRevenueMinor < refundMinor) {
    throw new LedgerImbalanceError(
      `sale remainder (rev ${remainingRevenueMinor} + vat ${remainingVatMinor}) does not cover refund ${refundMinor}`,
      "invalid_amount",
    );
  }
  const proportional = Math.round((originalVatMinor * refundMinor) / grossMinor);
  const vatMinor = Math.min(
    Math.max(proportional, refundMinor - remainingRevenueMinor, 0),
    remainingVatMinor,
    refundMinor,
  );
  return { vatMinor, revenueMinor: refundMinor - vatMinor };
}

/**
 * The reversal legs for a (possibly partial) refund: DR platform_revenue +
 * DR vat_output_payable / CR payments_clearing — legs built CONDITIONALLY
 * because under adversarial rounding a final partial can be ALL VAT
 * (revenue 0) or all revenue (VAT 0); a zero line is never emitted. Mirrors
 * the line construction inside `apply_refund_webhook`.
 */
export function buildPartialSaleRevenueReversalLines(input: {
  refundMinor: number;
  vatMinor: number;
}): JournalLine[] {
  const { refundMinor, vatMinor } = input;
  requirePositiveKobo(refundMinor);
  requireWholeKoboNamed(vatMinor, "vatMinor");
  if (vatMinor > refundMinor) {
    throw new LedgerImbalanceError(`VAT reversal (${vatMinor}) must be <= refund (${refundMinor})`, "invalid_amount");
  }
  const revenueMinor = refundMinor - vatMinor;
  const lines: JournalLine[] = [];
  if (revenueMinor > 0) lines.push(debit("platform_revenue", revenueMinor));
  if (vatMinor > 0) lines.push(debit("vat_output_payable", vatMinor));
  lines.push(credit("payments_clearing", refundMinor));
  return lines;
}
