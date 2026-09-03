import { test } from "node:test";
import assert from "node:assert/strict";

import { generateDataKey } from "../crypto/envelope";
import { KmsMasterKeyProvider } from "../crypto/kms-master-key";

/**
 * A fake AWS KMS endpoint: Encrypt stores plaintext under an opaque blob and
 * returns it; Decrypt looks the plaintext back up. Also records the last
 * request so we can assert the SigV4 signing + target headers.
 */
function fakeKms() {
  const store = new Map<string, string>(); // base64 blob -> base64 plaintext
  let counter = 0;
  const calls: Array<{ target: string; auth: string; amzDate: string; body: any }> = [];
  const fetchImpl: typeof fetch = async (_url, init) => {
    const headers = new Headers(init?.headers as HeadersInit);
    const target = headers.get("x-amz-target") || "";
    const body = JSON.parse(String(init?.body ?? "{}"));
    calls.push({
      target,
      auth: headers.get("authorization") || "",
      amzDate: headers.get("x-amz-date") || "",
      body,
    });
    if (target.endsWith("Encrypt")) {
      const blob = Buffer.from(`blob-${counter++}-${body.KeyId}`).toString("base64");
      store.set(blob, body.Plaintext);
      return new Response(JSON.stringify({ CiphertextBlob: blob, KeyId: body.KeyId }), {
        status: 200,
      });
    }
    if (target.endsWith("Decrypt")) {
      const pt = store.get(body.CiphertextBlob);
      if (!pt) return new Response(JSON.stringify({ __type: "InvalidCiphertextException" }), { status: 400 });
      return new Response(JSON.stringify({ Plaintext: pt }), { status: 200 });
    }
    return new Response("{}", { status: 400 });
  };
  return { fetchImpl, calls };
}

function makeProvider(extra?: Partial<ConstructorParameters<typeof KmsMasterKeyProvider>[0]>) {
  const { fetchImpl, calls } = fakeKms();
  const provider = new KmsMasterKeyProvider({
    region: "us-east-1",
    accessKeyId: "AKIAEXAMPLE",
    secretAccessKey: "secretexample",
    keyId: "arn:aws:kms:us-east-1:544011261114:key/abc-123",
    fetchImpl,
    now: () => new Date("2026-06-20T05:46:00.000Z"),
    ...extra,
  });
  return { provider, calls };
}

test("KmsMasterKeyProvider identifies itself and pins the CMK as version", () => {
  const { provider } = makeProvider();
  assert.equal(provider.providerKey, "aws-kms");
  assert.equal(provider.keyVersion, "arn:aws:kms:us-east-1:544011261114:key/abc-123");
});

test("wrap → unwrap round-trips through (fake) KMS", async () => {
  const { provider } = makeProvider();
  const dek = generateDataKey();
  const wrapped = await provider.wrapDataKey(dek);
  assert.equal(wrapped.provider, "aws-kms");
  const recovered = await provider.unwrapDataKey(wrapped);
  assert.deepEqual([...recovered], [...dek]);
});

test("the data key is never sent in cleartext — Encrypt carries base64 plaintext to KMS only, and the stored blob is opaque", async () => {
  const { provider } = makeProvider();
  const dek = generateDataKey();
  const wrapped = await provider.wrapDataKey(dek);
  const needle = [...dek].join(",");
  let found = false;
  for (let i = 0; i + dek.byteLength <= wrapped.blob.byteLength; i++) {
    if ([...wrapped.blob.subarray(i, i + dek.byteLength)].join(",") === needle) found = true;
  }
  assert.equal(found, false, "raw key must not be recoverable from the stored KMS blob");
});

test("requests are SigV4-signed and target the KMS Encrypt/Decrypt operations", async () => {
  const { provider, calls } = makeProvider();
  const wrapped = await provider.wrapDataKey(generateDataKey());
  await provider.unwrapDataKey(wrapped);
  assert.equal(calls.length, 2);
  assert.ok(calls[0].target.endsWith("Encrypt"));
  assert.ok(calls[1].target.endsWith("Decrypt"));
  for (const c of calls) {
    assert.ok(c.auth.startsWith("AWS4-HMAC-SHA256 "), "must be SigV4-signed");
    assert.ok(/Signature=[0-9a-f]{64}/.test(c.auth), "must carry a hex signature");
    assert.ok(/^\d{8}T\d{6}Z$/.test(c.amzDate), "must carry an X-Amz-Date");
  }
});

test("unwrapping a non-KMS blob is refused", async () => {
  const { provider } = makeProvider();
  await assert.rejects(() =>
    provider.unwrapDataKey({ provider: "env", keyVersion: "x", blob: new Uint8Array([1, 2, 3]) }),
  );
});

test("a KMS error response surfaces as a thrown error", async () => {
  const { provider } = makeProvider();
  await assert.rejects(() =>
    provider.unwrapDataKey({
      provider: "aws-kms",
      keyVersion: "arn:aws:kms:us-east-1:544011261114:key/abc-123",
      blob: new Uint8Array([9, 9, 9]),
    }),
  );
});

test("tryFromEnv returns null when KMS is unconfigured", () => {
  assert.equal(KmsMasterKeyProvider.tryFromEnv({}), null);
});

test("tryFromEnv builds a provider when KMS env is present", () => {
  const p = KmsMasterKeyProvider.tryFromEnv({
    KYC_VAULT_KMS_KEY_ID: "arn:aws:kms:us-east-1:544011261114:key/abc-123",
    AWS_ACCESS_KEY_ID: "AKIAEXAMPLE",
    AWS_SECRET_ACCESS_KEY: "secretexample",
    AWS_REGION: "us-east-1",
  });
  assert.ok(p);
  assert.equal(p?.providerKey, "aws-kms");
});
