/**
 * @henryco/kyc — Supabase adapter for the vault artifact repository.
 *
 * Implements {@link VaultArtifactRepo} over grant-locked SECURITY DEFINER RPCs
 * (defined in the vault migration). Binary columns (wrapped data key, IV, auth
 * tag) cross the wire as base64 text — the RPCs `decode(...,'base64')` on write
 * and `encode(...,'base64')` on read — avoiding PostgREST bytea ambiguity and
 * guaranteeing lossless round-trips of key material.
 *
 * No `import "server-only"` (reached only via the server barrel); the injected
 * service-role client is the trust boundary.
 */
import type { ArtifactRecord, RetentionCandidate, VaultArtifactRepo } from "../vault/ports";
import type { MasterKeyProviderKey } from "../crypto/master-key";

type RpcResult = { data: unknown; error: { message: string } | null };
export type RpcCapableClient = {
  rpc: (name: string, params?: Record<string, unknown>) => Promise<RpcResult>;
};

const b64 = (bytes: Uint8Array): string => Buffer.from(bytes).toString("base64");
const unb64 = (s: string): Uint8Array => new Uint8Array(Buffer.from(s, "base64"));

type RawRow = {
  id: string;
  user_id: string;
  submission_id: string | null;
  media_ref: string;
  wrapped_data_key: string | null;
  key_provider: string;
  key_version: string;
  content_iv: string;
  content_auth_tag: string;
  content_type: string;
  document_type: string;
  byte_size: number;
  created_at: string;
  retention_hold_until: string | null;
  legal_hold_reason: string | null;
  crypto_shredded_at: string | null;
};

function decodeRow(row: RawRow): ArtifactRecord {
  return {
    id: row.id,
    userId: row.user_id,
    submissionId: row.submission_id,
    mediaRef: row.media_ref,
    wrappedDataKey: row.wrapped_data_key ? unb64(row.wrapped_data_key) : null,
    keyProvider: row.key_provider as MasterKeyProviderKey,
    keyVersion: row.key_version,
    contentIv: unb64(row.content_iv),
    contentAuthTag: unb64(row.content_auth_tag),
    contentType: row.content_type,
    documentType: row.document_type,
    byteSize: row.byte_size,
    createdAt: row.created_at,
    retentionHoldUntil: row.retention_hold_until,
    legalHoldReason: row.legal_hold_reason,
    cryptoShreddedAt: row.crypto_shredded_at,
  };
}

export class SupabaseVaultArtifactRepo implements VaultArtifactRepo {
  readonly #client: RpcCapableClient;
  constructor(opts: { client: RpcCapableClient }) {
    this.#client = opts.client;
  }

  async insert(record: ArtifactRecord): Promise<ArtifactRecord> {
    const { error } = await this.#client.rpc("kyc_vault_store_artifact", {
      p_id: record.id,
      p_user_id: record.userId,
      p_submission_id: record.submissionId,
      p_media_ref: record.mediaRef,
      p_wrapped_data_key: record.wrappedDataKey ? b64(record.wrappedDataKey) : null,
      p_key_provider: record.keyProvider,
      p_key_version: record.keyVersion,
      p_content_iv: b64(record.contentIv),
      p_content_auth_tag: b64(record.contentAuthTag),
      p_content_type: record.contentType,
      p_document_type: record.documentType,
      p_byte_size: record.byteSize,
      p_created_at: record.createdAt,
    });
    if (error) throw new Error(`kyc/repo: store failed — ${error.message}`);
    return record;
  }

  async getById(id: string): Promise<ArtifactRecord | null> {
    const { data, error } = await this.#client.rpc("kyc_vault_get_artifact", { p_id: id });
    if (error) throw new Error(`kyc/repo: get failed — ${error.message}`);
    const row = Array.isArray(data) ? (data[0] as RawRow | undefined) : (data as RawRow | null);
    return row ? decodeRow(row) : null;
  }

  async listByUser(userId: string): Promise<ArtifactRecord[]> {
    const { data, error } = await this.#client.rpc("kyc_vault_list_user_artifacts", {
      p_user_id: userId,
    });
    if (error) throw new Error(`kyc/repo: listByUser failed — ${error.message}`);
    return ((data as RawRow[] | null) ?? []).map(decodeRow);
  }

  async listShreddable(now: string): Promise<RetentionCandidate[]> {
    // Returns a LIGHT projection (no crypto material) — see kyc_vault_list_shreddable.
    const { data, error } = await this.#client.rpc("kyc_vault_list_shreddable", { p_now: now });
    if (error) throw new Error(`kyc/repo: listShreddable failed — ${error.message}`);
    type LightRow = {
      id: string;
      user_id: string;
      created_at: string;
      retention_hold_until: string | null;
      legal_hold_reason: string | null;
      crypto_shredded_at: string | null;
    };
    return ((data as LightRow[] | null) ?? []).map((r) => ({
      id: r.id,
      userId: r.user_id,
      createdAt: r.created_at,
      retentionHoldUntil: r.retention_hold_until,
      legalHoldReason: r.legal_hold_reason,
      cryptoShreddedAt: r.crypto_shredded_at,
    }));
  }

  async markShredded(id: string, shreddedAt: string, reason: string): Promise<void> {
    const { error } = await this.#client.rpc("kyc_vault_crypto_shred", {
      p_id: id,
      p_shredded_at: shreddedAt,
      p_reason: reason,
    });
    if (error) throw new Error(`kyc/repo: cryptoShred failed — ${error.message}`);
  }
}
