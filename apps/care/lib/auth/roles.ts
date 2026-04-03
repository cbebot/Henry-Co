export const APP_ROLES = [
  "customer",
  "owner",
  "manager",
  "rider",
  "support",
  "staff",
] as const;

export type AppRole = (typeof APP_ROLES)[number];
export type StaffRole = Extract<AppRole, "owner" | "manager" | "rider" | "support" | "staff">;

export function isAppRole(value: string | null | undefined): value is AppRole {
  return APP_ROLES.includes(String(value || "").toLowerCase() as AppRole);
}

export function isStaffRole(value: string | null | undefined): value is StaffRole {
  const role = String(value || "").toLowerCase();
  return (
    role === "owner" ||
    role === "manager" ||
    role === "rider" ||
    role === "support" ||
    role === "staff"
  );
}

export function normalizeRole(value: string | null | undefined): AppRole {
  const role = String(value || "").trim().toLowerCase();
  if (isAppRole(role)) return role;
  return "customer";
}

export function isOwner(role: string | null | undefined) {
  return normalizeRole(role) === "owner";
}

export function homeForRole(role: string | null | undefined) {
  const normalized = normalizeRole(role);

  if (normalized === "owner") return "/owner";
  if (normalized === "manager") return "/manager";
  if (normalized === "rider") return "/rider";
  if (normalized === "support") return "/support";
  if (normalized === "staff") return "/staff";

  return "/track";
}
