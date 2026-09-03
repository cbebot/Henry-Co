/**
 * The gateway's typed, NON-throwing error taxonomy (mirrors `@henryco/payment-router`'s
 * `ProviderError` discipline). Every expected failure is a `Result` error the surface
 * maps to calm-authority copy. A message here is user-safe by contract — it NEVER names
 * the provider/source or the real model.
 */
export type AiGatewayErrorCode =
  | "auth_required" // V3-33: anonymous/unauthenticated actor → blocked at the router, no call
  | "insufficient_funds" // wallet can't cover the estimate → provider NOT called
  | "cap_exceeded" // estimate over the tier's per-call cost ceiling → not called
  | "kill_switch_active" // global AI flag off → not called
  | "rate_limited" // velocity / free-allowance cap → not called
  | "provider_timeout" // started, no usable result; hold released, no charge
  | "provider_error" // provider failed; hold released, no charge
  | "provider_refusal" // model declined; not billed in Pass 1 (released)
  | "schema_validation_failed" // output failed validation; retried once then released
  | "duplicate" // replayed idempotency key → returns the prior result, never double-charges
  | "not_configured" // provider not configured (no key) and no fallback
  | "rate_card_missing" // no resolvable rate-book row for the surface/tier
  | "surface_unknown"; // no registered surface for the key

export interface AiGatewayError {
  code: AiGatewayErrorCode;
  /** Calm-authority, user-safe message. By contract contains NO provider/model name. */
  message: string;
}

export function aiError(code: AiGatewayErrorCode, message: string): AiGatewayError {
  return { code, message };
}

/** Safe default copy per code (a surface may localise/override via i18n). */
export const DEFAULT_AI_ERROR_COPY: Record<AiGatewayErrorCode, string> = {
  auth_required: "Sign in to use Henry Onyx Intelligence.",
  insufficient_funds: "Top up your wallet to continue.",
  cap_exceeded: "This is too large to run in one step.",
  kill_switch_active: "Henry Onyx Intelligence is paused.",
  rate_limited: "Please wait a moment and try again.",
  provider_timeout: "That took too long — please try again.",
  provider_error: "Henry Onyx Intelligence is unavailable right now.",
  provider_refusal: "Henry Onyx Intelligence couldn't help with that.",
  schema_validation_failed: "Henry Onyx Intelligence couldn't format that — please try again.",
  duplicate: "This request was already completed.",
  not_configured: "Henry Onyx Intelligence is unavailable right now.",
  rate_card_missing: "Henry Onyx Intelligence is unavailable right now.",
  surface_unknown: "Henry Onyx Intelligence is unavailable right now.",
};
