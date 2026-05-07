import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Admin Supabase client factory for `@henryco/auth` internals.
 *
 * Mirrors the pattern at `apps/account/lib/supabase.ts:17-24` (plus the
 * matching factories in apps/{hub,staff}/lib/supabase.ts) — same env
 * vars, same auth options, same shape. Centralising here means
 * `@henryco/auth` is self-sufficient: any consumer app with the standard
 * Supabase env present can call `requireUnifiedViewer()` without
 * threading a client argument through every server component.
 *
 * The client is intentionally NOT cached at module scope — each call
 * returns a fresh instance — because Next.js server actions / route
 * handlers run in worker contexts where module-singleton state can leak
 * between requests. Cost is negligible (the factory is ~microseconds);
 * safety is meaningful.
 */
export function createAdminSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!url || !serviceKey) {
    throw new Error(
      "@henryco/auth: SUPABASE admin environment variables are missing " +
        "(NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY required).",
    );
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
