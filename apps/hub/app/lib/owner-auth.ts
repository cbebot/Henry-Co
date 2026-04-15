import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import {
  buildSharedCookieHandlers,
  buildSupabaseCookieOptions,
  isRecoverableSupabaseAuthError,
  resolveRequestCookieDomain,
} from "@henryco/config";
import { logOwnerSurfaceError } from "@/lib/owner-diagnostics";

async function getOwnerSupabaseServerClient() {
  const cookieStore = await cookies();
  const headerStore = await headers();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    logOwnerSurfaceError("app/lib/owner-auth.getOwnerSupabaseServerClient", new Error("Missing Supabase URL or anon key"), {
      hasUrl: Boolean(url),
      hasAnon: Boolean(anon),
    });
    return null;
  }

  const cookieDomain = resolveRequestCookieDomain((name) => headerStore.get(name));

  return createServerClient(url, anon, {
    cookieOptions: buildSupabaseCookieOptions(cookieDomain),
    cookies: buildSharedCookieHandlers(cookieStore, cookieDomain),
  });
}

type OwnerSupabaseClient = NonNullable<Awaited<ReturnType<typeof getOwnerSupabaseServerClient>>>;

type OwnerAuthFailure = {
  ok: false;
  reason: "unauthorized" | "forbidden" | "misconfigured";
  supabase: OwnerSupabaseClient | null;
};

type OwnerAuthSuccess = {
  ok: true;
  user: {
    id: string;
    email?: string | null;
  };
  supabase: OwnerSupabaseClient;
};

export type OwnerAuthResult = OwnerAuthFailure | OwnerAuthSuccess;

export async function requireOwner(): Promise<OwnerAuthResult> {
  const supabase = await getOwnerSupabaseServerClient();
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
    user: {
      id: user.id,
      email: user.email,
    },
    supabase,
  };
}
