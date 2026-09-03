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
 * Resolve a service-role Supabase client (cached per process). Mirrors
 * @henryco/notifications so the push channel reads/writes the same way the
 * in-app channel does. Returns a structured failure on missing env rather than
 * throwing, so a push never crashes the calling request.
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

/** Test-only injection seam. */
export function _setAdminClientForTests(client: SupabaseClient | null): void {
  cached = client;
}
