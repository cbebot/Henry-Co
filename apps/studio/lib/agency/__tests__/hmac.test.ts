import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  signAgencyPayload,
  verifyAgencySignature,
  isMonotonicSeq,
  isFreshTimestamp,
  AGENCY_SIGNATURE_TTL_SECONDS,
} from "@/lib/agency/hmac";
import { verifySpecFetch, signSpecFetch } from "@/lib/agency/spec-url";

const SECRET = "test-callback-secret-0123456789";

function freshTimestamp(now = Date.now()): string {
  return String(Math.floor(now / 1000));
}

describe("agency HMAC — the executor callback handshake", () => {
  it("verifies a correctly signed, fresh payload", () => {
    const body = JSON.stringify({ kind: "heartbeat", jobId: "j1", attempt: 0, seq: 1 });
    const ts = freshTimestamp();
    const sig = signAgencyPayload(SECRET, ts, body);
    assert.deepEqual(verifyAgencySignature({ secret: SECRET, timestamp: ts, signature: sig, rawBody: body }), {
      ok: true,
    });
  });

  it("rejects a tampered body (forged report)", () => {
    const body = JSON.stringify({ kind: "report", jobId: "j1", attempt: 0, outcome: "built" });
    const ts = freshTimestamp();
    const sig = signAgencyPayload(SECRET, ts, body);
    const tampered = body.replace("built", "killed_budget");
    const res = verifyAgencySignature({ secret: SECRET, timestamp: ts, signature: sig, rawBody: tampered });
    assert.equal(res.ok, false);
    if (!res.ok) assert.equal(res.reason, "bad_signature");
  });

  it("rejects a stale timestamp (replayed capture outside the window)", () => {
    const body = "{}";
    const staleTs = String(Math.floor(Date.now() / 1000) - AGENCY_SIGNATURE_TTL_SECONDS - 60);
    const sig = signAgencyPayload(SECRET, staleTs, body);
    const res = verifyAgencySignature({ secret: SECRET, timestamp: staleTs, signature: sig, rawBody: body });
    assert.equal(res.ok, false);
    if (!res.ok) assert.equal(res.reason, "stale_timestamp");
  });

  it("rejects the wrong secret", () => {
    const body = "{}";
    const ts = freshTimestamp();
    const sig = signAgencyPayload("attacker-secret", ts, body);
    const res = verifyAgencySignature({ secret: SECRET, timestamp: ts, signature: sig, rawBody: body });
    assert.equal(res.ok, false);
  });

  it("isFreshTimestamp bounds both directions", () => {
    const now = Date.now();
    assert.equal(isFreshTimestamp(freshTimestamp(now), AGENCY_SIGNATURE_TTL_SECONDS, now), true);
    assert.equal(isFreshTimestamp("not-a-number", AGENCY_SIGNATURE_TTL_SECONDS, now), false);
  });
});

describe("monotonic sequence — replay-inside-window guard", () => {
  it("accepts a strictly increasing seq", () => {
    assert.equal(isMonotonicSeq(0, 1), true);
    assert.equal(isMonotonicSeq(4, 5), true);
  });
  it("rejects a replayed or equal seq", () => {
    assert.equal(isMonotonicSeq(5, 5), false);
    assert.equal(isMonotonicSeq(5, 3), false);
    assert.equal(isMonotonicSeq(5, -1), false);
    assert.equal(isMonotonicSeq(5, Number.NaN), false);
  });
});

describe("signed spec-fetch URL", () => {
  it("verifies a fresh, correctly signed link", () => {
    const now = Date.now();
    const exp = Math.floor(now / 1000) + 120;
    const sig = signSpecFetch(SECRET, "j1", 0, exp);
    assert.deepEqual(verifySpecFetch({ secret: SECRET, jobId: "j1", attempt: 0, expSec: exp, sig, now }), { ok: true });
  });

  it("rejects an expired link", () => {
    const now = Date.now();
    const exp = Math.floor(now / 1000) - 10;
    const sig = signSpecFetch(SECRET, "j1", 0, exp);
    const res = verifySpecFetch({ secret: SECRET, jobId: "j1", attempt: 0, expSec: exp, sig, now });
    assert.equal(res.ok, false);
    if (!res.ok) assert.equal(res.reason, "expired");
  });

  it("rejects a forged far-future expiry", () => {
    const now = Date.now();
    const exp = Math.floor(now / 1000) + 60 * 60 * 24;
    const sig = signSpecFetch(SECRET, "j1", 0, exp);
    const res = verifySpecFetch({ secret: SECRET, jobId: "j1", attempt: 0, expSec: exp, sig, now });
    assert.equal(res.ok, false);
    if (!res.ok) assert.equal(res.reason, "ttl_too_long");
  });

  it("rejects a link signed for a DIFFERENT job (no cross-job reuse)", () => {
    const now = Date.now();
    const exp = Math.floor(now / 1000) + 120;
    const sig = signSpecFetch(SECRET, "j1", 0, exp);
    // Present the j1 signature against j2 — must fail.
    const res = verifySpecFetch({ secret: SECRET, jobId: "j2", attempt: 0, expSec: exp, sig, now });
    assert.equal(res.ok, false);
    if (!res.ok) assert.equal(res.reason, "bad_signature");
  });
});
