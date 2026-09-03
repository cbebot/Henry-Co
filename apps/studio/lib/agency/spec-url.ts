/**
 * SA-2 — the short-TTL signed spec-fetch URL (ARCHITECTURE §2.2 E1 mechanics).
 * `workflow_dispatch` inputs are size-limited, so the dispatch carries only
 * `jobId + attempt + a signed spec-fetch URL`; the credential-less runner pulls
 * the frozen BuildJobSpec back over this signed GET. PURE (node:crypto).
 *
 *   sig = hex(HMAC_SHA256(secret, `${jobId}.${attempt}.${expSec}`))
 *
 * The URL authenticates the FETCH, not the runner — it grants read of exactly
 * one job's frozen (already PII-scrubbed) spec, for a few minutes. It carries
 * no credential the runner can reuse for anything else.
 */

import crypto from "node:crypto";

export const SPEC_URL_TTL_SECONDS = 5 * 60;

export function signSpecFetch(
  secret: string,
  jobId: string,
  attempt: number,
  expSec: number,
): string {
  return crypto.createHmac("sha256", secret).update(`${jobId}.${attempt}.${expSec}`).digest("hex");
}

export function buildSpecFetchUrl(input: {
  baseUrl: string;
  secret: string;
  jobId: string;
  attempt: number;
  now?: number;
  ttlSeconds?: number;
}): string {
  const nowSec = Math.floor((input.now ?? Date.now()) / 1000);
  const expSec = nowSec + (input.ttlSeconds ?? SPEC_URL_TTL_SECONDS);
  const sig = signSpecFetch(input.secret, input.jobId, input.attempt, expSec);
  const base = input.baseUrl.replace(/\/$/, "");
  const q = new URLSearchParams({ attempt: String(input.attempt), exp: String(expSec), sig });
  return `${base}/api/agency/spec/${encodeURIComponent(input.jobId)}?${q.toString()}`;
}

export type VerifySpecFetchResult = { ok: true } | { ok: false; reason: string };

export function verifySpecFetch(input: {
  secret: string;
  jobId: string;
  attempt: number;
  expSec: number;
  sig: string;
  now?: number;
}): VerifySpecFetchResult {
  if (!input.secret) return { ok: false, reason: "secret_missing" };
  const nowSec = Math.floor((input.now ?? Date.now()) / 1000);
  if (!Number.isFinite(input.expSec) || input.expSec < nowSec) {
    return { ok: false, reason: "expired" };
  }
  // Reject an absurd future expiry (a forged long-lived link).
  if (input.expSec - nowSec > 60 * 60) return { ok: false, reason: "ttl_too_long" };
  const expected = signSpecFetch(input.secret, input.jobId, input.attempt, input.expSec);
  try {
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(String(input.sig ?? "").trim(), "hex");
    if (a.length === 0 || a.length !== b.length) return { ok: false, reason: "bad_signature" };
    if (!crypto.timingSafeEqual(a, b)) return { ok: false, reason: "bad_signature" };
  } catch {
    return { ok: false, reason: "bad_signature" };
  }
  return { ok: true };
}
