import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import {
  buildSharedCookieHandlers,
  buildSupabaseCookieOptions,
  resolveRequestCookieDomain,
} from "@henryco/config";

export async function createHubSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  const cookieStore = await cookies();
  const headerStore = await headers();
  const cookieDomain = resolveRequestCookieDomain((name) => headerStore.get(name));

  return createServerClient(url, anon, {
    cookieOptions: buildSupabaseCookieOptions(cookieDomain),
    cookies: buildSharedCookieHandlers(cookieStore, cookieDomain),
  });
}
