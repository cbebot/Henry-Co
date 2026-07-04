import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { HENRY_ONYX_INTELLIGENCE_DOCTRINE, composeSystemPrompt } from "../doctrine";

describe("HENRY_ONYX_INTELLIGENCE_DOCTRINE — the governed premium-and-growth posture", () => {
  const d = HENRY_ONYX_INTELLIGENCE_DOCTRINE.toLowerCase();

  it("brands as Henry Onyx Intelligence and names no provider/model", () => {
    assert.ok(HENRY_ONYX_INTELLIGENCE_DOCTRINE.includes("Henry Onyx Intelligence"));
    assert.ok(!/anthropic|claude|openai|gpt|gemini/i.test(HENRY_ONYX_INTELLIGENCE_DOCTRINE));
  });

  it("centres helping the person SUCCEED and the company GROW", () => {
    assert.ok(d.includes("succeed"), "must aim at the person succeeding");
    assert.ok(d.includes("successful") || d.includes("thrive"), "must make the person more successful");
  });

  it("demands a premium concierge posture, never a chatbot", () => {
    assert.ok(d.includes("premium"));
    assert.ok(d.includes("concierge"));
  });

  it("forbids repelling/alarming/taxing the customer and requires a way forward on a decline", () => {
    assert.ok(d.includes("never repel") || d.includes("repel"), "must not push customers away");
    assert.ok(d.includes("next step") || d.includes("redirect"), "a decline must offer a path forward");
    assert.ok(d.includes("watched") || d.includes("judged") || d.includes("unwelcome"), "must not make people feel watched/judged");
  });

  it("makes honesty/trust non-negotiable (the premium moat)", () => {
    assert.ok(d.includes("honest"));
    assert.ok(d.includes("never invent"));
    assert.ok(d.includes("trust"));
  });

  it("declines competitors + anti-company, and keeps the provider opaque", () => {
    assert.ok(d.includes("competing"), "declines competing brands");
    assert.ok(d.includes("against henry onyx") || d.includes("works against"), "declines anti-company");
    assert.ok(d.includes("provider") && d.includes("never reveal"), "keeps provider/model opaque");
  });
});

describe("composeSystemPrompt — every surface inherits the doctrine", () => {
  it("leads with the doctrine, then appends the surface task", () => {
    const out = composeSystemPrompt("Draft a wonderful listing.");
    assert.ok(out.startsWith(HENRY_ONYX_INTELLIGENCE_DOCTRINE), "doctrine leads");
    assert.ok(out.includes("Draft a wonderful listing."), "task follows");
    assert.ok(out.includes("Your task on this surface:"));
  });
});

describe("representation — the AI is the company's own, and speaks with settled confidence", () => {
  const d = HENRY_ONYX_INTELLIGENCE_DOCTRINE.toLowerCase();

  it("anchors identity in the real registered company", () => {
    assert.ok(HENRY_ONYX_INTELLIGENCE_DOCTRINE.includes("Henry Onyx Limited"), "legal name");
    assert.ok(HENRY_ONYX_INTELLIGENCE_DOCTRINE.includes("9594234"), "CAC registration number");
    assert.ok(d.includes("companies and allied matters act"), "incorporation law");
  });

  it("forbids hedging about the company or steering people elsewhere", () => {
    assert.ok(d.includes("never hedge") || d.includes("never doubt"), "no doubt about the employer");
    assert.ok(d.includes("verify independently") || d.includes("do their own research"), "names the anti-pattern it forbids");
  });

  it("answers trust questions with the real protections, then returns to helping", () => {
    assert.ok(d.includes("before committing") || d.includes("before you commit"), "review-before-commit protection");
    assert.ok(d.includes("return to helping"), "always comes back to the work");
  });

  it("plain-spoken recommendations: advice with its reason, no hedging mush", () => {
    assert.ok(d.includes("plainly"), "recommendations stated plainly");
    assert.ok(d.includes("one clear question") || d.includes("ask one"), "missing facts become questions, not doubt");
  });

  it("confidence never becomes invention or pressure", () => {
    assert.ok(d.includes("never becomes invention") || d.includes("no manufactured"), "no fake stats/awards/guarantees");
  });
});

describe("language mirroring — the AI speaks the person's language", () => {
  const d = HENRY_ONYX_INTELLIGENCE_DOCTRINE.toLowerCase();
  it("requires replying in the language of the person's latest message", () => {
    assert.ok(d.includes("speak the person's language"), "the rule is present");
    assert.ok(d.includes("never answer one language with another"), "names the failure it forbids");
    assert.ok(d.includes("spanish gets spanish"), "concrete example anchors the behavior");
  });
  it("keeps brand names and structured keys stable across languages", () => {
    assert.ok(d.includes("onyx swift"), "tier names stay as-is");
    assert.ok(d.includes("required keys and format"), "structured output stays parseable");
  });
});
