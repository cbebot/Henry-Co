import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { isAiGatewayLive, isAiSurfaceEnabled } from "../flags";

describe("isAiGatewayLive — the company master switch", () => {
  it("is off by default (nothing set)", () => {
    assert.equal(isAiGatewayLive({}), false);
  });

  it("turns on via NEXT_PUBLIC_HENRY_FLAG_AI_GATEWAY=true", () => {
    assert.equal(isAiGatewayLive({ NEXT_PUBLIC_HENRY_FLAG_AI_GATEWAY: "true" }), true);
  });

  it("turns on via the NEXT_PUBLIC_HENRY_FLAGS list (ai_gateway or ai)", () => {
    assert.equal(isAiGatewayLive({ NEXT_PUBLIC_HENRY_FLAGS: "ai_gateway" }), true);
    assert.equal(isAiGatewayLive({ NEXT_PUBLIC_HENRY_FLAGS: "something,ai" }), true);
    assert.equal(isAiGatewayLive({ NEXT_PUBLIC_HENRY_FLAGS: "other" }), false);
  });
});

describe("isAiSurfaceEnabled — master switch OR per-surface override", () => {
  it("renders when the master switch is on, regardless of the surface flag", () => {
    assert.equal(isAiSurfaceEnabled(undefined, { NEXT_PUBLIC_HENRY_FLAG_AI_GATEWAY: "true" }), true);
  });

  it("renders when only the surface flag is explicitly true (isolate one surface pre-launch)", () => {
    assert.equal(isAiSurfaceEnabled("true", {}), true);
  });

  it("stays dark when neither is set", () => {
    assert.equal(isAiSurfaceEnabled(undefined, {}), false);
    assert.equal(isAiSurfaceEnabled("false", {}), false);
  });
});
