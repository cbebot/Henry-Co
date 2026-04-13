import "server-only";

import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import {
  buildSharedCookieHandlers,
  buildSupabaseCookieOptions,
  resolveRequestCookieDomain,
} from "@henryco/config";
import { getOptionalEnv } from "@/lib/env";

const SUPABASE_URL = getOptionalEnv("NEXT_PUBLIC_SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = getOptionalEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") || "";

export async function createSupabaseServer() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const cookieDomain = resolveRequestCookieDomain((name) => headerStore.get(name));

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookieOptions: buildSupabaseCookieOptions(cookieDomain),
    cookies: buildSharedCookieHandlers(cookieStore, cookieDomain),
  });
}
