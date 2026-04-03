"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSharedCookieDomain } from "@henryco/config";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export function getBrowserSupabase() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Missing Supabase public env vars.");
  }

  if (!browserClient) {
    const cookieDomain = getSharedCookieDomain(window.location.hostname);
    browserClient = createBrowserClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
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
