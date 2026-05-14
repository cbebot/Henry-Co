import {
  AlertTriangle,
  Banknote,
  Bell,
  Building2,
  CalendarDays,
  Camera,
  ClipboardCheck,
  Compass,
  History,
  LayoutDashboard,
  LineChart,
  Map,
  PackageCheck,
  ReceiptText,
  Route,
  Truck,
  Users,
} from "lucide-react";
import type { WorkspaceNavItem } from "@henryco/workspace-shell";

/**
 * V3 PASS 21 — logistics operator workspace navigation.
 *
 * One nav list per operator surface: rider, dispatcher, manager,
 * owner. Each list seeds the WorkspaceShell sidebar; the first 4 of
 * each list also seed the mobile bottom-nav (the rider workspace
 * specifically asks for "4 anchors" in the mobile parity spec).
 */

export const riderNavItems: WorkspaceNavItem[] = [
  {
    href: "/rider",
    label: "Today",
    icon: LayoutDashboard,
    description: "Today's queue",
  },
  {
    href: "/rider/active",
    label: "Active leg",
    icon: Route,
    description: "Current pickup or drop-off",
  },
  {
    href: "/rider/history",
    label: "History",
    icon: History,
    description: "Completed legs",
  },
  {
    href: "/rider/notifications",
    label: "Alerts",
    icon: Bell,
    hasIndicator: true,
    description: "Dispatch + customer alerts",
  },
  {
    href: "/rider/expenses",
    label: "Expenses",
    icon: ReceiptText,
    description: "Fuel + maintenance log",
  },
];

export const dispatcherNavItems: WorkspaceNavItem[] = [
  {
    href: "/dispatcher",
    label: "Live board",
    icon: LayoutDashboard,
    description: "Unassigned pickups + live riders",
  },
  {
    href: "/dispatcher/zones",
    label: "Zones",
    icon: Map,
    description: "Corridors + surge + SLA",
  },
  {
    href: "/dispatcher/exceptions",
    label: "Exceptions",
    icon: AlertTriangle,
    hasIndicator: true,
    description: "Delayed / failed shipments",
  },
  {
    href: "/dispatcher/fleet",
    label: "Fleet",
    icon: Truck,
    description: "Vehicles + riders on shift",
  },
];

export const managerNavItems: WorkspaceNavItem[] = [
  {
    href: "/manager",
    label: "Operations",
    icon: LayoutDashboard,
    description: "On-time, exceptions, revenue",
  },
  {
    href: "/manager/fleet",
    label: "Fleet",
    icon: Truck,
    description: "Vehicles + riders directory",
  },
  {
    href: "/manager/sla",
    label: "SLA",
    icon: ClipboardCheck,
    description: "Per-corridor SLA health",
  },
  {
    href: "/manager/finance",
    label: "Finance",
    icon: Banknote,
    description: "Revenue, payouts, fuel",
  },
  {
    href: "/manager/claims",
    label: "Claims",
    icon: PackageCheck,
    hasIndicator: true,
    description: "Damaged / lost shipments",
  },
];

export const ownerNavItems: WorkspaceNavItem[] = [
  {
    href: "/owner",
    label: "Strategic",
    icon: LineChart,
    description: "Monthly volume + growth",
  },
  {
    href: "/owner/business",
    label: "Business",
    icon: Building2,
    description: "B2B account roster",
  },
  {
    href: "/owner/staff",
    label: "Staff",
    icon: Users,
    description: "Operator directory",
  },
  {
    href: "/owner/calendar",
    label: "Calendar",
    icon: CalendarDays,
    description: "Shift + service calendar",
  },
];

export const RIDER_MOBILE_NAV = riderNavItems.slice(0, 4);
export const DISPATCHER_MOBILE_NAV = dispatcherNavItems.slice(0, 4);
export const MANAGER_MOBILE_NAV = managerNavItems.slice(0, 4);
export const OWNER_MOBILE_NAV = ownerNavItems.slice(0, 4);

export const RIDER_BRAND = {
  shortName: "Rider workspace",
  kicker: "HenryCo · Logistics",
  href: "/rider",
  icon: Compass,
};

export const DISPATCHER_BRAND = {
  shortName: "Dispatch board",
  kicker: "HenryCo · Logistics",
  href: "/dispatcher",
  icon: Map,
};

export const MANAGER_BRAND = {
  shortName: "Operations",
  kicker: "HenryCo · Logistics",
  href: "/manager",
  icon: LayoutDashboard,
};

export const OWNER_BRAND = {
  shortName: "Owner suite",
  kicker: "HenryCo · Logistics",
  href: "/owner",
  icon: LineChart,
};

export const CAMERA_ICON = Camera;
