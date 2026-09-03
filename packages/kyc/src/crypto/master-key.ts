/**
 * @henryco/kyc — master-key layer (envelope encryption, key-wrapping).
 *
 * A {@link MasterKeyProvider} wraps and unwraps per-record **data keys** using
 * a **master key that lives OUTSIDE the database** — never a plain DB column.
 * This is the swappable key-management seam: the vault depends only on the
 * interface, so the master key can move from an env var to a cloud KMS without
 * touching vault logic.
 *
 * Threat model: a database-only breach yields, per record, the AES-256-GCM
 * ciphertext (in storage) plus a *wrapped* data key (in the DB). Neither is
 * usable without the master key, which is held by the provider outside the DB.
 *
 * Two implementations ship:
 *   - {@link EnvMasterKeyProvider} — master key from an env var (the dormant
 *     default; zero new infrastructure). Wrapping is local AES-256-GCM.
 *   - `KmsMasterKeyProvider` (see `kms-master-key.ts`) — master key held in AWS
 *     KMS (the recommended production target; the key never leaves the HSM).
 */
import { generateDataKey, type EncryptedPayload } from "./envelope";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const WRAP_ALGO = "aes-256-gcm";
const WRAP_IV_BYTES = 12;
const WRAP_TAG_BYTES = 16;
const MASTER_KEY_BYTES = 32;

/** Provider key strings (closed set so blobs can never be cross-decoded). */
export type MasterKeyProviderKey = "env" | "aws-kms";

/**
 * An opaque, self-describing wrapped data key. `blob` is meaningless without
 * the matching provider + master key. Persisted in the DB; safe to lose to a
 * DB-only breach.
 */
export type WrappedDataKey = {
  provider: MasterKeyProviderKey;
  /** Which master key wrapped this — enables rotation without re-wrapping all. */
  keyVersion: string;
  blob: Uint8Array;
};

export interface MasterKeyProvider {
  readonly providerKey: MasterKeyProviderKey;
  readonly keyVersion: string;
  /** Wrap (encrypt) a data key with the master key. */
  wrapDataKey(dataKey: Uint8Array): Promise<WrappedDataKey>;
  /** Unwrap (decrypt) a previously-wrapped data key. Throws on any mismatch. */
  unwrapDataKey(wrapped: WrappedDataKey): Promise<Uint8Array>;
}

/** Re-export so callers can mint a data key without reaching into the envelope module. */
export { generateDataKey };

function aadForVersion(keyVersion: string): Uint8Array {
  // Bind the wrap to its key version so a blob cannot be replayed under a
  // different declared version.
  return new TextEncoder().encode(`henryco-kyc-dek-wrap:${keyVersion}`);
}

/**
 * Env-var master key provider. The master key is a base64-encoded 256-bit value
 * read from the deployment environment — outside the database, in the platform
 * secret store (e.g. Vercel env). Wrapping uses AES-256-GCM locally.
 */
export class EnvMasterKeyProvider implements MasterKeyProvider {
  readonly providerKey = "env" as const;
  readonly keyVersion: string;
  readonly #masterKey: Uint8Array;

  constructor(opts: { masterKey: Uint8Array; keyVersion?: string }) {
    if (opts.masterKey.byteLength !== MASTER_KEY_BYTES) {
      throw new Error(
        `kyc/master-key: env master key must be ${MASTER_KEY_BYTES} bytes, got ${opts.masterKey.byteLength}`,
      );
    }
    this.#masterKey = opts.masterKey;
    this.keyVersion = opts.keyVersion?.trim() || "env-v1";
  }

  async wrapDataKey(dataKey: Uint8Array): Promise<WrappedDataKey> {
    const iv = randomBytes(WRAP_IV_BYTES);
    const cipher = createCipheriv(WRAP_ALGO, this.#masterKey, iv, {
      authTagLength: WRAP_TAG_BYTES,
    });
    cipher.setAAD(aadForVersion(this.keyVersion));
    const ciphertext = Buffer.concat([cipher.update(dataKey), cipher.final()]);
    const authTag = cipher.getAuthTag();
    // Frame: iv || authTag || ciphertext.
    const blob = Buffer.concat([iv, authTag, ciphertext]);
    return { provider: "env", keyVersion: this.keyVersion, blob: new Uint8Array(blob) };
  }

  async unwrapDataKey(wrapped: WrappedDataKey): Promise<Uint8Array> {
    if (wrapped.provider !== "env") {
      throw new Error(`kyc/master-key: env provider cannot unwrap a '${wrapped.provider}' blob`);
    }
    if (wrapped.keyVersion !== this.keyVersion) {
      throw new Error(
        `kyc/master-key: key version mismatch (blob '${wrapped.keyVersion}' vs provider '${this.keyVersion}')`,
      );
    }
    if (wrapped.blob.byteLength <= WRAP_IV_BYTES + WRAP_TAG_BYTES) {
      throw new Error("kyc/master-key: wrapped blob too short");
    }
    const iv = wrapped.blob.subarray(0, WRAP_IV_BYTES);
    const authTag = wrapped.blob.subarray(WRAP_IV_BYTES, WRAP_IV_BYTES + WRAP_TAG_BYTES);
    const ciphertext = wrapped.blob.subarray(WRAP_IV_BYTES + WRAP_TAG_BYTES);
    const decipher = createDecipheriv(WRAP_ALGO, this.#masterKey, iv, {
      authTagLength: WRAP_TAG_BYTES,
    });
    decipher.setAuthTag(authTag);
    decipher.setAAD(aadForVersion(this.keyVersion));
    const dataKey = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return new Uint8Array(dataKey);
  }

  /** Build from an env bag, throwing if the key is absent or malformed. */
  static fromEnv(env: Record<string, string | undefined> = process.env): EnvMasterKeyProvider {
    const raw = (env.KYC_VAULT_MASTER_KEY || "").trim();
    if (!raw) {
      throw new Error("kyc/master-key: KYC_VAULT_MASTER_KEY is not configured");
    }
    let key: Buffer;
    try {
      key = Buffer.from(raw, "base64");
    } catch {
      throw new Error("kyc/master-key: KYC_VAULT_MASTER_KEY is not valid base64");
    }
    if (key.byteLength !== MASTER_KEY_BYTES) {
      throw new Error(
        `kyc/master-key: KYC_VAULT_MASTER_KEY must decode to ${MASTER_KEY_BYTES} bytes, got ${key.byteLength}`,
      );
    }
    return new EnvMasterKeyProvider({
      masterKey: new Uint8Array(key),
      keyVersion: (env.KYC_VAULT_MASTER_KEY_VERSION || "").trim() || "env-v1",
    });
  }

  /** Like {@link fromEnv} but returns null when unconfigured (for dormant detection). */
  static tryFromEnv(
    env: Record<string, string | undefined> = process.env,
  ): EnvMasterKeyProvider | null {
    if (!(env.KYC_VAULT_MASTER_KEY || "").trim()) return null;
    return EnvMasterKeyProvider.fromEnv(env);
  }
}

export type { EncryptedPayload };
