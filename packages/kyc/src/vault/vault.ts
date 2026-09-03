/**
 * @henryco/kyc — the KYC vault service.
 *
 * Encrypt-before-store for the rare case a raw identity artifact (ID image,
 * selfie) genuinely must be held. The default for verification is the minimized
 * verdict (see `verdict.ts`); this service exists for the artifact path only.
 *
 * Guarantees:
 *   - Storage holds ONLY AES-256-GCM ciphertext (a private bucket of opaque
 *     octet-stream). The DB holds the envelope-WRAPPED data key + iv + tag.
 *   - Decryption requires the master key (held outside the DB by the injected
 *     MasterKeyProvider). A DB-or-storage breach yields nothing usable.
 *   - The content is bound to its record id via GCM AAD, so a ciphertext blob
 *     cannot be swapped into another record.
 *   - Crypto-shred destroys the DB copy of the wrapped data key (logical erasure)
 *     then removes the blob → the LIVE artifact is immediately unrecoverable. A DB
 *     backup taken BEFORE the shred still holds that wrapped key; because the
 *     WRAPPING (master) key is unchanged, that backup stays decryptable until it
 *     ages out per backup-retention — true under BOTH providers as built.
 *     Immediate backup-irreversibility requires destroying/rotating the wrapping
 *     key itself (env: rotate KYC_VAULT_MASTER_KEY; KMS: ScheduleKeyDeletion of the
 *     CMK / per-record CMKs), not a row-level shred. Every op is audited.
 *
 * Reachable only via the server barrel + exports map (no deep import); uses
 * node:crypto so it is server/Node-only.
 */
import {
  decryptWithDataKey,
  encryptWithDataKey,
  generateDataKey,
} from "../crypto/envelope";
import type { MasterKeyProvider } from "../crypto/master-key";
import type {
  ArtifactRecord,
  VaultArtifactRepo,
  VaultAudit,
  VaultBlobStore,
} from "./ports";

const DEFAULT_BUCKET = "kyc-vault";

function randomId(): string {
  // crypto.randomUUID is available in Node 20+ and Edge.
  return `kycart_${crypto.randomUUID()}`;
}

/** GCM additional-authenticated-data binding ciphertext to its record id. */
function aadForRecord(id: string): Uint8Array {
  return new TextEncoder().encode(`henryco-kyc-artifact:${id}`);
}

export type KycVaultDeps = {
  blobStore: VaultBlobStore;
  repo: VaultArtifactRepo;
  audit: VaultAudit;
  masterKey: MasterKeyProvider;
  bucket?: string;
  now?: () => Date;
  idGen?: () => string;
};

export type StoreArtifactInput = {
  userId: string;
  submissionId?: string | null;
  documentType: string;
  content: Uint8Array;
  contentType: string;
};

export class KycVault {
  readonly #blobStore: VaultBlobStore;
  readonly #repo: VaultArtifactRepo;
  readonly #audit: VaultAudit;
  readonly #masterKey: MasterKeyProvider;
  readonly #bucket: string;
  readonly #now: () => Date;
  readonly #idGen: () => string;

  constructor(deps: KycVaultDeps) {
    this.#blobStore = deps.blobStore;
    this.#repo = deps.repo;
    this.#audit = deps.audit;
    this.#masterKey = deps.masterKey;
    this.#bucket = deps.bucket ?? DEFAULT_BUCKET;
    this.#now = deps.now ?? (() => new Date());
    this.#idGen = deps.idGen ?? randomId;
  }

