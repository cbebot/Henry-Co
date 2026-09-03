import type { PaymentStatus } from "./types";

const FRIENDLY_STATUS: Record<PaymentStatus, string> = {
  pending: "Awaiting transfer",
  processing: "Verifying transfer",
  paid: "Confirmed",
  failed: "Action required",
  refunded: "Refunded",
  cancelled: "Cancelled",
};

export function friendlyPaymentStatus(status: PaymentStatus, override?: string | null) {
  return override ?? FRIENDLY_STATUS[status] ?? status;
}

export function formatPaymentAmount(amount: number, currency: string, locale = "en-NG") {
  if (!Number.isFinite(amount)) return "—";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${Math.round(amount).toLocaleString()}`;
  }
}

export function formatPaymentDueDate(value: string | null | undefined, fallback = "On confirmation") {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatPaymentReceiptDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * A stable, human-readable transaction reference. Prefers an explicit reference
 * (order no / invoice no) the caller already has; otherwise derives a short,
 * uppercase ref from the payment id so the surface never shows a bare UUID.
 */
export function formatPaymentReference(id: string, reference?: string | null) {
  const explicit = (reference ?? "").trim();
  if (explicit) return explicit;
  const compact = String(id ?? "").replace(/[^0-9a-zA-Z]/g, "");
  const tail = compact.slice(-8).toUpperCase();
  return tail ? `HX-${tail}` : String(id ?? "");
}

export function buildPaymentRedirectPath(
  basePath: string,
  query?: Record<string, string | null | undefined>,
) {
  const params = query
    ? Object.entries(query).filter(([, value]) => Boolean(value)) as Array<[string, string]>
    : [];
  if (!params.length) return basePath;
  const search = new URLSearchParams(params).toString();
  return `${basePath}?${search}`;
}
