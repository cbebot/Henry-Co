import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { STUDIO_AI_MODEL_LABEL, shouldBackOffOnGatewayCode } from "./ai-runtime";

describe("studio AI runtime helpers", () => {
  it("exposes a brand-opaque model label (never a provider/model id)", () => {
    assert.equal(STUDIO_AI_MODEL_LABEL, "henry-onyx-intelligence");
    assert.doesNotMatch(STUDIO_AI_MODEL_LABEL, /claude-/);
  });
  it("backs off on real provider/config trouble, not on routine per-input refusals", () => {
    // real AiGatewayError.code values (errors.ts) — provider outage / missing provider
    assert.equal(shouldBackOffOnGatewayCode("provider_error"), true);
    assert.equal(shouldBackOffOnGatewayCode("provider_timeout"), true);
    assert.equal(shouldBackOffOnGatewayCode("not_configured"), true);
    // routine, per-input or per-call — must NOT trip the circuit breaker
    assert.equal(shouldBackOffOnGatewayCode("provider_refusal"), false);
    assert.equal(shouldBackOffOnGatewayCode("schema_validation_failed"), false);
    assert.equal(shouldBackOffOnGatewayCode("rate_limited"), false);
    assert.equal(shouldBackOffOnGatewayCode("kill_switch_active"), false);
  });
});
