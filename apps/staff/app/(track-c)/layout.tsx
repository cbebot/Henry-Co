import type { ReactNode } from "react";
import { loadDashboardOptions } from "@henryco/auth/server";
import { StaffShell, StaffRailGroup, StaffRailEntry } from "@henryco/dashboard-shell/shell";
import { getEligibleStaffModules } from "@henryco/dashboard-shell";
import { getAccountUrl } from "@henryco/config";
import { STAFF_DIVISION_ACCENT } from "@henryco/dashboard-modules-staff/shared";
import "@henryco/dashboard-modules-staff/modules";

import { requireTrackCStaffViewer } from "./_internal/viewer";
import { selectRoleOption, signOutFromTrackC } from "./_actions/role-switcher";

export const dynamic = "force-dynamic";

/**
 * Track C (DASH-9) shell layout.
 *
 * Density-first chrome composition:
 *   - IdentityBar with role-switcher pulling loadDashboardOptions()
 *   - StaffShell wrapping the WorkspaceRail (left) + main + ContextDrawer (right)
 *   - WorkspaceRail composed from getEligibleStaffModules(viewer):
 *       * cross-division group at top (staff-overview, staff-support,
 *         staff-moderation, staff-finance-operator, staff-settings)
 *       * division-bound group below (one StaffRailEntry per
 *         division module the viewer has access in)
 *   - cheatsheet trigger in the IdentityBar trailing slot
 *
 * The shell calls requireTrackCStaffViewer() exactly once per render;
 * page components receive the viewer via props (not via a context).
 * Each module's getQueues() hydrates the rail badges in parallel.
 */
export default async function TrackCLayout({ children }: { children: ReactNode }) {
  const viewer = await requireTrackCStaffViewer();
  const roleOptions = await loadDashboardOptions({
    id: viewer.user.id,
    email: viewer.user.email,
    app_metadata: viewer.user.appMetadata,
    user_metadata: viewer.user.userMetadata,
  });
  const modules = getEligibleStaffModules(viewer);

  // Hydrate per-module queue badges in parallel. Each module's
  // getQueues returns an array of queue descriptors with pending counts.
  const queueByModule = new Map<string, { pending: number; breach: number }>();
  await Promise.all(
    modules.map(async (m) => {
      if (!m.getQueues) return;
      try {
        const qs = await m.getQueues(viewer);
        let pending = 0;
        let breach = 0;
        for (const q of qs) {
          pending += q.pendingCount;
          breach += q.slaBreachCount;
        }
        queueByModule.set(m.slug, { pending, breach });
      } catch {
        // Treat as zero — rail still renders.
      }
    }),
  );

  // Partition modules by scope.
  const crossDivisionModules = modules.filter((m) => m.scope.kind === "cross_division");
  const divisionModules = modules.filter((m) => m.scope.kind === "division");

  return (
    <StaffShell
      viewer={viewer}
      roleOptions={roleOptions}
      onSelectRoleOption={selectRoleOption}
      onSignOut={signOutFromTrackC}
      cheatsheetTrigger={
        <a
          href="/cheatsheet"
          aria-label="Keyboard shortcuts"
          style={{
            fontSize: "0.7rem",
            fontWeight: 600,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            padding: "0.4rem 0.6rem",
            borderRadius: "9999px",
            border: "1px solid rgba(10,10,10,0.12)",
            color: "rgba(10,10,10,0.65)",
            textDecoration: "none",
          }}
        >
          ?
        </a>
      }
      rail={
        <>
          {crossDivisionModules.length > 0 ? (
            <StaffRailGroup label="Org">
              {crossDivisionModules.map((m) => {
                const q = queueByModule.get(m.slug);
                return (
                  <StaffRailEntry
                    key={m.slug}
                    href={`/modules/${m.slug}`}
                    label={m.title}
                    pendingCount={q?.pending}
                    slaBreach={q ? q.breach > 0 : false}
                  />
                );
              })}
            </StaffRailGroup>
          ) : null}
          {divisionModules.length > 0 ? (
            <StaffRailGroup label="Divisions">
              {divisionModules.map((m) => {
                const q = queueByModule.get(m.slug);
                const division =
                  m.scope.kind === "division" ? m.scope.division : null;
                const accent = division
                  ? STAFF_DIVISION_ACCENT[division as keyof typeof STAFF_DIVISION_ACCENT]
                  : undefined;
                return (
                  <StaffRailEntry
                    key={m.slug}
                    href={`/modules/${m.slug}`}
                    label={m.title}
                    pendingCount={q?.pending}
                    slaBreach={q ? q.breach > 0 : false}
                    accent={accent}
                  />
                );
              })}
            </StaffRailGroup>
          ) : null}
        </>
      }
    >
      {children}
    </StaffShell>
  );
}

// Capture the import so `getAccountUrl` isn't tree-shaken — used by
// downstream pages for "manage in account" deep-links.
export const accountSettingsUrl = getAccountUrl("/settings");
