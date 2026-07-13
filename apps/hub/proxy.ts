import { NextRequest, NextResponse } from "next/server";
import {
  COMPANY,
  buildSecurityHeaders,
  getIntelligenceConnectSrc,
  isSupabaseAuthTokenCookie,
} from "@henryco/config";
import { writeSessionStateCookie } from "@henryco/auth/server/session-state";

// The Intelligence launcher mounted on every hub page POSTs cross-subdomain to the account
// app's /api/intelligence/* endpoints, so the account origin has to be in connect-src or the
// browser's CSP blocks the fetch before it leaves the page (the panel then reports "couldn't
// reach the service"). Sourced from the same getAccountUrl the launcher fetches so the two
// cannot drift.
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  // wss://*.supabase.co is REQUIRED for the realtime WebSocket. Safari/WebKit
  // (iOS) does NOT allow a wss: connection under an https: source — it blocks
  // the socket, and `new WebSocket()` then throws synchronously ("The operation
  // is insecure"), which crashes SupabaseRealtimeProvider into the error
  // boundary and the whole owner dashboard fails to open. Chrome derives wss:
  // from https: and never hit this, so it was desktop-invisible.
  `connect-src 'self' ${getIntelligenceConnectSrc().join(" ")} https://*.supabase.co wss://*.supabase.co https://api.cloudinary.com`,
  "media-src 'self' blob: https://res.cloudinary.com",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const sharedSecurityHeaders = buildSecurityHeaders();

function applyBaselineSecurityHeaders(res: NextResponse) {
  for (const { key, value } of sharedSecurityHeaders) {
    res.headers.set(key, value);
  }
  res.headers.set("Content-Security-Policy", csp);
  res.headers.set("Cross-Origin-Resource-Policy", "same-origin");
}

function normalizeHost(value?: string | null) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "");
}

function normalizeProto(value?: string | null) {
  const proto = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/:$/, "");
  return proto === "http" || proto === "https" ? proto : "https";
}

function isPublicLegalPath(pathname: string) {
  return pathname === "/privacy" || pathname === "/terms";
}

function appendStaffRoleParam(search: string) {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  params.delete("role");
  params.set("role", "staff");
  return `?${params.toString()}`;
}

/**
 * Hub does not run a full Supabase verify in the proxy (it cross-rewrites
 * /owner and offloads auth to the owner / staff pages). V3-01 adds a
 * passive `hc_session_state` cookie tag based on whether ANY Supabase
 * auth cookies are present in the request, so SSR + the client
 * `subscribeSessionState` helper can still observe the lifecycle.
 *
 * Tag value:
 *   - "signed-in-stale" when auth cookies are present (the next
 *     auth-aware app the user lands on will upgrade this to
 *     "signed-in" via its full verify).
 *   - "signed-out" when no auth cookies are present.
 *
 * Tagging is skipped on cross-host redirects (the destination tags).
 */
function tagSessionFromCookies(req: NextRequest, res: NextResponse): NextResponse {
  const hasAuth = req.cookies.getAll().some((cookie) => isSupabaseAuthTokenCookie(cookie.name));
  writeSessionStateCookie(res, hasAuth ? "signed-in-stale" : "signed-out", {
    hostname: req.nextUrl.hostname,
    secure: req.nextUrl.protocol === "https:",
  });
  return res;
}

export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const host =
    normalizeHost(request.nextUrl.hostname) ||
    normalizeHost(request.headers.get("x-forwarded-host")) ||
    normalizeHost(request.headers.get("host"));
  const proto = normalizeProto(request.nextUrl.protocol || request.headers.get("x-forwarded-proto"));
  requestHeaders.set("x-henry-host", host);
  requestHeaders.set("x-henry-proto", proto);
  requestHeaders.set("x-henry-pathname", request.nextUrl.pathname);
  requestHeaders.set("x-henry-search", request.nextUrl.search);
  requestHeaders.set("x-hub-return-path", `${request.nextUrl.pathname}${request.nextUrl.search}`);

  const isLegacyWorkspaceHost = host.startsWith("workspace.");
  const isStaffHqHost = host.startsWith("staffhq.");
  const isStaffHost = host.startsWith("staff.");
  const isWorkspaceHost = isLegacyWorkspaceHost || isStaffHqHost || isStaffHost;
  const isHqHost = host.startsWith("hq.");
  const baseDomain = COMPANY.group.baseDomain;
  const preferredHqOrigin = `https://hq.${baseDomain}`;
  const accountStaffShellOrigin = `https://account.${baseDomain}`;
  const rewriteUrl = request.nextUrl.clone();
  const redirectUrl = request.nextUrl.clone();

  function withSecurityHeaders(res: NextResponse) {
    applyBaselineSecurityHeaders(res);
    return res;
  }

  if (!isHqHost && request.nextUrl.pathname.startsWith("/owner")) {
    redirectUrl.href = `${preferredHqOrigin}${request.nextUrl.pathname}${request.nextUrl.search}`;
    return NextResponse.redirect(redirectUrl, 307);
  }

  const targetsWorkspace =
    request.nextUrl.pathname.startsWith("/workspace") || isWorkspaceHost;
  if (
    targetsWorkspace &&
    !isPublicLegalPath(request.nextUrl.pathname) &&
    !request.nextUrl.pathname.startsWith("/api/")
  ) {
    const search = appendStaffRoleParam(request.nextUrl.search);
    redirectUrl.href = `${accountStaffShellOrigin}/${search}`;
    return withSecurityHeaders(NextResponse.redirect(redirectUrl, 308));
  }

  if (
    isHqHost &&
    !isPublicLegalPath(rewriteUrl.pathname) &&
    !rewriteUrl.pathname.startsWith("/owner") &&
    !rewriteUrl.pathname.startsWith("/api/")
  ) {
    rewriteUrl.pathname =
      rewriteUrl.pathname === "/" ? "/owner" : `/owner${rewriteUrl.pathname}`;
  }

  const response =
    (isWorkspaceHost || isHqHost) && rewriteUrl.pathname !== request.nextUrl.pathname
      ? NextResponse.rewrite(rewriteUrl, { request: { headers: requestHeaders } })
      : NextResponse.next({ request: { headers: requestHeaders } });

  applyBaselineSecurityHeaders(response);

  if (
    request.nextUrl.pathname.startsWith("/owner") ||
    request.nextUrl.pathname.startsWith("/api/owner")
  ) {
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
  }

  return tagSessionFromCookies(request, response);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|OneSignalSDKWorker.js).*)"],
};
