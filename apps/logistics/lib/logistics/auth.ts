import "server-only";

import { redirect } from "next/navigation";
import { filterGrantedMemberships, isRecoverableSupabaseAuthError } from "@henryco/config";
import { normalizeEmail } from "@/lib/env";
import { getLogisticsSharedLoginUrl } from "@/lib/logistics-public-links";
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

type LogisticsMembershipFetch = MembershipRow & {
  user_id: string | null;
  normalized_email: string | null;
  is_active: boolean | null;
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
    return { user: null, normalizedEmail: null, roles: [], memberships: [] };
  }

  const admin = createAdminSupabase();
  const normalized = normalizeEmail(user.email);
  const emailVerified = Boolean(user.email_confirmed_at);

  const [{ data: profile }, { data: membershipCandidates }] = await Promise.all([
    admin.from("profiles").select("full_name, role").eq("id", user.id).maybeSingle<SharedProfile>(),
    admin
      .from("logistics_role_memberships")
      .select("id, role, scope_type, scope_id, user_id, normalized_email, is_active")
      .eq("is_active", true)
      .or(
        normalized
          ? `user_id.eq.${user.id},normalized_email.eq.${normalized}`
          : `user_id.eq.${user.id}`
      )
      .returns<LogisticsMembershipFetch[]>(),
  ]);

  // Shared grant rule: bound rows match only their owner; an unclaimed
  // (user_id null) seed grants only to a verified, matching mailbox. (The
  // logistics_role_memberships table is not created yet — this keeps the
  // resolver safe for the day it ships.)
  const membershipRows = filterGrantedMemberships(membershipCandidates ?? [], {
    userId: user.id,
    normalizedEmail: normalized,
    emailVerified,
  });

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
    redirect(getLogisticsSharedLoginUrl(next || "/customer"));
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
