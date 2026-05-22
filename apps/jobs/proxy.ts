import { NextResponse, type NextRequest } from "next/server";
import {
  sessionStateFor,
  verifySupabaseSession,
} from "@henryco/auth/server/verify-supabase-session";
import { writeSessionStateCookie } from "@henryco/auth/server/session-state";

/**
 * Jobs proxy — V3-01 wired.
 *
 * Passive auth: verifies / refreshes the Supabase session and tags the
 * `hc_session_state` cookie. Auth gating itself is handled at the page
 * level (server components).
 */
export async function proxy(request: NextRequest) {
  const reqHeaders = new Headers(request.headers);
  reqHeaders.set(
    "x-jobs-return-path",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );

  const response = NextResponse.next({
    request: { headers: reqHeaders },
  });

  const session = await verifySupabaseSession(request, response);
  const state = sessionStateFor(session);
  if (state) {
    writeSessionStateCookie(response, state, {
      hostname: request.nextUrl.hostname,
      secure: request.nextUrl.protocol === "https:",
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
