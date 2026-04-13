import { getSharedCookieDomain } from "./company";

export type SupabaseCookieTuple = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

export type NextCookieStore = {
  getAll: () => Array<{ name: string; value: string }>;
  set: (name: string, value: string, options?: Record<string, unknown>) => void;
};

export type SupabaseCookieHandlers = {
  getAll: () => Array<{ name: string; value: string }>;
  setAll: (cookies: SupabaseCookieTuple[]) => void;
};

/**
 * Build cookie handlers for `@supabase/ssr` server clients that *force* the
 * resolved shared cookie domain onto every cookie written.
 *
 * This exists because the `cookieOptions` passed to `createServerClient`
 * are applied inconsistently by `@supabase/ssr` across different cookie
 * writes (refresh vs. sign-in vs. recovery). Forcing the domain on the
 * `cookieStore.set` call guarantees every session cookie gets the shared
 * `.henrycogroup.com` scope so any henrycogroup.com subdomain can read
 * the session.
 */
export function buildSharedCookieHandlers(
  cookieStore: NextCookieStore,
  cookieDomain: string | undefined,
): SupabaseCookieHandlers {
  return {
    getAll() {
      return cookieStore.getAll();
    },
    setAll(cookiesToSet) {
      try {
        for (const { name, value, options } of cookiesToSet) {
          const merged = cookieDomain
            ? { ...(options || {}), domain: cookieDomain, path: "/" }
            : options;
          cookieStore.set(name, value, merged);
        }
      } catch {
        // Read-only cookie contexts (Server Components) — safe to ignore.
      }
    },
  };
}

/**
 * Resolve the cookie domain to apply for a given request. Reads both the
 * `x-forwarded-host` header (Vercel proxy) and `host` header so the
 * detection works in production, preview deployments, and local dev.
 */
export function resolveRequestCookieDomain(
  headerGet: (name: string) => string | null | undefined,
): string | undefined {
  const host = headerGet("x-forwarded-host") || headerGet("host") || null;
  return getSharedCookieDomain(host);
}

/**
 * Build the `cookieOptions` object for `createServerClient`/`createBrowserClient`
 * based on a resolved cookie domain. Returns `undefined` when no shared
 * domain applies (localhost, IPs, unknown hosts), so Supabase falls back
 * to per-host cookies safely.
 */
export function buildSupabaseCookieOptions(
  cookieDomain: string | undefined,
): Record<string, unknown> | undefined {
  if (!cookieDomain) return undefined;
  return {
    domain: cookieDomain,
    path: "/",
    sameSite: "lax" as const,
    secure: true,
  };
}
