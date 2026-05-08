/**
 * Lightweight formatting helpers for the support module.
 *
 * Mirrors the small subset of apps/account/lib/format.ts surfaces the
 * widgets actually use; keeps the module package self-contained.
 */

const STATUS_LABEL: Record<string, string> = {
  open: "Open",
  awaiting_reply: "Awaiting your reply",
  in_progress: "In progress",
  resolved: "Resolved",
  closed: "Closed",
};

export function statusLabel(status: string | null | undefined): string {
  const key = (status ?? "").toLowerCase();
  return STATUS_LABEL[key] ?? "Open";
}

const DIVISION_LABEL: Record<string, string> = {
  account: "Account",
  care: "Care",
  jobs: "Jobs",
  learn: "Learn",
  logistics: "Logistics",
  marketplace: "Marketplace",
  property: "Property",
  studio: "Studio",
  wallet: "Wallet",
};

export function divisionLabel(division: string | null | undefined): string | null {
  if (!division) return null;
  return DIVISION_LABEL[division.toLowerCase()] ?? null;
}

/**
 * Compact relative-time formatter — matches the wallet module shape.
 * "just now / Xm ago / Xh ago / Xd ago / locale date".
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
