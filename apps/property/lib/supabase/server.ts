import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import {
  buildSharedCookieHandlers,
  buildSupabaseCookieOptions,
  resolveRequestCookieDomain,
} from "@henryco/config";
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
  const cookieDomain = resolveRequestCookieDomain((name) => headerStore.get(name));

  return createServerClient(url, anon, {
    cookieOptions: buildSupabaseCookieOptions(cookieDomain),
    cookies: buildSharedCookieHandlers(cookieStore, cookieDomain),
  });
}
