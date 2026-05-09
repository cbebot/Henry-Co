import { LayoutDashboard } from "lucide-react";
import type {
  OwnerDashboardModule,
  OwnerKpiDescriptor,
} from "@henryco/dashboard-shell/owner-register";
import type {
  PaletteEntry,
  NotificationCategory,
  RouteEntry,
} from "@henryco/dashboard-shell";

/**
 * owner-overview — Track B executive briefing module.
 *
 * Always visible. The home of the owner shell — executive situation
 * room, comms-health 4-tile, next-best owner actions, signals,
 * sensitive activity.
 *
 * KPI cards (6+ per DASH-8 G3): divisions live, recognized revenue,
 * open support pressure, active staff, critical signals, outbound
 * notifications. Each carries a reconcile-trace id (V15 gate).
 */
export const ownerOverviewModule: OwnerDashboardModule = {
  slug: "owner-overview",
  title: "Overview",
  description: "Executive briefing — divisions, finance pressure, signals, sensitive activity.",
  icon: () => <LayoutDashboard size={18} aria-hidden />,

  getEligibleViewer() {
    return "allowed";
  },

  getRoleGate(viewer) {
    return { kind: "allow", role: viewer.role };
  },

  getRoutes(): ReadonlyArray<RouteEntry> {
    return [{ path: "", kind: "home", label: "Overview" }];
  },

  async getCommandPaletteEntries(): Promise<ReadonlyArray<PaletteEntry>> {
    return [
      {
        id: "owner-overview.home",
        source: "owner-overview",
        groupLabel: "Open" as const,
        label: "Open executive overview",
        kicker: "Owner",
        href: "/owner",
        keywords: ["overview", "briefing", "executive", "kpi"],
      },
      {
        id: "owner-overview.signals",
        source: "owner-overview",
        groupLabel: "Open" as const,
        label: "Urgent signals",
        kicker: "Owner",
        href: "/owner#urgent-signals",
        keywords: ["signals", "urgent", "critical"],
      },
      {
        id: "owner-overview.sensitive",
        source: "owner-overview",
        groupLabel: "Open" as const,
        label: "Sensitive activity",
        kicker: "Owner",
        href: "/owner/settings/audit",
        keywords: ["audit", "sensitive", "activity", "log"],
      },
    ];
  },

  getNotificationCategories(): ReadonlyArray<NotificationCategory> {
    return [
      { slug: "owner.signal", label: "Owner signals", accent: "#1E1E1E", source: "owner-overview" },
      { slug: "owner.briefing", label: "Executive briefing", accent: "#C9A227", source: "owner-overview" },
    ];
  },

  async getOwnerKpis(): Promise<ReadonlyArray<OwnerKpiDescriptor>> {
    // Server-side: actual values come from `getOwnerOverviewData()` at
    // the page level. The descriptors here are the shape contract — the
    // host page calls them with live data and renders the MetricCards.
    // Each KPI carries a traceId so the reconcile-trace drawer can open.
    return [
      { id: "divisions-live", label: "Live divisions", value: "—", traceId: "overview.divisions-live" },
      { id: "recognized-revenue", label: "Recognized revenue", value: "—", traceId: "overview.recognized-revenue" },
      { id: "open-support", label: "Open support pressure", value: "—", traceId: "overview.open-support" },
      { id: "active-staff", label: "Active staff", value: "—", traceId: "overview.active-staff" },
      { id: "critical-signals", label: "Critical signals", value: "—", traceId: "overview.critical-signals" },
      { id: "outbound-notifications", label: "Outbound notifications", value: "—", traceId: "overview.outbound-notifications" },
    ];
  },

  async getReconcileTrace(traceId) {
    // Stub — host-side resolver (apps/hub/lib/owner-reconcile-trace.ts)
    // implements the actual SQL lookup. The module returns null here so
    // the host can override per-page.
    void traceId;
    return null;
  },
};
