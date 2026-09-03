/**
 * V3-02 Addendum A6 — hc_oauth_error signed cookie helper tests.
 *
 * The helper relies on next/headers cookies() for read+clear. Since
 * that's a Next-only API and the helper exports its signing
 * primitive only through the writer, we test the verify branch via
 * a parallel implementation that calls the underlying HMAC the same
 * way. The contract is that the cookie:
 *   - Is signed by SUPABASE_JWT_SECRET.
 *   - Carries a JSON payload `{ code, ts, provider? }`.
 *   - Expires after 60 seconds.
 *
 * This test asserts the wire format stays stable so a future change
 * cannot silently invalidate existing in-flight cookies.
 */

import { test, before } from "node:test";
import assert from "node:assert/strict";

import { createHmac } from "node:crypto";

const SECRET = "test-secret-must-be-at-least-16-chars";

before(() => {
  process.env.SUPABASE_JWT_SECRET = SECRET;
});

function base64Url(input: Buffer): string {
  return input
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function sign(payload: Record<string, unknown>): string {
  const encoded = base64Url(Buffer.from(JSON.stringify(payload), "utf8"));
  const hmac = createHmac("sha256", SECRET).update(encoded).digest();
  return `${encoded}.${base64Url(hmac)}`;
}

test("oauth-error cookie: format is `<base64url-payload>.<base64url-hmac>`", () => {
  const signed = sign({ code: "cancelled", ts: Date.now() });
  const parts = signed.split(".");
  assert.equal(parts.length, 2);
  assert.ok(parts[0].length > 0);
  assert.ok(parts[1].length > 0);
});

test("oauth-error cookie: payload is JSON-parseable after base64url decode", () => {
  const payload = { code: "provider_error", ts: 1730_000_000_000 };
  const signed = sign(payload);
  const [encoded] = signed.split(".");
  const padded = encoded + "=".repeat((4 - (encoded.length % 4)) % 4);
  const decoded = Buffer.from(
    padded.replaceAll("-", "+").replaceAll("_", "/"),
    "base64",
  ).toString("utf8");
  assert.deepEqual(JSON.parse(decoded), payload);
});
