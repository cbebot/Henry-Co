/**
 * HMAC verification for the inbound-email webhook.
 *
 * Byte-compatible with the Cloudflare Worker's signer and with the existing
 * account webhook (apps/account/app/api/webhooks/account/route.ts):
 *   signature = hex(HMAC_SHA256(secret, `${timestamp}.${rawBody}`))
 *   headers:   x-henry-timestamp, x-henry-signature   (sha256= prefix tolerated)
 *
 * Pure module — no Supabase/server-only imports — so it is unit-testable.
 */
import crypto from "node:crypto";

export const INBOUND_SIGNATURE_TTL_SECONDS = 5 * 60;

export function signInboundPayload(secret: string, timestamp: string, rawBody: string): string {
  return crypto.createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
}

export function normalizeSignature(value: string): string {
  const raw = String(value ?? "").trim();
  return raw.startsWith("sha256=") ? raw.slice("sha256=".length) : raw;
}

function safeEqualHex(expectedHex: string, receivedHex: string): boolean {
  try {
    const expected = Buffer.from(expectedHex, "hex");
    const received = Buffer.from(normalizeSignature(receivedHex), "hex");
    if (expected.length === 0 || received.length === 0 || expected.length !== received.length) {
      return false;
    }
    return crypto.timingSafeEqual(expected, received);
  } catch {
    return false;
  }
}

export function isFreshTimestamp(
  timestamp: string,
  toleranceSeconds = INBOUND_SIGNATURE_TTL_SECONDS,
  now = Date.now(),
): boolean {
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  const nowSec = Math.floor(now / 1000);
  return Math.abs(nowSec - ts) <= toleranceSeconds;
}

export type VerifyInboundInput = {
  secret: string;
  timestamp: string;
  signature: string;
  rawBody: string;
  toleranceSeconds?: number;
  now?: number;
};

export type VerifyInboundResult = { ok: true } | { ok: false; reason: string };

export function verifyInboundSignature(input: VerifyInboundInput): VerifyInboundResult {
  if (!input.secret) return { ok: false, reason: "secret_missing" };
  if (!input.timestamp || !input.signature) return { ok: false, reason: "headers_missing" };
  if (
    !isFreshTimestamp(
      input.timestamp,
      input.toleranceSeconds ?? INBOUND_SIGNATURE_TTL_SECONDS,
      input.now ?? Date.now(),
    )
  ) {
    return { ok: false, reason: "stale_timestamp" };
  }
  const expected = signInboundPayload(input.secret, input.timestamp, input.rawBody);
  if (!safeEqualHex(expected, input.signature)) return { ok: false, reason: "bad_signature" };
  return { ok: true };
}
