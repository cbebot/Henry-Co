import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { normaliseStructured, parseAssistantJson, buildFallbackStructured, countWords } from "./brief-copilot-structured";

describe("copilot structured parser (round-trips the gateway studio.brief.staff schema)", () => {
  it("parses the exact 20-field JSON the gateway prompt instructs", () => {
    const sample = JSON.stringify({
      projectType: "Storefront",
      platformPreference: "Next.js",
      designDirection: "clean",
      preferredLanguage: "English",
      frameworkPreference: "Next.js",
      backendPreference: "Supabase",
      hostingPreference: "Vercel",
      pageRequirements: ["Home", "Cart"],
      requiredFeatures: ["Checkout"],
      addonServices: [],
      techPreferences: ["Stripe"],
      businessType: "Retail",
      budgetBand: "₦1M – ₦3M",
      urgency: "Within 4 weeks",
      timeline: "4 weeks",
      goals: "sell online",
      scopeNotes: "n",
      summary: "a storefront",
      confidence: 0.8,
      uncertainties: [],
    });
    const out = normaliseStructured(parseAssistantJson(sample));
    assert.ok(out);
    assert.equal(out.projectType, "Storefront");
    assert.equal(out.budgetBand, "₦1M – ₦3M");
    assert.deepEqual(out.pageRequirements, ["Home", "Cart"]);
  });

  it("parses the out-of-scope refusal stub the gateway returns for off-topic input", () => {
    const stub = normaliseStructured(parseAssistantJson('{"projectType":"Other","summary":"Out-of-scope input — no Studio brief generated.","confidence":0,"pageRequirements":[],"requiredFeatures":[]}'));
    assert.ok(stub);
    assert.equal(stub.projectType, "Other");
    assert.equal(stub.confidence, 0);
  });

  it("deterministic fallback yields a valid structured brief without a model", () => {
    const fb = buildFallbackStructured("I want a storefront for my bakery with online payments and delivery tracking");
    assert.equal(typeof fb.summary, "string");
    assert.ok(fb.pageRequirements.length > 0);
    assert.ok(countWords("one two three") === 3);
  });
});
