/**
 * The account proxy's public-route predicate — extracted as a pure, dependency-free
 * function so it can be unit-tested (proxy.ts itself pulls in next/server + the auth
 * middleware, which don't import cleanly under the node test runner).
 *
 * "Public" means the auth proxy passes the request through WITHOUT a /login redirect.
 * A route belongs here when it self-authenticates (the handler is the auth authority)
 * or serves anonymous, sessionless traffic by design. The proxy still runs its cookie
 * refresh + referral side effects for these paths.
 */
export function isPublicAccountRoute(pathname: string): boolean {
  return (
    PUBLIC_ROUTE_PREFIXES.some((route) => pathname.startsWith(route)) ||
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
    // Henry Onyx Intelligence endpoints (chat / quote / run / health). These are the
    // cross-subdomain API the shared launcher POSTs to from every division. The FREE
    // support chat is designed for ANONYMOUS visitors (it derives identity from the
    // cookie itself and falls back to a synthetic actor), so a /login 307 here silently
    // kills it — the whole "free help for anyone" surface. The route handlers are the
    // auth authority: the paid /quote + /run fail closed with 401 when there is no
    // signed-in person, so opening the prefix never exposes a wallet charge. Without
    // this, an anonymous turn is 307'd to /login?next=/api/intelligence/chat and never
    // runs (the launcher only ever sees a redirect). Mirrors /api/push/subscribe.
    pathname.startsWith("/api/intelligence/") ||
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

/** Auth-flow routes that must be reachable signed-out. */
const PUBLIC_ROUTE_PREFIXES = [
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
