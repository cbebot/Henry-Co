/**
 * @henryco/kyc — type-only entry (erased at runtime; safe to import anywhere).
 */
export type { VerificationLevel } from "./levels";
export type { KycVerdict, VerificationDecision, BuildVerdictInput } from "./verdict";
export type {
  KycVendorKey,
  KycDocumentType,
  VendorDecision,
  InitiateInput,
  VerificationSession,
  VerificationResult,
  WebhookResult,
  KycVendorAdapter,
} from "./provider/adapter-interface";
export type { RetentionPolicy, RetentionRecord, RetentionDecision } from "./retention/policy";
export type {
  ArtifactRecord,
  NewArtifactRecord,
  VaultBlobStore,
  VaultArtifactRepo,
  VaultAudit,
  AuditEntry,
} from "./vault/ports";
export type {
  MasterKeyProvider,
  MasterKeyProviderKey,
  WrappedDataKey,
} from "./crypto/master-key";
