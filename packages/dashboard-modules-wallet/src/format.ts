/**
 * Lightweight formatting helpers for the wallet module.
 *
 * Mirrors the apps/account/lib/format.ts surface so the module package
 * stays self-contained — copying the small subset the widgets actually
 * use rather than depending on a host-app barrel.
 */

const NAIRA_FORMATTER = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

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

/**
 * Short, scannable label for a wallet transaction in the recent-list
 * widget. Falls back to the type-string when description is missing.
 */
export function formatTransactionLabel(opts: {
  description: string | null | undefined;
  type: string | null | undefined;
}): string {
  const description = (opts.description ?? "").trim();
  if (description) return description;
  const type = (opts.type ?? "").trim();
  if (!type) return "Wallet activity";
  return type
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((word) => word[0]!.toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
