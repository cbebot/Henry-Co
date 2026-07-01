import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getOptionalEnv } from "@/lib/env";

const SUPABASE_URL = getOptionalEnv("NEXT_PUBLIC_SUPABASE_URL") || "";
const SUPABASE_SERVICE_KEY = getOptionalEnv("SUPABASE_SERVICE_ROLE_KEY") || "";

/** True when the service-role env is present (so callers can fail closed, not crash). */
export function hasAdminSupabaseEnv(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_KEY);
}

/**
 * Service-role Supabase client — server-only, bypasses RLS. Used ONLY for the narrow admin
 * paths property needs: reading a listing's owner for the ownership gate and calling the
 * service_role-only `record_property_listing_verification` writer. Never import from a client
 * component.
 */
export function createAdminSupabase() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error("Supabase admin environment variables are missing.");
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
