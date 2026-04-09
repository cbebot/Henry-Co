"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSharedCookieDomain } from "@henryco/config";
import { getOptionalEnv } from "@/lib/env";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getBrowserSupabaseOptional() {
  const url = getOptionalEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anon = getOptionalEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!url || !anon) return null;

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

export function getBrowserSupabase() {
  const client = getBrowserSupabaseOptional();
  if (!client) {
    throw new Error("Missing Supabase public env vars.");
  }

  return client;
}
