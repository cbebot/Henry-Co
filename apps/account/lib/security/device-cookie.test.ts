import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";

// The device cookie is signed with the same secret the rest of the app uses
// for signed cookies. Set it before importing so the lazy reader picks it up.
process.env.SUPABASE_JWT_SECRET = "test-device-cookie-secret-0123456789";

import {
  HC_DEVICE_COOKIE,
  generateDeviceId,
  signDeviceId,
  verifyDeviceCookie,
} from "./device-cookie";

test("a signed device id round-trips back to the same id", () => {
  const id = generateDeviceId();
  const signed = signDeviceId(id);
  assert.ok(signed.includes("."));
  assert.equal(verifyDeviceCookie(signed), id);
});

test("the cookie name is stable and namespaced", () => {
  assert.equal(HC_DEVICE_COOKIE, "hc_device");
});

test("generateDeviceId returns distinct, non-trivial ids", () => {
  const a = generateDeviceId();
  const b = generateDeviceId();
  assert.notEqual(a, b);
  assert.ok(a.length >= 16);
});

test("a tampered signature is REJECTED", () => {
  const signed = signDeviceId(generateDeviceId());
  const [data, sig] = signed.split(".");
  const forged = `${data}.${"A".repeat(sig!.length)}`;
  assert.equal(verifyDeviceCookie(forged), null);
});

test("a tampered payload (swapped device id) is REJECTED", () => {
  const signed = signDeviceId("device-one");
  const sig = signed.split(".")[1];
  const evilData = Buffer.from("device-two").toString("base64url");
  assert.equal(verifyDeviceCookie(`${evilData}.${sig}`), null);
});

test("garbage input is rejected, never thrown", () => {
  assert.equal(verifyDeviceCookie(""), null);
  assert.equal(verifyDeviceCookie(null), null);
  assert.equal(verifyDeviceCookie(undefined), null);
  assert.equal(verifyDeviceCookie("not-a-cookie"), null);
  assert.equal(verifyDeviceCookie("a.b.c"), null);
});

test("a value signed with a different secret is REJECTED", () => {
  // Hand-craft a value with a valid format but the wrong signing key.
  const data = Buffer.from("device-x").toString("base64url");
  const wrongSig = createHmac("sha256", "some-other-secret-key-here")
    .update(data)
    .digest()
    .toString("base64url");
  assert.equal(verifyDeviceCookie(`${data}.${wrongSig}`), null);
});
