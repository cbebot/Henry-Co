/**
 * V3-18 — payment-document generation: build a branded, ledger-tied receipt/invoice
 * from confirmed money truth.
 *
 * This module turns a CONFIRMED payment (a succeeded `payment_intent` + the posted
 * double-entry journal entry that recorded it, V3-17) into the props for a branded
 * receipt/invoice. The non-negotiable rules it enforces in code (mirroring the DB
 * RPC `payments_private.record_customer_receipt`):
 *
 *   - The total is the LEDGER GROSS — `payment.amountMinor` — never recomputed from
 *     a cart. It must equal the posting's debit total (`ledgerDebitMinor`); a
 *     mismatch throws (a receipt can't claim an amount the ledger didn't record).
 *   - VAT is read from the `PricingBreakdown` ONLY (extractTaxFromBreakdown). No
 *     breakdown / no `tax` line → no VAT (taxMinor = 0 → the template omits the line).
 *   - Fees are the breakdown's explicit fee lines; subtotal is the residual, so
 *     subtotal + fees + tax === total by construction.
 *   - The issuer is Henry Onyx Limited, sourced from @henryco/config (buildDocumentIssuer).
 *   - The processor is NEVER named (ANTI-CLONE Principle 9): only the instrument
 *     (card/bank/wallet) and the raw transaction reference are shown.
 *
 * The builders are pure (no I/O), so they are provable on synthetic data without a
 * database. `renderPaymentDocumentBuffer` and `recordReceiptGenerated` are the
 * server-side render + telemetry seams the FL2 auto-generation handler wires in.
 *
 * Amounts are whole kobo (NGN minor units) — never float.
 */

import {
  buildDocumentIssuer,
  type DocumentIssuer,
} from "@henryco/config";
import {
  ReceiptDocument,
  InvoiceDocument,
  CreditNoteDocument,
  type ReceiptProps,
  type ReceiptLineItem,
  type InvoiceProps,
  type InvoiceLineItem,
  type CreditNoteProps,
  type CreditNoteLineItem,
} from "@henryco/branded-documents";
import { renderDocumentToBuffer } from "@henryco/branded-documents/render";
import { extractTaxFromBreakdown, type PricingBreakdown } from "@henryco/pricing";
import { getPaymentDocumentCopy } from "@henryco/i18n";
import type { AppLocale } from "@henryco/i18n";
import { emitEvent } from "@henryco/observability";

/** Breakdown line codes that count as platform/operational fees on a document. */
const FEE_LINE_CODES = new Set([
  "platform_fee",
  "service_fee",
  "inspection_fee",
  "payout_fee",
]);

export class PaymentDocumentError extends Error {
  constructor(
    message: string,
    readonly reason:
      | "invalid_amount"
      | "ledger_mismatch"
      | "negative_subtotal"
      | "currency_not_base",
  ) {
    super(`[payment-document] ${message}`);
    this.name = "PaymentDocumentError";
  }
}

function isWholeKobo(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}

/** A buyer party rendered onto the document. */
export type DocumentBuyer = {
  name: string;
  email?: string | null;
  address?: string[] | null;
};

/**
 * The confirmed-payment money truth a receipt is built from. Every field is read
 * from the ledger / payment_intent — never from client state.
 */
export type ConfirmedPayment = {
  /** payment_intents.id — the intent this receipt evidences. */
  intentId: string;
  /** payment_intents.amount_minor — the authoritative gross (kobo). */
  amountMinor: number;
  /** Settlement currency (NGN system base). */
  currency: string;
  /** journal_entries.id — the posted ledger entry that recorded the money. */
  ledgerEntryId: string;
  /** Sum of the posting's debit lines (must equal amountMinor). */
  ledgerDebitMinor: number;
  /** Division the payment belongs to (drives branding + issuer division label). */
  division: string | null;
  /** Payment instrument — card/bank/wallet/ussd. NEVER the processor name. */
  paymentMethod: string;
  /** Gateway transaction reference value (no processor name attached). */
  paymentReference: string | null;
  /** ISO timestamp the payment was confirmed. */
  paidAt: string;
  /** Allocated, stable document number (HO-RCT-YYYY-NNNNNN). */
  receiptNo: string;
};

