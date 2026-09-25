/**
 * V3-STAFF-SELFGRANT-FIX-01 — the app-side twin of the SQL `verified_profile_role()`.
 *
 * Background — the self-granted staff-role class:
 *   `public.profiles.role` used to be client-writable for any user without a row, and
 *   every resolver treated a non-customer value as staff/owner. The DB now records a
 *   server-issued, user_id-bound grant in `public.staff_role_grants` (minted only when a
 *   service-role / SECURITY DEFINER writer sets the role) and every SQL predicate
 *   requires it. App resolvers must apply the SAME rule, so a forged or stale
 *   `profiles.role` confers nothing here even if a DB write guard were ever lost:
 *
 *   - `customer` / empty roles need no evidence and pass straight through.
 *   - Any other role counts ONLY when an active (`revoked_at` null) grant for the same
 *     user carries the same role.
 *   - Lookup errors FAIL CLOSED (the role is dropped) — with one transitional exception:
 *     "relation does not exist" means the migration is not applied yet, and the
 *     resolver then behaves exactly as it did before the fix, so app and DB can deploy
 *     in either order.
 *
 * Lookups need an RLS-bypassing (service-role) client: request roles have no access to
 * staff_role_grants by design.
 */

/**
 * Customer-facing *_role_memberships roles — a membership row with one of these is NOT
 * an operator/staff grant (e.g. /api/marketplace vendor_apply self-serves an active
 * 'vendor_applicant' row for any caller). Mirrors the exclusion in SQL is_staff_in() /
 * is_staff_in_any() (migration 20260924120000) and the apps' own *StaffRole sets.
 */
export const CUSTOMER_FACING_MEMBERSHIP_ROLES: ReadonlySet<string> = new Set([
  "buyer",
  "vendor_applicant",
  "vendor",
  "client",
  "browser",
  "learner",
]);

export function isOperatorMembershipRole(role: unknown): boolean {
  const value = typeof role === "string" ? role.trim().toLowerCase() : "";
  return value !== "" && !CUSTOMER_FACING_MEMBERSHIP_ROLES.has(value);
}

export type StaffRoleGrantRow = {
  role?: string | null;
  revoked_at?: string | null;
};

type QueryError = { code?: string | null; message?: string | null } | null | undefined;

/** Structural subset of the supabase-js client used here (keeps this package dependency-free). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type StaffGrantQueryClient = { from(table: string): any };

function normalizeRole(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function verifiedLegacyProfileRole(
  profileRole: unknown,
  grant: StaffRoleGrantRow | null | undefined
): string | null {
  const role = normalizeRole(profileRole);
  if (!role) return null;
  if (role === "customer") return role;
  if (!grant || grant.revoked_at) return null;
  return normalizeRole(grant.role) === role ? role : null;
}

export function isMissingRelationError(error: QueryError): boolean {
  if (!error) return false;
  if (error.code === "42P01" || error.code === "PGRST205") return true;
  return /relation .* does not exist|could not find the table/i.test(String(error.message ?? ""));
}

export async function readVerifiedProfileRole(
  admin: StaffGrantQueryClient,
  userId: string,
  profileRole: unknown
): Promise<string | null> {
  const role = normalizeRole(profileRole);
  if (!role) return null;
  if (role === "customer") return role;

  const { data, error } = (await admin
    .from("staff_role_grants")
    .select("role, revoked_at")
    .eq("user_id", userId)
    .maybeSingle()) as { data: StaffRoleGrantRow | null; error: QueryError };

  if (error) return isMissingRelationError(error) ? role : null;
  return verifiedLegacyProfileRole(role, data);
}

/** Batch form for recipient / directory lists: id → verified role (null = not verified). */
export async function readVerifiedProfileRoles(
  admin: StaffGrantQueryClient,
  rows: ReadonlyArray<{ id: string; role?: string | null }>
): Promise<Map<string, string | null>> {
  const out = new Map<string, string | null>();
  const needEvidence = rows.filter((row) => {
    const role = normalizeRole(row.role);
    return role !== "" && role !== "customer";
  });
  for (const row of rows) {
    const role = normalizeRole(row.role);
    out.set(row.id, role === "customer" ? role : null);
  }
  if (needEvidence.length === 0) return out;

  const { data, error } = (await admin
    .from("staff_role_grants")
    .select("user_id, role, revoked_at")
    .in(
      "user_id",
      needEvidence.map((row) => row.id)
    )) as { data: Array<StaffRoleGrantRow & { user_id: string }> | null; error: QueryError };

  if (error) {
    const passThrough = isMissingRelationError(error);
    for (const row of needEvidence) out.set(row.id, passThrough ? normalizeRole(row.role) : null);
    return out;
  }
  const grantByUser = new Map((data ?? []).map((grant) => [grant.user_id, grant]));
  for (const row of needEvidence) {
    out.set(row.id, verifiedLegacyProfileRole(row.role, grantByUser.get(row.id)));
  }
  return out;
}
