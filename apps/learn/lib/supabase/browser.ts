"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getRequiredEnv } from "@/lib/env";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createSupabaseBrowser() {
  if (browserClient) {
    return browserClient;
  }

  const url = getRequiredEnv(
    "NEXT_PUBLIC_SUPABASE_URL",
    "Missing NEXT_PUBLIC_SUPABASE_URL for the browser Supabase client."
  );
  const anon = getRequiredEnv(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY for the browser Supabase client."
  );

  browserClient = createBrowserClient(url, anon);
  return browserClient;
}
