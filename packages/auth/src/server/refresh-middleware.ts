import "server-only";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { COMPANY } from "@henryco/config";
import { emitEvent } from "@henryco/observability/events";

import type { SessionState } from "../types";
import { writeSessionStateCookie } from "./session-state";

const REAUTH_PATH = "/auth/reauth";
const REAUTH_HEADER_VALUE = "ReauthRequired";

export type SessionResolution =
  | { status: "ok"; userId?: string }
  | { status: "refreshed"; userId?: string }
  | { status: "reauth"; userId?: string; reason?: string }
  | { status: "anonymous" };

export type RefreshMiddlewareOptions = {
  /**
   * Host-app callback: read the current Supabase session from the
   * request, verify it, attempt refresh if needed, and return the
   * outcome.
   *
   * Each app owns this because each app owns its Supabase client
   * instantiation pattern (cookie names, server client builders, etc).
   */
  resolve: (req: NextRequest) => Promise<SessionResolution> | SessionResolution;
  /**
   * Where to redirect users on reauth-required. Defaults to
   * `/auth/reauth` for loopback hosts, otherwise
   * `https://account.<baseDomain>/auth/reauth` in production and
   * `/auth/reauth` outside production.
   */
  reauthBaseUrl?: string;
};

function isLoopbackHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized === "::1" ||
    normalized.endsWith(".localhost")
  );
}

function defaultReauthBase(req: NextRequest): string {
  if (isLoopbackHostname(req.nextUrl.hostname)) {
    return REAUTH_PATH;
  }

  if (process.env.NODE_ENV === "production") {
    return `https://account.${COMPANY.group.baseDomain}${REAUTH_PATH}`;
  }
  return REAUTH_PATH;
}

function inferIntent(req: NextRequest): "form" | "page" {
  const method = req.method.toUpperCase();
  return method === "POST" || method === "PUT" || method === "PATCH" ? "form" : "page";
}

function buildReauthRedirect(req: NextRequest, base: string): URL {
  const reauth = new URL(base, req.nextUrl);
  // Carry the current path + query so the reauth screen can land the
  // user back exactly where they were after re-authenticating.
  const returnPath = `${req.nextUrl.pathname}${req.nextUrl.search}`;
  reauth.searchParams.set("return", returnPath);
  reauth.searchParams.set("intent", inferIntent(req));
  const draftKey = req.nextUrl.searchParams.get("drafts");
  if (draftKey) reauth.searchParams.set("drafts", draftKey);
  return reauth;
}

function tagSessionState(req: NextRequest, res: NextResponse, state: SessionState): void {
  writeSessionStateCookie(res, state, {
    hostname: req.nextUrl.hostname,
    secure: req.nextUrl.protocol === "https:",
  });
}

export type ReauthRedirectOptions = {
  /** Diagnostic reason carried into the `session.refresh_failed` event payload. */
  reason?: string;
  /** Actor id for the event, when known. */
  userId?: string;
  /** Override the default reauth base URL (e.g., cross-domain account host). */
  reauthBaseUrl?: string;
  /**
   * Forward Set-Cookie writes from an inner response onto the redirect.
   * Useful when the caller already wrote cookies (e.g., malformed-cookie
   * cleanup) on its working response and is about to discard it in
   * favour of a redirect — without this, those Set-Cookie headers
   * would never reach the browser.
   */
  carryCookiesFrom?: NextResponse;
};

/**
 * Build the canonical V3-01 reauth redirect response — the 307 to
 * `/auth/reauth?return=…&intent=form|page&drafts=…` with the
 * `WWW-Authenticate: ReauthRequired` + `X-HenryCo-Session-State: reauth`
 * headers, plus the `hc_session_state=reauth-required` cookie.
 *
 * Exposed as a standalone helper so per-app `proxy.ts` files that do
 * NOT use `withSessionRefresh` (because they already share a single
 * response object with the Supabase ssr client) can still produce the
 * same redirect with one call.
 *
 * Emits `henry.auth.session.refresh_failed` exactly once per call.
 *
 * @example
 *   // inside apps/<app>/proxy.ts
 *   const session = await verifySupabaseSession(request, response);
 *   if (session.status === "reauth" && isGatedRequest) {
 *     return reauthRedirectFor(request, {
 *       reason: session.reason,
 *       userId: session.userId,
 *     });
 *   }
 */
