import { LayoutDashboard } from "lucide-react";
import type {
  StaffDashboardModule,
  RouteEntry,
  PaletteEntry,
  NotificationCategory,
} from "@henryco/dashboard-shell";

import { StaffOverviewPage } from "./page";

/**
 * staff-overview — Track C operator briefing module.
 *
 * Cross-division. Always visible to any staff viewer (since
 * `requireStaffViewer` redirects out before this module renders).
 *
 * Surfaces:
 *   - accessible-divisions tiles (the divisions this viewer has
 *     staff access in, with per-division pending counts)
 *   - assigned-to-me queue (cross-division, sorted by SLA-warning
 *     first then by createdAt)
 *   - escalations-pending list (every queue row marked escalated
 *     by another operator that lands in this viewer's escalation
 *     fan-out)
 *   - SLA-warning aggregate metric tile
 *   - quick-action stack (jump-to-queue keyboard shortcuts)
 */
export const staffOverviewModule: StaffDashboardModule = {
  slug: "staff-overview",
  title: "Overview",
  description: "Operator briefing — divisions, queues, SLA, escalations.",
  icon: () => <LayoutDashboard size={18} aria-hidden />,
  scope: { kind: "cross_division" },

  getEligibleViewer() {
    return "allowed";
  },

  getRoleGate(viewer) {
    return { kind: "allow", role: viewer.role };
  },

  getRoutes(): ReadonlyArray<RouteEntry> {
    return [{ path: "", kind: "home", label: "Overview" }];
  },

  async getCommandPaletteEntries(viewer): Promise<ReadonlyArray<PaletteEntry>> {
    return [
      {
        id: "staff-overview.home",
        source: "staff-overview",
        groupLabel: "Open" as const,
        label: "Open overview",
        kicker: "Staff",
        href: "/modules/staff-overview",
        keywords: ["overview", "briefing", "queues", "sla"],
      },
      {
        id: "staff-overview.assigned-to-me",
        source: "staff-overview",
        groupLabel: "Open" as const,
        label: "Assigned to me",
        kicker: "Staff",
        href: "/modules/staff-overview?lens=assigned",
        keywords: ["assigned", "mine", "todo"],
      },
      {
        id: "staff-overview.sla-warning",
        source: "staff-overview",
        groupLabel: "Open" as const,
        label: "SLA warnings",
        kicker: "Staff",
        href: "/modules/staff-overview?lens=sla",
        keywords: ["sla", "warning", "breach", "overdue"],
      },
    ];
  },

  getNotificationCategories(): ReadonlyArray<NotificationCategory> {
    return [
      {
        slug: "staff.escalation",
        label: "Escalations",
        accent: "#B91C1C", source: "staff-overview",
      },
      {
        slug: "staff.assignment",
        label: "Assignments",
        accent: "#0E5A6F", source: "staff-overview",
      },
      {
        slug: "staff.sla",
        label: "SLA alerts",
        accent: "#C9A227", source: "staff-overview",
      },
    ];
  },

  async getQueues(viewer) {
    // staff-overview is a meta-surface — the actual queues belong to
    // the per-division modules. This returns the cross-division
    // aggregate "Assigned to me" pseudo-queue for the rail badge.
    const { loadAssignedToMeSummary } = await import("./data");
    const summary = await loadAssignedToMeSummary(viewer);
    return [
      {
        id: "assigned-to-me",
        title: "Assigned to me",
        href: "?lens=assigned",
        pendingCount: summary.pendingCount,
        slaWarningCount: summary.slaWarningCount,
        slaBreachCount: summary.slaBreachCount,
      },
    ];
  },
};
