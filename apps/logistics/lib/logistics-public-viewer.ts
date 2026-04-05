import "server-only";

import type { PublicAccountUser } from "@henryco/ui";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function getLogisticsPublicChipUser(): Promise<PublicAccountUser | null> {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const meta = (user.user_metadata || {}) as { full_name?: string; avatar_url?: string };
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();

    const name =
      (typeof profile?.full_name === "string" && profile.full_name.trim()) ||
      (typeof meta.full_name === "string" && meta.full_name.trim()) ||
      user.email?.split("@")[0] ||
      "Your account";

    return {
      displayName: name,
      email: user.email,
      avatarUrl: typeof meta.avatar_url === "string" ? meta.avatar_url : null,
    };
  } catch {
    return null;
  }
}
