import "server-only";

import { redirect } from "next/navigation";
import {
  isRecoverableSupabaseAuthError,
  normalizeEmail,
  resolveUserAvatarFromSources,
} from "@henryco/config";
import { createAdminSupabase } from "@/lib/supabase";
import { createSupabaseServer } from "@/lib/supabase/server";
import type { PropertyRole, PropertyViewer } from "@/lib/property/types";

type SharedProfile = {
  full_name: string | null;
  role?: string | null;
  avatar_url?: string | null;
};

type CustomerProfile = {
  full_name: string | null;
  avatar_url?: string | null;
};

type MembershipRow = {
  id: string;
  role: PropertyRole;
  scope_type: string;
  scope_id: string | null;
};

function uniqueRoles(roles: PropertyRole[]) {
  return [...new Set(roles)];
}

function mapLegacyRole(role: string | null | undefined): PropertyRole[] {
  const value = String(role || "").trim().toLowerCase();

  if (value === "owner") {
    return [
      "property_owner",
      "listing_manager",
      "relationship_manager",
      "managed_ops",
      "support",
      "moderation",
      "property_admin",
    ];
  }

  if (value === "manager") {
    return ["listing_manager", "relationship_manager", "managed_ops"];
  }

  if (value === "support") {
    return ["support"];
  }

  if (value === "staff") {
    return ["moderation"];
  }

  return [];
}

export function viewerHasRole(
  viewer: PropertyViewer | null | undefined,
  allowed: PropertyRole[]
) {
  if (!viewer) return false;
  return allowed.some((role) => viewer.roles.includes(role));
}

export async function getPropertyViewer(): Promise<PropertyViewer> {
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
  const normalized = normalizeEmail(user.email);

  const [{ data: customerProfile }, { data: profile }] = await Promise.all([
    admin
      .from("customer_profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle<CustomerProfile>(),
    admin
      .from("profiles")
      .select("full_name, role, avatar_url")
      .eq("id", user.id)
      .maybeSingle<SharedProfile>(),
  ]);

  let memberships: MembershipRow[] = [];

  try {
    const { data, error } = await admin
      .from("property_role_memberships")
      .select("id, role, scope_type, scope_id")
      .eq("is_active", true)
      .or(
        normalized
          ? `user_id.eq.${user.id},normalized_email.eq.${normalized}`
          : `user_id.eq.${user.id}`
      );

    if (!error) {
      memberships = (data as MembershipRow[] | null) ?? [];
    }
  } catch {
    memberships = [];
  }

  const roles = uniqueRoles([
    "browser",
    ...memberships.map((membership) => membership.role),
    ...mapLegacyRole(
      profile?.role ||
        (typeof user.app_metadata?.role === "string" ? user.app_metadata.role : null) ||
        (typeof user.user_metadata?.role === "string" ? user.user_metadata.role : null)
    ),
  ]);

  return {
    user: {
      id: user.id,
      email: user.email || null,
      fullName:
        customerProfile?.full_name ||
        profile?.full_name ||
        (typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null) ||
        (typeof user.user_metadata?.name === "string" ? user.user_metadata.name : null) ||
        null,
      avatarUrl: resolveUserAvatarFromSources(
        customerProfile?.avatar_url ?? profile?.avatar_url ?? null,
        user.user_metadata as Record<string, unknown> | null
      ),
    },
    normalizedEmail: normalized,
    roles,
    memberships: memberships.map((membership) => ({
      id: membership.id,
      role: membership.role,
      scopeType: membership.scope_type,
      scopeId: membership.scope_id,
    })),
  };
}

export async function requirePropertyUser(next?: string) {
  const viewer = await getPropertyViewer();

  if (!viewer.user) {
    const suffix = next ? `?next=${encodeURIComponent(next)}` : "";
    redirect(`/login${suffix}`);
  }

  return viewer;
}

export async function requirePropertyRoles(allowed: PropertyRole[], next?: string) {
  const viewer = await requirePropertyUser(next);

  if (!viewerHasRole(viewer, allowed)) {
    redirect("/account");
  }

  return viewer;
}
