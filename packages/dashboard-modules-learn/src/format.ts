/**
 * Lightweight formatting helpers for the learn module's widgets. Mirrors
 * `packages/dashboard-modules-marketplace/src/format.ts` and the care
 * module's format helper so each module package stays self-contained (no
 * shared formatting import).
 */

import type { PaletteGroupLabel } from "@henryco/dashboard-shell";
import type { QuickActionGroup } from "./data";

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
 * Title-case status enum values (`under_review` → `Under review`).
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
