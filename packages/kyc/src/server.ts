/**
 * @henryco/kyc/server — server-only entry (the full vault machine).
 *
 * The `server-only` guard makes it a build error to import this from a client
 * bundle. Everything that touches crypto, the master key, storage, the DB, or
 * audit is exported here; pure types/helpers come from the client-safe `.`
 * entry.
 */
import "server-only";

// Pure surface (re-exported for convenience).
export * from "./index";

// Crypto core.
export {
  generateDataKey,
  encryptWithDataKey,
  decryptWithDataKey,
  bytesEqual,
  type EncryptedPayload,
} from "./crypto/envelope";
export {
  EnvMasterKeyProvider,
  type MasterKeyProvider,
  type MasterKeyProviderKey,
  type WrappedDataKey,
} from "./crypto/master-key";
export { KmsMasterKeyProvider } from "./crypto/kms-master-key";

// Vault + retention.
export { KycVault, type KycVaultDeps, type StoreArtifactInput } from "./vault/vault";
export type {
  ArtifactRecord,
  NewArtifactRecord,
  VaultBlobStore,
  VaultArtifactRepo,
  VaultAudit,
  AuditEntry,
} from "./vault/ports";
export { RetentionEngine, type RetentionSummary } from "./retention/engine";

// Provider seam (dormant).
export { InternalKycAdapter } from "./provider/internal-adapter";

// App adapters + composition root.
export { SupabaseVaultBlobStore, type StorageCapableClient } from "./server/supabase-blob-store";
export { SupabaseVaultArtifactRepo, type RpcCapableClient } from "./server/supabase-artifact-repo";
export { ObservabilityVaultAudit } from "./server/observability-audit";
export { toAuditLogInput } from "./server/audit-map";
export { selectMasterKeyProvider, trySelectMasterKeyProvider } from "./server/master-key-factory";
export { buildRetentionPolicyFromEnv } from "./server/retention-config";
export {
  createKycVault,
  tryCreateKycVault,
  type KycVaultClient,
  type CreateKycVaultOptions,
  type KycVaultBundle,
} from "./server/factory";
