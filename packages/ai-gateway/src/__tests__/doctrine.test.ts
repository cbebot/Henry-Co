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
