import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import {
  assessQuality,
  assertAdvisoryOnly,
  QUALITY_INTERVENTIONS,
  QUALITY_MODEL_VERSION,
  SERVICE_UNIT_TYPES,
  type QualitySignals,
} from "../quality";

const HERE = path.dirname(fileURLToPath(import.meta.url));

function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1_664_525 + 1_013_904_223) >>> 0;
    return s / 4_294_967_296;
  };
}

test("a healthy unit is not at risk and suggests nothing", () => {
  const result = assessQuality({
    unitType: "care_booking",
    unitId: "b1",
    signals: {
      hoursSinceProviderMessage: 2,
      milestoneOverdueDays: 0,
      paymentStalledDays: 0,
      providerCompletionRate: 0.98,
      providerResponseHours: 1,
      customerEngagement: 0.8,
      priorComplaints: 0,
      deliveryWindowMissed: false,
    },
  });
  assert.equal(result.atRisk, false);
  assert.equal(result.riskBand, "low");
  assert.deepEqual(result.reasons, []);
  assert.equal(result.suggestedIntervention, undefined);
  assert.equal(result.advisory, true);
  assert.equal(result.modelVersion, QUALITY_MODEL_VERSION);
});

test("a failing unit is high risk with EXPLAINABLE reasons for every point of score", () => {
  const result = assessQuality({
    unitType: "studio_project",
    unitId: "p1",
    signals: {
      hoursSinceProviderMessage: 200,
      milestoneOverdueDays: 6,
      paymentStalledDays: 0,
      providerCompletionRate: 0.5,
      providerResponseHours: 90,
      customerEngagement: 0.05,
      priorComplaints: 1,
    },
  });
  assert.equal(result.riskBand, "high");
  assert.equal(result.atRisk, true);
  for (const expected of [
    "provider_silent",
    "milestone_overdue",
    "provider_low_completion_rate",
    "provider_slow_response",
    "customer_disengaged",
    "prior_complaint_on_unit",
  ]) {
    assert.ok(result.reasons.includes(expected as never), `missing reason ${expected}`);
  }
  assert.ok(result.suggestedIntervention, "a high-risk unit must suggest a human next step");
});

test("NO AUTO-PUNISHMENT: every suggested intervention is an action a HUMAN takes", () => {
  const rand = rng(7);
  const seen = new Set<string>();
  for (let i = 0; i < 500; i += 1) {
    const signals: QualitySignals = {
      hoursSinceProviderMessage: Math.round(rand() * 400),
      milestoneOverdueDays: Math.round(rand() * 10),
      paymentStalledDays: Math.round(rand() * 10),
      providerCompletionRate: rand(),
      providerResponseHours: Math.round(rand() * 100),
      customerEngagement: rand(),
      priorComplaints: Math.round(rand() * 2),
      deliveryWindowMissed: rand() > 0.5,
    };
    const unitType = SERVICE_UNIT_TYPES[i % SERVICE_UNIT_TYPES.length];
    const result = assessQuality({ unitType, unitId: `u${i}`, signals });
    assert.equal(result.advisory, true, "every assessment is advisory");
    if (result.suggestedIntervention) {
      seen.add(result.suggestedIntervention);
      assert.ok(
        (QUALITY_INTERVENTIONS as readonly string[]).includes(result.suggestedIntervention),
        `"${result.suggestedIntervention}" escaped the advisory union`,
      );
      // The negative assertion that actually matters.
      for (const punishment of ["suspend", "block", "hold", "freeze", "charge", "refund", "ban"]) {
        assert.equal(
          result.suggestedIntervention.includes(punishment),
          false,
          `a prediction proposed an enforcement action: ${result.suggestedIntervention}`,
        );
      }
    }
  }
  assert.ok(seen.size >= 3, "the fuzz should exercise several intervention branches");
});

test("NO AUTO-PUNISHMENT: the runtime guard rejects an enforcement verb", () => {
  for (const bad of ["suspend_provider", "block_account", "auto_refund", "freeze", ""]) {
    assert.throws(
      () => assertAdvisoryOnly(bad),
      /never auto-block, auto-suspend or auto-charge/,
      `"${bad}" must be rejected`,
    );
  }
  for (const good of QUALITY_INTERVENTIONS) {
    assert.doesNotThrow(() => assertAdvisoryOnly(good));
  }
});

