// @henryco/ai-gateway — the PURE, client-safe barrel. Types + pure helpers only.
// Everything that touches a provider SDK, a secret, or the service-role database lives
// behind the `./server` export (which carries `import "server-only"`) and never enters
// a client bundle. The exports map IS the boundary.

export type { Result } from "./src/result";
export { ok, err } from "./src/result";

export type { AiGatewayError, AiGatewayErrorCode } from "./src/errors";
export { aiError, DEFAULT_AI_ERROR_COPY } from "./src/errors";

export type {
  AiProviderAdapter,
  AiProviderKey,
  ProviderRequest,
  ProviderResult,
  ProviderUsage,
  ProviderError,
} from "./src/provider-types";

export type { AiSurfaceKey, AiSurfacePolicy } from "./src/surfaces";
export { AI_SURFACES, getSurfacePolicy } from "./src/surfaces";

export type { AiUsageReceipt, AiTask } from "./src/contracts";

export { estimateInputTokens, estimateUsageUpperBound } from "./src/metering";
export { redactReceipt, assertClientSafe, AI_LOG_REDACT_KEYS } from "./src/redaction";
export { mapSignalToTelemetry, type AiTelemetryRecord } from "./src/telemetry-map";
export { normalizeChatMessages, INTELLIGENCE_CHAT_SYSTEM_PROMPT, type ChatMessage } from "./src/intelligence-chat";
export { HENRY_ONYX_INTELLIGENCE_DOCTRINE, composeSystemPrompt } from "./src/doctrine";
export { isAiGatewayLive, isAiSurfaceEnabled } from "./src/flags";
export {
  parseVerdict,
  resolveVerdictDecision,
  VERIFIED_TRUST_THRESHOLD,
  type ListingVerdict,
  type VerdictDecision,
  type VerdictResolution,
} from "./src/verify";
export { parseCoachEnvelope, type CoachEnvelope } from "./src/studio-prompts";
export { aiTierBrandName, AI_TIER_BRAND_NAMES } from "./src/tier-brand";

export type {
  AiBillingPort,
  ReserveInput,
  ReserveResult,
  SettleInput,
  SettleResult,
} from "./src/billing-port";

export { InMemoryRateLimiter, DAY_MS, type AiRateLimitPort, type RateLimitCheck } from "./src/rate-limit";

export {
  runAiTaskWith,
  type AiTaskDeps,
  type AiTaskSuccess,
  type AiPromptParts,
  type AiUsageSignal,
} from "./src/orchestrator";

// The capability tier is owned by @henryco/pricing (it keys the rate card). Re-exported
// here so a client surface can label it ("Standard"/"Advanced") without importing the
// money package. It is a capability name, never a model id.
export type { AiModelTier } from "@henryco/pricing";