/** The kobo split a document presents, reconciled to the ledger gross. */
export type DocumentMoneySplit = {
  subtotalMinor: number;
  feesMinor: number;
  taxMinor: number;
  totalMinor: number;
  /** Fractional VAT rate carried by the breakdown, if any (informational). */
  taxRate: number | null;
};

function feesFromBreakdown(breakdown: PricingBreakdown): number {
  return breakdown.lines
    .filter((line) => FEE_LINE_CODES.has(line.code))
    .reduce((sum, line) => sum + Math.round(line.amount.amount), 0);
}

/**
 * Split the ledger gross into subtotal / fees / VAT for presentation. VAT comes
 * ONLY from the breakdown; fees are the breakdown's explicit fee lines; subtotal is
 * the residual so the three always reconcile to the gross. Throws if the residual
 * would be negative (a breakdown inconsistent with the ledger gross is a money bug).
 */
export function splitDocumentMoney(
  totalMinor: number,
  breakdown: PricingBreakdown | null | undefined,
): DocumentMoneySplit {
  if (!isWholeKobo(totalMinor) || totalMinor <= 0) {
    throw new PaymentDocumentError(`total must be a positive whole kobo value, got ${totalMinor}`, "invalid_amount");
  }
  const tax = extractTaxFromBreakdown(breakdown);
  const taxMinor = tax?.taxMinor ?? 0;
  const feesMinor = breakdown ? feesFromBreakdown(breakdown) : 0;
  const subtotalMinor = totalMinor - feesMinor - taxMinor;
  if (subtotalMinor < 0) {
    throw new PaymentDocumentError(
      `breakdown fees (${feesMinor}) + tax (${taxMinor}) exceed the ledger gross (${totalMinor})`,
      "negative_subtotal",
    );
  }
  return { subtotalMinor, feesMinor, taxMinor, totalMinor, taxRate: tax?.rate ?? null };
}

/** Map a pricing breakdown's non-tax lines to receipt line items (tax is summarised separately). */
function breakdownToReceiptItems(breakdown: PricingBreakdown): ReceiptLineItem[] {
  return breakdown.lines
    .filter((line) => line.code !== "tax")
    .map((line, index) => ({
      id: `line-${index}`,
      title: line.label,
      amountKobo: Math.round(line.amount.amount),
    }));
}

/**
 * Build the props for a branded receipt from confirmed payment truth. Pure — no
 * I/O — so it is provable on synthetic data. The caller resolves the locale.
 */
