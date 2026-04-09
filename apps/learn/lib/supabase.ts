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

/**
 * @deprecated Use {@link createSupabaseServer} from `@/lib/supabase/server`
 * or {@link createSupabaseBrowser} from `@/lib/supabase/browser` instead.
 * This legacy client does not share cookies across subdomains.
 */
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

/** True when service-role seeding / admin reads are available (optional for public SSR). */
export function hasSupabaseServiceRole() {
  const { url, serviceKey } = getSupabaseConfig();
  return Boolean(url && serviceKey);
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
