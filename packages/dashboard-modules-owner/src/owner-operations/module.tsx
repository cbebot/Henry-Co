import { Activity } from "lucide-react";
import type {
  OwnerDashboardModule,
  OwnerBulkAction,
} from "@henryco/dashboard-shell/owner-register";
import type {
  PaletteEntry,
  NotificationCategory,
  RouteEntry,
} from "@henryco/dashboard-shell";

/**
 * owner-operations — Track B operations module.
 *
 * Alerts, analytics, approvals, queues. The approvals queue carries
 * the highest-density bulk action stack — approve, decline, escalate
 * — each writing one audit_log row per row + a bulk_correlation_id
 * (V14 gate).
 */
export const ownerOperationsModule: OwnerDashboardModule = {
  slug: "owner-operations",
  title: "Operations",
  description: "Alerts, analytics, approvals, queues — operator-grade approvals + escalations.",
  icon: () => <Activity size={18} aria-hidden />,

  getEligibleViewer() {
    return "allowed";
  },

  getRoleGate(viewer) {
    return { kind: "allow", role: viewer.role };
  },

  getRoutes(): ReadonlyArray<RouteEntry> {
    return [
      { path: "operations", kind: "home", label: "Operations" },
      { path: "operations/alerts", kind: "detail", label: "Alerts" },
      { path: "operations/analytics", kind: "detail", label: "Analytics" },
      { path: "operations/approvals", kind: "detail", label: "Approvals" },
      { path: "operations/queues", kind: "detail", label: "Queues" },
    ];
  },

  async getCommandPaletteEntries(): Promise<ReadonlyArray<PaletteEntry>> {
    return [
      {
        id: "owner-operations.home",
        source: "owner-operations",
        groupLabel: "Open" as const,
        label: "Open operations center",
        kicker: "Owner",
        href: "/owner/operations",
        keywords: ["operations", "ops"],
      },
      {
        id: "owner-operations.approvals",
        source: "owner-operations",
        groupLabel: "Open" as const,
        label: "Approval center",
        kicker: "Owner",
        href: "/owner/operations/approvals",
        keywords: ["approvals", "approve", "decline"],
      },
      {
        id: "owner-operations.alerts",
        source: "owner-operations",
        groupLabel: "Open" as const,
        label: "Operational alerts",
        kicker: "Owner",
        href: "/owner/operations/alerts",
        keywords: ["alerts", "ops", "warnings"],
      },
      {
        id: "owner-operations.queues",
        source: "owner-operations",
        groupLabel: "Open" as const,
        label: "Operations queues",
        kicker: "Owner",
        href: "/owner/operations/queues",
        keywords: ["queues", "operations"],
      },
    ];
  },

  getNotificationCategories(): ReadonlyArray<NotificationCategory> {
    return [
      { slug: "owner.approval-pending", label: "Approval pending", accent: "#C9A227", source: "owner-operations" },
      { slug: "owner.ops-alert", label: "Operations alerts", accent: "#B91C1C", source: "owner-operations" },
    ];
  },

  getBulkActions(): ReadonlyArray<OwnerBulkAction> {
    return [
      {
        id: "approval.approve",
        label: "Approve",
        variant: "primary",
        confirmCopy: (n) => `This will approve ${n} item${n === 1 ? "" : "s"} and emit ${n} audit log row${n === 1 ? "" : "s"} grouped by a single bulk_correlation_id.`,
      },
      {
        id: "approval.decline",
        label: "Decline",
        variant: "destructive",
        requiresReason: true,
        confirmCopy: (n) => `Declining ${n} item${n === 1 ? "" : "s"} requires a reason. The reason is captured in each audit_log row.`,
      },
      {
        id: "approval.escalate",
        label: "Escalate",
        variant: "secondary",
        requiresReason: true,
      },
    ];
  },
};
