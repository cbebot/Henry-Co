import "server-only";

import { redirect } from "next/navigation";
import { isRecoverableSupabaseAuthError, resolveUserAvatarFromSources } from "@henryco/config";
import { normalizeEmail } from "@/lib/env";
import { getAccountLearnUrl, getSharedAuthUrl } from "@/lib/learn/links";
import { createAdminSupabase, hasSupabaseServiceRole } from "@/lib/supabase";
import { createSupabaseServer } from "@/lib/supabase/server";
import { readLearnCollection } from "@/lib/learn/store";
import type { LearnRole, LearnViewer } from "@/lib/learn/types";

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
  role: string | null;
  scope_type: string | null;
  scope_id: string | null;
  user_id?: string | null;
  normalized_email?: string | null;
  is_active?: boolean | null;
};

function uniqueRoles(roles: LearnRole[]) {
  return [...new Set(roles)];
}

function mapSharedRoleToLearnRoles(role: string | null | undefined): LearnRole[] {
  const value = String(role || "").trim().toLowerCase();
  if (value === "owner") {
    return [
      "academy_owner",
      "academy_admin",
      "instructor",
      "content_manager",
      "support",
      "finance",
      "internal_manager",
    ];
  }

  if (value === "manager") {
    return ["academy_admin", "internal_manager", "instructor"];
  }

  if (value === "support") {
    return ["support"];
  }

  if (value === "finance") {
    return ["finance"];
  }

  if (value === "staff") {
    return ["learner"];
  }

  return [];
}

export function viewerHasRole(viewer: LearnViewer | null | undefined, allowed: LearnRole[]) {
  if (!viewer) return false;
  return allowed.some((role) => viewer.roles.includes(role));
}

function viewerFromUserMetadata(user: {
  id: string;
  email?: string | null;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
}): LearnViewer {
  const normalized = normalizeEmail(user.email);
  const baseRoles = mapSharedRoleToLearnRoles(
    (typeof user.app_metadata?.role === "string" ? user.app_metadata.role : null) ||
      (typeof user.user_metadata?.role === "string" ? user.user_metadata.role : null)
  );
  return {
    user: {
      id: user.id,
      email: user.email || null,
      fullName:
        (typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null) ||
        (typeof user.user_metadata?.name === "string" ? user.user_metadata.name : null) ||
        null,
      avatarUrl: resolveUserAvatarFromSources(null, user.user_metadata as Record<string, unknown> | null),
    },
    normalizedEmail: normalized,
    roles: uniqueRoles(["learner", ...baseRoles]),
    memberships: [],
  };
}

export async function getLearnViewer(): Promise<LearnViewer> {
  let supabase;
  try {
    supabase = await createSupabaseServer();
  } catch {
    return {
      user: null,
      normalizedEmail: null,
      roles: [],
      memberships: [],
    };
  }

  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"] | null = null;
  try {
    const auth = await supabase.auth.getUser();
    user = auth.data.user ?? null;
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

  const normalized = normalizeEmail(user.email);

  if (!hasSupabaseServiceRole()) {
    return viewerFromUserMetadata(user);
  }

  try {
    const admin = createAdminSupabase();
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

    const membershipRows = (
      await readLearnCollection<MembershipRow>("learn_role_memberships", "created_at", false)
    ).filter((membership) => {
      if (membership.is_active === false) return false;
      if (membership.user_id && membership.user_id === user.id) return true;
      return !!normalized && membership.normalized_email === normalized;
    });

    const baseRoles = mapSharedRoleToLearnRoles(
      profile?.role ||
        (typeof user.app_metadata?.role === "string" ? user.app_metadata.role : null) ||
        (typeof user.user_metadata?.role === "string" ? user.user_metadata.role : null)
    );

    const membershipRoles = membershipRows
      .map((membership) => String(membership.role || "").trim() as LearnRole)
      .filter(Boolean);

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
      roles: uniqueRoles(["learner", ...membershipRoles, ...baseRoles]),
      memberships: membershipRows.map((membership) => ({
        id: membership.id,
        role: String(membership.role || "").trim() as LearnRole,
        scopeType: String(membership.scope_type || "platform"),
        scopeId: membership.scope_id || null,
      })),
    };
  } catch {
    return viewerFromUserMetadata(user);
  }
}

export async function requireLearnUser(next?: string) {
  const viewer = await getLearnViewer();

  if (!viewer.user) {
    redirect(getSharedAuthUrl("login", next));
  }

  return viewer;
}

export async function requireLearnRoles(allowed: LearnRole[], next?: string) {
  const viewer = await requireLearnUser(next);
  if (!viewerHasRole(viewer, allowed)) {
    redirect(getAccountLearnUrl());
  }
  return viewer;
}
