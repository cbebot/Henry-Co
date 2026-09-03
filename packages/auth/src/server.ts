import "server-only";

import {
  getAccountUrl,
  getCanonicalAccountHosts,
  getCanonicalHqHosts,
  getCanonicalStaffHqHosts,
  getCanonicalWorkspaceHosts,
  getHqUrl,
  getStaffHqUrl,
  isAbsoluteHttpUrl,
  normalizeTrustedRedirect,
  resolveTrustedRedirect,
} from "@henryco/config";

import { readAccessSnapshot } from "./viewer";
import {
  DASHBOARD_PREFERENCE_VALUES,
  type AccessSnapshot,
  type DashboardOption,
  type DashboardResolution,
  type DashboardRole,
} from "./types";

type AuthenticatedUser = {
  id: string;
  email?: string | null;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
};

const ACCOUNT_AUTH_PATHS = new Set([
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/auth/resolve",
  "/auth/choose",
]);

function toTargetUrl(target: string, origin: string): URL {
  return new URL(target.startsWith("/") ? target : target, origin);
}

function hostMatchesAny(hostname: string, candidates: string[]): boolean {
  const normalized = hostname.toLowerCase();
  return candidates.some((candidate) => candidate.toLowerCase() === normalized);
}

function isOwnerTarget(targetUrl: URL): boolean {
  return (
    hostMatchesAny(targetUrl.hostname, getCanonicalHqHosts()) ||
    targetUrl.pathname === "/owner" ||
    targetUrl.pathname.startsWith("/owner/")
  );
}

function isStaffTarget(targetUrl: URL): boolean {
  return (
    hostMatchesAny(targetUrl.hostname, getCanonicalStaffHqHosts()) ||
    hostMatchesAny(targetUrl.hostname, getCanonicalWorkspaceHosts()) ||
    targetUrl.pathname === "/workspace" ||
    targetUrl.pathname.startsWith("/workspace/")
  );
}

function isAccountAuthTarget(targetUrl: URL): boolean {
  return (
    hostMatchesAny(targetUrl.hostname, getCanonicalAccountHosts()) &&
    ACCOUNT_AUTH_PATHS.has(targetUrl.pathname)
  );
}

function toOwnerDestination(target: string, origin: string): string {
  const targetUrl = toTargetUrl(target, origin);
  const ownerPath =
    targetUrl.pathname === "/" || targetUrl.pathname === ""
      ? "/owner"
      : targetUrl.pathname.startsWith("/owner")
        ? targetUrl.pathname
        : `/owner${targetUrl.pathname}`;
  return getHqUrl(`${ownerPath}${targetUrl.search}${targetUrl.hash}`);
}

function toStaffDestination(target: string, origin: string): string {
  const targetUrl = toTargetUrl(target, origin);
  const workspacePath =
    targetUrl.pathname === "/workspace" || targetUrl.pathname === "/workspace/"
      ? "/"
      : targetUrl.pathname.startsWith("/workspace/")
        ? targetUrl.pathname.slice("/workspace".length) || "/"
        : targetUrl.pathname || "/";
  return getStaffHqUrl(`${workspacePath}${targetUrl.search}${targetUrl.hash}`);
}

/**
 * Build the option set the chooser screen renders. Order is meaningful —
 * the most "elevated" lane is presented first, customer last, mirroring
 * how staff/owners typically expect to land while still keeping the
 * personal account easy to reach.
 *
 * This function is also called by the IdentityBar role-switcher in the
 * shell chrome, which reads the same snapshot the chooser does and
 * shows the same lanes.
 */
function buildDashboardOptions(access: AccessSnapshot): DashboardOption[] {
  const options: DashboardOption[] = [];

  if (access.hasOwnerAccess) {
    options.push({
      key: "owner",
      role: "super_admin",
      title: "Owner Console",
      description:
        "Executive command, finance, workforce, and brand controls across every Henry Onyx division.",
      href: getHqUrl("/owner"),
    });
  }

  if (access.hasStaffAccess) {
    const staffRole: DashboardRole =
      access.staffDivisionCount === 1 && !access.hasOwnerAccess
        ? "division_operator"
        : "staff";
    options.push({
      key: "staff",
      role: staffRole,
      title: "Staff Workspace",
      description:
        staffRole === "division_operator"
          ? "Your division operations workspace — queues, approvals, and customer support."
          : "Cross-division staff hub — operations, support, and approvals across Henry Onyx.",
      href: getStaffHqUrl("/"),
    });
  }

  options.push({
    key: "customer",
    role: "customer",
    title: "Customer Dashboard",
    description:
      "Your personal Henry Onyx account — bookings, orders, wallet, and preferences.",
    href: getAccountUrl("/"),
  });

  return options;
}

function readPreferredDashboardKey(value?: string | null): DashboardOption["key"] | null {
  const normalized = String(value || "").trim().toLowerCase();
  return (DASHBOARD_PREFERENCE_VALUES as ReadonlyArray<string>).includes(normalized)
    ? (normalized as DashboardOption["key"])
    : null;
}

function buildChooserUrl(origin: string, next?: string | null): string {
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
        access.staffDivisionCount === 1 && !access.hasOwnerAccess
          ? "division_operator"
          : "staff";
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
  const access = await readAccessSnapshot({
    id: user.id,
    email: user.email ?? null,
    app_metadata: user.app_metadata,
    user_metadata: user.user_metadata,
  });
  return decideDashboardResolution({ access, next, origin, preferredDashboardKey });
}

/**
 * Back-compat wrapper. Existing callers that just want a URL and don't yet
 * handle the chooser keep working — when the resolver wants the chooser,
 * we return the chooser URL so the caller still issues a single redirect.
 *
 * New callers (DASH-1 IdentityBar onward) should use `resolveUserDashboard`
 * directly so they can inspect the role and (optionally) handle
 * chooser-vs-redirect explicitly.
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
 *
 * Also consumed by the DASH-1 IdentityBar role-switcher to enumerate
 * the lanes available to render in the dropdown.
 */
export async function loadDashboardOptions(user: AuthenticatedUser): Promise<DashboardOption[]> {
  const access = await readAccessSnapshot({
    id: user.id,
    email: user.email ?? null,
    app_metadata: user.app_metadata,
    user_metadata: user.user_metadata,
  });
  return buildDashboardOptions(access);
}

// Re-export viewer helpers for one-import server consumption.
export {
  requireUnifiedViewer,
  buildUnifiedViewer,
  getViewerRoles,
  readAccessSnapshot,
} from "./viewer";

// Track C (DASH-9) staff helpers. Re-exported here so single-import
// callers (apps/staff/app/(track-c)/layout.tsx) can pick up everything
// from @henryco/auth/server. Track-C-only imports may prefer
// @henryco/auth/staff for clearer intent.
export {
  requireStaffViewer,
  buildStaffViewer,
  getStaffMemberships,
  hasStaffAccessIn,
  getStaffDivisionsForViewer,
  getStaffRolesIn,
  type StaffViewer,
} from "./staff";

// Re-export cookie helpers.
export {
  setDashboardPreference,
  readDashboardPreference,
  clearDashboardPreference,
  DASHBOARD_PREFERENCE_COOKIE,
} from "./cookies";
