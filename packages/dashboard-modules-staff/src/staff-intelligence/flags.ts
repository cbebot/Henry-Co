/**
 * V3-42 — the dark-launch switch, kept in a PURE file so it is testable.
 * (`index.tsx` is `server-only` and cannot be loaded under node:test.)
 *
 * Default OFF: with `predictive_dashboards` unset the module is absent from the
 * staff rail, missing from the command palette, and its URL 404s — the host
 * only renders modules whose role gate allows them.
 */
import { isFlagEnabled, parseHenryFeatureFlags } from "@henryco/intelligence";

export const STAFF_INTELLIGENCE_PATH = "/modules/staff-intelligence";

export function staffIntelligenceEnabled(
  env: Record<string, string | undefined> = process.env as Record<string, string | undefined>,
): boolean {
  return isFlagEnabled(parseHenryFeatureFlags(env), "predictive_dashboards");
}
