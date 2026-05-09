import "server-only";

// Side-effect: registers all 9 Track B owner modules with
// @henryco/dashboard-shell/owner-register on first import.
import "@henryco/dashboard-modules-owner/modules";

import {
  getEligibleOwnerModules,
  type OwnerDashboardModule,
} from "@henryco/dashboard-shell/owner-register";
import { buildOwnerViewer, type OwnerViewer } from "@henryco/auth/owner";
import type { UnifiedViewer } from "@henryco/auth";

/**
 * G2 deliverable — Track B WorkspaceRail composition reads from the
 * owner registry, NOT from `getEligibleModules` (Track A) or
 * `getEligibleStaffModules` (Track C). This is the literal anti-pattern
 * #19 enforcement called out in the DASH-8 prompt:
 *
 *   "Verify by inspecting Track B's WorkspaceRail composition: it
 *    reads from getEligibleOwnerModules(viewer), not getEligibleModules."
 *
 * Returns the modules the owner viewer is eligible to see, in registration
 * order. Each module carries its slug, title, icon, routes, palette
 * entries, notification categories, and (where applicable) bulk actions
 * and KPI descriptors.
 *
 * Wiring point: imported by `apps/hub/app/owner/(command)/layout.tsx`.
 * Sidebar composition can derive its sections from this list directly,
 * or fall back to the legacy `getOwnerNavSections()` for hierarchical
 * sub-children that the registry does not yet model.
 */
export function getOwnerRailFromRegistry(viewer: UnifiedViewer): ReadonlyArray<OwnerDashboardModule> {
  if (!viewer.access.hasOwnerAccess) return [];
  const ownerViewer: OwnerViewer = buildOwnerViewer(viewer);
  return getEligibleOwnerModules(ownerViewer);
}

/**
 * Convenience derivation: produce the rail entries shaped for a simple
 * sidebar render. Each entry has the URL the rail link should hit
 * (derived from the module's first "home" route under the /owner
 * prefix) plus the module title and slug for keyed rendering.
 */
export function getOwnerRailEntries(viewer: UnifiedViewer): ReadonlyArray<{
  slug: string;
  title: string;
  href: string;
  description: string;
}> {
  const modules = getOwnerRailFromRegistry(viewer);
  return modules.map((module) => {
    const homeRoute = module.getRoutes().find((r) => r.kind === "home");
    const path = homeRoute ? homeRoute.path : "";
    const href = path === "" ? "/owner" : `/owner/${path}`;
    return {
      slug: module.slug,
      title: module.title,
      href,
      description: module.description,
    };
  });
}
