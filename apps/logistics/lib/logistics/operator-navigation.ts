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
import { translateSurfaceLabel, type AppLocale } from "@henryco/i18n";
import type { WorkspaceNavItem } from "@henryco/workspace-shell";

/**
 * V3 PASS 21 — logistics operator workspace navigation.
 *
 * One nav list per operator surface: rider, dispatcher, manager,
 * owner. Each list seeds the WorkspaceShell sidebar; the first 4 of
 * each list also seed the mobile bottom-nav (the rider workspace
 * specifically asks for "4 anchors" in the mobile parity spec).
 */

export function getRiderNavItems(locale: AppLocale): WorkspaceNavItem[] {
  const t = (text: string) => translateSurfaceLabel(locale, text);
  return [
    {
      href: "/rider",
      label: t("Today"),
      icon: LayoutDashboard,
      description: t("Today's queue"),
    },
    {
      href: "/rider/active",
      label: t("Active leg"),
      icon: Route,
      description: t("Current pickup or drop-off"),
    },
    {
      href: "/rider/history",
      label: t("History"),
      icon: History,
      description: t("Completed legs"),
    },
    {
      href: "/rider/notifications",
      label: t("Alerts"),
      icon: Bell,
      hasIndicator: true,
      description: t("Dispatch + customer alerts"),
    },
    {
      href: "/rider/expenses",
      label: t("Expenses"),
      icon: ReceiptText,
      description: t("Fuel + maintenance log"),
    },
  ];
}

export function getDispatcherNavItems(locale: AppLocale): WorkspaceNavItem[] {
  const t = (text: string) => translateSurfaceLabel(locale, text);
  return [
    {
      href: "/dispatcher",
      label: t("Live board"),
      icon: LayoutDashboard,
      description: t("Unassigned pickups + live riders"),
    },
    {
      href: "/dispatcher/zones",
      label: t("Zones"),
      icon: Map,
      description: t("Corridors + surge + SLA"),
    },
    {
      href: "/dispatcher/exceptions",
      label: t("Exceptions"),
      icon: AlertTriangle,
      hasIndicator: true,
      description: t("Delayed / failed shipments"),
    },
    {
      href: "/dispatcher/fleet",
      label: t("Fleet"),
      icon: Truck,
      description: t("Vehicles + riders on shift"),
    },
  ];
}

export function getManagerNavItems(locale: AppLocale): WorkspaceNavItem[] {
  const t = (text: string) => translateSurfaceLabel(locale, text);
  return [
    {
      href: "/manager",
      label: t("Operations"),
      icon: LayoutDashboard,
      description: t("On-time, exceptions, revenue"),
    },
    {
      href: "/manager/fleet",
      label: t("Fleet"),
      icon: Truck,
      description: t("Vehicles + riders directory"),
    },
    {
      href: "/manager/sla",
      label: t("SLA"),
      icon: ClipboardCheck,
      description: t("Per-corridor SLA health"),
    },
    {
      href: "/manager/finance",
      label: t("Finance"),
      icon: Banknote,
      description: t("Revenue, payouts, fuel"),
    },
    {
      href: "/manager/claims",
      label: t("Claims"),
      icon: PackageCheck,
      hasIndicator: true,
      description: t("Damaged / lost shipments"),
    },
  ];
}

export function getOwnerNavItems(locale: AppLocale): WorkspaceNavItem[] {
  const t = (text: string) => translateSurfaceLabel(locale, text);
  return [
    {
      href: "/owner",
      label: t("Strategic"),
      icon: LineChart,
      description: t("Monthly volume + growth"),
    },
    {
      href: "/owner/business",
      label: t("Business"),
      icon: Building2,
      description: t("B2B account roster"),
    },
    {
      href: "/owner/staff",
      label: t("Staff"),
      icon: Users,
      description: t("Operator directory"),
    },
    {
      href: "/owner/calendar",
      label: t("Calendar"),
      icon: CalendarDays,
      description: t("Shift + service calendar"),
    },
  ];
}

export function getRiderMobileNav(locale: AppLocale) {
  return getRiderNavItems(locale).slice(0, 4);
}
export function getDispatcherMobileNav(locale: AppLocale) {
  return getDispatcherNavItems(locale).slice(0, 4);
}
export function getManagerMobileNav(locale: AppLocale) {
  return getManagerNavItems(locale).slice(0, 4);
}
export function getOwnerMobileNav(locale: AppLocale) {
  return getOwnerNavItems(locale).slice(0, 4);
}

export function getRiderBrand(locale: AppLocale) {
  const t = (text: string) => translateSurfaceLabel(locale, text);
  return {
    shortName: t("Rider workspace"),
    kicker: "HenryCo · Logistics",
    href: "/rider",
    icon: Compass,
  };
}

export function getDispatcherBrand(locale: AppLocale) {
  const t = (text: string) => translateSurfaceLabel(locale, text);
  return {
    shortName: t("Dispatch board"),
    kicker: "HenryCo · Logistics",
    href: "/dispatcher",
    icon: Map,
  };
}

export function getManagerBrand(locale: AppLocale) {
  const t = (text: string) => translateSurfaceLabel(locale, text);
  return {
    shortName: t("Operations"),
    kicker: "HenryCo · Logistics",
    href: "/manager",
    icon: LayoutDashboard,
  };
}

export function getOwnerBrand(locale: AppLocale) {
  const t = (text: string) => translateSurfaceLabel(locale, text);
  return {
    shortName: t("Owner suite"),
    kicker: "HenryCo · Logistics",
    href: "/owner",
    icon: LineChart,
  };
}

export const CAMERA_ICON = Camera;
