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

/**
 * V3-STAFF-SELFGRANT-FIX-01 — the ONE answer to "is this account provisioned care staff,
 * and as what?". Server-controlled sources only, in precedence order: an explicit
 * owner-issued patch, the admin-API-only app_metadata.role, the existing profiles.role.
 * user_metadata is self-writable (supabase.auth.updateUser) and is deliberately NOT an
 * input. There is NO default: an account with no provisioned staff role resolves to null,
 * and callers must refuse rather than write a role.
 */
export function resolveProvisionedStaffRole(sources: {
  patchRole?: unknown;
  appMetadataRole?: unknown;
  profileRole?: unknown;
}): StaffRole | null {
  for (const value of [sources.patchRole, sources.appMetadataRole, sources.profileRole]) {
    if (typeof value !== "string") continue;
    const role = value.trim().toLowerCase();
    if (isStaffRole(role)) return role;
  }
  return null;
}

/**
 * Last-owner guard: how many accounts are owners through a server-controlled source,
 * resolved with the same precedence the owner console applies to the target
 * (app_metadata.role, then the grant-verified profiles.role). Archived accounts
 * (app_metadata.deleted_at) never count, and user_metadata is never read.
 */
export function countProvisionedOwners(
  users: ReadonlyArray<{ id: string; app_metadata?: Record<string, unknown> | null }>,
  verifiedProfileRoles: ReadonlyMap<string, string | null>
): number {
  const owners = new Set<string>();
  for (const user of users) {
    if (isArchivedAccount(user.app_metadata)) continue;
    const role = resolveProvisionedStaffRole({
      appMetadataRole: user.app_metadata?.role,
      profileRole: verifiedProfileRoles.get(user.id) ?? null,
    });
    if (role === "owner") owners.add(user.id);
  }
  return owners.size;
}

/** An account the owner console has archived (admin-set app_metadata.deleted_at). */
export function isArchivedAccount(appMetadata: Record<string, unknown> | null | undefined): boolean {
  return String(appMetadata?.deleted_at ?? "").trim() !== "";
}

/**
 * Whether an owner-console change must pass the last-owner check: it takes owner access
 * away from an ACTIVE owner. An archived owner is not counted as active, so removing it
 * can never lower the count.
 */
export function needsLastOwnerCheck(input: {
  currentRole: string | null | undefined;
  archived: boolean;
  removesOwner: boolean;
}): boolean {
  return input.currentRole === "owner" && !input.archived && input.removesOwner;
}

/**
 * Why a signed-in staff session may not act, in the order pages check it: archived
 * ("disabled"), frozen, or a forced re-login issued after its last sign-in. Pages
 * (requireRoles) redirect with the reason; API routes answer 403.
 */
export function sessionBlockReason(input: {
  deletedAt?: string | null;
  isFrozen?: boolean | null;
  forceReauthAfter?: string | null;
  lastSignInAt?: string | null;
}): "disabled" | "frozen" | "reauth" | null {
  if (input.deletedAt) return "disabled";
  if (input.isFrozen) return "frozen";
  if (input.forceReauthAfter) {
    const lastSignInAt = input.lastSignInAt ? new Date(input.lastSignInAt).getTime() : 0;
    const forceAt = new Date(input.forceReauthAfter).getTime();
    if (forceAt && lastSignInAt && lastSignInAt < forceAt) return "reauth";
  }
  return null;
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
