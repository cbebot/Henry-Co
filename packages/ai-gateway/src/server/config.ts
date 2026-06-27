import "server-only";

import { getAiProviderConfig } from "@henryco/config";
import type { AiModelTier } from "@henryco/pricing";

/**
 * The company-governed `tier → concrete Claude model` routing map. SERVER-ONLY — these
 * model ids never leave the server and are redacted from any client payload/log. The
 * studio copilot's current Haiku is the default `fast` mapping; `standard`/`deep` are
 * stronger models. Each is overridable by a server env var so the company can re-route a
 * tier without a code change (the governable axis of D3), and the model name stays opaque.
 */
const DEFAULT_TIER_MODELS: Record<AiModelTier, string> = {
  fast: "claude-haiku-4-5-20251001",
  standard: "claude-sonnet-4-6",
  deep: "claude-opus-4-8",
};

export function resolveModelForTier(tier: AiModelTier, env: NodeJS.ProcessEnv = process.env): string {
  const override =
    tier === "fast" ? env.AI_MODEL_FAST : tier === "standard" ? env.AI_MODEL_STANDARD : env.AI_MODEL_DEEP;
  const clean = (override ?? "").trim();
  return clean || DEFAULT_TIER_MODELS[tier];
}

/** The provider secret + configured flag (no model/provider name). */
export function getAiServerConfig() {
  return getAiProviderConfig();
}

/** SDK-level per-call timeout (studio precedent). */
export const AI_PROVIDER_TIMEOUT_MS = 25_000;
/** The gateway's tighter outer race, so billing/auth outages fall back before the SDK's
 *  own timeout (studio precedent: MODEL_TIMEOUT_MS=12s < SDK 25s). */
export const AI_GATEWAY_TIMEOUT_MS = 12_000;
