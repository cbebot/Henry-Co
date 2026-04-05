import "server-only";

import { redirect } from "next/navigation";
import { normalizeEmail } from "@/lib/env";
import { createAdminSupabase } from "@/lib/supabase";
import { getStudioAccountUrl, getStudioLoginUrl } from "@/lib/studio/links";
import { reconcileStudioSharedPendingSyncs } from "@/lib/studio/shared-account";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getStudioSnapshot } from "@/lib/studio/store";
import type { StudioRole, StudioViewer } from "@/lib/studio/types";

type SharedProfile = {
  full_name: string | null;
  role?: string | null;
  avatar_url?: string | null;
};

type MembershipRow = {
  id: string;
  role: string | null;
  scope_type: string | null;
  scope_id: string | null;
};

function uniqueRoles(roles: StudioRole[]) {
  return [...new Set(roles)];
}

function mapSharedRoleToStudioRoles(role: string | null | undefined): StudioRole[] {
  const value = String(role || "").trim().toLowerCase();
  if (value === "owner") {
    return [
      "studio_owner",
      "sales_consultation",
      "project_manager",
      "developer_designer",
      "client_success",
      "finance",
    ];
  }

  if (value === "manager") {
    return ["sales_consultation", "project_manager"];
  }

  if (value === "support") {
    return ["client_success"];
  }

  if (value === "staff") {
    return ["developer_designer"];
  }

  return [];
}

export function viewerHasRole(viewer: StudioViewer | null | undefined, allowed: StudioRole[]) {
  if (!viewer) return false;
  return allowed.some((role) => viewer.roles.includes(role));
}

export async function getStudioViewer(): Promise<StudioViewer> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      normalizedEmail: null,
      roles: [],
    };
  }

  const admin = createAdminSupabase();
  const normalized = normalizeEmail(user.email);

  if (normalized) {
    await reconcileStudioSharedPendingSyncs({
      email: normalized,
      userId: user.id,
      limit: 100,
    }).catch(() => null);
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, role, avatar_url")
    .eq("id", user.id)
    .maybeSingle<SharedProfile>();

  const { data: membershipRows } = await admin
    .from("studio_role_memberships")
    .select("id, role, scope_type, scope_id")
    .eq("is_active", true)
    .or(
      normalized
        ? `user_id.eq.${user.id},normalized_email.eq.${normalized}`
        : `user_id.eq.${user.id}`
    )
    .returns<MembershipRow[]>();

  const baseRoles = mapSharedRoleToStudioRoles(
    profile?.role ||
      (typeof user.app_metadata?.role === "string" ? user.app_metadata.role : null) ||
      (typeof user.user_metadata?.role === "string" ? user.user_metadata.role : null)
  );
  const membershipRoles = (membershipRows ?? [])
    .map((membership) => String(membership.role || "").trim() as StudioRole)
    .filter(Boolean);

  const snapshot = await getStudioSnapshot();
  const hasClientActivity = snapshot.leads.some(
    (lead) => lead.userId === user.id || (normalized && lead.normalizedEmail === normalized)
  );
  const roles = uniqueRoles(
    hasClientActivity ? ["client", ...membershipRoles, ...baseRoles] : [...membershipRoles, ...baseRoles]
  );

  return {
    user: {
      id: user.id,
      email: user.email || null,
      fullName:
        profile?.full_name ||
        (typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null) ||
        (typeof user.user_metadata?.name === "string" ? user.user_metadata.name : null) ||
        null,
      avatarUrl: profile?.avatar_url || null,
    },
    normalizedEmail: normalized,
    roles,
    memberships: (membershipRows ?? []).map((membership) => ({
      id: membership.id,
      role: String(membership.role || "").trim() as StudioRole,
      scopeType: String(membership.scope_type || "platform"),
      scopeId: membership.scope_id || null,
    })),
  };
}

export async function requireStudioUser(next?: string) {
  const viewer = await getStudioViewer();

  if (!viewer.user) {
    redirect(getStudioLoginUrl(next));
  }

  return viewer;
}

export async function requireStudioRoles(allowed: StudioRole[], next?: string) {
  const viewer = await requireStudioUser(next);

  if (!viewerHasRole(viewer, allowed)) {
    redirect(getStudioAccountUrl());
  }

  return viewer;
}
