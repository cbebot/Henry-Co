import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AI_TIER_BRAND_NAMES, aiTierBrandName } from "../tier-brand";

describe("tier brand names — Henry Onyx product names, never a vendor detail", () => {
  it("brands every tier under the Onyx line", () => {
    assert.equal(aiTierBrandName("fast"), "Onyx Swift");
    assert.equal(aiTierBrandName("standard"), "Onyx Core");
    assert.equal(aiTierBrandName("deep"), "Onyx Prime");
  });
  it("never carries a provider or model hint", () => {
    for (const name of Object.values(AI_TIER_BRAND_NAMES)) {
      assert.doesNotMatch(name.toLowerCase(), /claude|anthropic|gpt|sonnet|opus|haiku/);
      assert.doesNotMatch(name, /!/); // calm authority — no exclamation
    }
  });
});
