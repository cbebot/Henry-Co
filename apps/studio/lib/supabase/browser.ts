"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSharedCookieDomain } from "@henryco/config";
import { cleanEnv } from "@/lib/env";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getBrowserSupabase() {
  const url = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anon = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!url || !anon) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  if (!browserClient) {
    const cookieDomain =
      typeof window === "undefined" ? undefined : getSharedCookieDomain(window.location.hostname);

    browserClient = createBrowserClient(
      url,
      anon,
      cookieDomain
        ? {
            cookieOptions: {
              domain: cookieDomain,
              path: "/",
              sameSite: "lax",
              secure: true,
            },
          }
        : undefined
    );
  }

  return browserClient;
}
