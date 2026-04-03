import "server-only";

import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getSharedCookieDomain } from "@henryco/config";
import { getOptionalEnv } from "@/lib/env";

const SUPABASE_URL = getOptionalEnv("NEXT_PUBLIC_SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = getOptionalEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") || "";

export async function createSupabaseServer() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const cookieDomain = getSharedCookieDomain(
    headerStore.get("x-forwarded-host") || headerStore.get("host")
  );

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
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
      setAll(tokens) {
        try {
          for (const { name, value, options } of tokens) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server component — read-only cookies
        }
      },
    },
  });
}
