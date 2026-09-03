/**
 * Lightweight formatting helpers for the jobs module. Mirrors
 * `packages/dashboard-modules-marketplace/src/format.ts` so the package
 * stays self-contained.
 */

import type { PaletteGroupLabel } from "@henryco/dashboard-shell";
import type { QuickActionGroup } from "./data";

export function toPaletteGroup(group: QuickActionGroup): PaletteGroupLabel {
  return group;
}
