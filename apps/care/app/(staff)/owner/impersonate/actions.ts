"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireRoles } from "@/lib/auth/server";
import { createAdminSupabase } from "@/lib/supabase";
import { logSecurityEvent } from "@/lib/security/logger";
import { homeForRole, normalizeRole } from "@/lib/auth/roles";

const IMPERSONATION_COOKIE = "care_impersonation_owner";

export async function startImpersonationAction(input: { targetUserId: string }) {
  const auth = await requireRoles(["owner"]);

  const supabase = createAdminSupabase();
  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("id, full_name, role, is_frozen, deleted_at")
    .eq("id", input.targetUserId)
    .single();

  if (!targetProfile) throw new Error("Staff member not found.");
  if (targetProfile.deleted_at) throw new Error("Cannot impersonate a deactivated account.");
  if (targetProfile.is_frozen) throw new Error("Cannot impersonate a frozen account.");

  await logSecurityEvent({
    event_type: "owner_impersonation_start",
    user_id: auth.profile.id,
    role: "owner",
    details: {
      target_user_id: targetProfile.id,
      target_name: targetProfile.full_name,
      target_role: targetProfile.role,
    },
  });

  const { data: targetUser } = await supabase.auth.admin.getUserById(targetProfile.id);
  if (!targetUser?.user?.email) throw new Error("Target user has no email address.");

  const cookieStore = await cookies();
  cookieStore.set(
    IMPERSONATION_COOKIE,
    JSON.stringify({
      ownerUserId: auth.profile.id,
      ownerEmail: auth.user.email,
      targetUserId: targetProfile.id,
      targetName: targetProfile.full_name,
      targetRole: targetProfile.role,
      startedAt: new Date().toISOString(),
    }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 3600,
    }
  );

  const { data: magic } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email: targetUser.user.email,
  });

  if (!magic?.properties?.hashed_token) {
    throw new Error("Could not generate impersonation session.");
  }

  const targetHome = homeForRole(normalizeRole(targetProfile.role));

  redirect(
    `/owner/impersonate/callback?token_hash=${magic.properties.hashed_token}&type=magiclink&next=${encodeURIComponent(targetHome)}`
  );
}

export async function endImpersonationAction() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(IMPERSONATION_COOKIE)?.value;

  if (!raw) {
    redirect("/owner");
  }

  const session = JSON.parse(raw);

  await logSecurityEvent({
    event_type: "owner_impersonation_end",
    user_id: session.ownerUserId,
    role: "owner",
    details: {
      target_user_id: session.targetUserId,
      target_name: session.targetName,
      target_role: session.targetRole,
      duration_started: session.startedAt,
    },
  });

  cookieStore.delete(IMPERSONATION_COOKIE);

  const supabase = createAdminSupabase();
  const { data: ownerUser } = await supabase.auth.admin.getUserById(session.ownerUserId);

  if (ownerUser?.user?.email) {
    const { data: magic } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: ownerUser.user.email,
    });

    if (magic?.properties?.hashed_token) {
      redirect(
        `/owner/impersonate/callback?token_hash=${magic.properties.hashed_token}&type=magiclink&next=/owner`
      );
    }
  }

  redirect("/login");
}
