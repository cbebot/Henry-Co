import { test } from "node:test";
import assert from "node:assert/strict";

import { generateDataKey } from "../crypto/envelope";
import {
  EnvMasterKeyProvider,
  type WrappedDataKey,
} from "../crypto/master-key";

function makeProvider(seed = 7, version = "env-v1") {
  const key = new Uint8Array(32).map((_, i) => (i * 31 + seed) % 256);
  return new EnvMasterKeyProvider({ masterKey: key, keyVersion: version });
}

test("EnvMasterKeyProvider identifies itself", () => {
  const p = makeProvider();
  assert.equal(p.providerKey, "env");
  assert.equal(p.keyVersion, "env-v1");
});

test("wrap → unwrap round-trips the data key", async () => {
  const p = makeProvider();
  const dek = generateDataKey();
  const wrapped = await p.wrapDataKey(dek);
  const recovered = await p.unwrapDataKey(wrapped);
  assert.deepEqual([...recovered], [...dek]);
});

test("the wrapped blob never contains the plaintext data key", async () => {
  const p = makeProvider();
  const dek = generateDataKey();
  const wrapped = await p.wrapDataKey(dek);
  // Slide a window over the blob looking for the raw key — must not appear.
  const blob = wrapped.blob;
  const needle = [...dek].join(",");
  let found = false;
  for (let i = 0; i + dek.byteLength <= blob.byteLength; i++) {
    if ([...blob.subarray(i, i + dek.byteLength)].join(",") === needle) found = true;
  }
  assert.equal(found, false, "raw data key must not be present in the wrapped blob");
  assert.equal(wrapped.provider, "env");
  assert.equal(wrapped.keyVersion, "env-v1");
});

test("two wraps of the same key produce different blobs (fresh IV)", async () => {
  const p = makeProvider();
  const dek = generateDataKey();
  const a = await p.wrapDataKey(dek);
  const b = await p.wrapDataKey(dek);
  assert.notDeepEqual([...a.blob], [...b.blob]);
});

test("unwrapping with a provider holding a different master key fails", async () => {
  const a = makeProvider(7);
  const b = makeProvider(99);
  const wrapped = await a.wrapDataKey(generateDataKey());
  await assert.rejects(() => b.unwrapDataKey(wrapped));
});

test("tampering with the wrapped blob is detected", async () => {
  const p = makeProvider();
  const wrapped = await p.wrapDataKey(generateDataKey());
  const tampered: WrappedDataKey = { ...wrapped, blob: new Uint8Array(wrapped.blob) };
  tampered.blob[tampered.blob.byteLength - 1] ^= 0xff;
  await assert.rejects(() => p.unwrapDataKey(tampered));
});

test("unwrapping a blob from a different provider is refused", async () => {
  const p = makeProvider();
  const wrapped = await p.wrapDataKey(generateDataKey());
  const foreign: WrappedDataKey = { ...wrapped, provider: "aws-kms" };
  await assert.rejects(() => p.unwrapDataKey(foreign));
});

test("fromEnv reads a base64 256-bit key and version", async () => {
  const raw = Buffer.from(new Uint8Array(32).map((_, i) => i)).toString("base64");
  const p = EnvMasterKeyProvider.fromEnv({
    KYC_VAULT_MASTER_KEY: raw,
    KYC_VAULT_MASTER_KEY_VERSION: "env-2026",
  });
  assert.equal(p.providerKey, "env");
  assert.equal(p.keyVersion, "env-2026");
  const dek = generateDataKey();
  assert.deepEqual([...(await p.unwrapDataKey(await p.wrapDataKey(dek)))], [...dek]);
});

test("fromEnv throws when the key is missing or not 32 bytes", () => {
  assert.throws(() => EnvMasterKeyProvider.fromEnv({}));
  assert.throws(() =>
    EnvMasterKeyProvider.fromEnv({ KYC_VAULT_MASTER_KEY: Buffer.from("short").toString("base64") }),
  );
});

test("fromEnv returns null-safe absence via tryFromEnv when unconfigured", () => {
  assert.equal(EnvMasterKeyProvider.tryFromEnv({}), null);
});
