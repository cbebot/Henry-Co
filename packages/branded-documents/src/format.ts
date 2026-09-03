const NGN = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  minimumFractionDigits: 2,
});

export function formatKobo(amountKobo: number | null | undefined, currency = "NGN") {
  const value = Number(amountKobo) || 0;
  if (currency === "NGN") {
    return NGN.format(value / 100);
  }
  return new Intl.NumberFormat("en-NG", { style: "currency", currency }).format(value / 100);
}

export function formatDate(value: string | Date | null | undefined, locale = "en-NG") {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" }).format(d);
}

export function formatDateTime(value: string | Date | null | undefined, locale = "en-NG") {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function titleCase(value: string | null | undefined) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

// Friendly labels for the seller settlement enums that would otherwise print
// as raw column values (e.g. "paid_held") in payout statement PDFs. Mirrors
// payoutStatusLabel in apps/marketplace/lib/marketplace/vendor/labels.ts.
// Only the payout-specific compound values are mapped here so generic statuses
// used by other document templates still fall through to titleCase.
const PAYOUT_STATUS_LABELS: Record<string, string> = {
  awaiting_payment: "Awaiting payment",
  paid_held: "Held in escrow",
  awaiting_auto_release: "Awaiting release",
  delivered_pending_confirmation: "Awaiting release",
  payout_releasable: "Releasable",
  payout_frozen: "On hold",
  payout_released: "Released",
};

export function statusToLabel(status: string | null | undefined) {
  const key = String(status || "").toLowerCase();
  if (key in PAYOUT_STATUS_LABELS) {
    return PAYOUT_STATUS_LABELS[key];
  }
  return titleCase(status || "");
}
