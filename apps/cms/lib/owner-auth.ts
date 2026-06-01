import { isRecoverableSupabaseAuthError } from "@henryco/config";
import { createCmsSupabaseServer } from "./supabase/server";

type CmsSupabase = Awaited<ReturnType<typeof createCmsSupabaseServer>>;

type OwnerAuthFailure = {
  ok: false;
  reason: "unauthorized" | "forbidden" | "misconfigured";
  supabase: CmsSupabase | null;
};

type OwnerAuthSuccess = {
  ok: true;
  user: { id: string; email?: string | null };
  supabase: CmsSupabase;
};

export type OwnerAuthResult = OwnerAuthFailure | OwnerAuthSuccess;

/**
 * The owner-only gate, ported from the hub's `requireOwner`: a network-verified
 * Supabase user PLUS an `owner_profiles` row that is `is_active` with role in
 * {owner, admin}. This is the same identity model the live sites already trust —
 * the CMS reuses the contract; only the session transport (standalone login)
 * differs.
 */
export async function requireOwner(): Promise<OwnerAuthResult> {
  let supabase: CmsSupabase | null = null;
  try {
    supabase = await createCmsSupabaseServer();
  } catch {
    return { ok: false, reason: "misconfigured", supabase: null };
  }
  if (!supabase) {
    return { ok: false, reason: "misconfigured", supabase: null };
  }

  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"] | null = null;
  let userError: unknown = null;

  try {
    const auth = await supabase.auth.getUser();
    user = auth.data.user;
    userError = auth.error;
  } catch (error) {
    if (!isRecoverableSupabaseAuthError(error)) {
      throw error;
    }
    userError = error;
  }

  if (userError || !user) {
    return { ok: false, reason: "unauthorized", supabase };
  }

  const email = user.email?.trim().toLowerCase() || null;

  const { data: directProfile, error: directProfileError } = await supabase
    .from("owner_profiles")
    .select("user_id, email, role, is_active")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: emailProfile, error: emailProfileError } =
    !directProfile && email
      ? await supabase
          .from("owner_profiles")
          .select("user_id, email, role, is_active")
          .eq("email", email)
          .maybeSingle()
      : { data: null, error: null };

  const profile = directProfile ?? emailProfile;
  const profileError = directProfileError ?? emailProfileError;

  if (
    profileError ||
    !profile ||
    !profile.is_active ||
    !["owner", "admin"].includes(String(profile.role).trim().toLowerCase())
  ) {
    return { ok: false, reason: "forbidden", supabase };
  }

  return {
    ok: true,
    user: { id: user.id, email: user.email },
    supabase,
  };
}
