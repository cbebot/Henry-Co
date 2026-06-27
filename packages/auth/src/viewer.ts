import "server-only";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import {
  filterGrantedMemberships,
  getAccountUrl,
  normalizeEmail,
  type MembershipGrantRow,
} from "@henryco/config";

import { createAdminSupabase } from "./_internal/admin-supabase";
import type {
  AccessSnapshot,
  DashboardRole,
  StaffDivision,
  StaffDivisionMembership,
  UnifiedViewer,
  ViewerRoles,
} from "./types";

/**
 * Per-division role-membership tables that exist on disk today.
 * `is_staff_in()` SQL predicate joins these; the TS reader joins the
 * same set so client and server behaviour cannot drift.
 *
 * Source: `apps/hub/supabase/migrations/20260502120000_staff_notifications_audience.sql:35-38`.
 *
 * Note: logistics + jobs + care do NOT appear here because they don't
 * have dedicated role tables yet — staff identity for those divisions
 * lives in `profiles.role` (legacy fallback). Mirrors the SQL function's
 * `legacy_resolved` CTE.
 */
const STAFF_DIVISION_TABLES = [
  { division: "marketplace" as const, table: "marketplace_role_memberships" },
  { division: "studio" as const, table: "studio_role_memberships" },
  { division: "property" as const, table: "property_role_memberships" },
  { division: "learn" as const, table: "learn_role_memberships" },
] satisfies ReadonlyArray<{ division: StaffDivision; table: string }>;

/**
 * Profile roles that confer cross-division operator access. Mirrors the
 * `legacy_resolved` CTE in the staff-notifications migration. The TS
 * derivation is a CONVENIENCE for the rail / IdentityBar / membership
 * readouts; the SOURCE OF TRUTH for any RLS-relevant gate is the SQL
 * `is_staff_in()` predicate, which the function still calls for the
 * authoritative answer.
 */
const INTERNAL_PROFILE_ROLES = new Set([
  "owner",
  "admin",
  "superadmin",
  "manager",
  "support",
  "staff",
  "rider",
  "finance",
]);

/**
 * Profile roles that confer owner-tier access. Used by `getViewerRoles`
 * to populate `hasOwnerAccess` from the legacy fallback when no
 * `owner_profiles` row is present.
 */
const OWNER_PROFILE_ROLES = new Set(["owner", "admin", "superadmin"]);

function normalizeRole(value: unknown): string | null {
  const role = String(value || "").trim().toLowerCase();
  return role || null;
}

/**
 * Read the access snapshot for a given user — the same readout the
 * chooser uses, lifted out so server-only code paths share one
 * implementation and one round-trip pattern.
 *
 * Three Supabase reads happen in parallel:
 *   1. `profiles.role` — legacy + cross-division fallback
 *   2. `owner_profiles` — explicit owner identity (active rows only)
 *   3. each per-division `*_role_memberships` table — staff identity
 *
 * The owner read is best-effort by user_id first, then falls back to
 * normalized_email if the row was inserted with an email key only — same
 * defence-in-depth the prior `apps/account/lib/post-auth-routing.ts`
 * implements at lines 144-186. Centralised here so the IdentityBar and
 * the chooser cannot disagree on what "owner access" means.
 */
async function readAccessSnapshot(user: {
  id: string;
  email: string | null;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
  emailVerified?: boolean;
}): Promise<AccessSnapshot> {
  const admin = createAdminSupabase();
  const normalizedEmailAddress = normalizeEmail(user.email);
  const emailVerified = Boolean(user.emailVerified);

  const [{ data: profile }, { data: directOwnerProfile }, staffMembershipResults] =
    await Promise.all([
      admin
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle<{ role: string | null }>(),
      admin
        .from("owner_profiles")
        .select("role, is_active")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle<{ role: string | null; is_active: boolean }>(),
      Promise.all(
        STAFF_DIVISION_TABLES.map(async ({ table }) => {
          const filter = normalizedEmailAddress
            ? `user_id.eq.${user.id},normalized_email.eq.${normalizedEmailAddress}`
            : `user_id.eq.${user.id}`;
          try {
            const { data, error } = await admin
              .from(table)
              .select("user_id, normalized_email, is_active")
              .eq("is_active", true)
              .or(filter);
            if (error) return false;
            // Shared grant rule: a bound row matches only its owner; an
            // unclaimed (user_id null) seed grants only to a verified,
            // matching mailbox.
            return (
              filterGrantedMemberships((data ?? []) as MembershipGrantRow[], {
                userId: user.id,
                normalizedEmail: normalizedEmailAddress,
                emailVerified,
              }).length > 0
            );
          } catch {
            return false;
          }
        }),
      ),
    ]);

  const ownerProfile =
    directOwnerProfile ||
    (normalizedEmailAddress
      ? (
          await admin
            .from("owner_profiles")
            .select("role, is_active")
            .eq("email", normalizedEmailAddress)
            .eq("is_active", true)
            .maybeSingle<{ role: string | null; is_active: boolean }>()
        ).data
      : null);

  const profileRole =
    normalizeRole(profile?.role) ||
    normalizeRole(user.app_metadata?.role) ||
    normalizeRole(user.user_metadata?.role);
  const ownerRole = normalizeRole(ownerProfile?.role);
  const staffDivisionCount = staffMembershipResults.filter(Boolean).length;
  const hasExplicitStaffMembership = staffDivisionCount > 0;

  return {
    hasOwnerAccess: ownerRole === "owner" || ownerRole === "admin",
    hasStaffAccess:
      hasExplicitStaffMembership ||
      (profileRole ? INTERNAL_PROFILE_ROLES.has(profileRole) : false),
    staffDivisionCount,
    ownerRole,
    profileRole,
  };
}

