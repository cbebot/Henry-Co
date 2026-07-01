import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { STUDIO_AI_MODEL_LABEL, shouldBackOffOnGatewayCode } from "./ai-runtime";

describe("studio AI runtime helpers", () => {
  it("exposes a brand-opaque model label (never a provider/model id)", () => {
    assert.equal(STUDIO_AI_MODEL_LABEL, "henry-onyx-intelligence");
    assert.doesNotMatch(STUDIO_AI_MODEL_LABEL, /claude-/);
  });
  it("backs off on provider/config trouble, not on routine refusals", () => {
    assert.equal(shouldBackOffOnGatewayCode("provider_failed"), true);
    assert.equal(shouldBackOffOnGatewayCode("not_configured"), true);
    assert.equal(shouldBackOffOnGatewayCode("rate_limited"), false);
    assert.equal(shouldBackOffOnGatewayCode("kill_switch_active"), false);
  });
});
