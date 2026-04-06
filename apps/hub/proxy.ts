import { NextRequest, NextResponse } from "next/server";
import { COMPANY } from "@henryco/config";

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "connect-src 'self' https://*.supabase.co https://api.cloudinary.com",
  "media-src 'self' blob: https://res.cloudinary.com",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

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
  const isWorkspaceHost = isLegacyWorkspaceHost || isStaffHqHost;
  const isHqHost = host.startsWith("hq.");
  const baseDomain = COMPANY.group.baseDomain;
  const preferredHqOrigin = `https://hq.${baseDomain}`;
  const preferredStaffHqOrigin = `https://staffhq.${baseDomain}`;
  const rewriteUrl = request.nextUrl.clone();
  const redirectUrl = request.nextUrl.clone();

  function withSecurityHeaders(res: NextResponse) {
    res.headers.set("Content-Security-Policy", csp);
    res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    res.headers.set("X-Frame-Options", "DENY");
    res.headers.set("X-Content-Type-Options", "nosniff");
    res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    res.headers.set("Cross-Origin-Opener-Policy", "same-origin");
    res.headers.set("Cross-Origin-Resource-Policy", "same-origin");
    return res;
  }

  if (!isHqHost && request.nextUrl.pathname.startsWith("/owner")) {
    redirectUrl.href = `${preferredHqOrigin}${request.nextUrl.pathname}${request.nextUrl.search}`;
    return NextResponse.redirect(redirectUrl, 307);
  }

  if (!isWorkspaceHost && request.nextUrl.pathname.startsWith("/workspace")) {
    const p = request.nextUrl.pathname;
    const staffPath =
      p === "/workspace" || p === "/workspace/"
        ? "/"
        : p.startsWith("/workspace/")
          ? p.slice("/workspace".length)
          : p;
    redirectUrl.href = `${preferredStaffHqOrigin}${staffPath === "" ? "/" : staffPath}${request.nextUrl.search}`;
    return withSecurityHeaders(NextResponse.redirect(redirectUrl, 307));
  }

  if (isLegacyWorkspaceHost) {
    redirectUrl.href = `${preferredStaffHqOrigin}${request.nextUrl.pathname}${request.nextUrl.search}`;
    return withSecurityHeaders(NextResponse.redirect(redirectUrl, 307));
  }

  if (
    isStaffHqHost &&
    !rewriteUrl.pathname.startsWith("/workspace") &&
    !rewriteUrl.pathname.startsWith("/api/")
  ) {
    rewriteUrl.pathname =
      rewriteUrl.pathname === "/" ? "/workspace" : `/workspace${rewriteUrl.pathname}`;
  }

  if (
    isHqHost &&
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

  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");

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

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
