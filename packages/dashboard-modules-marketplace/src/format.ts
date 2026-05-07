/**
 * Lightweight formatting helpers for the marketplace module's widgets.
 * Mirrors `packages/dashboard-modules-account/src/format.ts` so each
 * module package stays self-contained.
 */

const FORMATTERS = new Map<string, Intl.NumberFormat>();

function getFormatter(currency: string): Intl.NumberFormat {
  const key = currency.toUpperCase();
  let fmt = FORMATTERS.get(key);
  if (!fmt) {
    fmt = new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: key === "" ? "NGN" : key,
      maximumFractionDigits: 0,
    });
    FORMATTERS.set(key, fmt);
  }
  return fmt;
}

/**
 * Format a kobo (or minor-unit) integer in the given currency. Default
 * `NGN`. Marketplace's display currency is per-order so each call site
 * passes the currency explicitly.
 */
export function formatMoney(amount: number, currency = "NGN"): string {
  return getFormatter(currency).format((amount ?? 0) / 100);
}

/**
 * Compact relative-time formatter — "5m ago", "2d ago", or a date.
 */
export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "just now";
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return "just now";
  const delta = Date.now() - ms;
  if (delta < 60_000) return "just now";
  if (delta < 3_600_000) return `${Math.floor(delta / 60_000)}m ago`;
  if (delta < 86_400_000) return `${Math.floor(delta / 3_600_000)}h ago`;
  if (delta < 604_800_000) return `${Math.floor(delta / 86_400_000)}d ago`;
  return new Date(ms).toLocaleDateString("en-NG");
}

/**
 * Title-case status enum values (`out_for_delivery` → `Out for delivery`).
 */
export function titleCaseStatus(value: string | null | undefined): string {
  if (!value) return "—";
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}
