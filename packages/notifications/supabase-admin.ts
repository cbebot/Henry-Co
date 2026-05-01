import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

export type AdminClientResolution =
  | { ok: true; client: SupabaseClient }
  | { ok: false; reason: "missing_env" };

function readEnv(name: string): string {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Resolve a service-role Supabase client. Cached at module scope per process.
 *
 * Required env (any of the URL aliases is accepted to match the apps' conventions):
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - SUPABASE_URL  or  NEXT_PUBLIC_SUPABASE_URL
 *
 * Returns a structured failure when env is missing so the caller can return a
 * safe error code rather than throw an unhandled exception.
 */
export function resolveAdminClient(): AdminClientResolution {
  if (cached) return { ok: true, client: cached };

  const url = readEnv("SUPABASE_URL") || readEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = readEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !serviceKey) return { ok: false, reason: "missing_env" };

  cached = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return { ok: true, client: cached };
}

/**
 * Test-only injection point. Lets the adversarial probes swap in a stub client
 * without touching the env vars.
 */
export function _setAdminClientForTests(client: SupabaseClient | null): void {
  cached = client;
}
