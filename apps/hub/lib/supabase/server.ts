import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import {
  buildSharedCookieHandlers,
  buildSupabaseCookieOptions,
  resolveRequestCookieDomain,
} from "@henryco/config";

/**
 * Hard per-request timeout for hub server-side Supabase fetches. Without it, a
 * Supabase request that connects but never responds (or fails in a way that makes
 * supabase-js retry) hangs the SSR render until the Vercel function times out —
 * blanking the public pages (observed: GET / → AuthRetryableFetchError → Vercel
 * Runtime Timeout). Aborting after a few seconds turns a hang into a fast failure
 * the callers' existing `.catch` / `Promise.allSettled` fallbacks already handle, so
 * the page renders (degraded) instead of never loading. Never fires when Supabase is
 * healthy (responses are sub-second).
 */
const SUPABASE_FETCH_TIMEOUT_MS = 4000;

function timeoutFetch(timeoutMs: number): typeof fetch {
  return (input, init) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
  };
}

export async function createHubSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  const cookieStore = await cookies();
  const headerStore = await headers();
  const cookieDomain = resolveRequestCookieDomain((name) => headerStore.get(name));

  return createServerClient(url, anon, {
    cookieOptions: buildSupabaseCookieOptions(cookieDomain),
    cookies: buildSharedCookieHandlers(cookieStore, cookieDomain),
    global: { fetch: timeoutFetch(SUPABASE_FETCH_TIMEOUT_MS) },
  });
}
