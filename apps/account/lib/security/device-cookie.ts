/**
 * Signed "known device" cookie.
 *
 * Sign-in alerting needs a stable, server-readable identity for the browser a
 * person signs in from — the User-Agent alone is too weak and too easily
 * shared. We mint a random device id on first sign-in, store it in an
 * httpOnly cookie, and match it against the user's recognised devices.
 *
 * The value is HMAC-signed so it cannot be forged or swapped, mirroring the
 * house pattern in `@henryco/auth/server/oauth-error-cookie`. It uses its OWN
 * dedicated secret (`DEVICE_COOKIE_SECRET`) so device memory never piggybacks
 * on the JWT-named cookie secret; it falls back to `SUPABASE_JWT_SECRET` (used
 * by the other signed cookies + the unit tests) when the dedicated one is unset.
 * Pure crypto — NO `server-only`, NO `next/headers` — so the signing is
 * unit-tested in isolation; the route does the cookie jar read/write below.
 */

import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

export const HC_DEVICE_COOKIE = "hc_device";

/** Recognised-device cookie lifetime: 400 days (the browser cookie ceiling). */
export const HC_DEVICE_COOKIE_MAX_AGE = 60 * 60 * 24 * 400;

function loadSecret(): string | null {
  const secret = process.env.DEVICE_COOKIE_SECRET || process.env.SUPABASE_JWT_SECRET;
  return typeof secret === "string" && secret.length >= 16 ? secret : null;
}

function sign(data: string, secret: string): string {
  return createHmac("sha256", secret).update(data).digest().toString("base64url");
}

/** A fresh, unguessable device id. */
export function generateDeviceId(): string {
  return randomUUID();
}

/**
 * Sign a device id into its cookie value. Throws if the secret is missing — an
 * unsigned device cookie must never be issued.
 */
export function signDeviceId(deviceId: string): string {
  const secret = loadSecret();
  if (!secret) {
    throw new Error(
      "SUPABASE_JWT_SECRET must be configured (>=16 chars) to sign the device cookie.",
    );
  }
  const data = Buffer.from(deviceId, "utf8").toString("base64url");
  return `${data}.${sign(data, secret)}`;
}

/**
 * Verify a cookie value and return the device id, or `null` for anything not
 * trustworthy (malformed, wrong signature, missing secret). Never throws.
 */
export function verifyDeviceCookie(raw: string | null | undefined): string | null {
  if (typeof raw !== "string" || raw.length === 0) return null;

  const secret = loadSecret();
  if (!secret) return null;

  const parts = raw.split(".");
  if (parts.length !== 2) return null;
  const [data, providedSig] = parts;
  if (!data || !providedSig) return null;

  const expected = Buffer.from(sign(data, secret));
  const provided = Buffer.from(providedSig);
  if (expected.length !== provided.length) return null;
  if (!timingSafeEqual(expected, provided)) return null;

  try {
    const id = Buffer.from(data, "base64url").toString("utf8");
    return id || null;
  } catch {
    return null;
  }
}
