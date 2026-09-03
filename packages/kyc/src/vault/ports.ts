/**
 * @henryco/kyc — vault dependency ports (hexagonal seams).
 *
 * The vault depends only on these interfaces, never on Supabase / @henryco/media
 * directly. The app supplies adapters (a service-role-client-backed blob store,
 * an RPC-backed repo, a writeAuditLog-backed audit sink). This keeps the vault
 * storage-vendor-neutral and unit-testable with in-memory fakes — the same
 * discipline as the provider seam.
 *
 * Types only — client-safe.
 */
import type { MasterKeyProviderKey } from "../crypto/master-key";

/** A persisted encrypted-artifact row. `wrappedDataKey === null` ⇒ crypto-shredded. */
export type ArtifactRecord = {
  id: string;
  userId: string;
  submissionId: string | null;
  /** media:// pointer to the ciphertext blob in private storage. */
  mediaRef: string;
  /** Envelope-wrapped data key; destroyed (set null) on crypto-shred. */
  wrappedDataKey: Uint8Array | null;
  keyProvider: MasterKeyProviderKey;
  keyVersion: string;
  /** AES-256-GCM nonce + tag of the CONTENT (not the wrapped key). */
  contentIv: Uint8Array;
  contentAuthTag: Uint8Array;
  contentType: string;
  documentType: string;
  byteSize: number;
  createdAt: string;
  retentionHoldUntil: string | null;
  legalHoldReason: string | null;
  cryptoShreddedAt: string | null;
};

/** A new artifact record being inserted (id + crypto material supplied by the vault). */
export type NewArtifactRecord = Omit<ArtifactRecord, "retentionHoldUntil" | "legalHoldReason" | "cryptoShreddedAt"> & {
  retentionHoldUntil?: string | null;
  legalHoldReason?: string | null;
  cryptoShreddedAt?: string | null;
};

/** Storage port — wraps the private-bucket put/get/remove for opaque ciphertext. */
export interface VaultBlobStore {
  putCiphertext(input: { bucket: string; pathPrefix: string; bytes: Uint8Array }): Promise<string>;
  getCiphertext(ref: string): Promise<Uint8Array>;
  removeCiphertext(ref: string): Promise<void>;
}

/**
 * A LIGHT retention-scan projection — deliberately excludes the crypto material
 * (wrapped key / iv / tag). The retention sweep only needs the id + lifecycle
 * fields to decide; never pull wrapping keys into app memory for a scan.
 */
export type RetentionCandidate = {
  id: string;
  userId: string;
  createdAt: string;
  retentionHoldUntil: string | null;
  legalHoldReason: string | null;
  cryptoShreddedAt: string | null;
};

/** DB port for artifact rows. Concrete impl is grant-locked RPCs / service-role writes. */
export interface VaultArtifactRepo {
  insert(record: ArtifactRecord): Promise<ArtifactRecord>;
  getById(id: string): Promise<ArtifactRecord | null>;
  listByUser(userId: string): Promise<ArtifactRecord[]>;
  /** Returns a LIGHT projection (no crypto material) for the scheduled scan. */
  listShreddable(now: string): Promise<RetentionCandidate[]>;
  markShredded(id: string, shreddedAt: string, reason: string): Promise<void>;
}

export type AuditEntry = {
  action: string;
  entityId: string;
  userId?: string | null;
  actorUserId?: string | null;
  reason?: string;
  metadata?: Record<string, unknown>;
};

/** Audit port — concrete impl composes writeAuditLog (@henryco/observability). */
export interface VaultAudit {
  record(entry: AuditEntry): Promise<void>;
}
