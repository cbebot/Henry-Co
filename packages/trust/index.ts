export {
  detectOffPlatformContact,
  detectSuspiciousContent,
  sanitizeForDisplay,
  calculateTrustScore,
} from "./detect";

export {
  detectContactDetails,
  type ContactConfidence,
  type ContactDetailsResult,
  type ContactHit,
  type ContactKind,
} from "./contact";

export {
  applyVerificationTrustControls,
  clampSharedTrustTier,
  getVerificationGateCopy,
  normalizeVerificationStatus,
  rankSharedTrustTier,
  satisfiesVerificationRequirement,
  type SharedTrustTier,
  type SharedVerificationStatus,
  type VerificationGateCopy,
  type VerificationRequirementLevel,
} from "./verification";

export {
  type ModerationAction,
  type ModerationEntityType,
  type ModerationSeverity,
  type ModerationStatus,
  type ModerationCase,
  type TrustFlag,
  SEVERITY_LABELS,
  ACTION_LABELS,
  shouldAutoFlag,
  escalateSeverityForRepeatOffender,
} from "./moderation";
