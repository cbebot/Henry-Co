/**
 * @henryco/kyc — AWS KMS master-key provider (recommended production target).
 *
 * The master key is a KMS Customer Master Key (CMK); the plaintext key material
 * NEVER leaves the KMS HSM. We call KMS `Encrypt` to wrap a data key and
 * `Decrypt` to unwrap it. A database-OR-application breach yields only KMS
 * CiphertextBlobs, which are inert without KMS access (separately IAM-gated).
 *
 * Dependency-free: KMS is reached over its HTTPS JSON API with SigV4 signing
 * (see `aws-sigv4.ts`), mirroring the SES rail — no `@aws-sdk/*` weight.
 *
 * Dormant by default: `tryFromEnv` returns null unless `KYC_VAULT_KMS_KEY_ID`
 * (+ AWS credentials) are configured at go-live.
 */
import { signJsonRequest, type AwsCredentials } from "./aws-sigv4";
import { generateDataKey, type MasterKeyProvider, type WrappedDataKey } from "./master-key";

export { generateDataKey };

type KmsOptions = {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  /** KMS CMK id/arn used as both the wrap key and the stored key version. */
  keyId: string;
  /** Injectable for tests. Defaults to the global fetch. */
  fetchImpl?: typeof fetch;
  /** Injectable clock for deterministic signing in tests. */
  now?: () => Date;
  /** Encryption-context (AAD) sent to KMS; binds the wrap to this purpose. */
  encryptionContext?: Record<string, string>;
};

export class KmsMasterKeyProvider implements MasterKeyProvider {
  readonly providerKey = "aws-kms" as const;
  readonly keyVersion: string;
  readonly #creds: AwsCredentials;
  readonly #keyId: string;
  readonly #host: string;
  readonly #fetch: typeof fetch;
  readonly #now: () => Date;
  readonly #context?: Record<string, string>;

  constructor(opts: KmsOptions) {
    if (!opts.keyId?.trim()) throw new Error("kyc/kms: keyId is required");
    this.#keyId = opts.keyId.trim();
    this.keyVersion = this.#keyId;
    this.#creds = {
      region: opts.region,
      accessKeyId: opts.accessKeyId,
      secretAccessKey: opts.secretAccessKey,
      sessionToken: opts.sessionToken,
    };
    this.#host = `kms.${opts.region}.amazonaws.com`;
    this.#fetch = opts.fetchImpl ?? fetch;
    this.#now = opts.now ?? (() => new Date());
    this.#context = opts.encryptionContext ?? { purpose: "henryco-kyc-vault" };
  }

  async #call(target: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
    const payload = JSON.stringify(body);
    const { url, headers } = await signJsonRequest({
      service: "kms",
      host: this.#host,
      target: `TrentService.${target}`,
      body: payload,
      creds: this.#creds,
      now: this.#now(),
    });
    const response = await this.#fetch(url, { method: "POST", headers, body: payload });
    const json = (await response.json().catch(() => null)) as Record<string, unknown> | null;
    if (!response.ok || !json) {
      const type = json && typeof json.__type === "string" ? json.__type : `http ${response.status}`;
      throw new Error(`kyc/kms: ${target} failed (${type})`);
    }
    return json;
  }

  async wrapDataKey(dataKey: Uint8Array): Promise<WrappedDataKey> {
    const out = await this.#call("Encrypt", {
      KeyId: this.#keyId,
      Plaintext: Buffer.from(dataKey).toString("base64"),
      EncryptionContext: this.#context,
    });
    const blob = typeof out.CiphertextBlob === "string" ? out.CiphertextBlob : "";
    if (!blob) throw new Error("kyc/kms: Encrypt returned no CiphertextBlob");
    return {
      provider: "aws-kms",
      keyVersion: this.keyVersion,
      blob: new Uint8Array(Buffer.from(blob, "base64")),
    };
  }

  async unwrapDataKey(wrapped: WrappedDataKey): Promise<Uint8Array> {
    if (wrapped.provider !== "aws-kms") {
      throw new Error(`kyc/kms: cannot unwrap a '${wrapped.provider}' blob`);
    }
    const out = await this.#call("Decrypt", {
      CiphertextBlob: Buffer.from(wrapped.blob).toString("base64"),
      EncryptionContext: this.#context,
      KeyId: this.#keyId,
    });
    const plaintext = typeof out.Plaintext === "string" ? out.Plaintext : "";
    if (!plaintext) throw new Error("kyc/kms: Decrypt returned no Plaintext");
    return new Uint8Array(Buffer.from(plaintext, "base64"));
  }

  /** Build from an env bag, or null when KMS is not configured (dormant). */
  static tryFromEnv(
    env: Record<string, string | undefined> = process.env,
  ): KmsMasterKeyProvider | null {
    const keyId = (env.KYC_VAULT_KMS_KEY_ID || "").trim();
    if (!keyId) return null;
    const accessKeyId = (env.KYC_VAULT_KMS_ACCESS_KEY_ID || env.AWS_ACCESS_KEY_ID || "").trim();
    const secretAccessKey = (
      env.KYC_VAULT_KMS_SECRET_ACCESS_KEY ||
      env.AWS_SECRET_ACCESS_KEY ||
      ""
    ).trim();
    if (!accessKeyId || !secretAccessKey) {
      throw new Error("kyc/kms: KYC_VAULT_KMS_KEY_ID set but AWS credentials are missing");
    }
    const region = (env.KYC_VAULT_KMS_REGION || env.AWS_REGION || "us-east-1").trim();
    const sessionToken = (env.KYC_VAULT_KMS_SESSION_TOKEN || env.AWS_SESSION_TOKEN || "").trim() || undefined;
    return new KmsMasterKeyProvider({ region, accessKeyId, secretAccessKey, sessionToken, keyId });
  }
}
