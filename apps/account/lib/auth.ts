import "server-only";

import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase";
import { normalizeEmail } from "@/lib/env";

export type AccountUser = {
  id: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  phone: string | null;
  isVerified: boolean;
};

export async function getAccountUser(): Promise<AccountUser | null> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const admin = createAdminSupabase();
  const { data: profile } = await admin
    .from("customer_profiles")
    .select("full_name, avatar_url, phone, is_verified")
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: normalizeEmail(user.email),
    fullName: profile?.full_name || user.user_metadata?.full_name || null,
    avatarUrl: profile?.avatar_url || null,
    phone: profile?.phone || null,
    isVerified: profile?.is_verified || false,
  };
}

export async function requireAccountUser(): Promise<AccountUser> {
  const user = await getAccountUser();
  if (!user) redirect("/login");
  return user;
}