export function buildReceiptProps(input: {
  payment: ConfirmedPayment;
  breakdown?: PricingBreakdown | null;
  buyer: DocumentBuyer;
  locale: AppLocale;
  /** Single-line description when there is no breakdown (defaults to the division label). */
  description?: string | null;
  issuer?: DocumentIssuer;
}): ReceiptProps {
  const { payment, breakdown, buyer, locale } = input;

  if (payment.currency.toUpperCase() !== "NGN") {
    throw new PaymentDocumentError(`settlement currency must be NGN, got ${payment.currency}`, "currency_not_base");
  }
  if (!isWholeKobo(payment.amountMinor) || payment.amountMinor <= 0) {
    throw new PaymentDocumentError(`amount must be a positive whole kobo value, got ${payment.amountMinor}`, "invalid_amount");
  }
  // The money-truth tie: the receipt total IS the posted ledger entry's debit total.
  if (payment.ledgerDebitMinor !== payment.amountMinor) {
    throw new PaymentDocumentError(
      `ledger posting debit (${payment.ledgerDebitMinor}) does not reconcile to the intent gross (${payment.amountMinor})`,
      "ledger_mismatch",
    );
  }

  const issuer = input.issuer ?? buildDocumentIssuer(payment.division);
  const labels = getPaymentDocumentCopy(locale);
  const split = splitDocumentMoney(payment.amountMinor, breakdown);

  const items: ReceiptLineItem[] = breakdown
    ? breakdownToReceiptItems(breakdown)
    : [
        {
          id: "line-0",
          title: input.description?.trim() || issuer.divisionLabel,
          amountKobo: payment.amountMinor,
        },
      ];

  return {
    receipt: {
      id: payment.intentId,
      receiptNo: payment.receiptNo,
      division: payment.division ?? "hub",
      paidAt: payment.paidAt,
      paymentMethod: payment.paymentMethod,
      paymentReference: payment.paymentReference,
      subtotalKobo: split.subtotalMinor,
      feesKobo: split.feesMinor,
      taxKobo: split.taxMinor,
      totalKobo: split.totalMinor,
      currency: "NGN",
      notes: null,
      paymentIntentId: payment.intentId,
      ledgerEntryId: payment.ledgerEntryId,
    },
    issuer,
    customer: {
      name: buyer.name,
      email: buyer.email ?? null,
      deliveryAddress: buyer.address ?? null,
    },
    items,
    labels,
  };
}

/**
 * Build the props for a branded invoice. Pure. An invoice may be issued before
 * settlement, so the ledger tie is optional; totals are taken as given and the
 * template/DB CHECK guarantees subtotal + tax − discount = total.
 */
export function buildInvoiceProps(input: {
  invoice: {
    id: string;
    invoiceNo: string;
    description: string;
    division: string | null;
    status: string;
    issuedAt: string;
    dueAt?: string | null;
    paidAt?: string | null;
    paymentMethod?: string | null;
    paymentReference?: string | null;
    subtotalKobo: number;
    taxKobo: number;
    discountKobo?: number | null;
    totalKobo: number;
    currency: string;
    lineItems: InvoiceLineItem[];
    paymentIntentId?: string | null;
    ledgerEntryId?: string | null;
  };
  buyer: DocumentBuyer;
  locale: AppLocale;
  issuer?: DocumentIssuer;
}): InvoiceProps {
  const issuer = input.issuer ?? buildDocumentIssuer(input.invoice.division);
  const labels = getPaymentDocumentCopy(input.locale);
  return {
    invoice: input.invoice,
    customer: {
      name: input.buyer.name,
      email: input.buyer.email ?? null,
      address: input.buyer.address ?? null,
    },
    issuer,
    labels,
  };
}

/**
 * V3-19 — the provider-CONFIRMED refund truth a credit note is built from. Every
 * field is read from payment_refunds / the posted reversing entry — never client
 * state. The DB RPC (`record_customer_credit_note`) re-verifies the same ties.
 */
export type ConfirmedRefund = {
  /** payment_refunds.id — the refund this credit note evidences. */
  refundId: string;
  /** payment_intents.id — the intent the refunded charge settled. */
  intentId: string;
  /** payment_refunds.amount_minor — the refunded amount (kobo). */
  amountMinor: number;
  /** Settlement currency (NGN system base). */
  currency: string;
  /** The refund-settlement journal entry ('payment_refund', refundId). */
  ledgerEntryId: string;
  /** Sum of that posting's debit lines (must equal amountMinor). */
  ledgerDebitMinor: number;
  /**
   * The POSTED output-VAT reversal for this refund (0 when no sale-revenue
   * entry existed to reverse). The DB rejects a credit note whose VAT line
   * disagrees with this figure — the document can never claim a tax effect
   * the ledger did not record.
   */
  vatReversedMinor: number;
  /** Original receipt number (HO-RCT-…), when the charge had one. */
  receiptNo: string | null;
  division: string | null;
  /** Payment instrument — card/bank/wallet/ussd. NEVER the processor name. */
  paymentMethod: string;
  /** Gateway transaction reference value (no processor name attached). */
  paymentReference: string | null;
  /** ISO timestamp the provider confirmed the refund. */
  refundedAt: string;
  /** Allocated, stable document number (HO-CRN-YYYY-NNNNNN). */
  creditNoteNo: string;
};

