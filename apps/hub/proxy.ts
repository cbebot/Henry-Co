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
  requestHeaders.set("x-hub-return-path", `${request.nextUrl.pathname}${request.nextUrl.search}`);

  const isWorkspaceHost = host.startsWith("workspace.");
  const isHqHost = host.startsWith("hq.");
  const preferredHqOrigin = `https://hq.${COMPANY.group.baseDomain}`;
  const preferredWorkspaceOrigin = `https://workspace.${COMPANY.group.baseDomain}`;
  const rewriteUrl = request.nextUrl.clone();
  const redirectUrl = request.nextUrl.clone();

  if (!isHqHost && request.nextUrl.pathname.startsWith("/owner")) {
    redirectUrl.href = `${preferredHqOrigin}${request.nextUrl.pathname}${request.nextUrl.search}`;
    return NextResponse.redirect(redirectUrl, 307);
  }

  if (!isWorkspaceHost && request.nextUrl.pathname.startsWith("/workspace")) {
    redirectUrl.href = `${preferredWorkspaceOrigin}${request.nextUrl.pathname}${request.nextUrl.search}`;
    return NextResponse.redirect(redirectUrl, 307);
  }

  if (isWorkspaceHost && !rewriteUrl.pathname.startsWith("/workspace")) {
    rewriteUrl.pathname =
      rewriteUrl.pathname === "/" ? "/workspace" : `/workspace${rewriteUrl.pathname}`;
  }

  if (
    isHqHost &&
    !rewriteUrl.pathname.startsWith("/owner") &&
    !rewriteUrl.pathname.startsWith("/api/owner")
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
