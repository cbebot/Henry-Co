import "server-only";

import { redirect } from "next/navigation";
import { normalizeEmail } from "@/lib/env";
import { createAdminSupabase } from "@/lib/supabase";
import { requireOwner as requireHubOwnerAccess } from "@/app/lib/owner-auth";
import { logOwnerSurfaceError } from "@/lib/owner-diagnostics";

export type OwnerUser = {
  id: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  phone: string | null;
  isOwner: true;
  ownerRole: string;
  /** True when admin/profile queries failed; UI should show a safe notice and avoid white screens. */
  commandCenterProfileIncomplete?: boolean;
};

type HubOwnerSession = Extract<Awaited<ReturnType<typeof requireHubOwnerAccess>>, { ok: true }>;

function degradedOwnerUser(auth: HubOwnerSession, error: unknown): OwnerUser {
  logOwnerSurfaceError("lib/owner-auth.requireOwner.degraded", error, { userId: auth.user.id });
  return {
    id: auth.user.id,
    email: normalizeEmail(auth.user.email),
    fullName: null,
    avatarUrl: null,
    phone: null,
    isOwner: true,
    ownerRole: "owner",
    commandCenterProfileIncomplete: true,
  };
}

export async function requireOwner(): Promise<OwnerUser> {
  const auth = await requireHubOwnerAccess();

  if (!auth.ok) {
    redirect("/owner/login");
  }

  try {
    const admin = createAdminSupabase();
    const [profileRes, ownerProfileRes] = await Promise.all([
      admin
        .from("customer_profiles")
        .select("full_name, avatar_url, phone")
        .eq("id", auth.user.id)
        .maybeSingle(),
      admin
        .from("owner_profiles")
        .select("role")
        .eq("user_id", auth.user.id)
        .eq("is_active", true)
        .maybeSingle(),
    ]);

    if (profileRes.error) {
      return degradedOwnerUser(auth, profileRes.error);
    }
    if (ownerProfileRes.error) {
      return degradedOwnerUser(auth, ownerProfileRes.error);
    }

    return {
      id: auth.user.id,
      email: normalizeEmail(auth.user.email),
      fullName: profileRes.data?.full_name || null,
      avatarUrl: profileRes.data?.avatar_url || null,
      phone: profileRes.data?.phone || null,
      isOwner: true,
      ownerRole: String(ownerProfileRes.data?.role || "owner").trim().toLowerCase() || "owner",
    };
  } catch (error) {
    return degradedOwnerUser(auth, error);
  }
}
