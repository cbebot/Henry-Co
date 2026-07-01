// V3-12 — shared studio AI runtime helpers. Pure (no server imports) so they are unit-testable
// and safe to import anywhere. The model label is deliberately brand-opaque: studio's legacy
// `modelUsed` UI field keeps existing, but never names the provider/model again.
export const STUDIO_AI_MODEL_LABEL = "henry-onyx-intelligence";

/** Mirror the old `modelDisabledUntil` heuristic against gateway error codes: temporarily stop
 *  attempting the model only when the trouble is provider/config-level, not a routine refusal. */
export function shouldBackOffOnGatewayCode(code: string): boolean {
  return code === "provider_failed" || code === "not_configured";
}
