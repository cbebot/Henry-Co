import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * @henryco/data/client — typed Supabase server client factory.
 *
 * Returns a Supabase client typed against the workspace `Database`
 * shape so all packages/data queries are row-type-safe at compile
 * time. Mirrors the env-var pattern from
 * `apps/account/lib/supabase.ts:17-24`.
 *
 * The client is NOT cached at module scope — see the rationale in
 * `packages/auth/src/_internal/admin-supabase.ts`. Each call returns
 * a fresh instance.
 */
export type TypedSupabaseClient = SupabaseClient<Database>;

export function createDataAdminClient(): TypedSupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!url || !serviceKey) {
    throw new Error(
      "@henryco/data: SUPABASE admin environment variables are missing " +
        "(NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY required).",
    );
  }

  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
