import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import {
  isRecoverableSupabaseAuthError,
  normalizeEmail,
  normalizePhone,
} from "@henryco/config";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase";
import { scheduleLinkedCareBookingsSync } from "@/lib/care-sync";
import { ensureAccountProfileRecords } from "@/lib/account-profile";

export type AccountUser = {
  id: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  phone: string | null;
  isVerified: boolean;
  isOwner: boolean;
  ownerRole: string | null;
};

export const getAccountUser = cache(async (): Promise<AccountUser | null> => {
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

  if (!user) return null;

  await ensureAccountProfileRecords(user);

  const admin = createAdminSupabase();
  const [{ data: profile }, { data: ownerProfile }] = await Promise.all([
    admin
      .from("customer_profiles")
      .select("full_name, avatar_url, phone, is_verified")
      .eq("id", user.id)
      .maybeSingle(),
    admin
      .from("owner_profiles")
      .select("role, is_active")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle(),
  ]);

  const fullName =
    profile?.full_name ||
    (typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null) ||
    (typeof user.user_metadata?.name === "string" ? user.user_metadata.name : null) ||
    null;
  const phone =
    normalizePhone(
      profile?.phone ||
        (typeof user.user_metadata?.phone === "string" ? user.user_metadata.phone : null) ||
        null
    ) || null;
  const email = normalizeEmail(user.email);

  scheduleLinkedCareBookingsSync({
    userId: user.id,
    email,
    fullName,
    phone,
  });

  return {
    id: user.id,
    email,
    fullName,
    avatarUrl: profile?.avatar_url || null,
    phone,
    isVerified: profile?.is_verified || false,
    isOwner: !!ownerProfile,
    ownerRole: ownerProfile?.role || null,
  };
});

export async function requireAccountUser(): Promise<AccountUser> {
  const user = await getAccountUser();
  if (!user) redirect("/login");
  return user;
}
