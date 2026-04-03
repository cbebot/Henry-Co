import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

async function getOwnerSupabaseServerClient() {
  const cookieStore = await cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    throw new Error("Missing Supabase environment variables.");
  }

  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Read-only in some server contexts. Safe to ignore there.
        }
      },
    },
  });
}

type OwnerSupabaseClient = Awaited<ReturnType<typeof getOwnerSupabaseServerClient>>;

type OwnerAuthFailure = {
  ok: false;
  reason: "unauthorized" | "forbidden";
  supabase: OwnerSupabaseClient;
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

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

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
