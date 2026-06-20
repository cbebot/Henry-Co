import { test } from "node:test";
import assert from "node:assert/strict";

import { KycVault } from "../vault/vault";
import { EnvMasterKeyProvider } from "../crypto/master-key";
import type { ArtifactRecord, VaultArtifactRepo, VaultBlobStore, VaultAudit, AuditEntry } from "../vault/ports";

/* ---- in-memory fakes (IO only; the REAL crypto + vault logic run) ---- */

class InMemoryBlobStore implements VaultBlobStore {
  blobs = new Map<string, Uint8Array>();
  private n = 0;
  async putCiphertext(input: { bucket: string; pathPrefix: string; bytes: Uint8Array }): Promise<string> {
    const ref = `media://private/${input.bucket}/${input.pathPrefix}/${this.n++}.bin`;
    this.blobs.set(ref, new Uint8Array(input.bytes));
    return ref;
  }
  async getCiphertext(ref: string): Promise<Uint8Array> {
    const b = this.blobs.get(ref);
    if (!b) throw new Error("blob not found: " + ref);
    return b;
  }
  async removeCiphertext(ref: string): Promise<void> {
    this.blobs.delete(ref);
  }
}

class InMemoryRepo implements VaultArtifactRepo {
  rows = new Map<string, ArtifactRecord>();
  async insert(r: ArtifactRecord): Promise<ArtifactRecord> {
    this.rows.set(r.id, { ...r });
    return r;
  }
  async getById(id: string): Promise<ArtifactRecord | null> {
    const r = this.rows.get(id);
    return r ? { ...r } : null;
  }
  async listByUser(userId: string): Promise<ArtifactRecord[]> {
    return [...this.rows.values()].filter((r) => r.userId === userId).map((r) => ({ ...r }));
  }
  async listShreddable(): Promise<ArtifactRecord[]> {
    return [...this.rows.values()].filter((r) => !r.cryptoShreddedAt).map((r) => ({ ...r }));
  }
  async markShredded(id: string, shreddedAt: string, _reason: string): Promise<void> {
    const r = this.rows.get(id);
    if (!r) throw new Error("no row " + id);
    r.wrappedDataKey = null; // crypto-shred: destroy the key
    r.cryptoShreddedAt = shreddedAt;
  }
}

class RecordingAudit implements VaultAudit {
  entries: AuditEntry[] = [];
  async record(e: AuditEntry): Promise<void> {
    this.entries.push(e);
  }
}

let idCounter = 0;
function makeVault(masterSeed = 5) {
  const key = new Uint8Array(32).map((_, i) => (i * 17 + masterSeed) % 256);
  const masterKey = new EnvMasterKeyProvider({ masterKey: key, keyVersion: "env-test" });
  const blobStore = new InMemoryBlobStore();
  const repo = new InMemoryRepo();
  const audit = new RecordingAudit();
  const vault = new KycVault({
    blobStore,
    repo,
    audit,
    masterKey,
    bucket: "kyc-vault",
    now: () => new Date("2026-06-20T05:46:00.000Z"),
    idGen: () => `art-${idCounter++}`,
  });
  return { vault, blobStore, repo, audit, masterKey, key };
}

const utf8 = (s: string) => new TextEncoder().encode(s);

test("store → read round-trips the plaintext artifact", async () => {
  const { vault } = makeVault();
  const content = utf8("📄 government id bytes");
  const { id } = await vault.storeEncryptedArtifact({
    userId: "u1",
    documentType: "government_id",
    content,
    contentType: "image/jpeg",
  });
  const read = await vault.readArtifact(id, { actorUserId: "u1", reason: "self view" });
  assert.equal(new TextDecoder().decode(read.bytes), "📄 government id bytes");
  assert.equal(read.contentType, "image/jpeg");
});

test("the stored blob is opaque ciphertext — plaintext never reaches storage", async () => {
  const { vault, blobStore } = makeVault();
  await vault.storeEncryptedArtifact({
    userId: "u1",
    documentType: "selfie",
    content: utf8("PLAINTEXT-SELFIE-MARKER"),
    contentType: "image/png",
  });
  for (const bytes of blobStore.blobs.values()) {
    assert.equal(
      new TextDecoder().decode(bytes).includes("PLAINTEXT-SELFIE-MARKER"),
      false,
      "ciphertext must not contain the plaintext",
    );
  }
});

