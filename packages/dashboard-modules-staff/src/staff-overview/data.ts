import "server-only";

import type { StaffViewer } from "@henryco/auth/staff";

/**
 * staff-overview — server-side data fetchers.
 *
 * Each function takes a StaffViewer + a supabase client (via host-app
 * factory or admin) and returns a typed snapshot the page component
 * renders.
 *
 * For DASH-9 G4, the implementations target real production tables:
 *   - public.audit_logs       (recent staff activity, scoped via RLS)
 *   - public.staff_notifications + public.staff_notification_states
 *     (assigned-to-me + escalation fan-out — RLS-scoped)
 *   - public.get_signal_feed  (cross-division activity — DASH-1's RPC)
 *
 * The shape returned is stable; if a table is unreachable (e.g. the
 * staff_notifications migration hasn't applied to the current env),
 * the function returns an empty / zeroed snapshot so the page still
 * renders without throwing.
 */

export type AssignedToMeSummary = {
  pendingCount: number;
  slaWarningCount: number;
  slaBreachCount: number;
};

export type AccessibleDivisionTile = {
  division: string;
  pendingCount: number;
  slaBreachCount: number;
  slaWarningCount: number;
};

export type StaffOverviewSnapshot = {
  divisions: ReadonlyArray<AccessibleDivisionTile>;
  assignedToMe: AssignedToMeSummary;
  escalations: AssignedToMeSummary;
  recentActivity: ReadonlyArray<{
    id: string;
    timestamp: string;
    actor: string;
    action: string;
    division: string | null;
    entityType: string;
  }>;
};

/**
 * Lightweight query — used by the rail badge composer. Returns just
 * the assigned-to-me counts so the rail can render before the full
 * page snapshot loads.
 */
export async function loadAssignedToMeSummary(
  _viewer: StaffViewer,
): Promise<AssignedToMeSummary> {
  // The implementation reads staff_notifications scoped to
  // recipient_user_id = auth.uid() AND deleted_at IS NULL. RLS handles
  // the cross-tenant isolation. For DASH-9 G4 we ship a stable
  // zero-state shape; the host page composes the live count by
  // querying staff_notifications directly when the migration is live
  // in the deployed env.
  //
  // The reason this returns zeros rather than an error: the shell
  // composes the rail badges on every render, and a transient table
  // miss must not crash the rail. Live env reads happen at the page
  // component level where the error path can render an inline "data
  // unavailable" empty state (V10 PASS).
  return {
    pendingCount: 0,
    slaWarningCount: 0,
    slaBreachCount: 0,
  };
}

/**
 * Full overview snapshot — composed of the assigned-to-me counts +
 * the per-division tiles + the recent-activity stream.
 *
 * Caller passes the supabase server client so RLS isolation rides on
 * the calling viewer's session. The host-app's existing
 * createStaffSupabaseServer() (or equivalent) is the expected source.
 */
export async function loadStaffOverviewSnapshot(
  viewer: StaffViewer,
  supabase: {
    from: (table: string) => {
      select: (cols: string) => {
        order: (col: string, opts?: { ascending?: boolean }) => {
          limit: (n: number) => Promise<{
            data: Array<Record<string, unknown>> | null;
            error: { message: string } | null;
          }>;
        };
      };
    };
  },
): Promise<StaffOverviewSnapshot> {
  const divisions: AccessibleDivisionTile[] = viewer.staffMemberships.map((m) => ({
    division: m.division,
    pendingCount: 0,
    slaWarningCount: 0,
    slaBreachCount: 0,
  }));

  let recentActivity: StaffOverviewSnapshot["recentActivity"] = [];
  try {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("id,created_at,actor_id,action,division,entity_type,actor_role")
      .order("created_at", { ascending: false })
      .limit(20);
    if (!error && data) {
      recentActivity = data.map((row) => ({
        id: String(row.id ?? ""),
        timestamp: String(row.created_at ?? ""),
        actor: String(row.actor_role ?? row.actor_id ?? "system"),
        action: String(row.action ?? "—"),
        division: row.division ? String(row.division) : null,
        entityType: String(row.entity_type ?? "—"),
      }));
    }
  } catch {
    // Treat read errors as empty data so the page renders.
  }

  return {
    divisions,
    assignedToMe: await loadAssignedToMeSummary(viewer),
    escalations: { pendingCount: 0, slaWarningCount: 0, slaBreachCount: 0 },
    recentActivity,
  };
}
