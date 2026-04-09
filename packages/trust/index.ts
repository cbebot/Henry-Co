export {
  detectOffPlatformContact,
  detectSuspiciousContent,
  sanitizeForDisplay,
  calculateTrustScore,
} from "./detect.js";

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
} from "./moderation.js";
