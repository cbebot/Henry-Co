import { createClient } from "@supabase/supabase-js";
import { getOptionalEnv } from "@/lib/env";

function readSupabaseEnv() {
  return {
    url: getOptionalEnv("NEXT_PUBLIC_SUPABASE_URL") || "",
    anonKey: getOptionalEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") || "",
    serviceKey:
      getOptionalEnv("SUPABASE_SERVICE_ROLE_KEY") ||
      getOptionalEnv("NEXT_PUBLIC_SUPABASE_SERVICE_KEY") ||
      "",
  };
}

export function hasPublicSupabaseEnv() {
  const { url, anonKey } = readSupabaseEnv();
  return Boolean(url && anonKey);
}

export function hasAdminSupabaseEnv() {
  const { url, serviceKey } = readSupabaseEnv();
  return Boolean(url && serviceKey);
}

export function createPublicSupabase() {
  const { url, anonKey } = readSupabaseEnv();
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
  const { url, serviceKey } = readSupabaseEnv();
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
