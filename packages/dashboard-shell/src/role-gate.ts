/**
 * @henryco/dashboard-shell/role-gate — RoleDecision contract.
 *
 * Each module's `getRoleGate(viewer)` returns a RoleDecision describing
 * which features within the module the viewer can use. The shell uses
 * this to:
 *
 *   1. Hide the module's WorkspaceRail entry entirely (`null`)
 *   2. Render the module but disable specific actions (`{kind: "allow",
 *      restrictions: [...]}`)
 *   3. Render with role-specific surfaces (`{kind: "allow", role: ...}`)
 *
 * The actual permission gate is enforced at the SQL/RLS layer + at
 * each API route. This contract is for UI affordance — nothing here
 * is security-critical.
 */

import type { DashboardRole, UnifiedViewer } from "@henryco/auth";

/**
 * One restriction within an allowed module. The shell uses these to
 * disable specific UI affordances (e.g. "this user can read but not
 * write") without hiding the module wholesale.
 */
export type RoleRestriction = {
  /** Stable id describing what's restricted. */
  feature: string;

  /** Human-readable reason — surfaced in tooltips. */
  reason?: string;
};

/**
 * The RoleDecision union. Modules return one of:
 *   - `null` — viewer cannot see the module
 *   - `{kind: "allow", role, restrictions}` — viewer can see, with
 *     possibly some features restricted
 *
 * Note: there is no `{kind: "deny"}` — denying the module is the
 * same as returning `null`. Distinguishing them at the type level
 * adds noise without value.
 */
export type RoleDecision = {
  kind: "allow";
  /**
   * The role the module should render for. Lets a module surface
   * different layouts for different roles (e.g. `customer` vs
   * `division_operator`).
   */
  role: DashboardRole;
  /** Optional list of restrictions the UI should respect. */
  restrictions?: ReadonlyArray<RoleRestriction>;
};

/**
 * Convenience helpers.
 */
export function allow(
  role: DashboardRole,
  restrictions?: ReadonlyArray<RoleRestriction>,
): RoleDecision {
  return restrictions ? { kind: "allow", role, restrictions } : { kind: "allow", role };
}

export function deny(): null {
  return null;
}

/**
 * Default role gate that mirrors the viewer's resolved role. Modules
 * that don't need custom logic can just return `defaultRoleGate(viewer)`.
 */
export function defaultRoleGate(viewer: UnifiedViewer): RoleDecision {
  return { kind: "allow", role: viewer.role };
}

/**
 * Customer-surface eligibility check. Returns `true` for any
 * authenticated viewer who can use the customer surface (i.e.
 * `apps/account`). The customer surface is open to all authenticated
 * humans — customers, owners, and staff all have wallets, can place
 * orders, and need access to their personal account chrome.
 *
 * Track A modules use this to decide whether to render in the
 * customer surface's rail / drawer / catch-all router. It is
 * deliberately broader than `viewer.kind === "customer"` because the
 * primary-lane `kind` describes which dashboard the viewer is routed
 * to BY DEFAULT, not who can use the customer surface when they're
 * already there. An owner who lands on `apps/account` (e.g. via the
 * lane switcher, a deep link, a bookmark, or a notification deep-link
 * template) is still entitled to the customer modules of that surface.
 *
 * Anti-pattern this closes: the previous `kind === "customer"` gate
 * conflated "primary lane" with "surface eligibility", so owner and
 * staff viewers in `apps/account` saw an empty module rail + 404s on
 * every `/modules/<slug>` URL even though the underlying division
 * pages (`/marketplace`, `/wallet`, …) rendered fine for them.
 *
 * The data-layer gates (`loadMarketplaceSnapshot`, `loadWalletSnapshot`,
 * etc.) remain `kind === "customer"` because those load user-scoped
 * customer-context rows that only exist for customer-lane viewers;
 * non-customer viewers see an empty snapshot which the widgets render
 * as the standard empty-state.
 *
 * For ANY non-trivial role logic, modules should still build their own
 * `getRoleGate`. This helper is the shared check for the three Track A
 * modules that share the same eligibility intent.
 */
export function viewerCanUseCustomerSurface(viewer: UnifiedViewer): boolean {
  // Every UnifiedViewer is, by construction, an authenticated user:
  // `requireUnifiedViewer` / `buildUnifiedViewer` redirect anonymous
  // callers to /login before producing a viewer. So presence of a
  // viewer.user.id is sufficient evidence of customer-surface access.
  return Boolean(viewer.user.id);
}
