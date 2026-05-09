import "server-only";

import { redirect } from "next/navigation";
import { getAccountUrl } from "@henryco/config";

import { requireUnifiedViewer, buildUnifiedViewer, getViewerRoles } from "./viewer";
import type {
  StaffDivision,
  StaffDivisionMembership,
  UnifiedViewer,
  ViewerRoles,
} from "./types";

/**
 * @henryco/auth/staff — Track C (staff dashboard) helpers.
 *
 * Source-of-truth gate for "is the caller staff at all?" + "in which
 * divisions?" — wraps the viewer + roles readers from ./viewer.ts so
 * Track C surfaces have one import path.
 *
 * The TS-side `hasStaffAccessIn()` mirrors the SQL `is_staff_in()`
 * predicate. It is a UI affordance — every RLS-relevant gate still
 * happens in the database. Drift between the two is structurally
 * limited because both join the same set of per-division
 * *_role_memberships tables + legacy profiles.role fallback.
 *
 * Anti-pattern #19 enforcement: Track C consumers import from
 * @henryco/auth/staff (not @henryco/auth/server). The two are
 * compatible but kept distinct so a search for staff-related auth
 * imports yields a single, exhaustive file list.
 */

/**
 * The staff-aware extension of UnifiedViewer. Adds the resolved
 * `staffMemberships` array (one row per division the viewer holds
 * operator access in) so per-page gates do not need a second
 * round-trip after the require gate has already loaded them.
 */
export type StaffViewer = UnifiedViewer & {
  /** Memberships resolved from the per-division *_role_memberships tables + legacy profiles.role fallback. */
  staffMemberships: ReadonlyArray<StaffDivisionMembership>;
};

/**
 * Track C entry gate. Composes `requireUnifiedViewer()`, then redirects
 * to the unified login page (with `role=staff` so the post-auth router
 * lands the viewer back here on success) if the viewer holds zero
 * staff access in any division.
 *
 * Returned `staffMemberships` reflects the authoritative list per the
 * `is_staff_in()` join. Multi-division operators see every division
 * they belong to; single-division operators see one row.
 *
 * USE FROM: `apps/staff/app/(track-c)/layout.tsx` exactly once per
 * shell render. Subsequent components within the shell receive the
 * StaffViewer as a prop rather than re-calling.
 */
export async function requireStaffViewer(): Promise<StaffViewer> {
  const viewer = await requireUnifiedViewer();
  const roles = await getViewerRoles(viewer);

  if (!roles.hasStaffAccess) {
    // Hand off to the unified login page with role=staff so the
    // post-auth resolver routes the viewer back to the staff surface
    // on success. If the viewer is truly customer-only, the login
    // page surfaces a "no staff access" state via getStaffHqUrl(/no-access).
    redirect(getAccountUrl("/login?role=staff"));
  }

  return {
    ...viewer,
    staffMemberships: roles.staffMemberships,
  };
}

/**
 * Compose `requireStaffViewer()` from a host-app session helper. Use
 * this when the caller already has the authenticated user object —
 * mirrors `buildUnifiedViewer()` exactly with the staff-access gate
 * appended.
 */
export async function buildStaffViewer(user: {
  id: string;
  email: string | null;
  fullName?: string | null;
  avatarUrl?: string | null;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
}): Promise<StaffViewer> {
  const viewer = await buildUnifiedViewer(user);
  const roles = await getViewerRoles(viewer);

  if (!roles.hasStaffAccess) {
    redirect(getAccountUrl("/login?role=staff"));
  }

  return {
    ...viewer,
    staffMemberships: roles.staffMemberships,
  };
}

/**
 * Read the viewer's staff memberships without enforcing the gate.
 * Use when you have a UnifiedViewer and want the list (e.g. the
 * IdentityBar role-switcher preview).
 */
export async function getStaffMemberships(viewer: UnifiedViewer): Promise<ReadonlyArray<StaffDivisionMembership>> {
  const roles = await getViewerRoles(viewer);
  return roles.staffMemberships;
}

/**
 * TS-side mirror of the SQL `is_staff_in(division_key)` predicate.
 *
 * Source of truth is the SQL function. This helper exists for UI
 * affordance: a per-module getRoleGate() can decide whether to render
 * the module entry without a network round-trip. The actual gate at
 * query time is enforced by RLS via is_staff_in().
 *
 * `viewer` MUST have memberships resolved (StaffViewer or a UnifiedViewer
 * paired with a getViewerRoles() call). Plain UnifiedViewer without
 * memberships has no division detail to answer against.
 *
 * `roleKey` is optional. When set, the membership's role must match
 * (case-insensitive). Pass null/undefined for "any role on this division".
 */
export function hasStaffAccessIn(
  viewer: StaffViewer | { staffMemberships: ReadonlyArray<StaffDivisionMembership> },
  divisionKey: StaffDivision,
  roleKey?: string | null,
): boolean {
  const normalizedDivision = divisionKey.toLowerCase();
  const normalizedRole = roleKey ? roleKey.toLowerCase() : null;

  for (const membership of viewer.staffMemberships) {
    if (membership.division.toLowerCase() !== normalizedDivision) continue;
    if (normalizedRole === null) return true;
    if (membership.role.toLowerCase() === normalizedRole) return true;
  }
  return false;
}

/**
 * Returns the divisions this viewer has any staff access in, sorted
 * by the canonical division order. Used by:
 *   - The Track C WorkspaceRail to render division-grouped queues.
 *   - The cross-division aggregation tiles in staff-overview.
 */
export function getStaffDivisionsForViewer(
  viewer: StaffViewer | { staffMemberships: ReadonlyArray<StaffDivisionMembership> },
): ReadonlyArray<StaffDivision> {
  const seen = new Set<StaffDivision>();
  for (const m of viewer.staffMemberships) {
    seen.add(m.division);
  }
  return STAFF_DIVISION_RAIL_ORDER.filter((d) => seen.has(d));
}

/**
 * The canonical division order Track C surfaces use when rendering
 * division-grouped chrome. Mirrors `COMPANY.divisions` order from
 * `packages/config/company.ts` — kept here so this file is
 * self-contained for callers that don't otherwise import config.
 *
 * Note: `hub`, `staff`, `account`, `security`, `system` are
 * organisation-wide operator surfaces, not customer-facing divisions.
 * They appear in `is_staff_in()` and may show in memberships, but
 * the Track C rail does NOT render an entry for them — they map to
 * staff-overview / staff-settings instead.
 */
const STAFF_DIVISION_RAIL_ORDER: ReadonlyArray<StaffDivision> = [
  "care",
  "marketplace",
  "property",
  "studio",
  "jobs",
  "learn",
  "logistics",
];

/**
 * Convenience: returns roles for a given division if the viewer has
 * any (multiple roles within a division get a flattened list). Used
 * by the IdentityBar division pill detail and by per-module gates
 * that branch on role within a division (e.g. moderator vs operator).
 */
export function getStaffRolesIn(
  viewer: { staffMemberships: ReadonlyArray<StaffDivisionMembership> },
  divisionKey: StaffDivision,
): ReadonlyArray<string> {
  const normalizedDivision = divisionKey.toLowerCase();
  const roles: string[] = [];
  for (const m of viewer.staffMemberships) {
    if (m.division.toLowerCase() === normalizedDivision) {
      roles.push(m.role);
    }
  }
  return roles;
}

// Re-export ViewerRoles type for downstream Track C imports — they
// commonly want the membership-bearing readout without re-importing
// from @henryco/auth.
export type { StaffDivisionMembership, StaffDivision, ViewerRoles };
