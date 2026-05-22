import { NextResponse, type NextRequest } from "next/server";
import {
  sessionStateFor,
  verifySupabaseSession,
} from "@henryco/auth/server/verify-supabase-session";
import { writeSessionStateCookie } from "@henryco/auth/server/session-state";

/**
 * Logistics proxy — V3-01 wired.
 *
 * Passive auth: verifies / refreshes the Supabase session and tags the
 * `hc_session_state` cookie. Page-level guards handle auth gating.
 */
export async function proxy(request: NextRequest) {
  const reqHeaders = new Headers(request.headers);
  reqHeaders.set(
    "x-logistics-return-path",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );
  // x-pathname: read by the (staff) operator workspace layout so it can
  // light up the correct sidebar nav item. Next.js does not expose
  // pathname in async server-component scope; the proxy is the only
  // place we can stamp this header before the page renders.
  reqHeaders.set("x-pathname", request.nextUrl.pathname);

  const response = NextResponse.next({
    request: { headers: reqHeaders },
  });

  const session = await verifySupabaseSession(request, response);
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
