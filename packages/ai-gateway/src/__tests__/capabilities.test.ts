import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  INTELLIGENCE_CAPABILITIES,
  getCapability,
  isCapabilityKey,
  getCapabilityForSurface,
  listCapabilitiesForPrompt,
} from "../capabilities";
import { getSurfacePolicy } from "../surfaces";
import { quoteCapability, quoteSurface } from "../server/quote";
import { parseSupportAssistEnvelope, interpretSupportAssistOutput } from "../support-assist";

describe("Intelligence capability registry", () => {
  it("every capability maps to a real, BILLABLE, deep surface (a free surface can never be sold)", () => {
    assert.ok(INTELLIGENCE_CAPABILITIES.length >= 3);
    for (const cap of INTELLIGENCE_CAPABILITIES) {
      const policy = getSurfacePolicy(cap.surface);
      assert.ok(policy, `${cap.key} -> ${cap.surface} exists`);
      assert.equal(policy?.billable, true, `${cap.key} is billable`);
      assert.equal(policy?.modelTier, "deep", `${cap.key} is deep tier`);
      assert.ok(cap.title && cap.blurb && cap.needs, `${cap.key} has copy`);
    }
  });

  it("lookups resolve and reject correctly", () => {
    assert.equal(getCapability("growth_plan")?.surface, "intelligence.deep.growth");
    assert.equal(getCapability("nope"), null);
    assert.equal(getCapability(null), null);
    assert.equal(isCapabilityKey("marketing_analysis"), true);
    assert.equal(isCapabilityKey("__proto__"), false, "no prototype-key confusion");
    assert.equal(getCapabilityForSurface("intelligence.deep.listing")?.key, "listing_review");
    assert.equal(getCapabilityForSurface("support.message.assist"), null);
  });

  it("the prompt catalog names every key and has no em dashes", () => {
    const lines = listCapabilitiesForPrompt();
    for (const cap of INTELLIGENCE_CAPABILITIES) assert.match(lines, new RegExp(cap.key));
    assert.equal(/[—–]/.test(lines), false);
  });
});

describe("quoteCapability — the price shown before a run", () => {
  it("quotes a real capability with a positive VAT-inclusive total and the deep tier", () => {
    const res = quoteCapability({ capabilityKey: "growth_plan", inputText: "I sell handmade bags in Lagos." });
    assert.equal(res.ok, true);
    if (!res.ok) return;
    assert.equal(res.value.tier, "deep");
    assert.equal(res.value.currency, "NGN");
    assert.ok(res.value.totalKobo > 0, "a real price");
    assert.ok(res.value.vatKobo > 0, "VAT shown for transparency");
    assert.ok(res.value.vatKobo < res.value.totalKobo, "VAT is a portion of the total");
  });

  it("more input text never lowers the quote (monotonic upper bound)", () => {
    const small = quoteCapability({ capabilityKey: "growth_plan", inputText: "short" });
    const big = quoteCapability({ capabilityKey: "growth_plan", inputText: "a much longer description ".repeat(50) });
    assert.ok(small.ok && big.ok);
    if (small.ok && big.ok) assert.ok(big.value.totalKobo >= small.value.totalKobo);
  });

  it("refuses an unknown capability (never quotes phantom work)", () => {
    const res = quoteCapability({ capabilityKey: "totally_made_up", inputText: "x" });
    assert.equal(res.ok, false);
  });
});

describe("quoteSurface — price-before-run for a paid surface (seller verify)", () => {
  it("quotes the metered listing-verify surface with a positive VAT-inclusive deep-tier total", () => {
    const res = quoteSurface({
      surface: "marketplace.listing.verify",
      inputText: "Handwoven leather tote, full-grain, made in Aba.",
    });
    assert.equal(res.ok, true);
    if (!res.ok) return;
    assert.equal(res.value.tier, "deep");
    assert.equal(res.value.currency, "NGN");
    assert.ok(res.value.totalKobo > 0, "a real price to charge the seller");
    assert.ok(res.value.vatKobo > 0 && res.value.vatKobo < res.value.totalKobo);
  });

  it("refuses a FREE surface — free work can never be quoted as paid", () => {
    const res = quoteSurface({ surface: "support.message.assist", inputText: "hi" });
    assert.equal(res.ok, false);
  });

  it("more listing text never lowers the quote (monotonic upper bound = never a surprise charge)", () => {
    const small = quoteSurface({ surface: "marketplace.listing.verify", inputText: "tote" });
    const big = quoteSurface({
      surface: "marketplace.listing.verify",
      inputText: "a much longer listing description ".repeat(40),
    });
    assert.ok(small.ok && big.ok);
    if (small.ok && big.ok) assert.ok(big.value.totalKobo >= small.value.totalKobo);
  });
});

describe("support envelope — the paid offer (L4)", () => {
  it("keeps a valid capability key as the offer, resolves it on interpret", () => {
    const raw = JSON.stringify({
      reply: "I can go deeper on this as a growth plan.",
      navigate: [],
      handoff: false,
      offer: "growth_plan",
    });
    assert.equal(parseSupportAssistEnvelope(raw)?.offer, "growth_plan");
    assert.equal(interpretSupportAssistOutput(raw)?.offer?.surface, "intelligence.deep.growth");
  });

  it("drops an invented or non-capability offer to null", () => {
    const raw = JSON.stringify({ reply: "Here you go.", navigate: [], handoff: false, offer: "make_me_rich" });
    assert.equal(parseSupportAssistEnvelope(raw)?.offer, null);
    assert.equal(interpretSupportAssistOutput(raw)?.offer, null);
  });

  it("absent offer is null (ordinary free support)", () => {
    const raw = JSON.stringify({ reply: "Opening your wallet.", navigate: [], handoff: false });
    assert.equal(parseSupportAssistEnvelope(raw)?.offer, null);
    assert.equal(interpretSupportAssistOutput(raw)?.offer, null);
  });
});
