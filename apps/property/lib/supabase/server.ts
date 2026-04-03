import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getSharedCookieDomain } from "@henryco/config";
import "@/lib/server-env";
import { getRequiredEnv } from "@/lib/env";

export async function createSupabaseServer() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const url = getRequiredEnv(
    "NEXT_PUBLIC_SUPABASE_URL",
    "Missing NEXT_PUBLIC_SUPABASE_URL for the server Supabase client."
  );
  const anon = getRequiredEnv(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY for the server Supabase client."
  );
  const cookieDomain = getSharedCookieDomain(
    headerStore.get("x-forwarded-host") || headerStore.get("host")
  );

  return createServerClient(url, anon, {
    cookieOptions: cookieDomain
      ? {
          domain: cookieDomain,
          path: "/",
          sameSite: "lax",
          secure: true,
        }
      : undefined,
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // ignore if called where cookies cannot be set
        }
      },
    },
  });
}
