import { NextResponse, type NextRequest } from "next/server";
import {
  sessionStateFor,
  verifySupabaseSession,
} from "@henryco/auth/server/verify-supabase-session";
import { writeSessionStateCookie } from "@henryco/auth/server/session-state";

/**
 * Care proxy — V3-01 wired.
 *
 * Passive auth: verifies / refreshes the Supabase session and tags the
 * `hc_session_state` cookie. Page-level guards handle auth gating.
 */
export async function proxy(request: NextRequest) {
  const reqHeaders = new Headers(request.headers);
  reqHeaders.set(
    "x-care-return-path",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );

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
