import { Users } from "lucide-react";
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
 * owner-staff — Track B staff center module.
 *
 * Directory, invite, roles, tree, per-user detail. Bulk actions on
 * staff members (suspend, restore, role change) write per-row
 * audit_log entries with bulk_correlation_id grouping (V14 gate).
 */
export const ownerStaffModule: OwnerDashboardModule = {
  slug: "owner-staff",
  title: "Staff",
  description: "Directory, invite, roles, tree — bulk role changes, suspensions, exports.",
  icon: () => <Users size={18} aria-hidden />,

  getEligibleViewer() {
    return "allowed";
  },

  getRoleGate(viewer) {
    return { kind: "allow", role: viewer.role };
  },

  getRoutes(): ReadonlyArray<RouteEntry> {
    return [
      { path: "staff", kind: "home", label: "Staff" },
      { path: "staff/directory", kind: "detail", label: "Directory" },
      { path: "staff/invite", kind: "detail", label: "Invite" },
      { path: "staff/roles", kind: "detail", label: "Roles" },
      { path: "staff/tree", kind: "detail", label: "Tree" },
      { path: "staff/users/:id", kind: "detail", label: "User detail", params: ["id"] },
    ];
  },

  async getCommandPaletteEntries(): Promise<ReadonlyArray<PaletteEntry>> {
    return [
      {
        id: "owner-staff.home",
        source: "owner-staff",
        groupLabel: "Open" as const,
        label: "Open staff center",
        kicker: "Owner",
        href: "/owner/staff",
        keywords: ["staff", "team", "directory"],
      },
      {
        id: "owner-staff.invite",
        source: "owner-staff",
        groupLabel: "Open" as const,
        label: "Invite staff member",
        kicker: "Owner",
        href: "/owner/staff/invite",
        keywords: ["invite", "add", "new staff"],
      },
      {
        id: "owner-staff.tree",
        source: "owner-staff",
        groupLabel: "Open" as const,
        label: "Org tree",
        kicker: "Owner",
        href: "/owner/staff/tree",
        keywords: ["tree", "org", "hierarchy"],
      },
    ];
  },

  getNotificationCategories(): ReadonlyArray<NotificationCategory> {
    return [
      { slug: "owner.staff-change", label: "Staff changes", accent: "#0E5A6F", source: "owner-staff" },
    ];
  },

  getBulkActions(): ReadonlyArray<OwnerBulkAction> {
    return [
      {
        id: "staff.suspend",
        label: "Suspend",
        variant: "destructive",
        requiresReason: true,
        confirmCopy: (n) => `Suspending ${n} staff member${n === 1 ? "" : "s"} blocks workspace access immediately. A reason is required.`,
      },
      {
        id: "staff.restore",
        label: "Restore",
        variant: "primary",
        confirmCopy: (n) => `Restore workspace access for ${n} staff member${n === 1 ? "" : "s"}.`,
      },
      {
        id: "staff.role-change",
        label: "Change role",
        variant: "secondary",
        requiresReason: true,
      },
    ];
  },
};
