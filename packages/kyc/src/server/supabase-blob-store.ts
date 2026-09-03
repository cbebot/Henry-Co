/**
 * @henryco/kyc — Supabase Storage adapter for the vault's ciphertext blobs.
 *
 * Implements {@link VaultBlobStore} over an injected privileged Supabase client.
 * Stores opaque ciphertext in a private bucket and round-trips it via
 * `media://` refs (reusing `@henryco/media`'s client-safe ref codec — NOT the
 * server media store, since @henryco/media exposes no `download()`).
 *
 * No `import "server-only"` (reached only via the server barrel); the injected
 * client is the trust boundary.
 */
import { buildMediaRef, parseMediaRef } from "@henryco/media";
import type { VaultBlobStore } from "../vault/ports";

type StorageBucketApi = {
  upload: (
    path: string,
    body: Blob,
    opts?: { contentType?: string; upsert?: boolean },
  ) => Promise<{ data: unknown; error: { message: string } | null }>;
  download: (path: string) => Promise<{ data: Blob | null; error: { message: string } | null }>;
  remove: (paths: string[]) => Promise<{ data: unknown; error: { message: string } | null }>;
};

export type StorageCapableClient = {
  storage: { from: (bucket: string) => StorageBucketApi };
};

export class SupabaseVaultBlobStore implements VaultBlobStore {
  readonly #client: StorageCapableClient;
  readonly #idGen: () => string;

  constructor(opts: { client: StorageCapableClient; idGen?: () => string }) {
    this.#client = opts.client;
    this.#idGen = opts.idGen ?? (() => crypto.randomUUID());
  }

  async putCiphertext(input: { bucket: string; pathPrefix: string; bytes: Uint8Array }): Promise<string> {
    const key = `${input.pathPrefix}/${this.#idGen()}.bin`;
    const body = new Blob([new Uint8Array(input.bytes)], { type: "application/octet-stream" });
    const { error } = await this.#client.storage.from(input.bucket).upload(key, body, {
      contentType: "application/octet-stream",
      upsert: false,
    });
    if (error) throw new Error(`kyc/blob: upload failed — ${error.message}`);
    return buildMediaRef({ visibility: "private", bucket: input.bucket, key });
  }

  async getCiphertext(ref: string): Promise<Uint8Array> {
    const { bucket, key } = this.#parsePrivate(ref);
    const { data, error } = await this.#client.storage.from(bucket).download(key);
    if (error || !data) throw new Error(`kyc/blob: download failed — ${error?.message ?? "no data"}`);
    return new Uint8Array(await data.arrayBuffer());
  }

  async removeCiphertext(ref: string): Promise<void> {
    const { bucket, key } = this.#parsePrivate(ref);
    const { error } = await this.#client.storage.from(bucket).remove([key]);
    if (error) throw new Error(`kyc/blob: remove failed — ${error.message}`);
  }

  // Defense-in-depth: vault artifacts are ALWAYS private. Refuse to act on a ref
  // that is not a private media ref, so a malformed/forged value can never
  // redirect a read/remove at a public object.
  #parsePrivate(ref: string): { bucket: string; key: string } {
    const parsed = parseMediaRef(ref);
    if (parsed.visibility !== "private") {
      throw new Error("kyc/blob: refusing a non-private media ref");
    }
    return { bucket: parsed.bucket, key: parsed.key };
  }
}
