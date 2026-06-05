"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSharedCookieDomain } from "@henryco/config";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getBrowserSupabase() {
  // Static `process.env.NEXT_PUBLIC_*` access so Next.js inlines the values
  // into the client bundle at build time. A dynamic read (process.env[name])
  // is NOT inlined and resolves to undefined in the browser.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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

export const createSupabaseBrowser = getBrowserSupabase;
