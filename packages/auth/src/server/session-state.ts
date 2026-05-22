import "server-only";

import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { COMPANY } from "@henryco/config";

import {
  HC_SESSION_STATE_COOKIE,
  SESSION_STATE_VALUES,
  type SessionState,
} from "../types";

/**
 * 30 days. The cookie is a hint, not a security boundary — Supabase's
 * httpOnly session cookie remains the source of truth for whether the
 * viewer is authenticated. The long TTL lets SSR branch on this value
 * cheaply; the refresh middleware overwrites it on every request, so
 * a stale value can never linger more than one round-trip.
 */
const SESSION_STATE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function cookieDomain(): string | undefined {
  // Addendum A9: in non-production environments (NODE_ENV !== "production")
  // fall back to the request hostname rather than `.henrycogroup.com`.
  // This mirrors the convention `@henryco/auth/cookies` already uses for
  // the dashboard-preference cookie in dev / test contexts.
  if (process.env.NODE_ENV !== "production") return undefined;
  return `.${COMPANY.group.baseDomain}`;
}

/**
 * Set or clear the `hc_session_state` cookie on a NextResponse. Called
 * by the refresh middleware on every request so the cookie value is
 * always one of the four canonical states.
 *
 * SECURITY: this cookie is intentionally NOT `httpOnly` — the
 * client-side `readSessionStateCookie` helper needs to read it. It
 * carries no sensitive data (just a four-value enum). The httpOnly
 * Supabase cookie remains the only thing trusted for authentication
 * decisions.
 */
export function writeSessionStateCookie(
  res: NextResponse,
  state: SessionState,
): void {
  const isClear = state === "signed-out";
  res.cookies.set({
    name: HC_SESSION_STATE_COOKIE,
    value: state,
    path: "/",
    maxAge: isClear ? 0 : SESSION_STATE_MAX_AGE_SECONDS,
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    domain: cookieDomain(),
  });
}

/**
 * Read `hc_session_state` from the active request cookie jar. Useful
 * for server components that want to branch on signed-in-ness without
 * round-tripping to Supabase.
 *
 * Returns null when the cookie is absent or carries an unrecognized
 * value (defense-in-depth — even though the writer is trusted, the
 * reader still validates).
 */
export async function readSessionState(): Promise<SessionState | null> {
  const jar = await cookies();
  const raw = jar.get(HC_SESSION_STATE_COOKIE)?.value;
  if (!raw) return null;
  return (SESSION_STATE_VALUES as ReadonlyArray<string>).includes(raw)
    ? (raw as SessionState)
    : null;
}

export { HC_SESSION_STATE_COOKIE } from "../types";
