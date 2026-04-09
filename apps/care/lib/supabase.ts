import { createClient } from "@supabase/supabase-js";
import { getOptionalEnv } from "@/lib/env";

const SUPABASE_URL = getOptionalEnv("NEXT_PUBLIC_SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = getOptionalEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") || "";
const SUPABASE_SERVICE_KEY =
  getOptionalEnv("SUPABASE_SERVICE_ROLE_KEY") ||
  getOptionalEnv("NEXT_PUBLIC_SUPABASE_SERVICE_KEY") ||
  "";

/**
 * @deprecated Use {@link createSupabaseServer} from `@/lib/supabase/server`
 * or {@link createSupabaseBrowser} from `@/lib/supabase/browser` instead.
 * This legacy client does not share cookies across subdomains.
 */
export function createPublicSupabase() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Supabase public environment variables are missing.");
  }

  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function createAdminSupabase() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error("Supabase admin environment variables are missing.");
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
