import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { evaluate, combineVerdicts } from "../pipeline";
import { runDeterministic } from "../deterministic/index";
import { normalizeAiResult } from "../ai/ai-scan";
import type { AiScanResult, DetectorVerdict, ModerationInput } from "../types";

const listing = (text: string): ModerationInput => ({
  contentType: "marketplace_listing",
  contentId: "c1",
  text,
  locale: "en",
});

describe("evaluate — deterministic-only floor", () => {
  it("approves clean content with no AI", () => {
    const r = evaluate(listing("Beautiful leather bag for sale"));
    assert.equal(r.decision, "approve");
    assert.equal(r.scanner, "deterministic_rule");
    assert.equal(r.shortCircuited, false);
  });
  it("rejects banned goods and short-circuits", () => {
    const r = evaluate(listing("AK-47 for sale"));
    assert.equal(r.decision, "reject");
    assert.equal(r.scanner, "deterministic_rule");
    assert.equal(r.shortCircuited, true);
  });
  it("rejects hate speech and short-circuits", () => {
    assert.equal(evaluate(listing("you retard")).shortCircuited, true);
  });
  it("holds PII leaks", () => {
    assert.equal(evaluate(listing("call 08031234567")).decision, "hold");
  });
  it("holds scam language (composes trust detector)", () => {
    const r = evaluate(listing("send money via western union now, act now"));
    assert.equal(r.decision, "hold");
    assert.ok(r.reasons.includes("scam_suspected"));
  });
});

describe("evaluate — degrade-not-fail-open", () => {
  it("a null AI result never weakens a deterministic hold", () => {
    const r = evaluate(listing("this is shit"), { aiResult: null });
    assert.equal(r.decision, "hold");
    assert.equal(r.scanner, "deterministic_rule");
  });
  it("an unambiguous reject ignores any AI approve", () => {
    const ai: AiScanResult = { recommendation: "approve", reasons: [], confidence: 0.99 };
    const r = evaluate(listing("cocaine for sale"), { aiResult: ai });
    assert.equal(r.decision, "reject");
    assert.equal(r.scanner, "deterministic_rule"); // AI was not consulted
  });
});

describe("combineVerdicts — AI layering (human-gated)", () => {
  const cleanVerdict: DetectorVerdict = {
    decision: "approve",
    reasons: [],
    severity: "low",
    unambiguous: false,
    detail: [],
  };
  it("AI hold lifts an approve to hold", () => {
    const ai: AiScanResult = { recommendation: "hold", reasons: ["ai_flagged_scam"], confidence: 0.8 };
    const r = combineVerdicts(cleanVerdict, ai);
    assert.equal(r.decision, "hold");
    assert.equal(r.scanner, "ai_check");
    assert.ok(r.reasons.includes("ai_flagged_scam"));
  });
  it("AI approve leaves an approve as approve", () => {
    const ai: AiScanResult = { recommendation: "approve", reasons: [], confidence: 0.9 };
    assert.equal(combineVerdicts(cleanVerdict, ai).decision, "approve");
  });
  it("AI can never produce a reject (downgraded to hold upstream)", () => {
    const downgraded = normalizeAiResult({ recommendation: "reject", reasons: ["ai_flagged_nsfw"], confidence: 1 });
    assert.equal(downgraded.recommendation, "hold");
    const r = combineVerdicts(cleanVerdict, downgraded);
    assert.equal(r.decision, "hold");
    assert.notEqual(r.decision, "reject");
  });
  it("AI approve cannot lower a deterministic hold", () => {
    const holdVerdict: DetectorVerdict = {
      decision: "hold",
      reasons: ["pii_leak"],
      severity: "medium",
      unambiguous: false,
      detail: [],
    };
    const ai: AiScanResult = { recommendation: "approve", reasons: [], confidence: 0.95 };
    assert.equal(combineVerdicts(holdVerdict, ai).decision, "hold");
  });
  it("unambiguous deterministic reject short-circuits even in combineVerdicts", () => {
    const rejectVerdict: DetectorVerdict = {
      decision: "reject",
      reasons: ["banned_goods"],
      severity: "critical",
      unambiguous: true,
      detail: ["weapons"],
    };
    const ai: AiScanResult = { recommendation: "approve", reasons: [], confidence: 1 };
    const r = combineVerdicts(rejectVerdict, ai);
    assert.equal(r.decision, "reject");
    assert.equal(r.shortCircuited, true);
    assert.equal(r.scanner, "deterministic_rule");
  });
});

describe("normalizeAiResult", () => {
  it("clamps confidence into [0,1]", () => {
    assert.equal(normalizeAiResult({ recommendation: "hold", reasons: [], confidence: 5 }).confidence, 1);
    assert.equal(normalizeAiResult({ recommendation: "hold", reasons: [], confidence: -1 }).confidence, 0);
  });
  it("handles NaN confidence", () => {
    assert.equal(normalizeAiResult({ recommendation: "hold", reasons: [], confidence: NaN }).confidence, 0);
  });
});

describe("runDeterministic — image hash integration", () => {
  it("rejects on a known-bad image hash", () => {
    const r = runDeterministic(listing("clean text"), {
      imageHashes: ["badhash"],
      knownBadImageHashes: new Set(["badhash"]),
    });
    assert.equal(r.decision, "reject");
    assert.ok(r.reasons.includes("image_hash_match"));
  });
  it("approves clean text + clean images", () => {
    const r = runDeterministic(listing("clean text"), {
      imageHashes: ["safe"],
      knownBadImageHashes: new Set(["badhash"]),
    });
    assert.equal(r.decision, "approve");
  });
  it("skips image-hash when no known-bad set supplied (degrade)", () => {
    const r = runDeterministic(listing("clean text"), { imageHashes: ["anything"] });
    assert.equal(r.decision, "approve");
  });
});
