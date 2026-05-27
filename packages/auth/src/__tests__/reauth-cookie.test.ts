/**
 * V3-02 S4 — hc_last_reauth signed cookie verification tests.
 *
 * Verifies the HMAC contract:
 *   - Tampered payload fails the signature check.
 *   - Wrong-subject cookies are rejected.
 *   - Cookies older than 5 minutes fail the age check.
 *   - Future-dated cookies beyond 60s skew are rejected.
 *   - Valid cookies are accepted and parsed.
 */

import { test, before } from "node:test";
import assert from "node:assert/strict";

import {
  REAUTH_WINDOW_MS,
  verifyReauthCookieValue,
  _internal,
} from "../server/reauth-cookie";

before(() => {
  // Set the secret before importing-time evaluation
  process.env.SUPABASE_JWT_SECRET = "test-secret-must-be-at-least-16-chars";
});

const USER = "11111111-1111-1111-1111-111111111111";

test("reauth-cookie: rejects empty / malformed input", () => {
  assert.equal(verifyReauthCookieValue(null, USER), null);
  assert.equal(verifyReauthCookieValue(undefined, USER), null);
  assert.equal(verifyReauthCookieValue("", USER), null);
  assert.equal(verifyReauthCookieValue("no-dot", USER), null);
  assert.equal(verifyReauthCookieValue("trailing-dot.", USER), null);
});

test("reauth-cookie: accepts a freshly-signed cookie for the same subject", () => {
  const now = Date.now();
  const signed = _internal.signPayload({ sub: USER, ts: now });
  const parsed = verifyReauthCookieValue(signed, USER, now);
  assert.ok(parsed, "expected parsed payload");
  assert.equal(parsed!.sub, USER);
  assert.equal(parsed!.ts, now);
});

test("reauth-cookie: rejects a cookie signed for a different subject", () => {
  const now = Date.now();
  const signed = _internal.signPayload({ sub: USER, ts: now });
  const parsed = verifyReauthCookieValue(
    signed,
    "00000000-0000-0000-0000-000000000000",
    now,
  );
  assert.equal(parsed, null);
});

test("reauth-cookie: rejects an expired cookie (>5 minutes old)", () => {
  const now = Date.now();
  const signed = _internal.signPayload({
    sub: USER,
    ts: now - (REAUTH_WINDOW_MS + 1_000),
  });
  const parsed = verifyReauthCookieValue(signed, USER, now);
  assert.equal(parsed, null);
});

test("reauth-cookie: rejects a future-dated cookie beyond skew", () => {
  const now = Date.now();
  const signed = _internal.signPayload({ sub: USER, ts: now + 120_000 });
  const parsed = verifyReauthCookieValue(signed, USER, now);
  assert.equal(parsed, null);
});

test("reauth-cookie: tampered payload fails signature check", () => {
  const now = Date.now();
  const signed = _internal.signPayload({ sub: USER, ts: now });
  // Mutate one character of the payload portion → signature no longer matches.
  const tampered = `${signed[0] === "A" ? "B" : "A"}${signed.slice(1)}`;
  const parsed = verifyReauthCookieValue(tampered, USER, now);
  assert.equal(parsed, null);
});