test("PRECISION / RECALL: sampled against a known good-vs-bad generative process", () => {
  // "Bad" units are generated failing; "good" units generated healthy. Both get
  // noise, so the detector is not scored against a trivially separable set.
  const rand = rng(2026);
  let tp = 0;
  let fp = 0;
  let fn = 0;
  let tn = 0;
  const N = 400;
  for (let i = 0; i < N; i += 1) {
    const actuallyBad = i % 2 === 0;
    const noise = rand();
    const blur = rand();
    // OVERLAPPING distributions on purpose. A trivially separable fixture would
    // score 100% and prove nothing, so ~30% of bad units present only mildly
    // (a failure caught late) and ~20% of good units carry one alarming signal
    // (a provider who went quiet on holiday). That overlap is what the
    // precision/recall numbers below actually measure.
    const mildBad = blur < 0.3;
    const noisyGood = blur > 0.8;
    const signals: QualitySignals = actuallyBad
      ? {
          hoursSinceProviderMessage: mildBad ? 40 + noise * 20 : 80 + noise * 120,
          milestoneOverdueDays: mildBad ? 0 : noise > 0.4 ? 3 : 0,
          paymentStalledDays: noise > 0.7 ? 6 : 0,
          providerCompletionRate: mildBad ? 0.86 + noise * 0.1 : 0.55 + noise * 0.2,
          providerResponseHours: mildBad ? 8 + noise * 6 : 40 + noise * 40,
          customerEngagement: mildBad ? 0.25 + noise * 0.3 : noise * 0.2,
          priorComplaints: noise > 0.8 ? 1 : 0,
          deliveryWindowMissed: false,
        }
      : {
          hoursSinceProviderMessage: noisyGood ? 55 + noise * 20 : noise * 20,
          milestoneOverdueDays: 0,
          paymentStalledDays: 0,
          providerCompletionRate: 0.9 + noise * 0.1,
          providerResponseHours: noisyGood ? 14 + noise * 8 : noise * 6,
          customerEngagement: 0.6 + noise * 0.4,
          priorComplaints: 0,
          deliveryWindowMissed: false,
        };
    const flagged = assessQuality({ unitType: "care_booking", unitId: `u${i}`, signals }).atRisk;
    if (actuallyBad && flagged) tp += 1;
    else if (!actuallyBad && flagged) fp += 1;
    else if (actuallyBad && !flagged) fn += 1;
    else tn += 1;
  }
  const precision = tp / (tp + fp || 1);
  const recall = tp / (tp + fn || 1);
  console.log(
    `    quality at-risk — n=${N} tp=${tp} fp=${fp} fn=${fn} tn=${tn} ` +
      `precision=${(precision * 100).toFixed(1)}% recall=${(recall * 100).toFixed(1)}%`,
  );
  // Bars sit below the fixture's ACHIEVABLE frontier, not at an aspirational
  // number. ~20% of the "good" units are generated carrying two genuinely
  // alarming signals (a provider silent 55h+ AND slow to respond); any honest
  // rule-based detector flags those, which caps precision near 83% here. The
  // outcome happened to be fine, but flagging them for a human look was correct.
  assert.ok(precision >= 0.75, `precision ${(precision * 100).toFixed(1)}% below 75%`);
  assert.ok(recall >= 0.7, `recall ${(recall * 100).toFixed(1)}% below 70%`);
  assert.ok(fp + fn > 0, "an overlapping fixture MUST produce some errors — a perfect score means the fixture is separable and the metric is meaningless");
});

test("PRE-DATA unit: absent signals are not treated as good news", () => {
  const result = assessQuality({ unitType: "learn_enrolment", unitId: "e1", signals: {} });
  assert.equal(result.signalsPresent, 0, "nothing was observed and the output says so");
  assert.equal(result.riskBand, "low");
  assert.deepEqual(result.reasons, []);
});

test("PURE: identical input yields identical output, input unmutated", () => {
  const signals: QualitySignals = { hoursSinceProviderMessage: 100, milestoneOverdueDays: 4 };
  const snapshot = JSON.stringify(signals);
  const a = assessQuality({ unitType: "marketplace_order", unitId: "o1", signals });
  const b = assessQuality({ unitType: "marketplace_order", unitId: "o1", signals });
  assert.deepEqual(a, b);
  assert.equal(JSON.stringify(signals), snapshot);
});

test("per-unit-type thresholds differ: learn tolerates silence a care booking does not", () => {
  const signals: QualitySignals = { hoursSinceProviderMessage: 60 };
  assert.ok(assessQuality({ unitType: "care_booking", unitId: "c", signals }).reasons.includes("provider_silent"));
  assert.equal(
    assessQuality({ unitType: "learn_enrolment", unitId: "l", signals }).reasons.includes("provider_silent"),
    false,
    "a week of quiet on a self-paced course is normal",
  );
});

test("STRUCTURAL: the detector has no path to an AI gateway or a wallet", () => {
  const source = readFileSync(path.join(HERE, "..", "quality.ts"), "utf8");
  for (const forbidden of ["ai-gateway", "runAiTask", "payments_private", "customer_wallet", "supabase", "fetch("]) {
    assert.equal(source.includes(forbidden), false, `must not reference "${forbidden}"`);
  }
});