test("the DB row stores a WRAPPED key, never the raw data key or plaintext", async () => {
  const { vault, repo } = makeVault();
  const { id } = await vault.storeEncryptedArtifact({
    userId: "u1",
    documentType: "nin",
    content: utf8("RAW-DOC"),
    contentType: "image/jpeg",
  });
  const row = (await repo.getById(id))!;
  assert.ok(row.wrappedDataKey && row.wrappedDataKey.byteLength > 0);
  assert.equal(row.keyProvider, "env");
  assert.equal(JSON.stringify(row).includes("RAW-DOC"), false);
});

test("SIMULATED DB-ONLY BREACH: rows + ciphertext, but no master key → nothing usable", async () => {
  // Attacker captures the DB rows and the storage blobs from a victim vault.
  const victim = makeVault(5);
  const content = utf8("super-sensitive-id");
  const { id } = await victim.vault.storeEncryptedArtifact({
    userId: "u1",
    documentType: "passport",
    content,
    contentType: "image/jpeg",
  });
  const row = (await victim.repo.getById(id))!;

  // Reconstruct a vault from ONLY the exfiltrated DB + storage, but with a
  // DIFFERENT (attacker) master key — i.e. they lack the real master key.
  const attacker = makeVault(200); // different master key
  // graft the victim's stolen DB rows + blobs into the attacker's stores
  (attacker.repo as any).rows = (victim.repo as any).rows;
  (attacker.blobStore as any).blobs = (victim.blobStore as any).blobs;

  await assert.rejects(
    () => attacker.vault.readArtifact(id, {}),
    "without the master key the wrapped data key cannot be unwrapped",
  );
  // And the raw plaintext appears nowhere in the exfiltrated material.
  const dump =
    JSON.stringify(row) +
    [...(victim.blobStore as any).blobs.values()].map((b: Uint8Array) => new TextDecoder().decode(b)).join("");
  assert.equal(dump.includes("super-sensitive-id"), false);
});

test("crypto-shred destroys the key so the artifact is permanently unrecoverable", async () => {
  const { vault, repo, blobStore } = makeVault();
  const { id, mediaRef } = await vault.storeEncryptedArtifact({
    userId: "u1",
    documentType: "selfie",
    content: utf8("to-be-shredded"),
    contentType: "image/png",
  });
  await vault.cryptoShred(id, "retention expiry");
  const row = (await repo.getById(id))!;
  assert.equal(row.wrappedDataKey, null, "wrapped key destroyed");
  assert.ok(row.cryptoShreddedAt);
  assert.equal(blobStore.blobs.has(mediaRef), false, "ciphertext blob removed");
  await assert.rejects(() => vault.readArtifact(id, {}), "shredded artifact cannot be read");
});

test("crypto-shred is idempotent", async () => {
  const { vault } = makeVault();
  const { id } = await vault.storeEncryptedArtifact({
    userId: "u1",
    documentType: "selfie",
    content: utf8("x"),
    contentType: "image/png",
  });
  await vault.cryptoShred(id, "first");
  await vault.cryptoShred(id, "second"); // must not throw
});

test("a ciphertext blob cannot be swapped between records (AAD binds it to its id)", async () => {
  const { vault, repo } = makeVault();
  const a = await vault.storeEncryptedArtifact({ userId: "u1", documentType: "nin", content: utf8("A-DOC"), contentType: "image/jpeg" });
  const b = await vault.storeEncryptedArtifact({ userId: "u2", documentType: "nin", content: utf8("B-DOC"), contentType: "image/jpeg" });
  // Attacker swaps record A's pointer to B's ciphertext.
  const rowA = (await repo.getById(a.id))!;
  const rowB = (await repo.getById(b.id))!;
  rowA.mediaRef = rowB.mediaRef;
  (repo as any).rows.set(a.id, rowA);
  await assert.rejects(() => vault.readArtifact(a.id, {}), "swapped ciphertext must fail to decrypt");
});

test("every state-changing operation writes an audit row", async () => {
  const { vault, audit } = makeVault();
  const { id } = await vault.storeEncryptedArtifact({ userId: "u1", documentType: "nin", content: utf8("x"), contentType: "image/jpeg" });
  await vault.readArtifact(id, { actorUserId: "u1", reason: "self" });
  await vault.cryptoShred(id, "test");
  const actions = audit.entries.map((e) => e.action);
  assert.ok(actions.some((a) => a.includes("stored")));
  assert.ok(actions.some((a) => a.includes("read")));
  assert.ok(actions.some((a) => a.includes("shred")));
});
