import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isStudioAgencyEnabled } from "@/lib/agency/flag";
import { defaultStudioBuildRateCard, priceBuildUsageKobo } from "@/lib/agency/rate-card";
import { scrubContactPii } from "@/lib/agency/scrub";

describe("studio_agency flag — default dark", () => {
  it("is OFF when unset", () => {
    assert.equal(isStudioAgencyEnabled({}), false);
    assert.equal(isStudioAgencyEnabled({ STUDIO_AGENCY_LIVE: "" }), false);
    assert.equal(isStudioAgencyEnabled({ STUDIO_AGENCY_LIVE: "0" }), false);
  });
  it("is ON only for explicit truthy values", () => {
    assert.equal(isStudioAgencyEnabled({ STUDIO_AGENCY_LIVE: "1" }), true);
    assert.equal(isStudioAgencyEnabled({ STUDIO_AGENCY_LIVE: "true" }), true);
    assert.equal(isStudioAgencyEnabled({ STUDIO_AGENCY_LIVE: "yes" }), true);
  });
});

describe("build rate card — lockstep with the seeded row", () => {
  it("carries the deep tier + the envelope knobs", () => {
    const card = defaultStudioBuildRateCard();
    assert.equal(card.key, "studio-build-rate-card-v1");
    assert.equal(card.currency, "NGN");
    assert.equal(card.envelope.fraction, 0.2);
    assert.equal(card.envelope.floorKobo, 1_000_000);
    assert.equal(card.envelope.ceilingKobo, 10_000_000);
    assert.equal(card.tiers.deep.rate.in, 0.8);
    assert.equal(card.tiers.deep.rate.out, 4);
  });
  it("prices usage linearly in kobo", () => {
    const kobo = priceBuildUsageKobo({
      calls: 1,
      inputTokens: 1000,
      outputTokens: 500,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
    });
    // 1000*0.8 + 500*4 = 800 + 2000 = 2800 kobo.
    assert.equal(kobo, 2800);
  });
});

describe("spec PII scrub — no contact data reaches the sandbox", () => {
  it("removes emails and phone numbers", () => {
    const scrubbed = scrubContactPii("Reach me at ada@example.com or +2348012345678 anytime.");
    assert.ok(!scrubbed.includes("ada@example.com"));
    assert.ok(!scrubbed.includes("2348012345678"));
    assert.ok(scrubbed.includes("[contact removed]"));
  });
  it("leaves ordinary business copy intact", () => {
    const scrubbed = scrubContactPii("We want more qualified leads and calmer operations.");
    assert.equal(scrubbed, "We want more qualified leads and calmer operations.");
  });
});
