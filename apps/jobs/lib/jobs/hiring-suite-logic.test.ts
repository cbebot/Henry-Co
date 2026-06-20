import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  buildHiringScope,
  aggregateScores,
  resolveMentions,
  validateBulkMove,
  decisionToTransition,
  isValidScore,
  HIRING_RUBRIC_KEYS,
} from "./hiring-suite-logic";

const BIZ_A = "11111111-1111-1111-1111-111111111111";
const BIZ_B = "22222222-2222-2222-2222-222222222222";
const APP_1 = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const APP_2 = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const U1 = "user-1";
const U2 = "user-2";
const U3 = "user-3";

describe("buildHiringScope — cross-business isolation (RLS predicate mirror)", () => {
  it("binds a business context to its own business", () => {
    const scope = buildHiringScope({ kind: "business", businessId: BIZ_A, role: "member" });
    assert.equal(scope.businessId, BIZ_A);
    assert.notEqual(scope.businessId, BIZ_B);
  });
  it("a personal context resolves to a no-match sentinel (zero hiring rows)", () => {
    assert.equal(buildHiringScope({ kind: "personal" }).businessId, "__none__");
  });
  it("a business context without an id also denies", () => {
    assert.equal(buildHiringScope({ kind: "business", businessId: "" }).businessId, "__none__");
  });
});

describe("isValidScore", () => {
  it("accepts integers 1–5", () => {
    for (const n of [1, 2, 3, 4, 5]) assert.equal(isValidScore(n), true);
  });
  it("rejects out-of-range, non-integer, NaN", () => {
    for (const n of [0, 6, 3.5, Number.NaN, -1]) assert.equal(isValidScore(n), false);
  });
});

describe("aggregateScores — team aggregation (SQL view mirror)", () => {
  it("returns nulls for no scores", () => {
    const s = aggregateScores([]);
    assert.equal(s.scorerCount, 0);
    assert.equal(s.scoreCount, 0);
    assert.equal(s.overallMean, null);
    assert.deepEqual(s.rubricMeans, {});
    assert.equal(s.predictiveScore, null);
  });
  it("aggregates per-rubric mean + overall mean + distinct scorer count", () => {
    const s = aggregateScores([
      { scorerUserId: U1, rubricKey: "technical", score: 4 },
      { scorerUserId: U2, rubricKey: "technical", score: 2 },
      { scorerUserId: U1, rubricKey: "culture", score: 5 },
    ]);
    assert.equal(s.scorerCount, 2);
    assert.equal(s.scoreCount, 3);
    assert.equal(s.rubricMeans.technical.mean, 3);
    assert.equal(s.rubricMeans.technical.count, 2);
    assert.equal(s.rubricMeans.culture.mean, 5);
    assert.equal(s.overallMean, Math.round(((4 + 2 + 5) / 3) * 100) / 100);
  });
  it("ignores invalid scores", () => {
    const s = aggregateScores([
      { scorerUserId: U1, rubricKey: "technical", score: 4 },
      { scorerUserId: U2, rubricKey: "technical", score: 99 },
    ]);
    assert.equal(s.scoreCount, 1);
    assert.equal(s.rubricMeans.technical.mean, 4);
  });
});

describe("resolveMentions — member-only, deduped, no self", () => {
  it("keeps only members, drops non-members", () => {
    assert.deepEqual(resolveMentions([U1, U2], [U1, U3, U2]), [U1, U2]);
  });
  it("dedupes repeated ids", () => {
    assert.deepEqual(resolveMentions([U1, U2], [U1, U1, U2]), [U1, U2]);
  });
  it("excludes the author", () => {
    assert.deepEqual(resolveMentions([U1, U2], [U1, U2], U1), [U2]);
  });
  it("returns empty when none match", () => {
    assert.deepEqual(resolveMentions([U1], [U3]), []);
  });
});

describe("validateBulkMove — all-or-nothing pre-flight (RPC guard mirror)", () => {
  const base = {
    appBusinessIds: { [APP_1]: BIZ_A, [APP_2]: BIZ_A },
    stagesByApplication: { [APP_1]: ["applied", "interview"], [APP_2]: ["applied", "interview"] },
    actingBusinessId: BIZ_A,
  };
  it("rejects an empty batch", () => {
    assert.deepEqual(validateBulkMove({ ...base, applicationIds: [], toStage: "interview" }), { ok: false, error: "no_applications" });
  });
  it("rejects a blank target stage", () => {
    assert.deepEqual(validateBulkMove({ ...base, applicationIds: [APP_1], toStage: "  " }), { ok: false, error: "no_stage" });
  });
  it("rejects an unbound pipeline", () => {
    const r = validateBulkMove({ ...base, appBusinessIds: { [APP_1]: null }, applicationIds: [APP_1], toStage: "interview" });
    assert.deepEqual(r, { ok: false, error: "unbound_pipeline" });
  });
  it("rejects a cross-business application", () => {
    const r = validateBulkMove({ ...base, appBusinessIds: { [APP_1]: BIZ_B }, applicationIds: [APP_1], toStage: "interview" });
    assert.deepEqual(r, { ok: false, error: "cross_business" });
  });
  it("rejects a stage not in the pipeline", () => {
    const r = validateBulkMove({ ...base, applicationIds: [APP_1], toStage: "nonexistent" });
    assert.deepEqual(r, { ok: false, error: "invalid_stage" });
  });
  it("accepts a valid same-business batch", () => {
    assert.deepEqual(validateBulkMove({ ...base, applicationIds: [APP_1, APP_2], toStage: "interview" }), { ok: true });
  });
});

describe("decisionToTransition", () => {
  it("maps offer", () => {
    assert.deepEqual(decisionToTransition("offer"), { stage: "offer", status: "active", eventKey: "HIRING_OFFER_SENT", document: "offer" });
  });
  it("maps rejection to the terminal stage + staged event", () => {
    assert.deepEqual(decisionToTransition("rejection"), { stage: "rejected", status: "rejected", eventKey: "HIRING_APPLICATION_STAGED", document: "rejection" });
  });
  it("maps hire", () => {
    assert.deepEqual(decisionToTransition("hire"), { stage: "hired", status: "hired", eventKey: "HIRING_CANDIDATE_HIRED", document: null });
  });
});

describe("HIRING_RUBRIC_KEYS", () => {
  it("is the canonical four-rubric set", () => {
    assert.deepEqual([...HIRING_RUBRIC_KEYS], ["technical", "communication", "culture", "experience"]);
  });
});
