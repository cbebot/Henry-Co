/**
 * V3-42 — the four dashboard lenses, and who may see each.
 *
 * THE SECURITY FACT THIS FILE ENCODES
 * ===================================
 * V3-40 and V3-41 deliberately chose DIFFERENT RLS predicates:
 *
 *   risk_scores / risk_enforcement_log   ->  is_staff_in('security')   [V3-40]
 *   workload_forecasts / quality_assessments / dispute_likelihoods
 *                                        ->  is_staff_in_any()         [V3-41]
 *
 * That asymmetry IS the per-role matrix this pass must honour: a support
 * operator drilling into a chart genuinely cannot reach a risk row, because the
 * database will not return it. The dashboards therefore read with the
 * RLS-SCOPED staff client and never the service-role admin client — using admin
 * here would silently dissolve the entire guarantee.
 *
 * The gate below is defence in depth and an honesty measure, not the security
 * boundary. Without it a support operator would be shown a "Risk trend" chart
 * that is permanently empty, which reads as "the platform has no risk" rather
 * than "you cannot see this". The database is the gate; this is the affordance.
 *
 * WHY THIS FILE IS PURE: it takes a resolved capability object, not a viewer.
 * `@henryco/auth/staff` is a `server-only` module that throws the moment it is
 * imported outside a server bundler, so importing it here would make the lens
 * policy — the most security-relevant logic in the pass — untestable. The auth
 * lookup stays in `index.tsx` (already server-only) and hands the answer down.
 */

import type { RecommendationRoleScope } from "@henryco/intelligence";

export type LensKey = RecommendationRoleScope; // 'trust' | 'finance' | 'support' | 'moderation'

export const LENS_KEYS: readonly LensKey[] = ["trust", "finance", "support", "moderation"] as const;

/**
 * What the viewer is allowed to reach, already resolved by the caller from
 * `hasStaffAccessIn` — the TS mirror of the SQL predicates.
 */
export interface LensCapabilities {
  /** Mirrors `is_staff_in('security')`: the ONLY gate on V3-40's tables. */
  security: boolean;
}

export interface LensDefinition {
  key: LensKey;
  /** Accent for the lens header, from the shared staff division palette. */
  division: "security" | "marketplace" | "staff" | "hub";
  /**
   * Whether this lens reads V3-40's security-gated tables. Exactly one does.
   */
  readsRestrictedRiskTables: boolean;
}

export const LENSES: Readonly<Record<LensKey, LensDefinition>> = {
  // The ONLY lens that reads V3-40's security-gated tables.
  trust: { key: "trust", division: "security", readsRestrictedRiskTables: true },
  finance: { key: "finance", division: "marketplace", readsRestrictedRiskTables: false },
  support: { key: "support", division: "staff", readsRestrictedRiskTables: false },
  moderation: { key: "moderation", division: "hub", readsRestrictedRiskTables: false },
};

/**
 * May this viewer see this lens?
 *
 * Mirrors the SQL exactly: the trust lens requires `security` membership; the
 * other three require only that the viewer is staff at all, which the Track C
 * layout guard has already established before any module renders.
 */
export function canViewLens(caps: LensCapabilities, lens: LensKey): boolean {
  if (LENSES[lens]?.readsRestrictedRiskTables) return Boolean(caps?.security);
  return LENS_KEYS.includes(lens);
}

/** Every lens this viewer may see, in a stable display order. */
export function lensesForViewer(caps: LensCapabilities): LensKey[] {
  return LENS_KEYS.filter((lens) => canViewLens(caps, lens));
}

/**
 * Resolve the lens to render from a requested value.
 *
 * An unknown OR forbidden request falls back to the viewer's first permitted
 * lens rather than throwing — a bookmarked `?lens=trust` from a demoted
 * operator should show them their own dashboard, not an error page. It must
 * never fall through to the requested lens.
 */
export function resolveLens(caps: LensCapabilities, requested?: string | null): LensKey {
  const permitted = lensesForViewer(caps);
  // Compare against the literal key list, never against arbitrary input: a
  // property lookup here would let "__proto__" or "constructor" through.
  const wanted = LENS_KEYS.find((lens) => lens === requested);
  if (wanted && permitted.includes(wanted)) return wanted;
  return permitted[0] ?? "support";
}
