import "server-only";

import {
  COMPANY,
  getAccountUrl,
  getHqUrl,
  getStaffHqUrl,
  isAbsoluteHttpUrl,
  normalizeEmail,
  normalizeTrustedRedirect,
  resolveTrustedRedirect,
} from "@henryco/config";
import { createAdminSupabase } from "@/lib/supabase";

type AuthenticatedUser = {
  id: string;
  email?: string | null;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
};

export type DashboardRole = "customer" | "staff" | "division_operator" | "super_admin";

export type DashboardOption = {
  key: "customer" | "staff" | "owner";
  role: DashboardRole;
  title: string;
  description: string;
  href: string;
};

export type DashboardResolution =
  | { kind: "redirect"; role: DashboardRole; redirectUrl: string }
  | { kind: "chooser"; chooserUrl: string; options: DashboardOption[] };

export type AccessSnapshot = {
  hasOwnerAccess: boolean;
  hasStaffAccess: boolean;
  staffDivisionCount: number;
  ownerRole: string | null;
  profileRole: string | null;
};

const STAFF_MEMBERSHIP_TABLES = [
  "marketplace_role_memberships",
  "studio_role_memberships",
  "property_role_memberships",
  "learn_role_memberships",
  "logistics_role_memberships",
] as const;

const INTERNAL_PROFILE_ROLES = new Set([
  "owner",
  "manager",
  "support",
  "staff",
  "rider",
  "finance",
]);

const ACCOUNT_AUTH_PATHS = new Set([
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/auth/resolve",
  "/auth/choose",
]);

export const DASHBOARD_PREFERENCE_COOKIE = "hc_dash_pref";
const DASHBOARD_PREFERENCE_VALUES = new Set<DashboardOption["key"]>(["customer", "staff", "owner"]);

function normalizeRole(value: unknown) {
  const role = String(value || "").trim().toLowerCase();
  return role || null;
}

function getHenryCoHosts() {
  const baseDomain = COMPANY.group.baseDomain;
  return {
    accountHost: `account.${baseDomain}`,
    hqHost: `hq.${baseDomain}`,
    staffHost: `staffhq.${baseDomain}`,
    workspaceHost: `workspace.${baseDomain}`,
  };
}

function toTargetUrl(target: string, origin: string) {
  return new URL(target.startsWith("/") ? target : target, origin);
}

function isOwnerTarget(targetUrl: URL) {
  const { hqHost } = getHenryCoHosts();
  return (
    targetUrl.hostname === hqHost ||
    targetUrl.pathname === "/owner" ||
    targetUrl.pathname.startsWith("/owner/")
  );
}

function isStaffTarget(targetUrl: URL) {
  const { staffHost, workspaceHost } = getHenryCoHosts();
  return (
    targetUrl.hostname === staffHost ||
    targetUrl.hostname === workspaceHost ||
    targetUrl.pathname === "/workspace" ||
    targetUrl.pathname.startsWith("/workspace/")
  );
}

function isAccountAuthTarget(targetUrl: URL) {
  const { accountHost } = getHenryCoHosts();
  return targetUrl.hostname === accountHost && ACCOUNT_AUTH_PATHS.has(targetUrl.pathname);
}

function toOwnerDestination(target: string, origin: string) {
  const targetUrl = toTargetUrl(target, origin);
  const ownerPath =
    targetUrl.pathname === "/" || targetUrl.pathname === ""
      ? "/owner"
      : targetUrl.pathname.startsWith("/owner")
        ? targetUrl.pathname
        : `/owner${targetUrl.pathname}`;

  return getHqUrl(`${ownerPath}${targetUrl.search}${targetUrl.hash}`);
}

function toStaffDestination(target: string, origin: string) {
  const targetUrl = toTargetUrl(target, origin);
  const workspacePath =
    targetUrl.pathname === "/workspace" || targetUrl.pathname === "/workspace/"
      ? "/"
      : targetUrl.pathname.startsWith("/workspace/")
        ? targetUrl.pathname.slice("/workspace".length) || "/"
        : targetUrl.pathname || "/";

  return getStaffHqUrl(`${workspacePath}${targetUrl.search}${targetUrl.hash}`);
}

