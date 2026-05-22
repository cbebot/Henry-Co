import "server-only";

import type { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  buildSharedCookieWriteOptions,
  filterValidSupabaseSessionCookies,
  findMalformedSupabaseSessionCookieNames,
  getSharedCookieDomain,
  isRecoverableSupabaseAuthError,
  isSupabaseAuthTokenCookie,
} from "@henryco/config";
import { emitEvent } from "@henryco/observability/events";

import type { SessionState } from "../types";

/**
 * Verify the Supabase session attached to a Next.js proxy request and
 * (when possible) refresh the access token in-flight.
 *
 * Centralises the pattern that previously lived inline in 8 proxy.ts
 * files (account / marketplace / jobs / learn / logistics / property /
 * studio / care). The helper:
 *
 *   1. Clears MALFORMED Supabase cookies from req + res (defensive — a
 *      truncated cookie corrupts every subsequent supabase.auth call
 *      until cleared).
 *   2. Short-circuits "no session cookies present" → status `anonymous`
 *      without hitting Supabase.
 *   3. Builds an @supabase/ssr server client wired to the SHARED
 *      response cookie jar so any access-token refresh flows back to
 *      the client transparently.
 *   4. Calls `supabase.auth.getUser()` to (a) verify the access token
 *      and (b) auto-refresh via the refresh token if needed.
 *   5. Returns a structured `SupabaseSessionResolution` the caller
 *      maps to behaviour (passthrough vs reauth-redirect vs anonymous-
 *      redirect).
 *
 * Emit hook: when a refresh DID happen (detected via setAll being
 * called), this fires `henry.auth.session.refreshed`. That keeps the
 * emit responsibility inside the helper so per-app proxies don't have
 * to depend on @henryco/observability directly.
 */
export type SupabaseSessionResolution =
  | { status: "ok"; userId: string; refreshed: boolean }
  | { status: "anonymous" }
  | { status: "reauth"; reason: string; userId?: string }
  | { status: "no-config" };

export type VerifySupabaseSessionOptions = {
  /**
   * Clear malformed Supabase cookies from req + res before verifying
   * (default: true). Set false when the caller wants to handle
   * malformed-cookie semantics itself (e.g., redirect-with-cleanup).
   */
  clearMalformed?: boolean;
};

/**
 * Test-only injection seam. Allows unit tests to replace the
 * `@supabase/ssr` `createServerClient` import with a stub. Reset by
 * passing `null`.
 */
type CreateClientFn = typeof createServerClient;
let createClientForTests: CreateClientFn | null = null;
export function __setSupabaseClientFactoryForTests(factory: CreateClientFn | null): void {
  createClientForTests = factory;
}

function getCreateClient(): CreateClientFn {
  return createClientForTests ?? createServerClient;
}

export async function verifySupabaseSession(
  req: NextRequest,
  res: NextResponse,
  opts: VerifySupabaseSessionOptions = {},
): Promise<SupabaseSessionResolution> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnon) {
    return { status: "no-config" };
  }

  const allCookies = req.cookies.getAll();
  const malformedNames = new Set(findMalformedSupabaseSessionCookieNames(allCookies));
  const clearMalformed = opts.clearMalformed ?? true;
  if (malformedNames.size > 0 && clearMalformed) {
    clearAuthCookies(req, res, malformedNames);
  }

  // Cookies present but malformed-only? Treat as `reauth` — the user
  // had a session, the cookies got corrupted, the reauth screen is the
  // right surface to land on.
  const validSessionCookies = filterValidSupabaseSessionCookies(req.cookies.getAll());
  const hasAuthCookie = validSessionCookies.some((c) => isSupabaseAuthTokenCookie(c.name));
  if (!hasAuthCookie) {
    if (malformedNames.size > 0 && clearMalformed) {
      return { status: "reauth", reason: "malformed_session_cookies" };
    }
    return { status: "anonymous" };
  }

  const cookieDomain = getSharedCookieDomain(req.nextUrl.hostname);
  let didRefresh = false;
  const createClient = getCreateClient();
  const supabase = createClient(supabaseUrl, supabaseAnon, {
    cookieOptions: cookieDomain
      ? { domain: cookieDomain, path: "/", sameSite: "lax", secure: true }
      : undefined,
    cookies: {
      getAll() {
        return filterValidSupabaseSessionCookies(req.cookies.getAll());
      },
      setAll(cookiesToSet) {
        didRefresh = true; // setAll fires only when @supabase/ssr refreshed the session
        for (const { name, value, options } of cookiesToSet) {
          req.cookies.set(name, value);
          res.cookies.set(name, value, buildSharedCookieWriteOptions(options, cookieDomain));
        }
      },
    },
  });

  let userId: string | null = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      // Recoverable auth errors mean "your session decayed" — clear
      // the cookies and route to reauth. Non-recoverable errors
      // (e.g., network / transport) bubble so the host's outer
      // error handler can surface them properly.
      if (!isRecoverableSupabaseAuthError(error)) {
        throw error;
      }
      clearAuthCookies(req, res);
      return { status: "reauth", reason: "supabase_auth_error" };
    }
    userId = data.user?.id ?? null;
  } catch (error) {
    if (!isRecoverableSupabaseAuthError(error)) {
      throw error;
    }
    clearAuthCookies(req, res);
    return { status: "reauth", reason: "supabase_auth_exception" };
  }

  if (!userId) {
    // Cookies present but @supabase/ssr could not produce a user —
    // refresh failed silently. The session has gone stale on the
    // server side.
    clearAuthCookies(req, res);
    return { status: "reauth", reason: "user_absent_after_verify" };
  }

  if (didRefresh) {
    emitEvent({
      name: "henry.auth.session.refreshed",
      classification: "system_state",
      outcome: "completed",
      actorId: userId,
    });
  }

  return { status: "ok", userId, refreshed: didRefresh };
}

/**
 * Clear the named Supabase auth cookies from both req + res. Defaults
 * to clearing ALL recognised supabase auth cookies; pass `names` to
 * limit to a subset (used when only specific cookies are malformed).
 *
 * Exposed so per-app proxies that want to clear cookies on a
 * REDIRECT response (rather than the inner res) can do so with the
 * same code path.
 */
export function clearSupabaseAuthCookies(
  req: NextRequest,
  res: NextResponse,
  names?: Set<string>,
): void {
  clearAuthCookies(req, res, names);
}

function clearAuthCookies(
  req: NextRequest,
  res: NextResponse,
  names?: Set<string>,
): void {
  const cookieDomain = getSharedCookieDomain(req.nextUrl.hostname);
  for (const cookie of req.cookies.getAll()) {
    if (!isSupabaseAuthTokenCookie(cookie.name)) continue;
    if (names && !names.has(cookie.name)) continue;
    req.cookies.set(cookie.name, "");
    res.cookies.set(cookie.name, "", {
      domain: cookieDomain,
      expires: new Date(0),
      path: "/",
      sameSite: "lax",
      secure: true,
    });
  }
}

/**
 * Map a `SupabaseSessionResolution` to the corresponding
 * `hc_session_state` cookie value. `no-config` returns null — the
 * caller should not tag the cookie at all (preserves existing
 * graceful-degradation behaviour for environments without Supabase).
 */
export function sessionStateFor(
  resolution: SupabaseSessionResolution,
): SessionState | null {
  switch (resolution.status) {
    case "ok":
      return "signed-in";
    case "anonymous":
      return "signed-out";
    case "reauth":
      return "reauth-required";
    case "no-config":
      return null;
  }
}
