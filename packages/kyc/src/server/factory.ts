/**
 * @henryco/kyc — composition root.
 *
 * Wires the vault from an injected privileged Supabase client + the
 * environment: selects the master-key provider (KMS preferred, env fallback),
 * builds the storage/repo/audit adapters, and assembles the vault + retention
 * engine. The app owns the client + secrets; the package reads neither directly
 * beyond the master-key selection.
 *
 * `tryCreateKycVault` returns null when no master key is configured, so callers
 * can keep the vault dormant without a hard failure.
 */
import type { AuditLogSupabaseClient } from "@henryco/observability/audit-log";
import { KycVault } from "../vault/vault";
import { RetentionEngine } from "../retention/engine";
import type { MasterKeyProvider } from "../crypto/master-key";
import type { RetentionPolicy } from "../retention/policy";
import { SupabaseVaultBlobStore, type StorageCapableClient } from "./supabase-blob-store";
import { SupabaseVaultArtifactRepo, type RpcCapableClient } from "./supabase-artifact-repo";
import { ObservabilityVaultAudit } from "./observability-audit";
import { selectMasterKeyProvider, trySelectMasterKeyProvider } from "./master-key-factory";
import { buildRetentionPolicyFromEnv } from "./retention-config";

/** The injected client must expose storage + rpc (a service-role Supabase client). */
export type KycVaultClient = StorageCapableClient & RpcCapableClient;

export type CreateKycVaultOptions = {
  client: KycVaultClient;
  env?: Record<string, string | undefined>;
  bucket?: string;
  /** Override the env-derived policy (e.g. for a specific surface). */
  retentionPolicy?: RetentionPolicy;
};

export type KycVaultBundle = {
  vault: KycVault;
  retentionEngine: RetentionEngine;
  masterKeyProvider: MasterKeyProvider;
};

function assemble(masterKey: MasterKeyProvider, opts: CreateKycVaultOptions): KycVaultBundle {
  const env = opts.env ?? process.env;
  const blobStore = new SupabaseVaultBlobStore({ client: opts.client });
  const repo = new SupabaseVaultArtifactRepo({ client: opts.client });
  // The real Supabase client satisfies all three adapter views; cast at this
  // single composition boundary.
  const audit = new ObservabilityVaultAudit({
    client: opts.client as unknown as AuditLogSupabaseClient,
  });
  const vault = new KycVault({ blobStore, repo, audit, masterKey, bucket: opts.bucket });
  const retentionEngine = new RetentionEngine({
    vault,
    repo,
    audit,
    policy: opts.retentionPolicy ?? buildRetentionPolicyFromEnv(env),
  });
  return { vault, retentionEngine, masterKeyProvider: masterKey };
}

/** Build the vault, throwing if no master key is configured. */
export function createKycVault(opts: CreateKycVaultOptions): KycVaultBundle {
  return assemble(selectMasterKeyProvider(opts.env ?? process.env), opts);
}

/** Build the vault, or null when no master key is configured (dormant). */
export function tryCreateKycVault(opts: CreateKycVaultOptions): KycVaultBundle | null {
  const masterKey = trySelectMasterKeyProvider(opts.env ?? process.env);
  return masterKey ? assemble(masterKey, opts) : null;
}
