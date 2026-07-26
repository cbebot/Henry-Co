/**
 * SA-2 — the executor↔orchestrator HMAC handshake. PURE (node:crypto only) so
 * it is unit-testable and byte-compatible with the shipped inbound-email
 * scheme (apps/hub/lib/owner-inbox/signature.ts):
 *
 *   signature = hex(HMAC_SHA256(secret, `${timestamp}.${rawBody}`))
 *   headers:   x-henry-timestamp, x-henry-signature   (sha256= prefix tolerated)
 *   window:    5 minutes, timing-safe hex compare
 *
 * SA-2 adds the ARCHITECTURE §2.4 replay defence the email path doesn't need:
 * a MONOTONIC per-(jobId, attempt) sequence number. The timestamp window stops
 * a stale capture; the sequence stops a replay INSIDE the window from keeping a
 * dead or hijacked run looking alive. The verifier rejects a seq that is not
 * strictly greater than the last one the orchestrator recorded.
 */

import crypto from "node:crypto";

export const AGENCY_SIGNATURE_TTL_SECONDS = 5 * 60;

export function signAgencyPayload(secret: string, timestamp: string, rawBody: string): string {
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
  toleranceSeconds = AGENCY_SIGNATURE_TTL_SECONDS,
  now = Date.now(),
): boolean {
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  const nowSec = Math.floor(now / 1000);
  return Math.abs(nowSec - ts) <= toleranceSeconds;
}

export type VerifyAgencyInput = {
  secret: string;
  timestamp: string;
  signature: string;
  rawBody: string;
  toleranceSeconds?: number;
  now?: number;
};

export type VerifyAgencyResult =
  | { ok: true }
  | { ok: false; reason: "secret_missing" | "headers_missing" | "stale_timestamp" | "bad_signature" };

/** Signature + freshness only. Sequence monotonicity is a separate stateful check. */
export function verifyAgencySignature(input: VerifyAgencyInput): VerifyAgencyResult {
  if (!input.secret) return { ok: false, reason: "secret_missing" };
  if (!input.timestamp || !input.signature) return { ok: false, reason: "headers_missing" };
  if (
    !isFreshTimestamp(
      input.timestamp,
      input.toleranceSeconds ?? AGENCY_SIGNATURE_TTL_SECONDS,
      input.now ?? Date.now(),
    )
  ) {
    return { ok: false, reason: "stale_timestamp" };
  }
  const expected = signAgencyPayload(input.secret, input.timestamp, input.rawBody);
  if (!safeEqualHex(expected, input.signature)) return { ok: false, reason: "bad_signature" };
  return { ok: true };
}

/**
 * Replay-window guard: accept only a strictly-increasing sequence per
 * (jobId, attempt). `lastSeq` is what the orchestrator has on the job row;
 * `incoming` is the heartbeat's seq. A replayed capture carries a seq ≤ the
 * one already recorded and is rejected.
 */
export function isMonotonicSeq(lastSeq: number, incoming: number): boolean {
  const last = Number(lastSeq);
  const next = Number(incoming);
  if (!Number.isFinite(next) || next < 0) return false;
  if (!Number.isFinite(last)) return next >= 0;
  return next > last;
}
