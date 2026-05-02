import "server-only";

import { isRecoverableSupabaseAuthError, resolveUserAvatarFromSources } from "@henryco/config";
import type { PublicAccountUser } from "@henryco/ui";
import { createAdminSupabase } from "@/lib/supabase";
import { createHubSupabaseServer } from "@/lib/supabase/server";

export async function getHubPublicChipUser(): Promise<PublicAccountUser | null> {
  let supabase: Awaited<ReturnType<typeof createHubSupabaseServer>>;
  try {
    supabase = await createHubSupabaseServer();
  } catch {
    return null;
  }
  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"] | null = null;

  try {
    const auth = await supabase.auth.getUser();
    user = auth.data.user ?? null;
  } catch (error) {
    /** Non-recoverable supabase auth errors used to re-throw and reach
     * error.tsx, surfacing as a "server error" on the about / privacy /
     * terms pages on preview deploys where the env wasn't fully wired.
     * These are read-only public surfaces; treating any auth failure as
     * "no chip user" is correct — the page should still render. */
    if (!isRecoverableSupabaseAuthError(error)) {
      // Log so we still see infra issues without taking down the page.
      console.error("[hub/getHubPublicChipUser] non-recoverable auth error", error);
    }
    user = null;
  }

  if (!user) {
    return null;
  }

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
