import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Lightweight middleware: injects the request pathname as the
 * `x-pathname` header so server components (notably the /client portal
 * layout) can branch on the route — needed because Next.js doesn't
 * expose `pathname` in async server-component scope.
 *
 * If you ever add real edge logic here (auth, redirects, geo), keep
 * this header passthrough.
 */
export function middleware(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set("x-pathname", request.nextUrl.pathname);
  return NextResponse.next({
    request: { headers },
  });
}

export const config = {
  // Skip Next.js internals and most static asset paths so middleware
  // doesn't add latency to every image/font/icon request. The /client
  // portal pages — the only consumer of x-pathname today — are still
  // covered by the catch-all.
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|manifest\\.json|icon\\.svg|opengraph-image|twitter-image|__nextjs_original-stack-frame).*)",
  ],
};
