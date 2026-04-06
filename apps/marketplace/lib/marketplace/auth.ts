import "server-only";

import { redirect } from "next/navigation";
import { isRecoverableSupabaseAuthError, normalizeEmail, resolveUserAvatarFromSources } from "@henryco/config";
import { createAdminSupabase } from "@/lib/supabase";
import { buildSharedAccountLoginUrl } from "@/lib/marketplace/shared-account";
import { createSupabaseServer } from "@/lib/supabase/server";
import type { MarketplaceRole, MarketplaceViewerContext } from "@/lib/marketplace/types";

type SharedProfile = {
  full_name: string | null;
  role?: string | null;
};

type CustomerProfile = {
  avatar_url: string | null;
};

type MarketplaceRoleMembershipRow = {
  id: string;
  role: MarketplaceRole;
  scope_type: string;
  scope_id: string | null;
};

function uniqueRoles(roles: MarketplaceRole[]) {
  return [...new Set(roles)];
}

export function viewerHasRole(
  viewer: MarketplaceViewerContext | null | undefined,
  allowed: MarketplaceRole[]
) {
  if (!viewer) return false;
  return allowed.some((role) => viewer.roles.includes(role));
}

export async function getMarketplaceViewer(): Promise<MarketplaceViewerContext> {
  const supabase = await createSupabaseServer();
  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"] | null = null;

  try {
    const auth = await supabase.auth.getUser();
    user = auth.data.user;
  } catch (error) {
    if (!isRecoverableSupabaseAuthError(error)) {
      throw error;
    }
  }

  if (!user) {
    return {
      user: null,
      normalizedEmail: null,
      roles: [],
      memberships: [],
    };
  }

  const admin = createAdminSupabase();
  const email = normalizeEmail(user.email);

  const [{ data: profile }, { data: customerProfile }] = await Promise.all([
    admin.from("profiles").select("full_name, role").eq("id", user.id).maybeSingle<SharedProfile>(),
    admin
      .from("customer_profiles")
      .select("avatar_url")
      .eq("id", user.id)
      .maybeSingle<CustomerProfile>(),
  ]);

  let memberships:
    | MarketplaceRoleMembershipRow[]
    | null = null;
  let membershipError = false;

  try {
    const { data: byUser, error: byUserError } = await admin
      .from("marketplace_role_memberships")
      .select("id, role, scope_type, scope_id")
      .eq("user_id", user.id)
      .eq("is_active", true);

    if (byUserError) {
      membershipError = true;
    } else {
      memberships = (byUser as MarketplaceRoleMembershipRow[] | null) ?? [];
    }

    if (!membershipError && email) {
      const { data: byEmail, error: byEmailError } = await admin
        .from("marketplace_role_memberships")
        .select("id, role, scope_type, scope_id")
        .eq("normalized_email", email)
        .eq("is_active", true);

      if (byEmailError) {
        membershipError = true;
      } else {
        memberships = [
          ...(memberships ?? []),
          ...((byEmail as MarketplaceRoleMembershipRow[] | null) ?? []),
        ];
      }
    }
  } catch {
    membershipError = true;
  }

  const explicitRoles = uniqueRoles(
    (memberships ?? []).map((membership) => membership.role).filter(Boolean) as MarketplaceRole[]
  );

  // Bootstrap fallback only while the marketplace role table is missing or unreadable.
  const fallbackRoles: MarketplaceRole[] = [];
  const legacyRole = String(profile?.role || user.app_metadata?.role || "").toLowerCase();

  if (membershipError) {
    if (legacyRole === "owner") fallbackRoles.push("marketplace_owner");
    if (legacyRole === "support") fallbackRoles.push("support");
    if (legacyRole === "manager") fallbackRoles.push("operations");
    if (legacyRole === "staff") fallbackRoles.push("marketplace_admin");
  }

  const roles = uniqueRoles(["buyer", ...explicitRoles, ...fallbackRoles]);

  return {
    user: {
      id: user.id,
      email: user.email || null,
      fullName:
        profile?.full_name ||
        (typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null) ||
        (typeof user.user_metadata?.name === "string" ? user.user_metadata.name : null) ||
        null,
      avatarUrl: resolveUserAvatarFromSources(customerProfile?.avatar_url ?? null, user.user_metadata as Record<
        string,
        unknown
      > | null),
    },
    normalizedEmail: email,
    roles,
    memberships: (memberships ?? []).map((membership) => ({
      id: membership.id,
      role: membership.role,
      scopeType: membership.scope_type,
      scopeId: membership.scope_id,
    })),
  };
}

export async function requireMarketplaceUser(next?: string) {
  const viewer = await getMarketplaceViewer();

  if (!viewer.user) {
    redirect(buildSharedAccountLoginUrl(next || "/account"));
  }

  return viewer;
}

export async function requireMarketplaceRoles(allowed: MarketplaceRole[], next?: string) {
  const viewer = await requireMarketplaceUser(next);

  if (!viewerHasRole(viewer, allowed)) {
    redirect("/account");
  }

  return viewer;
}
