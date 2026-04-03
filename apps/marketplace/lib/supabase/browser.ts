"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getOptionalEnv } from "@/lib/env";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getBrowserSupabase() {
  const url = getOptionalEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anon = getOptionalEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (!url || !anon) {
    throw new Error("Missing Supabase public env vars.");
  }

  if (!browserClient) {
    browserClient = createBrowserClient(url, anon);
  }

  return browserClient;
}