/**
 * Read the viewer's full division memberships — not just the count.
 *
 * Returns one membership row per division the viewer holds operator
 * access to, sourced from either:
 *   - the per-division *_role_memberships table (when the division has one), or
 *   - the legacy profiles.role fallback (when the division does not).
 *
 * Mirrors the SQL `is_staff_in()` predicate's union of `divisional` +
 * `legacy_resolved` CTEs so the TS readout matches what the database
 * sees.
 *
 * Used by:
 *   - the WorkspaceRail (DASH-2+) to decide which division entries to render
 *   - the staff variant of `getDashboardSummary()` (G4)
 *   - the audit-logging layer (cite which division produced an action)
 */
async function readStaffMemberships(
  user: { id: string; email: string | null; emailVerified?: boolean },
): Promise<ReadonlyArray<StaffDivisionMembership>> {
  const admin = createAdminSupabase();
  const normalizedEmailAddress = normalizeEmail(user.email);
  const emailVerified = Boolean(user.emailVerified);

  const [profile, divisionalRows] = await Promise.all([
    admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle<{ role: string | null }>(),
    Promise.all(
      STAFF_DIVISION_TABLES.map(async ({ division, table }) => {
        const filter = normalizedEmailAddress
          ? `user_id.eq.${user.id},normalized_email.eq.${normalizedEmailAddress}`
          : `user_id.eq.${user.id}`;
        try {
          const { data, error } = await admin
            .from(table)
            .select("role, user_id, normalized_email, is_active")
            .eq("is_active", true)
            .or(filter);
          if (error) return null;
          // Shared grant rule: bound rows match only their owner; an unclaimed
          // (user_id null) seed grants only to a verified, matching mailbox.
          const granted = filterGrantedMemberships(
            (data ?? []) as Array<MembershipGrantRow & { role: string | null }>,
            { userId: user.id, normalizedEmail: normalizedEmailAddress, emailVerified }
          );
          if (!granted.length) return null;
          const role = normalizeRole(granted[0].role) || "staff";
          return { division, role, source: "division_table" as const };
        } catch {
          return null;
        }
      }),
    ),
  ]);

  const memberships: StaffDivisionMembership[] = [];
  for (const row of divisionalRows) {
    if (row) memberships.push(row);
  }

  const profileRole = normalizeRole(profile.data?.role);
  if (profileRole && INTERNAL_PROFILE_ROLES.has(profileRole)) {
    // Mirror the SQL function's legacy_resolved CTE — these divisions
    // confer access through the legacy profile role rather than a
    // dedicated per-division table.
    const legacyDivisions: StaffDivision[] = [
      "care",
      "logistics",
      "jobs",
      "hub",
      "staff",
      "account",
    ];
    if (OWNER_PROFILE_ROLES.has(profileRole)) {
      legacyDivisions.push("security", "system");
    }
    for (const division of legacyDivisions) {
      // Only add if not already covered by a division table membership.
      if (!memberships.some((m) => m.division === division)) {
        memberships.push({ division, role: profileRole, source: "legacy_profile" });
      }
    }
  }

  return memberships;
}

/**
 * Resolve which DashboardRole the viewer is operating as for the
 * CURRENT request. The shell chrome's role pill + module rail derive
 * from this; the actual gating still happens at the SQL/RLS layer.
 *
 * Precedence:
 *   1. owner > staff > customer when access is held in multiple lanes
 *   2. `division_operator` when staff access is held in exactly ONE
 *      division and no owner access (mirrors the chooser's
 *      `buildDashboardOptions` promotion)
 *
 * NOTE: The PERSISTED preference cookie is honoured at routing time
 * (`resolveUserDashboard` in `./server.ts`) — not here. This function
 * resolves the lane for the CURRENT shell render, not the lane the user
 * is *about to be redirected to*. They differ when a user is mid-page
 * load on a lane other than their preference.
 */
function resolveRole(access: AccessSnapshot): {
  role: DashboardRole;
  kind: "customer" | "staff" | "owner";
} {
  if (access.hasOwnerAccess) {
    return { role: "super_admin", kind: "owner" };
  }
  if (access.hasStaffAccess) {
    if (access.staffDivisionCount === 1) {
      return { role: "division_operator", kind: "staff" };
    }
    return { role: "staff", kind: "staff" };
  }
  return { role: "customer", kind: "customer" };
}

