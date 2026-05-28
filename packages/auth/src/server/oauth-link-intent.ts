import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { COMPANY } from "@henryco/config";

/**
 * V3-02 Addendum A1 — OAuth account-linking intent cookie.
 *
 * When a user signs in via OAuth with an email that already has a
 * password-based account, the callback handler MUST NOT auto-link
 * the identities (auto-link is an account-takeover vector). Instead
 * the callback:
 *
 *   1. Captures a signed `hc_oauth_link_intent` cookie carrying
 *      `{ email, provider, ts }`.
 *   2. Signs the user out of the freshly-minted OAuth session so
 *      they cannot proceed under the unverified link.
 *   3. Redirects to `/auth/link-account?intent=oauth_link&provider=<name>`.
 *      That page asks for the existing-account password; on
 *      successful password sign-in, the OAuth identity attaches to
 *      the existing user.
 *
 * Cookie TTL: 10 minutes per the addendum. After that the link
 * intent expires harmlessly and the user must re-initiate the
 * OAuth flow.
 *
 * The `email` carried in the cookie binds the intent to the same
 * email the OAuth flow attested; the link-account page MUST refuse
 * to link if the password sign-in resolves to a different email.
 */

export const HC_OAUTH_LINK_INTENT_COOKIE = "hc_oauth_link_intent";

const COOKIE_MAX_AGE_SECONDS = 10 * 60;

export type OAuthLinkIntentPayload = {
  email: string;
  provider: string;
  ts: number;
};

function loadSecret(): string {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "SUPABASE_JWT_SECRET must be configured (>=16 chars) — hc_oauth_link_intent cookie cannot be signed without it.",
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

function sign(payload: OAuthLinkIntentPayload): string {
  const encoded = base64Url(Buffer.from(JSON.stringify(payload), "utf8"));
  const hmac = createHmac("sha256", loadSecret()).update(encoded).digest();
  return `${encoded}.${base64Url(hmac)}`;
}

function cookieDomainForResponse(): string | undefined {
  if (process.env.NODE_ENV !== "production") return undefined;
  return `.${COMPANY.group.baseDomain}`;
}

export function writeOAuthLinkIntent(
  res: NextResponse,
  payload: Omit<OAuthLinkIntentPayload, "ts"> & { ts?: number },
): void {
  const filled: OAuthLinkIntentPayload = {
    email: payload.email,
    provider: payload.provider,
    ts: payload.ts ?? Date.now(),
  };
  const value = sign(filled);
  res.cookies.set({
    name: HC_OAUTH_LINK_INTENT_COOKIE,
    value,
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    domain: cookieDomainForResponse(),
  });
}

export async function readVerifiedOAuthLinkIntent(
  now: number = Date.now(),
): Promise<OAuthLinkIntentPayload | null> {
  const jar = await cookies();
  const raw = jar.get(HC_OAUTH_LINK_INTENT_COOKIE)?.value;
  if (!raw) return null;
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

  let payload: OAuthLinkIntentPayload;
  try {
    payload = JSON.parse(base64UrlDecode(payloadPart).toString("utf8")) as OAuthLinkIntentPayload;
  } catch {
    return null;
  }
  if (
    !payload ||
    typeof payload.email !== "string" ||
    typeof payload.provider !== "string" ||
    typeof payload.ts !== "number"
  ) {
    return null;
  }
  if (now - payload.ts > COOKIE_MAX_AGE_SECONDS * 1000) return null;
  return payload;
}

export async function clearOAuthLinkIntent(): Promise<void> {
  const jar = await cookies();
  jar.set({
    name: HC_OAUTH_LINK_INTENT_COOKIE,
    value: "",
    path: "/",
    maxAge: 0,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    domain: cookieDomainForResponse(),
  });
}

/**
 * Toggle that gates the active part of A1 — when OFF (default),
 * the callback handler still emits telemetry about the auto-link
 * scenario but does not break the existing Supabase behaviour.
 * When ON, the callback redirects through /auth/link-account.
 *
 * Owners enable this via the env var once they've reviewed the
 * link-account UX in preview. The infrastructure (cookie + page)
 * ships regardless; the gate decides whether real users see the
 * extra round-trip.
 */
export function isOAuthLinkIntentEnabled(): boolean {
  const v = process.env.HENRYCO_AUTH_OAUTH_LINK_INTENT;
  return v === "1" || v?.toLowerCase() === "true";
}
