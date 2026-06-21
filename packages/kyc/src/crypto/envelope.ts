/**
 * @henryco/kyc — envelope encryption core (data-key layer).
 *
 * Authenticated symmetric encryption of a single artifact's bytes with a
 * per-record **data key**, using the vetted, OpenSSL-backed `node:crypto`
 * AES-256-GCM primitive. NO hand-rolled cryptography.
 *
 * This module knows nothing about master keys, storage, or the database — it
 * only turns `(plaintext, dataKey)` into authenticated ciphertext and back.
 * The data key itself is wrapped by an external master key in `master-key.ts`
 * (envelope encryption), so this ciphertext + the *wrapped* key in the DB are
 * useless without the master key held outside the database.
 *
 * Not a package entry point — reachable only via the server barrel, which
 * carries the `server-only` guard. node:crypto makes it server/Node-only.
 */
import { createCipheriv, createDecipheriv, randomBytes, timingSafeEqual } from "node:crypto";

const ALGORITHM = "aes-256-gcm";

/** 256-bit data key. */
export const DATA_KEY_BYTES = 32;
/** 96-bit GCM nonce — the NIST-recommended IV size for GCM. */
export const IV_BYTES = 12;
/** 128-bit GCM authentication tag. */
export const AUTH_TAG_BYTES = 16;

export type EncryptedPayload = {
  /** AES-256-GCM ciphertext of the plaintext. */
  ciphertext: Uint8Array;
  /** Random 96-bit nonce, unique per encryption. */
  iv: Uint8Array;
  /** 128-bit GCM authentication tag. */
  authTag: Uint8Array;
};

/** Generate a cryptographically-random 256-bit data key. */
export function generateDataKey(): Uint8Array {
  return new Uint8Array(randomBytes(DATA_KEY_BYTES));
}

function assertKey(dataKey: Uint8Array): void {
  if (dataKey.byteLength !== DATA_KEY_BYTES) {
    throw new Error(`kyc/envelope: data key must be ${DATA_KEY_BYTES} bytes, got ${dataKey.byteLength}`);
  }
}

/**
 * Encrypt `plaintext` with `dataKey` under AES-256-GCM. A fresh random IV is
 * generated for every call (never reuse a nonce with the same key). Optional
 * `aad` (additional authenticated data) binds the ciphertext to a context such
 * as the record id, so a captured ciphertext cannot be replayed into a
 * different record without detection.
 */
export function encryptWithDataKey(
  plaintext: Uint8Array,
  dataKey: Uint8Array,
  aad?: Uint8Array,
): EncryptedPayload {
  assertKey(dataKey);
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, dataKey, iv, { authTagLength: AUTH_TAG_BYTES });
  if (aad && aad.byteLength > 0) cipher.setAAD(aad);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    ciphertext: new Uint8Array(ciphertext),
    iv: new Uint8Array(iv),
    authTag: new Uint8Array(authTag),
  };
}

/**
 * Decrypt an {@link EncryptedPayload}. Throws if the data key, ciphertext,
 * auth tag, or AAD do not all match — GCM is authenticated, so any tampering
 * (or wrong key) fails closed rather than returning corrupt plaintext.
 */
export function decryptWithDataKey(
  payload: EncryptedPayload,
  dataKey: Uint8Array,
  aad?: Uint8Array,
): Uint8Array {
  assertKey(dataKey);
  if (payload.authTag.byteLength !== AUTH_TAG_BYTES) {
    throw new Error("kyc/envelope: invalid auth tag length");
  }
  const decipher = createDecipheriv(ALGORITHM, dataKey, payload.iv, {
    authTagLength: AUTH_TAG_BYTES,
  });
  decipher.setAuthTag(payload.authTag);
  if (aad && aad.byteLength > 0) decipher.setAAD(aad);
  const plaintext = Buffer.concat([decipher.update(payload.ciphertext), decipher.final()]);
  return new Uint8Array(plaintext);
}

/** Constant-time byte-equality (re-exported for callers comparing key material). */
export function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.byteLength !== b.byteLength) return false;
  return timingSafeEqual(a, b);
}