/**
 * Build a UnifiedViewer from a Supabase user object. Rejects with a
 * redirect to the login page when the user is null/anonymous.
 *
 * The shell chrome calls this once per request from
 * `apps/account/app/(account)/layout.tsx`. Subsequent components that
 * need the viewer should accept it as a prop rather than re-call —
 * each call hits Supabase three times for the access snapshot, which
 * is cheap but not free.
 */
export async function requireUnifiedViewer(): Promise<UnifiedViewer> {
  // Use the host app's existing server-supabase client by inspecting
  // the cookie jar through the admin client's auth() — but for the
  // initial DASH-1 implementation we lean on the consumer-app's auth
  // helper (e.g. apps/account/lib/auth.ts:requireAccountUser) to
  // produce the user object, then we ENRICH it with the unified access
  // snapshot.
  //
  // The clean path is: every consumer app passes its `getAuthenticatedUser`
  // function as a parameter. For DASH-1 we invert: we read the access
  // snapshot ourselves and let the host app handle session presence
  // through its own gate. This shipper-friendly pattern uses a thin
  // wrapper at apps/account/lib/auth.ts that calls requireUnifiedViewer
  // after its own session gate.
  //
  // For the bare-callable shape, we read the user from the admin client's
  // auth JWT header — Next 16's headers() exposes the bearer when the
  // request rides through the supabase-cookies middleware.
  const headerStore = await headers();
  const userJson = headerStore.get("x-supabase-user");
  if (!userJson) {
    redirect(getAccountUrl("/login"));
  }

  let parsed: {
    id: string;
    email?: string | null;
    email_confirmed_at?: string | null;
    app_metadata?: Record<string, unknown>;
    user_metadata?: Record<string, unknown>;
  };
  try {
    parsed = JSON.parse(userJson);
  } catch {
    redirect(getAccountUrl("/login"));
  }

  if (!parsed.id) {
    redirect(getAccountUrl("/login"));
  }

  const emailVerified = Boolean(parsed.email_confirmed_at);
  const access = await readAccessSnapshot({
    id: parsed.id,
    email: parsed.email ?? null,
    app_metadata: parsed.app_metadata,
    user_metadata: parsed.user_metadata,
    emailVerified,
  });
  const { role, kind } = resolveRole(access);

  return {
    user: {
      id: parsed.id,
      email: parsed.email ?? null,
      fullName:
        normalizeRole(parsed.user_metadata?.full_name) ||
        normalizeRole(parsed.user_metadata?.fullName) ||
        null,
      avatarUrl:
        (parsed.user_metadata?.avatar_url as string | undefined) ||
        (parsed.user_metadata?.avatarUrl as string | undefined) ||
        null,
      appMetadata: parsed.app_metadata ?? {},
      userMetadata: parsed.user_metadata ?? {},
      emailVerified,
    },
    access,
    role,
    kind,
  };
}

/**
 * Compose `requireUnifiedViewer()` from a host-app session helper. Use
 * this when the caller already has the authenticated user object (e.g.
 * `apps/account/lib/auth.ts:requireAccountUser` already redirected
 * unauthenticated callers and produced the Supabase user) — passing it
 * here avoids re-reading the session.
 *
 * This is the recommended integration path for DASH-1's apps/account
 * shell, because it preserves the existing `requireAccountUser()`
 * redirect behaviour and just enriches the result with the unified
 * access snapshot.
 */
export async function buildUnifiedViewer(user: {
  id: string;
  email: string | null;
  fullName?: string | null;
  avatarUrl?: string | null;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
  email_confirmed_at?: string | null;
  emailVerified?: boolean;
}): Promise<UnifiedViewer> {
  const emailVerified = Boolean(user.emailVerified ?? user.email_confirmed_at);
  const access = await readAccessSnapshot({
    id: user.id,
    email: user.email,
    app_metadata: user.app_metadata,
    user_metadata: user.user_metadata,
    emailVerified,
  });
  const { role, kind } = resolveRole(access);

  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName ?? null,
      avatarUrl: user.avatarUrl ?? null,
      appMetadata: user.app_metadata ?? {},
      userMetadata: user.user_metadata ?? {},
      emailVerified,
    },
    access,
    role,
    kind,
  };
}

/**
 * Return the viewer's full division memberships. Composed of the
 * AccessSnapshot's flat counts + the per-division row readouts so the
 * caller can render the rail / pickers without a second round-trip.
 */
export async function getViewerRoles(viewer: UnifiedViewer): Promise<ViewerRoles> {
  const memberships = await readStaffMemberships({
    id: viewer.user.id,
    email: viewer.user.email,
    emailVerified: Boolean(viewer.user.emailVerified),
  });

  return {
    hasOwnerAccess: viewer.access.hasOwnerAccess,
    hasStaffAccess: viewer.access.hasStaffAccess,
    staffDivisionCount: viewer.access.staffDivisionCount,
    staffDivisions: memberships,
    staffMemberships: memberships,
    ownerRole: viewer.access.ownerRole,
    profileRole: viewer.access.profileRole,
  };
}

// Re-export the access snapshot reader for the routing module.
export { readAccessSnapshot };