export function reauthRedirectFor(
  req: NextRequest,
  options: ReauthRedirectOptions = {},
): NextResponse {
  emitEvent({
    name: "henry.auth.session.refresh_failed",
    classification: "system_state",
    outcome: "failed",
    actorId: options.userId,
    payload: { reason: options.reason ?? "unknown" },
  });

  const base = options.reauthBaseUrl ?? defaultReauthBase(req);
  const reauthUrl = buildReauthRedirect(req, base);

  const res = NextResponse.redirect(reauthUrl, 307);
  res.headers.set("WWW-Authenticate", REAUTH_HEADER_VALUE);
  res.headers.set("X-Henry Onyx-Session-State", "reauth");

  if (options.carryCookiesFrom) {
    for (const cookie of options.carryCookiesFrom.cookies.getAll()) {
      res.cookies.set(cookie);
    }
  }

  tagSessionState(req, res, "reauth-required");

  return res;
}

/**
 * Wrap a Next.js middleware so token-refresh + reauth routing become
 * a single, ecosystem-wide behaviour across the 10 web apps.
 *
 * Behaviour:
 *   - `resolve` returns "ok"         → call through, tag cookie `signed-in`.
 *   - `resolve` returns "refreshed"  → emit `session.refreshed`, call through,
 *                                       tag cookie `signed-in`.
 *   - `resolve` returns "anonymous"  → call through, tag cookie `signed-out`
 *                                       (the inner middleware / page decides
 *                                       whether anonymous access is allowed).
 *   - `resolve` returns "reauth"     → emit `session.refresh_failed`, 307-redirect
 *                                       to `/auth/reauth` with `return`, `intent`
 *                                       and `drafts` preserved. Adds the headers
 *                                       `WWW-Authenticate: ReauthRequired` and
 *                                       `X-HenryCo-Session-State: reauth` so
 *                                       fetch / server-action callers (which
 *                                       never see redirects) can detect the
 *                                       state from the response alone.
 *
 * Usage in `apps/<app>/middleware.ts`:
 *
 *   import { withSessionRefresh } from "@henryco/auth/server/refresh-middleware";
 *
 *   const existing = async (req: NextRequest) => {
 *      // ...existing per-app middleware logic...
 *   };
 *
 *   export const middleware = withSessionRefresh(existing, {
 *     resolve: async (req) => verifySupabaseSession(req),
 *   });
 *
 *   export const config = { matcher: [...] };
 */
export function withSessionRefresh<Args extends unknown[]>(
  next: (
    req: NextRequest,
    ...rest: Args
  ) => Promise<NextResponse | undefined> | NextResponse | undefined,
  options: RefreshMiddlewareOptions,
) {
  return async (req: NextRequest, ...rest: Args): Promise<NextResponse> => {
    const resolution = await options.resolve(req);

    if (resolution.status === "reauth") {
      return reauthRedirectFor(req, {
        reason: resolution.reason,
        userId: resolution.userId,
        reauthBaseUrl: options.reauthBaseUrl,
      });
    }

    if (resolution.status === "refreshed") {
      emitEvent({
        name: "henry.auth.session.refreshed",
        classification: "system_state",
        outcome: "completed",
        actorId: resolution.userId,
      });
    }

    const downstream = (await next(req, ...rest)) ?? NextResponse.next();
    const state: SessionState =
      resolution.status === "anonymous" ? "signed-out" : "signed-in";
    tagSessionState(req, downstream, state);
    return downstream;
  };
}
