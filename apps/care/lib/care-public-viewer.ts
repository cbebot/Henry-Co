import "server-only";

import { cookies } from "next/headers";
import { readPassiveSupabaseUserFromCookies, resolveUserAvatarFromSources } from "@henryco/config";
import type { PublicAccountUser } from "@henryco/ui";
import { createAdminSupabase } from "@/lib/supabase";

export async function getCarePublicChipUser(): Promise<PublicAccountUser | null> {
  const cookieStore = await cookies();
  const user = readPassiveSupabaseUserFromCookies(
    cookieStore.getAll(),
    process.env.NEXT_PUBLIC_SUPABASE_URL
  );

  if (!user) return null;

  const meta = (user.user_metadata || {}) as { full_name?: string; avatar_url?: string };
  let customerProfile: { full_name?: string | null; avatar_url?: string | null } | null = null;
  let profile: { full_name?: string | null; avatar_url?: string | null } | null = null;

  try {
    const admin = createAdminSupabase();
    const [{ data: customerProfileRow }, { data: profileRow }] = await Promise.all([
      admin.from("customer_profiles").select("full_name, avatar_url").eq("id", user.id).maybeSingle(),
      admin.from("profiles").select("full_name, avatar_url").eq("id", user.id).maybeSingle(),
    ]);
    customerProfile = customerProfileRow;
    profile = profileRow;
  } catch {
    customerProfile = null;
    profile = null;
  }

  const name =
    (typeof customerProfile?.full_name === "string" && customerProfile.full_name.trim()) ||
    (typeof profile?.full_name === "string" && profile.full_name.trim()) ||
    (typeof meta.full_name === "string" && meta.full_name.trim()) ||
    user.email?.split("@")[0] ||
    "Your account";

  return {
    displayName: name,
    email: user.email,
    avatarUrl: resolveUserAvatarFromSources(
      customerProfile?.avatar_url ?? profile?.avatar_url ?? null,
      user.user_metadata as Record<string, unknown>
    ),
  };
}
