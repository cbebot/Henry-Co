// Humanized, translated labels for the vendor workspace enums — pure and
// testable, copy via injected `t` (pages own their translateSurfaceLabel).
// Raw enum values ("payout_frozen", "awaiting_acceptance") never reach a
// vendor page; unknown values fall back to a calm title-cased form.

type Translate = (label: string) => string;

/** Calm fallback for values outside the known sets: "payout_frozen" → "Payout frozen". */
export function humanizeEnumValue(value: string): string {
  const spaced = value.replace(/_/g, " ").trim();
  if (spaced === "") return "";
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** Order-group fulfilment state (marketplace_order_groups.fulfillment_status). */
export function fulfillmentStatusLabel(status: string, t: Translate): string {
  switch (status) {
    case "awaiting_acceptance":
      return t("Awaiting acceptance");
    case "confirmed":
      return t("Confirmed");
    case "fulfillment_in_progress":
      return t("In progress");
    case "packed":
      return t("Packed");
    case "shipped":
      return t("Shipped");
    case "delivered":
      return t("Delivered");
    case "delivered_pending_confirmation":
      return t("Delivered, awaiting confirmation");
    case "delayed":
      return t("Delayed");
    case "returned":
      return t("Returned");
    default:
      return humanizeEnumValue(status);
  }
}

/** Order payment state (marketplace_order_groups.payment_status). */
export function paymentStatusLabel(status: string, t: Translate): string {
  switch (status) {
    case "pending":
      return t("Payment pending");
    case "receipt_submitted":
      return t("Receipt submitted");
    case "verified":
      return t("Payment verified");
    case "failed":
      return t("Payment failed");
    case "refunded":
      return t("Refunded");
    default:
      return humanizeEnumValue(status);
  }
}

/**
 * Order-group settlement state (marketplace_order_groups.payout_status) —
 * grouped the same way computePayoutBalance buckets the money.
 */
export function payoutStatusLabel(status: string, t: Translate): string {
  switch (status) {
    case "awaiting_payment":
    case "pending":
      return t("Awaiting payment");
    case "paid_held":
      return t("Held in escrow");
    case "delivered_pending_confirmation":
    case "awaiting_auto_release":
      return t("Awaiting auto-release");
    case "payout_releasable":
    case "eligible":
      return t("Releasable");
    case "requested":
    case "under_review":
      return t("Payout requested");
    case "approved":
    case "scheduled":
      return t("Payout approved");
    case "payout_frozen":
    case "frozen":
    case "disputed":
      return t("Frozen");
    case "refunded":
      return t("Refunded");
    case "partially_refunded":
      return t("Partially refunded");
    case "payout_released":
    case "released":
    case "paid":
      return t("Released");
    case "rejected":
      return t("Rejected");
    default:
      return humanizeEnumValue(status);
  }
}

/** Payout-request lifecycle (marketplace_payout_requests.status — the payouts history list). */
export function payoutRequestStatusLabel(status: string, t: Translate): string {
  switch (status) {
    case "requested":
      return t("Requested");
    case "under_review":
      return t("Under review");
    case "approved":
      return t("Approved");
    case "released":
    case "payout_released":
    case "paid":
      return t("Paid");
    case "rejected":
      return t("Rejected");
    case "frozen":
    case "payout_frozen":
      return t("Frozen");
    default:
      return humanizeEnumValue(status);
  }
}

/** Dispute lifecycle (marketplace_disputes.status). */
export function disputeStatusLabel(status: string, t: Translate): string {
  switch (status) {
    case "open":
      return t("Open");
    case "investigating":
      return t("Investigating");
    case "resolved":
      return t("Resolved");
    case "rejected":
      return t("Rejected");
    default:
      return humanizeEnumValue(status);
  }
}

/** Dispute resolution (marketplace_disputes.resolution_type). */
export function disputeResolutionLabel(resolutionType: string, t: Translate): string {
  switch (resolutionType) {
    case "manual_review":
      return t("Manual review");
    case "refund_to_buyer":
      return t("Refund to buyer");
    default:
      return humanizeEnumValue(resolutionType);
  }
}
