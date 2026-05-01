import { NextRequest, NextResponse } from "next/server";
import { buildSecurityHeaders } from "@henryco/config";

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

const sharedSecurityHeaders = buildSecurityHeaders();

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
  const proto = normalizeProto(
    request.nextUrl.protocol || request.headers.get("x-forwarded-proto")
  );

  requestHeaders.set("x-henry-host", host);
  requestHeaders.set("x-henry-proto", proto);
  requestHeaders.set("x-henry-pathname", request.nextUrl.pathname);
  requestHeaders.set("x-henry-search", request.nextUrl.search);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  for (const { key, value } of sharedSecurityHeaders) {
    response.headers.set(key, value);
  }
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  response.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"
  );
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
