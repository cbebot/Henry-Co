import { test } from "node:test";
import assert from "node:assert/strict";

import { forecastWorkload, QUEUE_KEYS } from "../workload";
import { assessQuality, QUALITY_INTERVENTIONS, SERVICE_UNIT_TYPES } from "../quality";
import { scoreDisputeLikelihood } from "../dispute";
import {
  assertNoRawScore,
  toStaffDisputeView,
  toStaffQualityView,
  toStaffWorkloadView,
} from "../projection";

/**
 * ADVERSARIAL FUZZ — hostile input against all three engines.
 *
 * This is not a happy-path test. Every value is chosen to break something: NaN,
 * ±Infinity, negatives, 1e308, denormals, unparseable and far-future dates, and
 * absurd model config. The invariants asserted here must hold for EVERY input.
 *
 * It earns its place: an earlier round of this fuzz found four real defects that
 * every hand-written test missed —
 *
 *   1. `upperCI` could be `Infinity` (a non-finite `z` propagated straight out);
 *   2. `predicted` could be `Infinity` because `round2` OVERFLOWED —
 *      `Math.round(1e308 * 100) / 100` is Infinity, the multiply overflowing
 *      before the divide could bring it back;
 *   3. a fractional `minAgents` surfaced as "recommend 0.30000000000000004
 *      people" on an operator screen;
 *   4. a non-finite model `intercept` made the logit NaN, and `logistic(NaN)` is
 *      NaN — so a NaN likelihood could be persisted and banded arbitrarily.
 *
 * All four would have been written to the database and rendered to staff. None
 * would have thrown. That is why this runs in CI.
 */

function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1_664_525 + 1_013_904_223) >>> 0;
    return s / 4_294_967_296;
  };
}

const HOSTILE_NUMBERS = [
  Number.NaN,
  Number.POSITIVE_INFINITY,
  Number.NEGATIVE_INFINITY,
  0,
  -0,
  -1,
  -1e12,
  1e12,
  1e308,
  Number.MAX_SAFE_INTEGER,
  Number.MIN_SAFE_INTEGER,
  0.1 + 0.2, // 0.30000000000000004
  1e-300, // denormal — made the seasonal index explode
];

const HOSTILE_DATES = [
  "not-a-date",
  "",
  "1970-01-01T00:00:00.000Z",
  "2999-12-31T23:59:59.999Z",
  "0000-01-01T00:00:00.000Z",
  "2026-13-45T99:99:99Z",
  "2026-03-29T01:30:00.000Z", // European DST spring-forward boundary
];

const ITERATIONS = 3000;

test("FUZZ: the forecaster always emits finite, non-negative, ordered numbers", () => {
  const rand = rng(90210);
  const pick = <T>(a: readonly T[]): T => a[Math.floor(rand() * a.length)];

  for (let i = 0; i < ITERATIONS; i += 1) {
    const history = Array.from({ length: Math.floor(rand() * 12) }, () => ({
      at: rand() < 0.3 ? pick(HOSTILE_DATES) : new Date(Math.floor(rand() * 2e12)).toISOString(),
      count: pick(HOSTILE_NUMBERS),
    }));

    const forecast = forecastWorkload({
      queue: pick(QUEUE_KEYS),
      history,
      asOf: rand() < 0.3 ? pick(HOSTILE_DATES) : undefined,
      horizonHours: rand() < 0.2 ? pick(HOSTILE_NUMBERS) : undefined,
      config:
        rand() < 0.3
          ? {
              alpha: pick(HOSTILE_NUMBERS),
              z: pick(HOSTILE_NUMBERS),
              maxAgents: pick(HOSTILE_NUMBERS),
              minAgents: pick(HOSTILE_NUMBERS),
              throughputPerAgentPerDay: pick(HOSTILE_NUMBERS),
            }
          : undefined,
    });

    for (const point of forecast.perHour) {
      assert.ok(Number.isFinite(point.predicted) && point.predicted >= 0, `predicted=${point.predicted}`);
      assert.ok(Number.isFinite(point.lowerCI) && point.lowerCI >= 0, `lowerCI=${point.lowerCI}`);
      assert.ok(Number.isFinite(point.upperCI), `upperCI=${point.upperCI}`);
      assert.ok(point.lowerCI <= point.upperCI, `CI inverted: ${point.lowerCI} > ${point.upperCI}`);
      assert.ok(typeof point.at === "string" && point.at.length >= 10, `bad timestamp ${point.at}`);
    }
    for (const rec of forecast.staffingRecommendation) {
      assert.ok(
        Number.isInteger(rec.recommendedAgents) && rec.recommendedAgents >= 0,
        `a recommendation must be a whole headcount, got ${rec.recommendedAgents}`,
      );
    }
    // The horizon must stay bounded no matter what was asked for.
    assert.ok(forecast.perHour.length <= 744, `horizon ${forecast.perHour.length} unbounded`);
  }
});

