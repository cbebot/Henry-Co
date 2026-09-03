import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildRouterAuditInput } from "../audit";

describe("buildRouterAuditInput", () => {
  it("folds money + routing context into newValues (server-side records the provider)", () => {
    const input = buildRouterAuditInput({
      intentId: "i1",
      country: "NG",
      currency: "NGN",
      method: "card",
      selectedProvider: "paystack",
      outcome: "started",
      latencyMs: 12,
      division: "marketplace",
    });
    assert.equal(input.action, "payment.route");
    assert.equal(input.entityType, "payment_intent");
    assert.equal(input.entityId, "i1");
    assert.equal(input.division, "marketplace");
    const nv = input.newValues as Record<string, unknown>;
    assert.equal(nv.selected_provider, "paystack");
    assert.equal(nv.country, "NG");
    assert.equal(nv.currency, "NGN");
    assert.equal(nv.method, "card");
    assert.equal(nv.outcome, "started");
    assert.equal(nv.latency_ms, 12);
  });

  it("handles a null selectedProvider (A5 blocked path) and absent division", () => {
    const input = buildRouterAuditInput({
      intentId: "i2",
      country: "ZZ",
      currency: "USD",
      method: "card",
      selectedProvider: null,
      outcome: "blocked",
      latencyMs: 3,
    });
    const nv = input.newValues as Record<string, unknown>;
    assert.equal(nv.selected_provider, null);
    assert.equal(input.division, null);
    assert.equal(input.reason, null);
  });
});
