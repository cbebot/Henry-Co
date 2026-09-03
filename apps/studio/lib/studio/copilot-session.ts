import "server-only";

import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";

const SESSION_COOKIE = "studio_copilot_session";

/**
 * The stable per-visitor session id shared by the brief co-pilot AND the coach chat. It is the
 * anti-abuse identity for anonymous prospects: the copilot's per-session caps and the gateway's
 * per-actor daily allowance both key off it, so rate rules actually bind (a random per-call id
 * would make them unenforceable).
 */
export async function getOrCreateCopilotSessionId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(SESSION_COOKIE)?.value?.trim();
  if (existing && /^[A-Za-z0-9_-]{16,64}$/.test(existing)) return existing;
  const fresh = randomBytes(18).toString("base64url");
  store.set(SESSION_COOKIE, fresh, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  });
  return fresh;
}
