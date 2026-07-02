// Shared studio AI runtime helpers. Pure (no server imports) so they are unit-testable and safe
// to import anywhere. The model label is deliberately brand-opaque: studio's `modelUsed` UI field
// keeps existing, but never names the provider/model.
export const STUDIO_AI_MODEL_LABEL = "henry-onyx-intelligence";

/**
 * Calm, honest copy for a gateway refusal. The brief engine NEVER substitutes a scripted reply
 * that pretends to understand — it tells the person plainly what happened and invites a resend.
 * (Owner directive: no misleading fallbacks; abuse is limited by rules, not by canned replies.)
 */
export function briefFailureCopy(code: string): string {
  if (code === "rate_limited") {
    return "You've reached today's co-pilot limit. Continue with the form below — the team reads every brief.";
  }
  if (code === "kill_switch_active" || code === "not_configured") {
    return "Henry Onyx Intelligence is offline right now. Please try again shortly.";
  }
  return "That didn't come through clearly. Please send it again.";
}

/** Transport-level trouble worth ONE more server-side attempt before reporting failure. */
export function isRetryableGatewayCode(code: string): boolean {
  return code === "provider_timeout" || code === "provider_error";
}
