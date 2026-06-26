import { type NextRequest, NextResponse } from "next/server";
import { reauthRedirectFor } from "@henryco/auth/server/refresh-middleware";
import {
  sessionStateFor,
  verifySupabaseSession,
} from "@henryco/auth/server/verify-supabase-session";
import {
  HC_SESSION_STATE_COOKIE,
  writeSessionStateCookie,
} from "@henryco/auth/server/session-state";
import { HC_REAUTH_CONTEXT_COOKIE } from "@henryco/auth/server/reauth-context";
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

// V3-04 (S5): share-arrival attribution. A share URL carries
// `?ref=share&from=<one-way-hash>`. We mirror the existing `hc_ref`
// 30-day cookie pattern and stash the opaque `from=` fingerprint so an
// eventual conversion can be correlated to the sharer. The hash is NOT a
// credential — it grants nothing; it is matched against a known sharer
// hash (`verifySharerHash`) only when attribution is actually applied.
const SHARE_COOKIE_NAME = "hc_share_from";
const SHARE_HASH_SHAPE = /^s1\.[A-Za-z0-9_-]{16,64}$/;

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

  // Share arrivals (`ref=share`) additionally carry an opaque `from=`
  // sharer fingerprint — capture it for later attribution correlation.
  if (ref !== "share") return;
  const from = request.nextUrl.searchParams.get("from");
  if (!from || !SHARE_HASH_SHAPE.test(from)) return;
  response.cookies.set(SHARE_COOKIE_NAME, from, {
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
    // V3-15-FIX-01: provider payment webhooks (e.g. /api/payments/webhooks/paystack)
    // are server-to-server, HMAC-signature-authenticated, and carry NO session.
    // The auth proxy must NOT 307 them to /login (Paystack does not follow
    // redirects → every webhook would be lost). Mirrors /api/webhooks/account.
    pathname.startsWith("/api/payments/webhooks/") ||
    // Push registration self-authenticates (session cookie OR a native
    // `Bearer` access token), so the proxy must not 307 it to /login — the
    // native app carries no session cookie and the route handler is the auth
    // authority (returns 401 when neither credential is valid).
    pathname.startsWith("/api/push/subscribe") ||
    pathname === "/api/health" ||
    // V3-04 (S2): Universal-Link / App-Link manifests MUST be reachable
    // unauthenticated with no redirect (per Apple/Google spec). The AASA
    // file has no extension, so the `includes(".")` guard below misses it.
    pathname.startsWith("/.well-known/") ||
    // OG-SOCIAL-METADATA — Next file-convention metadata routes (the Open Graph
    // and Twitter card images) must be fetchable by anonymous link-preview
    // crawlers (Facebook / X / LinkedIn / WhatsApp). They have no file
    // extension, so the `includes(".")` guard below misses them, and they would
    // otherwise be 307'd to /login — leaving a shared account link with a
    // broken (login-page) preview image. They carry no session and serve only a
    // public 1200x630 brand card, so the auth proxy must let them through.
    pathname === "/opengraph-image" ||
    pathname === "/twitter-image" ||
    pathname.startsWith("/opengraph-image/") ||
    pathname.startsWith("/twitter-image/") ||
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
    const hasActiveReauthContext = Boolean(
      request.cookies.get(HC_REAUTH_CONTEXT_COOKIE),
    );
    const shouldPreserveReauthState =
      session.status === "anonymous" &&
      (hasActiveReauthContext ||
        (pathname.startsWith("/auth/reauth") &&
          request.cookies.get(HC_SESSION_STATE_COOKIE)?.value ===
            "reauth-required"));

    if (state && !shouldPreserveReauthState) {
      writeSessionStateCookie(response, state, {
        hostname: request.nextUrl.hostname,
        secure: request.nextUrl.protocol === "https:",
      });
    }
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
  if (state) {
    writeSessionStateCookie(response, state, {
      hostname: request.nextUrl.hostname,
      secure: request.nextUrl.protocol === "https:",
    });
  }
  captureReferralCode(request, response);
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
