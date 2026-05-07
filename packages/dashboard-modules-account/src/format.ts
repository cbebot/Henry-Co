/**
 * Lightweight formatting helpers for the customer-overview module.
 *
 * These mirror the apps/account/lib/format.ts surface so the module
 * package stays self-contained — copying the small subset the module
 * widgets actually use rather than depending on a host-app barrel.
 */

const NAIRA_FORMATTER = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

/**
 * Format a kobo integer as the user-facing Naira string. For instance,
 * `formatNaira(123_456)` → "₦1,235" (rounded, no fractional kobo).
 */
export function formatNaira(kobo: number): string {
  return NAIRA_FORMATTER.format((kobo ?? 0) / 100);
}

/**
 * Compact relative-time formatter. Matches the audit's "minutes ago /
 * hours ago / days ago" pattern.
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
