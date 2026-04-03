export type Permission =
  | "view_owner_dashboard"
  | "manage_bookings"
  | "manage_pricing"
  | "manage_settings"
  | "manage_reviews"
  | "manage_staff"
  | "view_manager_dashboard"
  | "view_rider_dashboard"
  | "view_support_dashboard"
  | "view_staff_dashboard";

import type { AppRole } from "@/lib/auth/roles";

const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  customer: [],
  owner: [
    "view_owner_dashboard",
    "manage_bookings",
    "manage_pricing",
    "manage_settings",
    "manage_reviews",
    "manage_staff",
    "view_manager_dashboard",
    "view_rider_dashboard",
    "view_support_dashboard",
  ],
  manager: ["view_manager_dashboard", "manage_bookings", "view_support_dashboard"],
  rider: ["view_rider_dashboard"],
  support: ["view_support_dashboard", "manage_reviews"],
  staff: ["view_staff_dashboard"],
};

export function can(role: AppRole, permission: Permission) {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function getPermissions(role: AppRole) {
  return {
    canViewBookings:
      can(role, "manage_bookings") ||
      can(role, "view_owner_dashboard") ||
      can(role, "view_manager_dashboard") ||
      can(role, "view_support_dashboard"),
    canUpdateBookings: can(role, "manage_bookings"),
    canManagePricing: can(role, "manage_pricing"),
    canApproveReviews: can(role, "manage_reviews"),
    canManageSettings: can(role, "manage_settings"),
    canManageUsers: can(role, "manage_staff"),
  };
}

export function canAccessPath(role: AppRole, path: string) {
  const normalizedPath = String(path || "").trim();

  if (!normalizedPath || normalizedPath === "/") {
    return role !== "customer";
  }

  if (normalizedPath.startsWith("/owner")) {
    return role === "owner";
  }

  if (normalizedPath.startsWith("/manager")) {
    return role === "owner" || role === "manager";
  }

  if (normalizedPath.startsWith("/rider")) {
    return role === "owner" || role === "manager" || role === "rider";
  }

  if (normalizedPath.startsWith("/support")) {
    return role === "owner" || role === "manager" || role === "support";
  }

  if (normalizedPath.startsWith("/staff")) {
    return role === "owner" || role === "manager" || role === "staff";
  }

  return true;
}
