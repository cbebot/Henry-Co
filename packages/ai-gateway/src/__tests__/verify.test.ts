import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { parseVerdict, resolveVerdictDecision, type ListingVerdict } from "../verify";

const PASS_JSON = JSON.stringify({
  honest: true,
  aiGeneratedMedia: false,
  matchesStandards: true,
  safeToPost: true,
  trustScore: 92,
  reasons: ["Claims match the photos.", "Original product photography."],
  verdict: "pass",
});

describe("parseVerdict — robust against malformed / hostile model output", () => {
  it("parses a clean pass verdict (model 'pass' normalises to internal 'verified')", () => {
    const v = parseVerdict(PASS_JSON);
    assert.ok(v);
    assert.equal(v.verdict, "verified");
    assert.equal(v.trustScore, 92);
    assert.equal(v.honest, true);
    assert.equal(v.aiGeneratedMedia, false);
  });

  it("strips code fences", () => {
    const v = parseVerdict("```json\n" + PASS_JSON + "\n```");
    assert.ok(v);
    assert.equal(v.verdict, "verified");
  });

  it("clamps trustScore into 0..100", () => {
    assert.equal(parseVerdict(JSON.stringify({ ...JSON.parse(PASS_JSON), trustScore: 999 }))?.trustScore, 100);
    assert.equal(parseVerdict(JSON.stringify({ ...JSON.parse(PASS_JSON), trustScore: -5 }))?.trustScore, 0);
    assert.equal(parseVerdict(JSON.stringify({ ...JSON.parse(PASS_JSON), trustScore: "high" }))?.trustScore, 0);
  });

  it("coerces missing/non-boolean flags to the SAFE side (false)", () => {
    const v = parseVerdict(JSON.stringify({ verdict: "pass", trustScore: 80 }));
    assert.ok(v);
    // absent flags must not be treated as true — fail safe
    assert.equal(v.honest, false);
    assert.equal(v.matchesStandards, false);
    assert.equal(v.safeToPost, false);
  });

  it("returns null for non-JSON / non-object / array", () => {
    assert.equal(parseVerdict("not json"), null);
    assert.equal(parseVerdict("[1,2,3]"), null);
    assert.equal(parseVerdict("42"), null);
    assert.equal(parseVerdict(""), null);
  });

  it("normalizes an unknown verdict string to 'review' (never silently 'pass')", () => {
    assert.equal(parseVerdict(JSON.stringify({ ...JSON.parse(PASS_JSON), verdict: "looks good" }))?.verdict, "review");
  });

  it("bounds the reasons array (count + length) and drops non-strings", () => {
    const many = Array.from({ length: 50 }, (_, i) => "r".repeat(2000) + i);
    const v = parseVerdict(JSON.stringify({ ...JSON.parse(PASS_JSON), reasons: [...many, 7, null, { x: 1 }] }));
    assert.ok(v);
    assert.ok(v.reasons.length <= 10, "reasons capped");
    assert.ok(v.reasons.every((r) => typeof r === "string" && r.length <= 400), "each reason bounded");
  });
});

describe("resolveVerdictDecision — the badge gate AUGMENTS human moderation, never auto-publishes unsafe", () => {
  function v(over: Partial<ListingVerdict>): ListingVerdict {
    return { honest: true, aiGeneratedMedia: false, matchesStandards: true, safeToPost: true, trustScore: 90, reasons: [], verdict: "verified", ...over };
  }

  it("awards the Verified badge only when ALL gates pass and the model says pass", () => {
    const d = resolveVerdictDecision(v({}));
    assert.equal(d.badge, true);
    assert.equal(d.outcome, "verified");
  });

  it("never awards the badge when content is unsafe — routes to reject regardless of model verdict", () => {
    const d = resolveVerdictDecision(v({ safeToPost: false, verdict: "verified" }));
    assert.equal(d.badge, false);
    assert.equal(d.outcome, "reject");
  });

  it("never awards the badge when media is AI-generated or dishonest — routes to human review", () => {
    assert.equal(resolveVerdictDecision(v({ aiGeneratedMedia: true })).badge, false);
    assert.equal(resolveVerdictDecision(v({ honest: false })).outcome, "review");
  });

  it("a low trust score routes to review even if the flags are clean", () => {
    const d = resolveVerdictDecision(v({ trustScore: 40 }));
    assert.equal(d.badge, false);
    assert.equal(d.outcome, "review");
  });

  it("the decision NEVER means 'publish' — it only awards a badge or routes; humans/the upsert still gate go-live", () => {
    const d = resolveVerdictDecision(v({}));
    assert.ok(["verified", "review", "reject"].includes(d.outcome));
    assert.ok(!("publish" in d), "no publish authority in the AI decision");
  });
});
