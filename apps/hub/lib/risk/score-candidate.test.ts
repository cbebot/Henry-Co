import { test } from "node:test";
import assert from "node:assert/strict";

import type { RiskModelConfig, RiskScoreResult } from "@henryco/intelligence";
import { scoreCandidateWithAdvisory } from "./score-candidate";
import type { RiskEntityCandidate } from "./readers";
import type { RiskAssistOutcome } from "./assist";

/**
 * V3-40 — the ABSOLUTE the R1 adversarial round fixed, now guarded by a real test:
 * an advisory throw (request OR re-score) must NEVER drop the deterministic floor.
 */

const MODEL: RiskModelConfig = {
  modelKind: "fraud_risk",
  version: "1.0.0",
  status: "live",
  weights: { "behavioral.velocity_events_24h": 100, "signal.wallet_velocity_anomaly": 22 },
  behavioralScales: { velocity_events_24h: 100 },
  thresholds: { monitor: 30, review: 60, freeze: 85 },
  advisoryCapPoints: 10,
};

/** A candidate whose deterministic floor lands in the review tier (advisory-eligible). */
function reviewCandidate(): RiskEntityCandidate {
  return {
    entityType: "account",
    entityId: "acct-review",
    features: { signals: [], behavioral: { velocity_events_24h: 65 } }, // → det score 65 (review)
  };
}

const eligible = (floor: RiskScoreResult) =>
  floor.deterministicTier === "review" || floor.deterministicTier === "freeze";

test("advisory REQUEST throws → floor is kept, advisory_error recorded", async () => {
  const outcome = await scoreCandidateWithAdvisory({
    candidate: reviewCandidate(),
    model: MODEL,
    wantsAdvisory: true,
    isEligible: eligible,
    requestAdvisory: async () => {
      throw new Error("ledger RPC exploded");
    },
  });
  assert.equal(outcome.result.riskScore, 65, "the deterministic floor is persisted, not dropped");
  assert.equal(outcome.result.deterministicScore, 65);
  assert.equal(outcome.advisoryApplied, false);
  assert.equal(outcome.advisorySkipped, "advisory_error");
});

test("advisory RE-SCORE throws → floor is kept (both throw sites live in the same try)", async () => {
  // A well-formed advisory whose adjustmentPoints is NaN makes the second scoreEntity
  // path exercise; here we force the re-score to throw by returning a poisoned advisory
  // that the engine rejects only at runtime — simulate via a requestAdvisory that returns
  // an advisory, then rely on a model that would throw. Simpler: throw from within the
  // returned promise chain after the null check by returning a getter that explodes.
  const hostile = {
    get advisory() {
      throw new Error("re-score input access exploded");
    },
  } as unknown as RiskAssistOutcome;
  const outcome = await scoreCandidateWithAdvisory({
    candidate: reviewCandidate(),
    model: MODEL,
    wantsAdvisory: true,
    isEligible: eligible,
    requestAdvisory: async () => hostile,
  });
  assert.equal(outcome.result.riskScore, 65, "the floor survives a re-score/outcome throw");
  assert.equal(outcome.advisorySkipped, "advisory_error");
});

test("advisory returns null (skipped) → floor is kept with the real skip reason", async () => {
  const outcome = await scoreCandidateWithAdvisory({
    candidate: reviewCandidate(),
    model: MODEL,
    wantsAdvisory: true,
    isEligible: eligible,
    requestAdvisory: async (): Promise<RiskAssistOutcome> => ({ advisory: null, skipped: "ceiling" }),
  });
  assert.equal(outcome.result.riskScore, 65);
  assert.equal(outcome.advisoryApplied, false);
  assert.equal(outcome.advisorySkipped, "ceiling");
});

test("advisory applies within cap → adjusted result, floor preserved in deterministicScore", async () => {
  const outcome = await scoreCandidateWithAdvisory({
    candidate: reviewCandidate(),
    model: MODEL,
    wantsAdvisory: true,
    isEligible: eligible,
    requestAdvisory: async (): Promise<RiskAssistOutcome> => ({
      advisory: { adjustmentPoints: 8, noteKey: "corroborating_pattern" },
    }),
  });
  assert.equal(outcome.result.riskScore, 73, "65 + 8 clamped");
  assert.equal(outcome.result.deterministicScore, 65, "the floor is preserved alongside");
  assert.equal(outcome.advisoryApplied, true);
  assert.equal(outcome.advisorySkipped, null);
});

test("not tier-eligible (pass/monitor floor) → no advisory requested, no skip recorded", async () => {
  let requested = false;
  const outcome = await scoreCandidateWithAdvisory({
    candidate: { entityType: "account", entityId: "acct-low", features: { signals: [], behavioral: { velocity_events_24h: 20 } } },
    model: MODEL,
    wantsAdvisory: true,
    isEligible: eligible,
    requestAdvisory: async () => {
      requested = true;
      return { advisory: null, skipped: "flag_dark" };
    },
  });
  assert.equal(requested, false, "a pass-tier entity is never sent to the advisory");
  assert.equal(outcome.result.riskScore, 20);
  assert.equal(outcome.advisorySkipped, null, "no skip is recorded for an ineligible entity");
});

test("no headroom (wantsAdvisory false) → floor only, advisory never requested", async () => {
  let requested = false;
  const outcome = await scoreCandidateWithAdvisory({
    candidate: reviewCandidate(),
    model: MODEL,
    wantsAdvisory: false,
    isEligible: eligible,
    requestAdvisory: async () => {
      requested = true;
      return { advisory: null, skipped: "flag_dark" };
    },
  });
  assert.equal(requested, false);
  assert.equal(outcome.result.riskScore, 65);
  assert.equal(outcome.advisorySkipped, null);
});
