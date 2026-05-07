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
