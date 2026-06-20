/**
 * Shared in-memory fakes for vault/engine tests. Not a *.test.ts → never run as
 * a test suite; only imported by the real suites. IO is faked; the real crypto
 * + vault + engine logic run unchanged.
 */
import { KycVault } from "../vault/vault";
import { EnvMasterKeyProvider } from "../crypto/master-key";
import type {
  ArtifactRecord,
  AuditEntry,
  RetentionCandidate,
  VaultArtifactRepo,
  VaultAudit,
  VaultBlobStore,
} from "../vault/ports";

export class InMemoryBlobStore implements VaultBlobStore {
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

export class InMemoryRepo implements VaultArtifactRepo {
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
  async listShreddable(): Promise<RetentionCandidate[]> {
    return [...this.rows.values()]
      .filter((r) => !r.cryptoShreddedAt)
      .map((r) => ({
        id: r.id,
        userId: r.userId,
        createdAt: r.createdAt,
        retentionHoldUntil: r.retentionHoldUntil,
        legalHoldReason: r.legalHoldReason,
        cryptoShreddedAt: r.cryptoShreddedAt,
      }));
  }
  async markShredded(id: string, shreddedAt: string, _reason: string): Promise<void> {
    const r = this.rows.get(id);
    if (!r) throw new Error("no row " + id);
    r.wrappedDataKey = null;
    r.cryptoShreddedAt = shreddedAt;
  }
}

export class RecordingAudit implements VaultAudit {
  entries: AuditEntry[] = [];
  async record(e: AuditEntry): Promise<void> {
    this.entries.push(e);
  }
}

let idCounter = 0;

export function makeVaultKit(opts: { masterSeed?: number; now?: () => Date } = {}) {
  const seed = opts.masterSeed ?? 5;
  const key = new Uint8Array(32).map((_, i) => (i * 17 + seed) % 256);
  const masterKey = new EnvMasterKeyProvider({ masterKey: key, keyVersion: "env-test" });
  const blobStore = new InMemoryBlobStore();
  const repo = new InMemoryRepo();
  const audit = new RecordingAudit();
  const now = opts.now ?? (() => new Date("2026-06-20T00:00:00.000Z"));
  const vault = new KycVault({
    blobStore,
    repo,
    audit,
    masterKey,
    bucket: "kyc-vault",
    now,
    idGen: () => `art-${idCounter++}`,
  });
  return { vault, blobStore, repo, audit, masterKey, now };
}
