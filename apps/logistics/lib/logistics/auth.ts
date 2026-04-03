import "server-only";

import { redirect } from "next/navigation";
import { normalizeEmail } from "@/lib/env";
import { createAdminSupabase } from "@/lib/supabase";
import { createSupabaseServer } from "@/lib/supabase/server";
import type { LogisticsRole, LogisticsViewer } from "@/lib/logistics/types";

type SharedProfile = {
  full_name: string | null;
  role?: string | null;
};

type MembershipRow = {
  id: string;
  role: string | null;
  scope_type: string | null;
  scope_id: string | null;
};

function uniqueRoles(roles: LogisticsRole[]) {
  return [...new Set(roles)];
}

function mapSharedRoleToLogisticsRoles(role: string | null | undefined): LogisticsRole[] {
  const value = String(role || "").trim().toLowerCase();

  if (value === "owner") {
    return ["logistics_owner", "dispatch_manager", "dispatch_admin", "support", "finance_ops"];
  }

  if (value === "manager") {
    return ["dispatch_manager", "dispatch_admin"];
  }

  if (value === "support") {
    return ["support"];
  }

  if (value === "staff") {
    return ["dispatch_admin"];
  }

  if (value === "rider") {
    return ["rider"];
  }

  return [];
}

export function viewerHasRole(viewer: LogisticsViewer | null | undefined, allowed: LogisticsRole[]) {
  if (!viewer) return false;
  return allowed.some((role) => viewer.roles.includes(role));
}

export async function getLogisticsViewer(): Promise<LogisticsViewer> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, normalizedEmail: null, roles: [], memberships: [] };
  }

  const admin = createAdminSupabase();
  const normalized = normalizeEmail(user.email);

  const [{ data: profile }, { data: membershipRows }] = await Promise.all([
    admin.from("profiles").select("full_name, role").eq("id", user.id).maybeSingle<SharedProfile>(),
    admin
      .from("logistics_role_memberships")
      .select("id, role, scope_type, scope_id")
      .eq("is_active", true)
      .or(
        normalized
          ? `user_id.eq.${user.id},normalized_email.eq.${normalized}`
          : `user_id.eq.${user.id}`
      )
      .returns<MembershipRow[]>(),
  ]);

  const baseRoles = mapSharedRoleToLogisticsRoles(
    profile?.role ||
      (typeof user.app_metadata?.role === "string" ? user.app_metadata.role : null) ||
      (typeof user.user_metadata?.role === "string" ? user.user_metadata.role : null)
  );
  const membershipRoles = (membershipRows ?? [])
    .map((membership) => String(membership.role || "").trim() as LogisticsRole)
    .filter(Boolean);
  const roles = uniqueRoles(["customer", ...baseRoles, ...membershipRoles]);

  return {
    user: {
      id: user.id,
      email: user.email || null,
      fullName:
        profile?.full_name ||
        (typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null) ||
        (typeof user.user_metadata?.name === "string" ? user.user_metadata.name : null) ||
        null,
    },
    normalizedEmail: normalized,
    roles,
    memberships: (membershipRows ?? []).map((membership) => ({
      id: membership.id,
      role: String(membership.role || "").trim() as LogisticsRole,
      scopeType: String(membership.scope_type || "platform"),
      scopeId: membership.scope_id || null,
    })),
  };
}

export async function requireLogisticsUser(next?: string) {
  const viewer = await getLogisticsViewer();

  if (!viewer.user) {
    const suffix = next ? `?next=${encodeURIComponent(next)}` : "";
    redirect(`/login${suffix}`);
  }

  return viewer;
}

export async function requireLogisticsRoles(allowed: LogisticsRole[], next?: string) {
  const viewer = await requireLogisticsUser(next);

  if (!viewerHasRole(viewer, allowed)) {
    if (viewer.roles.includes("customer")) {
      redirect("/customer");
    }
    redirect("/");
  }

  return viewer;
}
