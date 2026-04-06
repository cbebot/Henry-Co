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

type AccessSnapshot = {
  hasOwnerAccess: boolean;
  hasStaffAccess: boolean;
  ownerRole: string | null;
  profileRole: string | null;
};

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
]);

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

  const [{ data: profile }, { data: directOwnerProfile }] = await Promise.all([
    admin.from("profiles").select("role").eq("id", user.id).maybeSingle<{ role: string | null }>(),
    admin
      .from("owner_profiles")
      .select("role, is_active")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle<{ role: string | null; is_active: boolean }>(),
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

  return {
    hasOwnerAccess: ownerRole === "owner" || ownerRole === "admin",
    hasStaffAccess: profileRole ? INTERNAL_PROFILE_ROLES.has(profileRole) : false,
    ownerRole,
    profileRole,
  };
}

export async function resolveAuthenticatedDestination({
  user,
  next,
  origin,
}: {
  user: AuthenticatedUser;
  next?: string | null;
  origin: string;
}) {
  let normalizedNext = normalizeTrustedRedirect(next);
  const nextUrl = toTargetUrl(normalizedNext, origin);
  const access = await readAccessSnapshot(user);

  if (isAccountAuthTarget(nextUrl)) {
    normalizedNext = "/";
  }

  if (normalizedNext !== "/") {
    const trustedTarget = toTargetUrl(normalizedNext, origin);

    if (isOwnerTarget(trustedTarget)) {
      return access.hasOwnerAccess
        ? toOwnerDestination(normalizedNext, origin)
        : getHqUrl("/owner/no-access");
    }

    if (isStaffTarget(trustedTarget)) {
      return access.hasStaffAccess
        ? toStaffDestination(normalizedNext, origin)
        : getStaffHqUrl("/no-access");
    }

    return isAbsoluteHttpUrl(normalizedNext)
      ? normalizedNext
      : resolveTrustedRedirect(origin, normalizedNext);
  }

  if (access.hasOwnerAccess) {
    return getHqUrl("/owner");
  }

  if (access.hasStaffAccess) {
    return getStaffHqUrl("/");
  }

  return getAccountUrl("/");
}