async function readAccessSnapshot(user: AuthenticatedUser): Promise<AccessSnapshot> {
  const admin = createAdminSupabase();
  const normalizedEmailAddress = normalizeEmail(user.email);

  const [{ data: profile }, { data: directOwnerProfile }, staffMembershipResults] = await Promise.all([
    admin.from("profiles").select("role").eq("id", user.id).maybeSingle<{ role: string | null }>(),
    admin
      .from("owner_profiles")
      .select("role, is_active")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle<{ role: string | null; is_active: boolean }>(),
    Promise.all(
      STAFF_MEMBERSHIP_TABLES.map(async (table) => {
        const filter = normalizedEmailAddress
          ? `user_id.eq.${user.id},normalized_email.eq.${normalizedEmailAddress}`
          : `user_id.eq.${user.id}`;

        try {
          const { data, error } = await admin
            .from(table)
            .select("id")
            .eq("is_active", true)
            .or(filter)
            .limit(1);

          if (error) return false;
          return Boolean(data?.length);
        } catch {
          return false;
        }
      })
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
    hasStaffAccess: hasExplicitStaffMembership || (profileRole ? INTERNAL_PROFILE_ROLES.has(profileRole) : false),
    staffDivisionCount,
    ownerRole,
    profileRole,
  };
}

/**
 * Build the option set the chooser screen renders. Order is meaningful —
 * the most "elevated" lane is presented first, customer last, mirroring
 * how staff/owners typically expect to land while still keeping the
 * personal account easy to reach.
 */
function buildDashboardOptions(access: AccessSnapshot): DashboardOption[] {
  const options: DashboardOption[] = [];

  if (access.hasOwnerAccess) {
    options.push({
      key: "owner",
      role: "super_admin",
      title: "Owner Console",
      description:
        "Executive command, finance, workforce, and brand controls across every Henry & Co. division.",
      href: getHqUrl("/owner"),
    });
  }

  if (access.hasStaffAccess) {
    const staffRole: DashboardRole =
      access.staffDivisionCount === 1 && !access.hasOwnerAccess ? "division_operator" : "staff";
    options.push({
      key: "staff",
      role: staffRole,
      title: "Staff Workspace",
      description:
        staffRole === "division_operator"
          ? "Your division operations workspace — queues, approvals, and customer support."
          : "Cross-division staff hub — operations, support, and approvals across HenryCo.",
      href: getStaffHqUrl("/"),
    });
  }

  options.push({
    key: "customer",
    role: "customer",
    title: "Customer Dashboard",
    description: "Your personal Henry & Co. account — bookings, orders, wallet, and preferences.",
    href: getAccountUrl("/"),
  });

  return options;
}

function readPreferredDashboardKey(value?: string | null): DashboardOption["key"] | null {
  const normalized = String(value || "").trim().toLowerCase() as DashboardOption["key"];
  if (DASHBOARD_PREFERENCE_VALUES.has(normalized)) return normalized;
  return null;
}

function buildChooserUrl(origin: string, next?: string | null) {
  const url = new URL("/auth/choose", origin);
  const safeNext = normalizeTrustedRedirect(next);
  if (safeNext !== "/") {
    url.searchParams.set("next", safeNext);
  }
  return url.toString();
}

/**
 * Pure decision function — given an access snapshot, decide where the
 * user should land. Lifted out of `resolveUserDashboard` so it can be
 * unit-tested without a Supabase connection.
 *
 * Honored signals:
 *   - explicit `next` parameter pointing at owner/staff space (user
 *     already declared intent → skip chooser)
 *   - `preferredDashboardKey` from the remember-choice cookie (skip
 *     chooser when the remembered option still maps to a role the
 *     user has access to)
 */
export function decideDashboardResolution({
  access,
  next,
  origin,
  preferredDashboardKey,
}: {
  access: AccessSnapshot;
  next?: string | null;
  origin: string;
  preferredDashboardKey?: string | null;
}): DashboardResolution {
  let normalizedNext = normalizeTrustedRedirect(next);
  const nextUrl = toTargetUrl(normalizedNext, origin);

  if (isAccountAuthTarget(nextUrl)) {
    normalizedNext = "/";
  }

  // Explicit `next` to an elevated space — honor user intent, skip chooser.
  if (normalizedNext !== "/") {
    const trustedTarget = toTargetUrl(normalizedNext, origin);

    if (isOwnerTarget(trustedTarget)) {
      return {
        kind: "redirect",
        role: access.hasOwnerAccess ? "super_admin" : "customer",
        redirectUrl: access.hasOwnerAccess
          ? toOwnerDestination(normalizedNext, origin)
          : getHqUrl("/owner/no-access"),
      };
    }

    if (isStaffTarget(trustedTarget)) {
      const staffRole: DashboardRole =
        access.staffDivisionCount === 1 && !access.hasOwnerAccess ? "division_operator" : "staff";
      return {
        kind: "redirect",
        role: access.hasStaffAccess ? staffRole : "customer",
        redirectUrl: access.hasStaffAccess
          ? toStaffDestination(normalizedNext, origin)
          : getStaffHqUrl("/no-access"),
      };
    }

    return {
      kind: "redirect",
      role: "customer",
      redirectUrl: isAbsoluteHttpUrl(normalizedNext)
        ? normalizedNext
        : resolveTrustedRedirect(origin, normalizedNext),
    };
  }

  const options = buildDashboardOptions(access);
  const preferenceKey = readPreferredDashboardKey(preferredDashboardKey);

  // Remember-choice: honor the user's prior pick if they still have access.
  if (preferenceKey) {
    const chosen = options.find((option) => option.key === preferenceKey);
    if (chosen) {
      return { kind: "redirect", role: chosen.role, redirectUrl: chosen.href };
    }
  }

  // Single-lane user — no ambiguity, route directly.
  if (options.length <= 1) {
    const only = options[0];
    return { kind: "redirect", role: only.role, redirectUrl: only.href };
  }

  // Multi-role user without a remembered pick — show the chooser.
  return {
    kind: "chooser",
    chooserUrl: buildChooserUrl(origin, next),
    options,
  };
}

/**
 * Single source of truth for "where should this user land after auth?"
 *
 * Reads the live access snapshot from Supabase, then defers to the pure
 * `decideDashboardResolution` for the actual decision. Callers receive
 * a structured result so they can either redirect immediately or hand
 * off to the role chooser screen for ambiguous (multi-role) users.
 */
export async function resolveUserDashboard({
  user,
  next,
  origin,
  preferredDashboardKey,
}: {
  user: AuthenticatedUser;
  next?: string | null;
  origin: string;
  preferredDashboardKey?: string | null;
}): Promise<DashboardResolution> {
  const access = await readAccessSnapshot(user);
  return decideDashboardResolution({ access, next, origin, preferredDashboardKey });
}

/**
 * Back-compat wrapper. Existing callers that just want a URL and don't yet
 * handle the chooser keep working — when the resolver wants the chooser,
 * we return the chooser URL so the caller still issues a single redirect.
 *
 * New callers should use `resolveUserDashboard` directly so they can
 * inspect the role and (optionally) handle chooser-vs-redirect explicitly.
 */
export async function resolveAuthenticatedDestination({
  user,
  next,
  origin,
  preferredDashboardKey,
}: {
  user: AuthenticatedUser;
  next?: string | null;
  origin: string;
  preferredDashboardKey?: string | null;
}): Promise<string> {
  const resolution = await resolveUserDashboard({ user, next, origin, preferredDashboardKey });
  return resolution.kind === "redirect" ? resolution.redirectUrl : resolution.chooserUrl;
}

/**
 * Exposed so the chooser POST handler can validate the user's pick
 * against the same access snapshot the resolver uses (defense in depth —
 * a user can't force-redirect to a dashboard they don't have access to).
 */
export async function loadDashboardOptions(user: AuthenticatedUser): Promise<DashboardOption[]> {
  const access = await readAccessSnapshot(user);
  return buildDashboardOptions(access);
}