/**
 * Build the props for a branded credit note from confirmed refund truth. Pure —
 * no I/O — so it is provable on synthetic data. Mirrors `buildReceiptProps`:
 * the total IS the refund-settlement posting's debit total, the VAT line IS the
 * posted reversal, subtotal is the residual — reconciled by construction.
 */
export function buildCreditNoteProps(input: {
  refund: ConfirmedRefund;
  buyer: DocumentBuyer;
  locale: AppLocale;
  /** Single-line description of what was refunded (defaults to the division label). */
  description?: string | null;
  issuer?: DocumentIssuer;
}): CreditNoteProps {
  const { refund, buyer, locale } = input;

  if (refund.currency.toUpperCase() !== "NGN") {
    throw new PaymentDocumentError(`settlement currency must be NGN, got ${refund.currency}`, "currency_not_base");
  }
  if (!isWholeKobo(refund.amountMinor) || refund.amountMinor <= 0) {
    throw new PaymentDocumentError(`amount must be a positive whole kobo value, got ${refund.amountMinor}`, "invalid_amount");
  }
  // The money-truth tie: the credit-note total IS the posted reversal's debit total.
  if (refund.ledgerDebitMinor !== refund.amountMinor) {
    throw new PaymentDocumentError(
      `refund posting debit (${refund.ledgerDebitMinor}) does not reconcile to the refund amount (${refund.amountMinor})`,
      "ledger_mismatch",
    );
  }
  if (!isWholeKobo(refund.vatReversedMinor) || refund.vatReversedMinor > refund.amountMinor) {
    throw new PaymentDocumentError(
      `VAT reversal (${refund.vatReversedMinor}) out of range for refund (${refund.amountMinor})`,
      "invalid_amount",
    );
  }

  const issuer = input.issuer ?? buildDocumentIssuer(refund.division);
  const labels = getPaymentDocumentCopy(locale);
  const subtotalMinor = refund.amountMinor - refund.vatReversedMinor;

  const items: CreditNoteLineItem[] = [
    {
      id: "line-0",
      title: input.description?.trim() || issuer.divisionLabel,
      amountKobo: refund.amountMinor,
    },
  ];

  return {
    creditNote: {
      id: refund.refundId,
      creditNoteNo: refund.creditNoteNo,
      receiptNo: refund.receiptNo,
      division: refund.division ?? "hub",
      refundedAt: refund.refundedAt,
      paymentMethod: refund.paymentMethod,
      paymentReference: refund.paymentReference,
      subtotalKobo: subtotalMinor,
      taxKobo: refund.vatReversedMinor,
      totalKobo: refund.amountMinor,
      currency: "NGN",
      paymentIntentId: refund.intentId,
      refundId: refund.refundId,
      ledgerEntryId: refund.ledgerEntryId,
    },
    issuer,
    customer: {
      name: buyer.name,
      email: buyer.email ?? null,
    },
    items,
    labels,
  };
}

type RenderableElement = Parameters<typeof renderDocumentToBuffer>[0];

/** Render a document element to a PDF buffer (server-side). */
export async function renderPaymentDocumentBuffer(element: RenderableElement): Promise<Buffer> {
  return renderDocumentToBuffer(element);
}

/**
 * Compose + render a receipt PDF for a confirmed payment, emitting telemetry with
 * an outcome (no bare catch). Returns the buffer + the props (so a caller can
 * persist/upload). The processor is never in the payload.
 */
