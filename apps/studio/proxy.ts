import { NextResponse, type NextRequest } from "next/server";
import { reauthRedirectFor } from "@henryco/auth/server/refresh-middleware";
import {
  sessionStateFor,
  verifySupabaseSession,
} from "@henryco/auth/server/verify-supabase-session";
import { writeSessionStateCookie } from "@henryco/auth/server/session-state";
import { getAccountUrl, getDivisionUrl } from "@henryco/config";

/**
 * Studio proxy — V3-01 wired (cross-domain auth host: studio redirects
 * to account for login + reauth).
 *
 * Why middleware-level gating (not page-level)? The page-level guards
 * live inside server components wrapped in Suspense by `loading.tsx`.
 * Once Next has begun streaming the loading shell, throwing `redirect()`
 * from the inner page is too late — Next serialises the redirect digest
 * into the RSC payload but the wire response stays HTTP 200, so the
 * browser sits on the skeleton forever. Gating in the proxy sidesteps
 * that by returning a real 307 before any bytes are written. Page-level
 * guards are kept as defence-in-depth.
 *
 * V3-01 change: when cookies are PRESENT but refresh failed (status
 * = "reauth"), we now route to /auth/reauth on the account host
 * instead of /login. This preserves the form's draft context for
 * users mid-task. Genuinely-anonymous users (no cookies) continue to
 * land on /login as before.
 */
const AUTH_GATED_PREFIXES = [
  "/client",
  "/sales",
  "/pm",
  "/finance",
  "/delivery",
  "/owner",
  "/support",
] as const;

function isAuthGatedPath(pathname: string): boolean {
  return AUTH_GATED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function buildLoginRedirect(request: NextRequest): URL {
  const returnTo = `${getDivisionUrl("studio")}${request.nextUrl.pathname}${request.nextUrl.search}`;
  const loginPath = `/login?next=${encodeURIComponent(returnTo)}`;
  return new URL(getAccountUrl(loginPath));
}

export async function proxy(request: NextRequest) {
  const reqHeaders = new Headers(request.headers);
  reqHeaders.set(
    "x-studio-return-path",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );
  // x-pathname: read by the /client portal layout to decide whether to
  // render the chrome shell or hand off to a full-bleed takeover (e.g.
  // /client/messages). Next.js does not expose pathname in async
  // server-component scope; the proxy is the only place we can stamp
  // this header before the page renders.
  reqHeaders.set("x-pathname", request.nextUrl.pathname);

  const isGatedRequest = isAuthGatedPath(request.nextUrl.pathname);

  const response = NextResponse.next({
    request: { headers: reqHeaders },
  });

  const session = await verifySupabaseSession(request, response);

  if (session.status === "reauth" && isGatedRequest) {
    // Session decayed mid-flight. Route to account host's /auth/reauth
    // so the user re-authenticates and lands back exactly where they
    // were (with their draft restored).
    return reauthRedirectFor(request, {
      reason: session.reason,
      userId: session.userId,
      reauthBaseUrl: getAccountUrl("/auth/reauth"),
      carryCookiesFrom: response,
    });
  }

  if (session.status === "anonymous" && isGatedRequest) {
    // First-time / signed-out user trying to reach a gated path —
    // legacy /login redirect.
    return NextResponse.redirect(buildLoginRedirect(request), 307);
  }

  if (session.status === "no-config" && isGatedRequest) {
    // Env vars missing — fall back to the legacy login redirect so a
    // misconfigured deploy doesn't strand the user on a 500.
    return NextResponse.redirect(buildLoginRedirect(request), 307);
  }

  const state = sessionStateFor(session);
  if (state) {
    writeSessionStateCookie(response, state);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
