import { type NextRequest, NextResponse } from "next/server";
import { reauthRedirectFor } from "@henryco/auth/server/refresh-middleware";
import {
  sessionStateFor,
  verifySupabaseSession,
} from "@henryco/auth/server/verify-supabase-session";
import { writeSessionStateCookie } from "@henryco/auth/server/session-state";
import { getHqUrl, getSharedCookieDomain } from "@henryco/config";

/**
 * Account proxy — V3-01 wired (the SSO host).
 *
 * Behaviour matrix:
 *   - `/owner/*`                 → 307 to hq.henrycogroup.com (unchanged)
 *   - Public auth-flow routes    → verify (cookie auto-refresh), tag cookie,
 *                                    capture referral, pass through
 *   - Protected route + reauth   → V3-01 NEW: 307 to /auth/reauth with
 *                                    return / intent / drafts preserved.
 *   - Protected route + anon     → 307 to /login (legacy: first-time visitors
 *                                    have no session to "reauth" from)
 *   - Protected route + ok       → tag cookie, capture referral, security
 *                                    headers, pass through
 *
 * The reauth → /auth/reauth routing is the V3-01 improvement: it
 * preserves the draft key + return path so an in-flight form survives
 * the round-trip.
 */
const PUBLIC_ROUTES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
  "/auth/confirm",
  "/auth/resolve",
  "/auth/verified",
  "/auth/reauth", // V3-01: the reauth surface itself must be reachable signed-out
];

const REFERRAL_COOKIE_NAME = "hc_ref";
const REFERRAL_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function captureReferralCode(request: NextRequest, response: NextResponse): void {
  const ref = request.nextUrl.searchParams.get("ref");
  if (!ref || ref.length > 64) return;
  const cookieDomain = getSharedCookieDomain(request.nextUrl.hostname);
  response.cookies.set(REFERRAL_COOKIE_NAME, ref, {
    path: "/",
    domain: cookieDomain,
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    maxAge: REFERRAL_COOKIE_MAX_AGE,
  });
}

function isPublicRoute(pathname: string): boolean {
  return (
    PUBLIC_ROUTES.some((route) => pathname.startsWith(route)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/cron/") ||
    pathname.startsWith("/api/webhooks/account") ||
    pathname.includes(".")
  );
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith("/owner")) {
    return NextResponse.redirect(`${getHqUrl(pathname)}${search}`, 307);
  }

  const response = NextResponse.next({ request });
  const session = await verifySupabaseSession(request, response);

  if (isPublicRoute(pathname)) {
    // Public auth routes: pass through with verification side effects
    // (cookie refresh + state tag + referral capture). No redirect.
    const state = sessionStateFor(session);
    if (state) writeSessionStateCookie(response, state);
    captureReferralCode(request, response);
    return response;
  }

  // Protected route paths below.
  if (session.status === "reauth") {
    // Cookies were present; refresh failed. V3-01 routes to
    // /auth/reauth with return / intent / drafts preserved.
    return reauthRedirectFor(request, {
      reason: session.reason,
      userId: session.userId,
      carryCookiesFrom: response,
    });
  }

  if (session.status === "anonymous") {
    // No cookies at all — preserve the legacy /login redirect so
    // first-time visitors land on sign-in / sign-up.
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  // ok | no-config — pass through with security headers + referral.
  const state = sessionStateFor(session);
  if (state) writeSessionStateCookie(response, state);
  captureReferralCode(request, response);
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
