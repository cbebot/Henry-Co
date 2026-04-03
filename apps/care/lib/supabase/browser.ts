import { createClient } from "@supabase/supabase-js";
import { getOptionalEnv } from "@/lib/env";

export function createSupabaseBrowser() {
  const url = getOptionalEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anon = getOptionalEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (!url || !anon) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");

  return createClient(url, anon, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
}
