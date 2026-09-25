import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * V3-STAFF-SELFGRANT-FIX-01 — the owner-impersonation cookie, sealed.
 *
 * The cookie used to be plain JSON, and endImpersonationAction (no auth gate) minted a
 * magic link for whatever `ownerUserId` it named — so any caller that sent a forged
 * cookie was signed in as the owner. The session is now HMAC-sealed with an expiry;
 * the end action must also check that the current session IS the impersonated target
 * and that the owner is still an owner.
 */

export const IMPERSONATION_MAX_AGE_SECONDS = 3600;

export type ImpersonationSession = {
  ownerUserId: string;
  targetUserId: string;
  targetName: string | null;
  targetRole: string | null;
  startedAt: string;
};

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(`care-impersonation:v1:${payload}`).digest("base64url");
}

export function sealImpersonationSession(session: ImpersonationSession, secret: string): string {
  if (!secret) throw new Error("Impersonation signing secret is not configured.");
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

export function openImpersonationSession(
  sealed: string | null | undefined,
  secret: string,
  nowMs: number = Date.now()
): ImpersonationSession | null {
  if (!secret || typeof sealed !== "string") return null;
  const parts = sealed.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  const [payload, signature] = parts;

  const expected = Buffer.from(sign(payload, secret));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

  let session: ImpersonationSession;
  try {
    session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (!session || typeof session.ownerUserId !== "string" || typeof session.targetUserId !== "string") {
    return null;
  }
  const started = Date.parse(String(session.startedAt));
  if (!Number.isFinite(started) || nowMs - started > IMPERSONATION_MAX_AGE_SECONDS * 1000 || started - nowMs > 60_000) {
    return null;
  }
  return session;
}

/** A redirect target that can never leave the current origin. */
export function safeRelativeRedirect(next: string | null | undefined, fallback = "/"): string {
  const value = typeof next === "string" ? next.trim() : "";
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}

/** Owner-action secret without public fallbacks: fail closed when unset. */
export function impersonationSigningSecret(): string {
  return process.env.OWNER_ACTION_SIGNING_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
}
