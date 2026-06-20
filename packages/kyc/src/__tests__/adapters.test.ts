import { test } from "node:test";
import assert from "node:assert/strict";

import { SupabaseVaultBlobStore } from "../server/supabase-blob-store";
import { SupabaseVaultArtifactRepo } from "../server/supabase-artifact-repo";
import { toAuditLogInput } from "../server/audit-map";
import type { ArtifactRecord } from "../vault/ports";

/* ---- fake Supabase surfaces ---- */

function fakeStorageClient() {
  const objects = new Map<string, Uint8Array>();
  let n = 0;
  const client = {
    storage: {
      from(bucket: string) {
        return {
          async upload(path: string, body: Blob, _opts: unknown) {
            const buf = new Uint8Array(await body.arrayBuffer());
            objects.set(`${bucket}/${path}`, buf);
            return { data: { path }, error: null };
          },
          async download(path: string) {
            const b = objects.get(`${bucket}/${path}`);
            if (!b) return { data: null, error: { message: "not found" } };
            return { data: new Blob([new Uint8Array(b)]), error: null };
          },
          async remove(paths: string[]) {
            for (const p of paths) objects.delete(`${bucket}/${p}`);
            return { data: {}, error: null };
          },
        };
      },
    },
  };
  return { client, objects, nextId: () => `id-${n++}` };
}

test("SupabaseVaultBlobStore round-trips bytes and yields a private media:// ref", async () => {
  const { client, nextId } = fakeStorageClient();
  const store = new SupabaseVaultBlobStore({ client: client as any, idGen: nextId });
  const bytes = new Uint8Array([1, 2, 3, 250, 251, 0, 255]);
  const ref = await store.putCiphertext({ bucket: "kyc-vault", pathPrefix: "rec1", bytes });
  assert.match(ref, /^media:\/\/private\/kyc-vault\//);
  const back = await store.getCiphertext(ref);
  assert.deepEqual([...back], [...bytes]);
  await store.removeCiphertext(ref);
  await assert.rejects(() => store.getCiphertext(ref));
});

test("SupabaseVaultBlobStore refuses a non-private (public) media ref on read/remove", async () => {
  const { client } = fakeStorageClient();
  const store = new SupabaseVaultBlobStore({ client: client as any });
  const publicRef = "media://public/kyc-vault/x/0.bin";
  await assert.rejects(() => store.getCiphertext(publicRef), /non-private/);
  await assert.rejects(() => store.removeCiphertext(publicRef), /non-private/);
});

test("SupabaseVaultArtifactRepo round-trips bytea columns losslessly through base64 (no key corruption)", async () => {
  const tableRows = new Map<string, any>();
  const client = {
    async rpc(name: string, params: any) {
      if (name === "kyc_vault_store_artifact") {
        // Model the DB: p_-prefixed params land in column-named rows.
        tableRows.set(params.p_id, {
          id: params.p_id,
          user_id: params.p_user_id,
          submission_id: params.p_submission_id,
          media_ref: params.p_media_ref,
          wrapped_data_key: params.p_wrapped_data_key,
          key_provider: params.p_key_provider,
          key_version: params.p_key_version,
          content_iv: params.p_content_iv,
          content_auth_tag: params.p_content_auth_tag,
          content_type: params.p_content_type,
          document_type: params.p_document_type,
          byte_size: params.p_byte_size,
          created_at: params.p_created_at,
          retention_hold_until: null,
          legal_hold_reason: null,
          crypto_shredded_at: null,
        });
        return { data: params.p_id, error: null };
      }
      if (name === "kyc_vault_get_artifact") {
        const row = tableRows.get(params.p_id);
        return { data: row ?? null, error: null };
      }
      return { data: null, error: { message: "unknown rpc " + name } };
    },
  };
  const repo = new SupabaseVaultArtifactRepo({ client: client as any });

  // High-bit, zero, and 0xFF bytes are exactly where a bad encoding corrupts.
  const wrapped = new Uint8Array([0, 255, 128, 1, 254, 127, 0, 0]);
  const iv = new Uint8Array(12).map((_, i) => (i * 21) % 256);
  const tag = new Uint8Array(16).map((_, i) => (255 - i) % 256);
  const record: ArtifactRecord = {
    id: "art-1",
    userId: "u1",
    submissionId: null,
    mediaRef: "media://private/kyc-vault/art-1/0.bin",
    wrappedDataKey: wrapped,
    keyProvider: "env",
    keyVersion: "env-v1",
    contentIv: iv,
    contentAuthTag: tag,
    contentType: "image/jpeg",
    documentType: "nin",
    byteSize: 42,
    createdAt: "2026-06-20T00:00:00.000Z",
    retentionHoldUntil: null,
    legalHoldReason: null,
    cryptoShreddedAt: null,
  };
  await repo.insert(record);
  const back = (await repo.getById("art-1"))!;
  assert.deepEqual([...(back.wrappedDataKey ?? [])], [...wrapped], "wrapped key bytes preserved");
  assert.deepEqual([...back.contentIv], [...iv]);
  assert.deepEqual([...back.contentAuthTag], [...tag]);
  assert.equal(back.keyProvider, "env");
  assert.equal(back.contentType, "image/jpeg");
});

test("toAuditLogInput stamps the KYC entity type + division and never leaks PII into values", () => {
  const out = toAuditLogInput({
    action: "kyc.vault.artifact.read",
    entityId: "art-1",
    userId: "u1",
    actorUserId: "staff-9",
    reason: "staff review",
    metadata: { documentType: "nin", bvn: "22212345678" },
  });
  assert.equal(out.entityType, "kyc_verification");
  assert.equal(out.action, "kyc.vault.artifact.read");
  assert.equal(out.entityId, "art-1");
  assert.equal(out.reason, "staff review");
  assert.equal(out.division, "account");
  // metadata is redacted before being placed in newValues.
  assert.equal(JSON.stringify(out.newValues).includes("22212345678"), false);
});
