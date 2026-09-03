/**
 * V3-73 — Studio Project Suite: short-lived signed asset grant.
 *
 * A final, un-watermarked file is NEVER handed to the client as a raw URL. The
 * payment-gated issuance boundary mints a short-lived HMAC grant token bound to
 * (deliverable, viewer, expiry); the gated download proxy verifies it before
 * streaming. No valid grant → no file. This is the "client cannot bypass" rule.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { signAssetGrant, verifyAssetGrant, type AssetGrant } from "./asset-grant";

const SECRET = "grant-secret";
const NOW = 1_750_000_000; // fixed epoch seconds

function grant(exp: number): AssetGrant {
  return { deliverableId: "d-1", userId: "u-1", exp };
}

test("a valid, unexpired grant round-trips", () => {
  const token = signAssetGrant(grant(NOW + 300), SECRET);
  const verified = verifyAssetGrant(token, SECRET, NOW);
  assert.ok(verified);
  assert.equal(verified?.deliverableId, "d-1");
  assert.equal(verified?.userId, "u-1");
});

test("an expired grant is rejected", () => {
  const token = signAssetGrant(grant(NOW - 1), SECRET);
  assert.equal(verifyAssetGrant(token, SECRET, NOW), null);
});

test("a tampered payload is rejected", () => {
  const token = signAssetGrant(grant(NOW + 300), SECRET);
  const [payload, sig] = token.split(".");
  // re-encode a different deliverable id but keep the old signature
  const forged = Buffer.from(
    JSON.stringify({ deliverableId: "d-EVIL", userId: "u-1", exp: NOW + 300 }),
  ).toString("base64url");
  assert.equal(verifyAssetGrant(`${forged}.${sig}`, SECRET, NOW), null);
  // sanity: the untampered token still verifies
  assert.ok(verifyAssetGrant(`${payload}.${sig}`, SECRET, NOW));
});

test("a grant signed with another secret is rejected", () => {
  const token = signAssetGrant(grant(NOW + 300), SECRET);
  assert.equal(verifyAssetGrant(token, "other", NOW), null);
});

test("malformed tokens never throw, just return null", () => {
  assert.equal(verifyAssetGrant("", SECRET, NOW), null);
  assert.equal(verifyAssetGrant("nodot", SECRET, NOW), null);
  assert.equal(verifyAssetGrant("a.b.c", SECRET, NOW), null);
  assert.equal(verifyAssetGrant("!!!.???", SECRET, NOW), null);
});

test("distinct grants produce distinct tokens", () => {
  const a = signAssetGrant(grant(NOW + 300), SECRET);
  const b = signAssetGrant({ deliverableId: "d-2", userId: "u-1", exp: NOW + 300 }, SECRET);
  assert.notEqual(a, b);
});
