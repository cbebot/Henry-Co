// V3-12 — shared studio AI runtime helpers. Pure (no server imports) so they are unit-testable
// and safe to import anywhere. The model label is deliberately brand-opaque: studio's legacy
// `modelUsed` UI field keeps existing, but never names the provider/model again.
export const STUDIO_AI_MODEL_LABEL = "henry-onyx-intelligence";

/** Mirror the old `modelDisabledUntil` heuristic against the gateway's AiGatewayError.code
 *  taxonomy (NOT the telemetry signal `kind`): temporarily stop attempting the model only when
 *  the trouble is provider/config-level — a real outage or a missing provider — and never on a
 *  routine, per-input refusal (`provider_refusal`, `schema_validation_failed`, `rate_limited`). */
export function shouldBackOffOnGatewayCode(code: string): boolean {
  return code === "provider_error" || code === "provider_timeout" || code === "not_configured";
}
