import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { COMPANY } from "@henryco/config";

/**
 * V3-02 S4 — `hc_last_reauth` signed-cookie writer / verifier.
 *
 * Marks the wall-clock moment the user satisfied a fresh-credential
 * challenge. The sensitive-action guard treats any such moment within
 * the configured window (5 minutes) as evidence the user is still
 * the operator at the keyboard.
 *
 * Shape: `<base64url-payload>.<base64url-hmac>` where the payload is
 * a JSON blob `{ sub: <user-id>, ts: <epoch-ms> }`. The hmac binds
 * the cookie to a server secret so a captured cookie cannot be
 * forged or replayed against a different user.
 *
 * SECRET: SUPABASE_JWT_SECRET — already an active env var per
 * INTEGRATION-KEYS.md and already consumed by V3-01. Avoids
 * introducing yet another auth-class secret to rotate.
 *
 * NOT a security boundary against a stolen device; if an attacker
 * has the cookie + the Supabase access token they can already act
 * as the user. The cookie defends against:
 *   - Tampering: changing `ts` to bypass the 5-minute window.
 *   - Cross-user replay: lifting one user's cookie onto another
 *     session.
 *   - Stale cookies after a logout (the cookie is cleared on logout
 *     so subsequent sensitive actions challenge again).
 */

export const HC_LAST_REAUTH_COOKIE = "hc_last_reauth";

/** 5 minutes per Addendum + S4 spec. Exported so tests can reference. */
export const REAUTH_WINDOW_MS = 5 * 60 * 1000;

/** 10 minutes cookie TTL — gives the window slack for clock skew. */
const COOKIE_MAX_AGE_SECONDS = 10 * 60;

type ReauthPayload = {
  sub: string;
  ts: number;
};

function base64UrlEncode(input: Buffer): string {
  return input
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function base64UrlDecode(input: string): Buffer {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  const normalized = input.replaceAll("-", "+").replaceAll("_", "/") + pad;
  return Buffer.from(normalized, "base64");
}

function loadSecret(): string {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "SUPABASE_JWT_SECRET must be configured (>=16 chars) — sensitive-action guard cannot sign hc_last_reauth without it.",
    );
  }
  return secret;
}

function signPayload(payload: ReauthPayload): string {
  const serialized = JSON.stringify(payload);
  const encoded = base64UrlEncode(Buffer.from(serialized, "utf8"));
  const hmac = createHmac("sha256", loadSecret()).update(encoded).digest();
  return `${encoded}.${base64UrlEncode(hmac)}`;
}

function cookieDomainForRequest(): string | undefined {
  // Match writeSessionStateCookie / dashboard-preference cookie behaviour:
  // shared `.henrycogroup.com` in production, host-scoped in dev so
  // localhost / preview deployments work without re-configuring DNS.
  if (process.env.NODE_ENV !== "production") return undefined;
  return `.${COMPANY.group.baseDomain}`;
}

/**
 * Verify a `hc_last_reauth` cookie string. Returns the payload on
 * success, or null on:
 *   - missing/malformed input
 *   - bad signature (timing-safe compare)
 *   - subject mismatch with the supplied user id
 *   - older than `REAUTH_WINDOW_MS`
 *
 * SECURITY: `timingSafeEqual` guards against signature-comparison
 * timing side channels. Length mismatch is rejected before the
 * compare (timingSafeEqual throws otherwise).
 */
export function verifyReauthCookieValue(
  cookieValue: string | undefined | null,
  expectedSub: string,
  now: number = Date.now(),
): ReauthPayload | null {
  if (!cookieValue || typeof cookieValue !== "string") return null;
  const dot = cookieValue.lastIndexOf(".");
  if (dot <= 0 || dot === cookieValue.length - 1) return null;

  const payloadPart = cookieValue.slice(0, dot);
  const signaturePart = cookieValue.slice(dot + 1);

  let secret: string;
  try {
    secret = loadSecret();
  } catch {
    return null;
  }
  const expectedSignature = createHmac("sha256", secret)
    .update(payloadPart)
    .digest();
  const providedSignature = base64UrlDecode(signaturePart);
  if (providedSignature.length !== expectedSignature.length) return null;
  if (!timingSafeEqual(providedSignature, expectedSignature)) return null;

  let payload: ReauthPayload;
  try {
    const decoded = base64UrlDecode(payloadPart).toString("utf8");
    payload = JSON.parse(decoded) as ReauthPayload;
  } catch {
    return null;
  }
  if (!payload || typeof payload.sub !== "string" || typeof payload.ts !== "number") {
    return null;
  }
  if (payload.sub !== expectedSub) return null;
  if (now - payload.ts > REAUTH_WINDOW_MS) return null;
  // Reject future-dated timestamps beyond a small skew (60 s).
  if (payload.ts - now > 60_000) return null;
  return payload;
}

/**
 * Read + verify the `hc_last_reauth` cookie from the active request
 * jar. Returns the payload (after sub + age + signature checks pass)
 * or null when no valid reauth is in scope.
 */
export async function readVerifiedReauth(
  expectedSub: string,
  now: number = Date.now(),
): Promise<ReauthPayload | null> {
  const jar = await cookies();
  const raw = jar.get(HC_LAST_REAUTH_COOKIE)?.value;
  return verifyReauthCookieValue(raw, expectedSub, now);
}

/**
 * Write a fresh `hc_last_reauth` cookie onto a NextResponse. Called
 * by the reauth flow on successful re-credential.
 */
export function writeReauthCookie(
  res: NextResponse,
  userId: string,
  now: number = Date.now(),
): void {
  const value = signPayload({ sub: userId, ts: now });
  res.cookies.set({
    name: HC_LAST_REAUTH_COOKIE,
    value,
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    domain: cookieDomainForRequest(),
  });
}

/**
 * Write a fresh reauth cookie onto the active request jar. Useful
 * for route handlers that want to set the cookie inline rather than
 * passing a NextResponse around.
 */
export async function writeReauthCookieToJar(
  userId: string,
  now: number = Date.now(),
): Promise<void> {
  const value = signPayload({ sub: userId, ts: now });
  const jar = await cookies();
  jar.set({
    name: HC_LAST_REAUTH_COOKIE,
    value,
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    domain: cookieDomainForRequest(),
  });
}

/**
 * Clear the cookie. Called on logout / sign-out-everywhere so the
 * next sensitive action challenges again.
 */
export function clearReauthCookie(res: NextResponse): void {
  res.cookies.set({
    name: HC_LAST_REAUTH_COOKIE,
    value: "",
    path: "/",
    maxAge: 0,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    domain: cookieDomainForRequest(),
  });
}

export async function clearReauthCookieOnJar(): Promise<void> {
  const jar = await cookies();
  jar.set({
    name: HC_LAST_REAUTH_COOKIE,
    value: "",
    path: "/",
    maxAge: 0,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    domain: cookieDomainForRequest(),
  });
}

/** Internal — exposed for tests so they can build valid + tampered cookies. */
export const _internal = {
  signPayload,
  base64UrlDecode,
  base64UrlEncode,
};
