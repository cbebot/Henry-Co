// V3 studio payment de-fragmentation (Stage 1) — pure mapping from the
// legacy client-portal invoice shape onto the canonical PaymentRecordView
// consumed by @henryco/payment-surface. No IO, no env, no React: every
// function here runs under `tsx --test` and in server components alike.
//
// Money invariants: amounts stay in exact kobo precision until the shared
// format helpers round for display; status is provider-confirmed truth and
// is only coerced through the package's own coercePaymentStatus.

import { buildPaymentRecordView } from "@henryco/payment-surface/adapter";
import type { PaymentRecordView } from "@henryco/payment-surface/types";
import type { StudioInvoice, StudioPaymentSubmission } from "@/types/portal";

/** Exact kobo → major-unit conversion. Never rounds — display rounding is
 *  owned by formatPaymentAmount so the record view stays lossless. */
export function koboToMajorUnits(amountKobo: number): number {
  if (!Number.isFinite(amountKobo)) return 0;
  return amountKobo / 100;
}

export type PortalInvoiceProof = {
  proofName: string | null;
  proofUrl: string | null;
};

/**
 * Newest payment submission attached to an invoice, by submittedAt.
 * Pure selection over an already-authorised snapshot — no fetching.
 */
export function latestSubmissionForInvoice(
  submissions: readonly StudioPaymentSubmission[],
  invoiceId: string,
): StudioPaymentSubmission | null {
  let latest: StudioPaymentSubmission | null = null;
  let latestTime = Number.NEGATIVE_INFINITY;
  for (const submission of submissions) {
    if (submission.invoiceId !== invoiceId) continue;
    const time = Date.parse(submission.submittedAt || "");
    const comparable = Number.isNaN(time) ? 0 : time;
    if (comparable > latestTime) {
      latest = submission;
      latestTime = comparable;
    }
  }
  return latest;
}

/**
 * Proof fields for the record view — attached ONLY while the invoice status
 * (the provider-confirmed truth) says verification is in progress. A payable,
 * settled, or cancelled invoice never resurfaces an old submission's proof,
 * so the surface cannot mis-present a rejected transfer as "verifying".
 */
export function invoiceProofOnFile(
  invoice: Pick<StudioInvoice, "status">,
  submission: Pick<StudioPaymentSubmission, "proofName" | "proofUrl"> | null | undefined,
): PortalInvoiceProof | null {
  if (invoice.status !== "pending_verification") return null;
  if (!submission) return null;
  const proofName = submission.proofName || null;
  const proofUrl = submission.proofUrl || null;
  if (!proofName && !proofUrl) return null;
  return { proofName, proofUrl };
}

export type PortalInvoiceViewOptions = {
  /** Localized invoice description already resolved by the page. */
  label?: string;
  /** Localized status label (e.g. invoiceStatusToken(status, locale).label). */
  statusLabel?: string;
  /** Real proof fields from the latest submission — see invoiceProofOnFile. */
  proof?: PortalInvoiceProof | null;
};

/**
 * Portal invoice → canonical PaymentRecordView. Status coercion is delegated
 * to the package's coercePaymentStatus (sent/overdue/draft → pending,
 * pending_verification → processing, paid → paid, cancelled → cancelled);
 * the invoice number rides along as the human-readable reference.
 */
export function portalInvoiceToPaymentRecordView(
  invoice: StudioInvoice,
  options?: PortalInvoiceViewOptions,
): PaymentRecordView {
  const label = (options?.label ?? invoice.description).trim() || "Studio invoice";
  return buildPaymentRecordView({
    id: invoice.id,
    label,
    amount: koboToMajorUnits(invoice.amountKobo),
    currency: invoice.currency,
    status: invoice.status,
    statusLabel: options?.statusLabel,
    dueDate: invoice.dueDate,
    proofName: options?.proof?.proofName ?? null,
    proofUrl: options?.proof?.proofUrl ?? null,
    updatedAt: (invoice.status === "paid" ? invoice.paidAt : null) ?? invoice.updatedAt ?? null,
    reference: invoice.invoiceNumber,
  });
}