  /** Encrypt + store a raw artifact, returning the record id + media ref. */
  async storeEncryptedArtifact(
    input: StoreArtifactInput,
  ): Promise<{ id: string; mediaRef: string }> {
    const id = this.#idGen();
    const dataKey = generateDataKey();
    try {
      const encrypted = encryptWithDataKey(input.content, dataKey, aadForRecord(id));
      const wrapped = await this.#masterKey.wrapDataKey(dataKey);
      const mediaRef = await this.#blobStore.putCiphertext({
        bucket: this.#bucket,
        pathPrefix: id,
        bytes: encrypted.ciphertext,
      });
      const record: ArtifactRecord = {
        id,
        userId: input.userId,
        submissionId: input.submissionId ?? null,
        mediaRef,
        wrappedDataKey: wrapped.blob,
        keyProvider: wrapped.provider,
        keyVersion: wrapped.keyVersion,
        contentIv: encrypted.iv,
        contentAuthTag: encrypted.authTag,
        contentType: input.contentType,
        documentType: input.documentType,
        byteSize: input.content.byteLength,
        createdAt: this.#now().toISOString(),
        retentionHoldUntil: null,
        legalHoldReason: null,
        cryptoShreddedAt: null,
      };
      await this.#repo.insert(record);
      await this.#audit.record({
        action: "kyc.vault.artifact.stored",
        entityId: id,
        userId: input.userId,
        metadata: { documentType: input.documentType, keyProvider: wrapped.provider, byteSize: record.byteSize },
      });
      return { id, mediaRef };
    } finally {
      dataKey.fill(0); // best-effort zeroing of the plaintext data key
    }
  }

  /** Download + decrypt an artifact, returning plaintext bytes (server-side only). */
  async readArtifact(
    id: string,
    opts: { actorUserId?: string | null; reason?: string },
  ): Promise<{ bytes: Uint8Array; contentType: string }> {
    const record = await this.#repo.getById(id);
    if (!record) throw new Error(`kyc/vault: artifact ${id} not found`);
    if (record.cryptoShreddedAt || !record.wrappedDataKey) {
      throw new Error(`kyc/vault: artifact ${id} has been crypto-shredded and is unrecoverable`);
    }
    const dataKey = await this.#masterKey.unwrapDataKey({
      provider: record.keyProvider,
      keyVersion: record.keyVersion,
      blob: record.wrappedDataKey,
    });
    try {
      const ciphertext = await this.#blobStore.getCiphertext(record.mediaRef);
      const bytes = decryptWithDataKey(
        { ciphertext, iv: record.contentIv, authTag: record.contentAuthTag },
        dataKey,
        aadForRecord(id),
      );
      await this.#audit.record({
        action: "kyc.vault.artifact.read",
        entityId: id,
        userId: record.userId,
        actorUserId: opts.actorUserId ?? null,
        reason: opts.reason,
      });
      return { bytes, contentType: record.contentType };
    } finally {
      dataKey.fill(0);
    }
  }

  /**
   * Crypto-shred: destroy the DB copy of the wrapped data key (the live ciphertext
   * becomes undecryptable), then remove the blob. Backups predating the shred stay
   * decryptable (under BOTH providers) until they age out, because the wrapping key
   * is unchanged — immediate backup-irreversibility needs the wrapping key itself
   * rotated/destroyed (env: rotate the master key; KMS: ScheduleKeyDeletion).
   * Idempotent + audited.
   */
  async cryptoShred(
    id: string,
    reason: string,
    opts: { actorUserId?: string | null } = {},
  ): Promise<void> {
    const record = await this.#repo.getById(id);
    if (!record) throw new Error(`kyc/vault: artifact ${id} not found`);
    if (record.cryptoShreddedAt || !record.wrappedDataKey) {
      await this.#audit.record({
        action: "kyc.vault.artifact.crypto_shred.noop",
        entityId: id,
        userId: record.userId,
        actorUserId: opts.actorUserId ?? null,
        reason,
      });
      return;
    }
    const shreddedAt = this.#now().toISOString();
    // 1) Destroy the key first — this is the irreversible step.
    await this.#repo.markShredded(id, shreddedAt, reason);
    // 2) Physical cleanup of the (now-undecryptable) blob; best-effort.
    let blobRemoved = true;
    try {
      await this.#blobStore.removeCiphertext(record.mediaRef);
    } catch {
      blobRemoved = false; // key already destroyed → bytes are unrecoverable regardless
    }
    await this.#audit.record({
      action: "kyc.vault.artifact.crypto_shredded",
      entityId: id,
      userId: record.userId,
      actorUserId: opts.actorUserId ?? null,
      reason,
      metadata: { blobRemoved },
    });
  }
}
