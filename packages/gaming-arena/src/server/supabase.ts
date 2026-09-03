import "server-only";

/**
 * Service-role Supabase access for the gaming spine. Mirrors
 * packages/notifications/supabase-admin.ts: module-cached, structured failure
 * (no throw), URL aliases. The host app owns the env; this package consumes it.
 *
 * The privileged client is used ONLY to call the grant-locked SECURITY DEFINER
 * gaming RPCs (the authoritative writers) and to read match state. The CLIENT
 * never reaches these RPCs — they are revoked from anon/authenticated — so the
 * actor for every write is resolved by the authenticated apps/account server
 * action from the session, never from a client-supplied id.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * The minimal surface the gaming server half exercises (rpc only). The return is
 * PromiseLike (not Promise) so a real @supabase/supabase-js client — whose
 * `.rpc()` returns a thenable PostgrestFilterBuilder — is structurally assignable
 * to GamingDbClient at the call sites (apps/account routes), and so is the
 * in-memory test fake. `data`/`error` are intentionally wide.
 */
export type GamingRpcResult<T = unknown> = { data: T; error: { message: string } | null };
export type GamingDbClient = {
  rpc: (name: string, params?: Record<string, unknown>) => PromiseLike<GamingRpcResult>;
};

export type AdminClientResolution =
  | { ok: true; client: SupabaseClient }
  | { ok: false; reason: "missing_env" };

let cached: SupabaseClient | null = null;

function readEnv(name: string): string {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : "";
}

export function resolveGamingAdminClient(): AdminClientResolution {
  if (cached) return { ok: true, client: cached };
  const url = readEnv("SUPABASE_URL") || readEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = readEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) return { ok: false, reason: "missing_env" };
  cached = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return { ok: true, client: cached };
}

/** Throw a contextual error from a failed RPC (no bare/silent handling). */
export function unwrapRpc<T>(result: GamingRpcResult<T>, context: string): T {
  if (result.error) {
    throw new Error(`gaming/${context}: ${result.error.message}`);
  }
  return result.data;
}
