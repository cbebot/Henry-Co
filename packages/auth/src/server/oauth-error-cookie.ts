import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { COMPANY } from "@henryco/config";

/**
 * V3-02 Addendum A6 — OAuth callback error transport.
 *
 * Instead of putting the error code in the redirect URL (where it
 * leaks into analytics, referrer headers, and shareable links), the
 * callback handler sets a short-lived signed-HMAC cookie carrying
 * `{ code, ts }`. The chooser page reads + clears the cookie on
 * mount and renders the inline message.
 *
 * Cookie TTL: 60 seconds — the cookie either renders the message on
 * the very next page load or expires harmlessly.
 *
 * Signing prevents tampering ("set hc_oauth_error to make every
 * user see an error message") while keeping the value readable
 * server-side via the cookies() jar.
 */

export const HC_OAUTH_ERROR_COOKIE = "hc_oauth_error";

const COOKIE_MAX_AGE_SECONDS = 60;

/**
 * Stable error codes the callback can set. Keep this list short and
 * map to user-facing copy in the renderer. Extend by adding new
 * entries here in the same commit that adds the renderer copy.
 */
export type OAuthErrorCode =
  | "cancelled"
  | "provider_error"
  | "callback_invalid"
  | "session_exchange_failed"
  | "link_required"
  | "link_window_expired";

export type OAuthErrorPayload = {
  code: OAuthErrorCode;
  ts: number;
  provider?: string;
};

function loadSecret(): string {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "SUPABASE_JWT_SECRET must be configured (>=16 chars) — hc_oauth_error cookie cannot be signed without it.",
    );
  }
  return secret;
}

function base64Url(input: Buffer): string {
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

function sign(payload: OAuthErrorPayload): string {
  const encoded = base64Url(Buffer.from(JSON.stringify(payload), "utf8"));
  const hmac = createHmac("sha256", loadSecret()).update(encoded).digest();
  return `${encoded}.${base64Url(hmac)}`;
}

function cookieDomainForResponse(): string | undefined {
  if (process.env.NODE_ENV !== "production") return undefined;
  return `.${COMPANY.group.baseDomain}`;
}

/**
 * Set the OAuth-error cookie on a NextResponse. The callback uses
 * this when issuing the redirect to /auth/choose (no query string).
 */
export function writeOAuthErrorCookie(
  res: NextResponse,
  code: OAuthErrorCode,
  provider?: string,
  now: number = Date.now(),
): void {
  const value = sign({ code, ts: now, provider });
  res.cookies.set({
    name: HC_OAUTH_ERROR_COOKIE,
    value,
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    domain: cookieDomainForResponse(),
  });
}

/**
 * Read + verify + clear the OAuth-error cookie from the active
 * request jar. The chooser page calls this in its server component
 * so the message is consumed in a single render — peer tabs / a
 * later refresh see no error.
 *
 * Clearing on read: writes a zero-max-age cookie to the response
 * jar; Next 16's headers() lets server components mutate cookies
 * before the response is sent.
 */
export async function readAndClearOAuthErrorCookie(
  now: number = Date.now(),
): Promise<OAuthErrorPayload | null> {
  const jar = await cookies();
  const raw = jar.get(HC_OAUTH_ERROR_COOKIE)?.value;
  if (!raw) return null;

  // Clear immediately — even on signature failure, so a tampered
  // cookie cannot survive multiple page loads.
  try {
    jar.set({
      name: HC_OAUTH_ERROR_COOKIE,
      value: "",
      path: "/",
      maxAge: 0,
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      domain: cookieDomainForResponse(),
    });
  } catch {
    // read-only context (e.g. server component rendered before
    // headers() mutability window) — caller can re-clear elsewhere.
  }

  const dot = raw.lastIndexOf(".");
  if (dot <= 0 || dot === raw.length - 1) return null;
  const payloadPart = raw.slice(0, dot);
  const signaturePart = raw.slice(dot + 1);

  let secret: string;
  try {
    secret = loadSecret();
  } catch {
    return null;
  }
  const expected = createHmac("sha256", secret).update(payloadPart).digest();
  const provided = base64UrlDecode(signaturePart);
  if (provided.length !== expected.length) return null;
  if (!timingSafeEqual(provided, expected)) return null;

  let payload: OAuthErrorPayload;
  try {
    payload = JSON.parse(base64UrlDecode(payloadPart).toString("utf8")) as OAuthErrorPayload;
  } catch {
    return null;
  }
  if (!payload || typeof payload.code !== "string" || typeof payload.ts !== "number") {
    return null;
  }
  if (now - payload.ts > COOKIE_MAX_AGE_SECONDS * 1000) return null;
  return payload;
}
