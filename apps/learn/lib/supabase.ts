import { createClient } from "@supabase/supabase-js";
import { getOptionalEnv } from "@/lib/env";

function getSupabaseConfig() {
  return {
    url: getOptionalEnv("NEXT_PUBLIC_SUPABASE_URL") || "",
    anonKey: getOptionalEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") || "",
    serviceKey:
      getOptionalEnv("SUPABASE_SERVICE_ROLE_KEY") ||
      getOptionalEnv("NEXT_PUBLIC_SUPABASE_SERVICE_KEY") ||
      "",
  };
}

export function createPublicSupabase() {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) {
    throw new Error("Supabase public environment variables are missing.");
  }

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function createAdminSupabase() {
  const { url, serviceKey } = getSupabaseConfig();
  if (!url || !serviceKey) {
    throw new Error("Supabase admin environment variables are missing.");
  }

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
