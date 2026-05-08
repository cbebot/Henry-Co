import { Truck } from "lucide-react";
import type {
  StaffDashboardModule,
  RouteEntry,
  PaletteEntry,
  NotificationCategory,
} from "@henryco/dashboard-shell";
import { hasStaffAccessIn } from "@henryco/auth/staff";

export const staffCareModule: StaffDashboardModule = {
  slug: "staff-care",
  title: "Care",
  description: "Pickups, dispatch, payments, customer dispute triage.",
  icon: () => <Truck size={18} aria-hidden />,
  scope: { kind: "division", division: "care" },

  getEligibleViewer(viewer) {
    return hasStaffAccessIn(viewer, "care") ? "allowed" : "hidden";
  },

  getRoleGate(viewer) {
    if (!hasStaffAccessIn(viewer, "care")) return null;
    return { kind: "allow", role: viewer.role };
  },

  getRoutes(): ReadonlyArray<RouteEntry> {
    return [
      { path: "", kind: "home", label: "Care queue" },
      { path: "[bookingId]", kind: "detail", label: "Booking detail", params: ["bookingId"] },
    ];
  },

  async getCommandPaletteEntries(viewer): Promise<ReadonlyArray<PaletteEntry>> {
    if (!hasStaffAccessIn(viewer, "care")) return [];
    return [
      {
        id: "staff-care.queue",
        source: "staff-care",
        groupLabel: "Open" as const,
        label: "Open Care queue",
        kicker: "Staff",
        href: "/modules/staff-care",
        keywords: ["care", "pickups", "dispatch"],
      },
      {
        id: "staff-care.unpaid",
        source: "staff-care",
        groupLabel: "Open" as const,
        label: "Care · outstanding payments",
        kicker: "Staff",
        href: "/modules/staff-care?payment_status=outstanding",
        keywords: ["unpaid", "outstanding", "payment"],
      },
    ];
  },

  getNotificationCategories(): ReadonlyArray<NotificationCategory> {
    return [
      { slug: "care.booking", label: "Care · booking", accent: "#1F8B4C", source: "staff-care" },
      { slug: "care.payment", label: "Care · payment", accent: "#C9A227", source: "staff-care" },
      { slug: "care.dispute", label: "Care · dispute", accent: "#B91C1C", source: "staff-care" },
    ];
  },
};
