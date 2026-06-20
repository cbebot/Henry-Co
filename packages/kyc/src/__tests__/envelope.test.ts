import { test } from "node:test";
import assert from "node:assert/strict";

import {
  generateDataKey,
  encryptWithDataKey,
  decryptWithDataKey,
} from "../crypto/envelope";

const utf8 = (s: string) => new TextEncoder().encode(s);
const fromUtf8 = (b: Uint8Array) => new TextDecoder().decode(b);

test("generateDataKey returns a fresh 32-byte (256-bit) key each call", () => {
  const a = generateDataKey();
  const b = generateDataKey();
  assert.equal(a.byteLength, 32);
  assert.equal(b.byteLength, 32);
  assert.notDeepEqual([...a], [...b], "two generated keys must differ");
});

test("AES-256-GCM round-trips plaintext with a data key", () => {
  const key = generateDataKey();
  const plaintext = utf8("government-id-bytes-📄");
  const payload = encryptWithDataKey(plaintext, key);
  const recovered = decryptWithDataKey(payload, key);
  assert.equal(fromUtf8(recovered), "government-id-bytes-📄");
});

test("each encryption uses a fresh random 12-byte IV (no nonce reuse)", () => {
  const key = generateDataKey();
  const plaintext = utf8("same-plaintext");
  const one = encryptWithDataKey(plaintext, key);
  const two = encryptWithDataKey(plaintext, key);
  assert.equal(one.iv.byteLength, 12);
  assert.equal(two.iv.byteLength, 12);
  assert.notDeepEqual([...one.iv], [...two.iv], "IVs must differ across encryptions");
  assert.notDeepEqual(
    [...one.ciphertext],
    [...two.ciphertext],
    "ciphertext must differ when IV differs",
  );
  assert.equal(one.authTag.byteLength, 16);
});

test("decrypting with the wrong data key fails (GCM auth)", () => {
  const key = generateDataKey();
  const wrong = generateDataKey();
  const payload = encryptWithDataKey(utf8("secret"), key);
  assert.throws(() => decryptWithDataKey(payload, wrong));
});

test("tampering with the ciphertext is detected (auth tag mismatch)", () => {
  const key = generateDataKey();
  const payload = encryptWithDataKey(utf8("secret"), key);
  const tampered = { ...payload, ciphertext: new Uint8Array(payload.ciphertext) };
  tampered.ciphertext[0] ^= 0xff;
  assert.throws(() => decryptWithDataKey(tampered, key));
});

test("tampering with the auth tag is detected", () => {
  const key = generateDataKey();
  const payload = encryptWithDataKey(utf8("secret"), key);
  const tampered = { ...payload, authTag: new Uint8Array(payload.authTag) };
  tampered.authTag[0] ^= 0xff;
  assert.throws(() => decryptWithDataKey(tampered, key));
});

test("AAD binds ciphertext to a context — mismatched AAD fails to decrypt", () => {
  const key = generateDataKey();
  const payload = encryptWithDataKey(utf8("secret"), key, utf8("record:abc"));
  // Correct AAD decrypts.
  assert.equal(fromUtf8(decryptWithDataKey(payload, key, utf8("record:abc"))), "secret");
  // Wrong AAD (e.g. a swapped record id) is rejected.
  assert.throws(() => decryptWithDataKey(payload, key, utf8("record:xyz")));
  // Missing AAD when one was used is rejected.
  assert.throws(() => decryptWithDataKey(payload, key));
});

test("rejects a data key that is not exactly 32 bytes", () => {
  assert.throws(() => encryptWithDataKey(utf8("x"), new Uint8Array(16)));
});
