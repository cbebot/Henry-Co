import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { STUDIO_AI_MODEL_LABEL, briefFailureCopy, isRetryableGatewayCode } from "./ai-runtime";

describe("studio AI runtime helpers", () => {
  it("exposes a brand-opaque model label (never a provider/model id)", () => {
    assert.equal(STUDIO_AI_MODEL_LABEL, "henry-onyx-intelligence");
    assert.doesNotMatch(STUDIO_AI_MODEL_LABEL, /claude-/);
  });

  it("maps every refusal to honest, calm copy — never a scripted stand-in", () => {
    assert.match(briefFailureCopy("rate_limited"), /today's co-pilot limit/);
    assert.match(briefFailureCopy("kill_switch_active"), /offline right now/);
    assert.match(briefFailureCopy("not_configured"), /offline right now/);
    for (const code of ["provider_timeout", "provider_error", "provider_refusal", "schema_validation_failed", "unknown"]) {
      assert.match(briefFailureCopy(code), /send it again/i);
    }
    // Voice: calm authority — no exclamation marks in any failure line.
    for (const code of ["rate_limited", "kill_switch_active", "provider_error", "x"]) {
      assert.doesNotMatch(briefFailureCopy(code), /!/);
    }
  });

  it("retries once only on transport trouble, not on refusals or limits", () => {
    assert.equal(isRetryableGatewayCode("provider_timeout"), true);
    assert.equal(isRetryableGatewayCode("provider_error"), true);
    assert.equal(isRetryableGatewayCode("rate_limited"), false);
    assert.equal(isRetryableGatewayCode("provider_refusal"), false);
    assert.equal(isRetryableGatewayCode("schema_validation_failed"), false);
    assert.equal(isRetryableGatewayCode("not_configured"), false);
  });
});