test("FUZZ: the at-risk detector never escapes the advisory contract", () => {
  const rand = rng(1337);
  const pick = <T>(a: readonly T[]): T => a[Math.floor(rand() * a.length)];

  for (let i = 0; i < ITERATIONS; i += 1) {
    const result = assessQuality({
      unitType: pick(SERVICE_UNIT_TYPES),
      unitId: rand() < 0.1 ? "" : `u${i}`,
      signals: {
        hoursSinceProviderMessage: pick(HOSTILE_NUMBERS),
        milestoneOverdueDays: pick(HOSTILE_NUMBERS),
        paymentStalledDays: pick(HOSTILE_NUMBERS),
        providerCompletionRate: pick(HOSTILE_NUMBERS),
        providerResponseHours: pick(HOSTILE_NUMBERS),
        customerEngagement: pick(HOSTILE_NUMBERS),
        priorComplaints: pick(HOSTILE_NUMBERS),
        deliveryWindowMissed: rand() < 0.5,
      },
      thresholds:
        rand() < 0.3
          ? { highAtScore: pick(HOSTILE_NUMBERS), elevatedAtScore: pick(HOSTILE_NUMBERS) }
          : undefined,
    });

    assert.equal(result.advisory, true, "every assessment is advisory");
    assert.equal(result.atRisk, result.riskBand !== "low", "atRisk must agree with the band");
    if (result.suggestedIntervention) {
      assert.ok(
        (QUALITY_INTERVENTIONS as readonly string[]).includes(result.suggestedIntervention),
        `escaped the advisory union: ${result.suggestedIntervention}`,
      );
    }
    assert.ok(
      !(result.riskBand === "low" && result.suggestedIntervention),
      "a low band must not carry an intervention",
    );
  }
});

test("FUZZ: the dispute scorer always emits a real probability in [0,1]", () => {
  const rand = rng(31337);
  const pick = <T>(a: readonly T[]): T => a[Math.floor(rand() * a.length)];

  for (let i = 0; i < ITERATIONS; i += 1) {
    const scored = scoreDisputeLikelihood({
      transactionId: `t${i}`,
      features: {
        amountKobo: pick(HOSTILE_NUMBERS),
        deliveryConfirmationGapDays: pick(HOSTILE_NUMBERS),
        categoryDisputeRate: pick(HOSTILE_NUMBERS),
        buyerPriorDisputeRate: pick(HOSTILE_NUMBERS),
        sellerPriorDisputeRate: pick(HOSTILE_NUMBERS),
        daysSincePayment: pick(HOSTILE_NUMBERS),
        refundRequestedUnresolved: rand() < 0.5,
        itemNotReceivedReported: rand() < 0.5,
      },
      config:
        rand() < 0.3
          ? {
              intercept: pick(HOSTILE_NUMBERS),
              watchAt: pick(HOSTILE_NUMBERS),
              highAt: pick(HOSTILE_NUMBERS),
              windowDays: pick(HOSTILE_NUMBERS),
            }
          : undefined,
    });

    assert.ok(
      Number.isFinite(scored.likelihood) && scored.likelihood >= 0 && scored.likelihood <= 1,
      `likelihood=${scored.likelihood}`,
    );
    assert.ok(["low", "watch", "high"].includes(scored.band), `band=${scored.band}`);
    assert.equal(scored.advisory, true);
    assert.ok(Number.isFinite(scored.windowDays) && scored.windowDays > 0);
    const weights = scored.topFactors.map((f) => f.weight);
    assert.deepEqual(weights, [...weights].sort((a, b) => b - a), "topFactors must stay rank-ordered");
    for (const w of weights) assert.ok(Number.isFinite(w), `weight=${w}`);
  }
});

test("FUZZ: no hostile input can push a raw score across the client boundary", () => {
  const rand = rng(4242);
  const pick = <T>(a: readonly T[]): T => a[Math.floor(rand() * a.length)];

  for (let i = 0; i < 1000; i += 1) {
    const dispute = scoreDisputeLikelihood({
      transactionId: `t${i}`,
      features: {
        amountKobo: pick(HOSTILE_NUMBERS),
        itemNotReceivedReported: rand() < 0.5,
        deliveryConfirmationGapDays: pick(HOSTILE_NUMBERS),
      },
    });
    const quality = assessQuality({
      unitType: pick(SERVICE_UNIT_TYPES),
      unitId: `u${i}`,
      signals: { hoursSinceProviderMessage: pick(HOSTILE_NUMBERS), priorComplaints: pick(HOSTILE_NUMBERS) },
    });
    const workload = forecastWorkload({
      queue: pick(QUEUE_KEYS),
      history: [{ at: pick(HOSTILE_DATES), count: pick(HOSTILE_NUMBERS) }],
    });

    assert.doesNotThrow(() => assertNoRawScore(toStaffDisputeView(dispute)));
    assert.doesNotThrow(() => assertNoRawScore(toStaffQualityView(quality)));
    assert.doesNotThrow(() => assertNoRawScore(toStaffWorkloadView(workload)));
  }
});