export async function generateReceiptPdf(input: {
  payment: ConfirmedPayment;
  breakdown?: PricingBreakdown | null;
  buyer: DocumentBuyer;
  locale: AppLocale;
  description?: string | null;
  actorId?: string;
}): Promise<{ buffer: Buffer; props: ReceiptProps }> {
  try {
    const props = buildReceiptProps(input);
    const buffer = await renderPaymentDocumentBuffer(ReceiptDocument(props));
    emitEvent({
      name: "henry.receipt.generated",
      classification: "system_state",
      outcome: "issued",
      actorId: input.actorId,
      payload: {
        receiptNo: input.payment.receiptNo,
        division: input.payment.division,
        intentId: input.payment.intentId,
        ledgerEntryId: input.payment.ledgerEntryId,
        totalMinor: props.receipt.totalKobo,
        hasVat: (props.receipt.taxKobo ?? 0) > 0,
      },
    });
    return { buffer, props };
  } catch (error) {
    emitEvent({
      name: "henry.receipt.generated",
      classification: "system_state",
      outcome: "failed",
      actorId: input.actorId,
      payload: {
        receiptNo: input.payment.receiptNo,
        intentId: input.payment.intentId,
        error: error instanceof Error ? error.message : String(error),
      },
    });
    throw error;
  }
}

/**
 * Compose + render a credit-note PDF for a provider-confirmed refund, emitting
 * telemetry with an outcome (no bare catch). The processor is never in the payload.
 */
export async function generateCreditNotePdf(input: {
  refund: ConfirmedRefund;
  buyer: DocumentBuyer;
  locale: AppLocale;
  description?: string | null;
  actorId?: string;
}): Promise<{ buffer: Buffer; props: CreditNoteProps }> {
  try {
    const props = buildCreditNoteProps(input);
    const buffer = await renderPaymentDocumentBuffer(CreditNoteDocument(props));
    emitEvent({
      name: "henry.credit_note.generated",
      classification: "system_state",
      outcome: "issued",
      actorId: input.actorId,
      payload: {
        creditNoteNo: input.refund.creditNoteNo,
        receiptNo: input.refund.receiptNo,
        division: input.refund.division,
        intentId: input.refund.intentId,
        refundId: input.refund.refundId,
        ledgerEntryId: input.refund.ledgerEntryId,
        totalMinor: props.creditNote.totalKobo,
        hasVat: (props.creditNote.taxKobo ?? 0) > 0,
      },
    });
    return { buffer, props };
  } catch (error) {
    emitEvent({
      name: "henry.credit_note.generated",
      classification: "system_state",
      outcome: "failed",
      actorId: input.actorId,
      payload: {
        creditNoteNo: input.refund.creditNoteNo,
        refundId: input.refund.refundId,
        error: error instanceof Error ? error.message : String(error),
      },
    });
    throw error;
  }
}

/** Compose + render an invoice PDF. */
export async function generateInvoicePdf(input: Parameters<typeof buildInvoiceProps>[0] & { actorId?: string }): Promise<{ buffer: Buffer; props: InvoiceProps }> {
  try {
    const props = buildInvoiceProps(input);
    const buffer = await renderPaymentDocumentBuffer(InvoiceDocument(props));
    emitEvent({
      name: "henry.invoice.generated",
      classification: "system_state",
      outcome: "issued",
      actorId: input.actorId,
      payload: {
        invoiceNo: props.invoice.invoiceNo,
        division: props.invoice.division,
        totalMinor: props.invoice.totalKobo,
        hasVat: (props.invoice.taxKobo ?? 0) > 0,
      },
    });
    return { buffer, props };
  } catch (error) {
    emitEvent({
      name: "henry.invoice.generated",
      classification: "system_state",
      outcome: "failed",
      actorId: input.actorId,
      payload: { invoiceNo: input.invoice.invoiceNo, error: error instanceof Error ? error.message : String(error) },
    });
    throw error;
  }
}
