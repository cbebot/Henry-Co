// ---------------------------------------------------------------------------
// @henryco/moderation — client-safe barrel
//
// Exports the type contract, the pure deterministic detectors, the pure
// decision pipeline, the reason/decision catalogs, the snapshot redactor, and
// the telemetry envelope builders. The server-only orchestrator + persistence
// live behind "@henryco/moderation/server" and are deliberately NOT re-exported
// here (mirrors @henryco/observability) so `server-only` stays out of client
// bundles — the staff queue + report sheet can import labels/types from here.
// ---------------------------------------------------------------------------

export * from "./types";
export * from "./reasons";

// Deterministic detectors (pure)
export {
  runDeterministic,
  detectBannedGoods,
  detectProfanity,
  detectPiiLeak,
  detectScam,
  checkImageHashes,
  hammingDistanceHex,
  normalizeForLexicon,
  type DeterministicOptions,
} from "./deterministic/index";

// Decision pipeline (pure)
export { evaluate, combineVerdicts, DECISION_RANK } from "./pipeline";

// Snapshot redaction (pure)
export { buildContentSnapshot, maskPii } from "./snapshot";

// Telemetry envelope builders (pure)
export {
  MODERATION_EVENTS,
  divisionForContentType,
  buildScanEvent,
  buildReportFiledEvent,
  buildStaffOverrideEvent,
  type ModerationEventInput,
} from "./telemetry";

// AI prompt builder (pure; the router itself is injected server-side)
export { buildModerationPrompt } from "./ai/prompts";
