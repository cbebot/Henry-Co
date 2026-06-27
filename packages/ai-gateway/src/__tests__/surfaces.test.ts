import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { AI_SURFACES, getSurfacePolicy } from "../surfaces";

describe("AI_SURFACES registry", () => {
  it("registers marketplace.listing.draft as the Pass-1 METERED standard-tier surface", () => {
    const p = getSurfacePolicy("marketplace.listing.draft");
    assert.ok(p);
    assert.equal(p.billable, true);
    assert.equal(p.modelTier, "standard");
    assert.equal(p.maxOutputTokens, 1024);
    assert.equal(p.maxCalls, 1);
  });

  it("keeps company-critical surfaces FREE (no wallet interaction)", () => {
    for (const key of ["support.message.assist", "account.check.assist", "studio.brief.staff"] as const) {
      assert.equal(AI_SURFACES[key].billable, false, `${key} must be FREE`);
    }
  });

  it("keeps personal/business surfaces METERED", () => {
    for (const key of ["studio.brief.client", "business.message.assist", "intelligence.chat"] as const) {
      assert.equal(AI_SURFACES[key].billable, true, `${key} must be METERED`);
    }
  });

  it("registers the Intelligence chat as a METERED standard-tier surface", () => {
    const p = getSurfacePolicy("intelligence.chat");
    assert.ok(p);
    assert.equal(p.billable, true);
    assert.equal(p.modelTier, "standard");
  });

  it("registers the Pass-2 listing-verify trust review as METERED at the deep tier", () => {
    const p = getSurfacePolicy("marketplace.listing.verify");
    assert.ok(p);
    assert.equal(p.billable, true, "the trust review is metered (the seller pays for credibility)");
    assert.equal(p.modelTier, "deep", "verification runs on the strongest model so nothing slips through");
  });

  it("returns null for an unknown surface key", () => {
    assert.equal(getSurfacePolicy("does.not.exist" as never), null);
  });
});
