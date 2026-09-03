import { NextResponse, type NextRequest } from "next/server";
import {
  sessionStateFor,
  verifySupabaseSession,
} from "@henryco/auth/server/verify-supabase-session";
import { writeSessionStateCookie } from "@henryco/auth/server/session-state";

/**
 * Marketplace proxy — V3-01 wired.
 *
 * Behaviour:
 *   - Verifies / refreshes the Supabase session (cookie auto-refresh
 *     happens inside `verifySupabaseSession`).
 *   - Tags the `hc_session_state` cookie so SSR + the client
 *     `subscribeSessionState` helper see the current lifecycle state.
 *   - Does NOT redirect on auth failure — marketplace gates auth at
 *     the page level. The cookie state surfaces the change to the
 *     client without forcing a navigation mid-shop.
 */
export async function proxy(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
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
