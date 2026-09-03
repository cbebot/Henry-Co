/**
 * Lightweight formatting helpers for the care module's widgets. Mirrors
 * `packages/dashboard-modules-marketplace/src/format.ts` so each module
 * package stays self-contained (no shared formatting import).
 */

import type { PaletteGroupLabel } from "@henryco/dashboard-shell";
import type { QuickActionGroup } from "./data";

const NF_NGN = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 });

/**
 * Format a care money amount. Unlike the marketplace / wallet modules
 * (which store kobo), `care_bookings.balance_due` is persisted in **whole
 * naira** — this mirrors `apps/account/components/care/helpers.ts:formatNaira`,
 * which formats the value directly with no `/100`. Non-positive / invalid
 * amounts render as an em dash so empty money never reads as "₦0".
 */
export function formatNaira(amount: number | null | undefined): string {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) return "—";
  return `₦${NF_NGN.format(n)}`;
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
  return value.replace(/[_-]+/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase());
}

/**
 * Map a module-local quick-action group to the shell's
 * `PaletteGroupLabel`. The local groups are a strict subset, so this is
 * a total, lossless mapping (kept as a function so the subset stays
 * type-checked against the shell union).
 */
export function toPaletteGroup(group: QuickActionGroup): PaletteGroupLabel {
  return group;
}
