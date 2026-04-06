import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getSharedCookieDomain } from "@henryco/config";

export async function createStaffSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  const cookieStore = await cookies();
  const headerStore = await headers();
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
          /* ignore where cookies cannot be set (e.g. in RSC render pass) */
        }
      },
    },
  });
}
