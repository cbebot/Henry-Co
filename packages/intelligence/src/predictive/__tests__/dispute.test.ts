import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import {
  scoreDisputeLikelihood,
  DISPUTE_FACTORS,
  DISPUTE_MODEL_VERSION,
  type DisputeFeatures,
} from "../dispute";

const HERE = path.dirname(fileURLToPath(import.meta.url));

function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1_664_525 + 1_013_904_223) >>> 0;
    return s / 4_294_967_296;
  };
}

/**
 * THE distinctness proof the pass spec demands. `RiskSignalType` is a type-only
 * union (no runtime array), so the members are parsed out of the REAL source —
 * if V3-40 ever adds a signal that collides with a dispute factor, this fails.
 */
function readRiskSignalTypes(): string[] {
  const source = readFileSync(path.join(HERE, "..", "..", "index.ts"), "utf8");
  const start = source.indexOf("export type RiskSignalType =");
  assert.ok(start > -1, "RiskSignalType must exist in the intelligence barrel");
  const end = source.indexOf(";", start);
  return [...source.slice(start, end).matchAll(/"([a-z_]+)"/g)].map((m) => m[1]);
}

test("PROVABLY DISTINCT from V3-40 fraud risk: zero shared vocabulary", () => {
  const riskSignals = readRiskSignalTypes();
  assert.equal(riskSignals.length, 8, "V3-40's eight deterministic signals");
  const overlap = DISPUTE_FACTORS.filter((f) => riskSignals.includes(f));
  assert.deepEqual(overlap, [], `dispute factors must not reuse fraud signals: ${overlap.join(", ")}`);
});

test("a clean buyer with a stalled delivery still scores — fulfilment risk is not fraud risk", () => {
  // No adversarial signal anywhere: perfect buyer, perfect seller, ordinary value.
  const result = scoreDisputeLikelihood({
    transactionId: "t1",
    features: {
      amountKobo: 800_000,
      buyerPriorDisputeRate: 0,
      sellerPriorDisputeRate: 0,
      deliveryConfirmationGapDays: 21,
      itemNotReceivedReported: true,
      refundRequestedUnresolved: true,
      categoryDisputeRate: 0.05,
      daysSincePayment: 25,
    },
  });
  assert.equal(result.band, "high");
  assert.ok(
    result.topFactors.some((f) => f.factor === "item_not_received_reported"),
    "the dominant factor is a fulfilment failure, not an identity signal",
  );
});

test("BACK-TEST: AUC and precision@k against a labelled generative process", () => {
  const rand = rng(31337);
  const rows: { likelihood: number; propensity: number; label: 0 | 1 }[] = [];
  const N = 600;
  for (let i = 0; i < N; i += 1) {
    // Latent propensity drives the observable features AND the label — but only
    // PROBABILISTICALLY, and every feature carries independent noise. A label
    // that is a deterministic threshold on the same latent the features encode
    // makes the ranking trivial and the AUC meaningless (it scores ~0.99 and
    // proves nothing); this fixture keeps a real Bayes ceiling well below 1.0.
    const latent = rand();
    const daysSincePayment = Math.round(rand() * 60);
    // The TRUE propensity the label is drawn from. Survival matters: a
    // transaction that already sat most of its 60-day window without a dispute
    // is less likely to attract one in what remains — which is exactly why the
    // model carries a NEGATIVE `settlement_age` coefficient. Generating that
    // feature as pure noise would penalise the scorer for a real-world
    // relationship the fixture simply failed to encode.
    const propensity = (0.06 + latent * 0.55) * (1 - daysSincePayment / 90);
    const disputed: 0 | 1 = rand() < propensity ? 1 : 0;
    const jitter = () => (rand() - 0.5) * 0.5;
    const noisyLatent = Math.max(0, Math.min(1, latent + jitter()));
    const features: DisputeFeatures = {
      amountKobo: Math.round(50_000 + noisyLatent * 9_000_000),
      deliveryConfirmationGapDays: Math.round(Math.max(0, noisyLatent * 20 + jitter() * 8)),
      categoryDisputeRate: Math.max(0, 0.02 + noisyLatent * 0.15 + jitter() * 0.05),
      buyerPriorDisputeRate: rand() < latent * 0.5 ? 0.3 : 0.02,
      sellerPriorDisputeRate: rand() < latent * 0.45 ? 0.25 : 0.03,
      refundRequestedUnresolved: rand() < latent * 0.55,
      itemNotReceivedReported: rand() < latent * 0.4,
      daysSincePayment,
    };
    rows.push({
      likelihood: scoreDisputeLikelihood({ transactionId: `t${i}`, features }).likelihood,
      propensity,
      label: disputed,
    });
  }

  // AUC via the Mann-Whitney rank statistic (ties counted at half).
  const pos = rows.filter((r) => r.label === 1);
  const neg = rows.filter((r) => r.label === 0);
  const aucBy = (key: "likelihood" | "propensity"): number => {
    let wins = 0;
    for (const p of pos) {
      for (const n of neg) {
        if (p[key] > n[key]) wins += 1;
        else if (p[key] === n[key]) wins += 0.5;
      }
    }
    return wins / (pos.length * neg.length);
  };
  const auc = aucBy("likelihood");
  // The BAYES CEILING: rank by the true propensity the label was drawn from. No
  // scorer can beat this, and because the label is probabilistic it sits far
  // below 1.0 — so a fixed bar like "AUC >= 0.85" would be unreachable by
  // construction. The real claim is how much of the AVAILABLE signal we capture.
  const oracle = aucBy("propensity");
  const captured = (auc - 0.5) / Math.max(1e-9, oracle - 0.5);

  const k = 50;
  const topK = [...rows].sort((a, b) => b.likelihood - a.likelihood).slice(0, k);
  const precisionAtK = topK.filter((r) => r.label === 1).length / k;

  const baseRate = pos.length / rows.length;
  console.log(
    `    dispute back-test — n=${N} positives=${pos.length} negatives=${neg.length} ` +
      `AUC=${auc.toFixed(3)} (oracle ceiling ${oracle.toFixed(3)}, captured ${(captured * 100).toFixed(0)}%) ` +
      `precision@${k}=${(precisionAtK * 100).toFixed(1)}% vs base rate ${(baseRate * 100).toFixed(1)}%`,
  );
  assert.ok(auc > 0.55, `AUC ${auc.toFixed(3)} is barely above chance`);
  assert.ok(
    captured >= 0.6,
    `the scorer captured only ${(captured * 100).toFixed(0)}% of the ${oracle.toFixed(3)} signal available`,
  );
  assert.ok(auc <= oracle + 0.02, `AUC ${auc.toFixed(3)} exceeds the oracle ${oracle.toFixed(3)} — the fixture leaks the label`);
  assert.ok(
    precisionAtK >= baseRate * 1.4,
    `precision@${k} ${(precisionAtK * 100).toFixed(1)}% must beat the ${(baseRate * 100).toFixed(1)}% base rate by 1.4x`,
  );
});

test("MONOTONIC: adding pressure never lowers the likelihood", () => {
  const base: DisputeFeatures = {
    amountKobo: 500_000,
    deliveryConfirmationGapDays: 1,
    categoryDisputeRate: 0.05,
    buyerPriorDisputeRate: 0.01,
    sellerPriorDisputeRate: 0.01,
    refundRequestedUnresolved: false,
    itemNotReceivedReported: false,
    daysSincePayment: 2,
  };
  const baseline = scoreDisputeLikelihood({ transactionId: "m", features: base }).likelihood;
  const worse: DisputeFeatures[] = [
    { ...base, deliveryConfirmationGapDays: 20 },
    { ...base, itemNotReceivedReported: true },
    { ...base, refundRequestedUnresolved: true },
    { ...base, buyerPriorDisputeRate: 0.5 },
    { ...base, sellerPriorDisputeRate: 0.5 },
    { ...base, categoryDisputeRate: 0.4 },
    { ...base, amountKobo: 9_000_000 },
  ];
  for (const features of worse) {
    assert.ok(
      scoreDisputeLikelihood({ transactionId: "m", features }).likelihood > baseline,
      `worsening a feature must raise the likelihood: ${JSON.stringify(features)}`,
    );
  }
});

test("bands follow the configured thresholds", () => {
  const quiet = scoreDisputeLikelihood({
    transactionId: "q",
    features: { amountKobo: 20_000, deliveryConfirmationGapDays: 0, itemNotReceivedReported: false },
  });
  assert.equal(quiet.band, "low");
  assert.equal(quiet.windowDays, 60);
  assert.equal(quiet.modelVersion, DISPUTE_MODEL_VERSION);
  assert.equal(quiet.advisory, true);
});

test("factors are returned in descending pressure order (explainability)", () => {
  const result = scoreDisputeLikelihood({
    transactionId: "f",
    features: {
      amountKobo: 9_000_000,
      itemNotReceivedReported: true,
      refundRequestedUnresolved: true,
      deliveryConfirmationGapDays: 14,
      daysSincePayment: 60,
    },
  });
  const weights = result.topFactors.map((f) => f.weight);
  assert.deepEqual(weights, [...weights].sort((a, b) => b - a), "topFactors must be rank-ordered");
  assert.equal(result.topFactors[0].factor, "item_not_received_reported");
});

test("PRE-DATA transaction: no features means no confident score", () => {
  const result = scoreDisputeLikelihood({ transactionId: "empty", features: {} });
  assert.equal(result.featuresPresent, 0);
  assert.equal(result.band, "low");
  assert.deepEqual(result.topFactors, []);
});

test("hostile input degrades instead of throwing, and likelihood stays in [0,1]", () => {
  const result = scoreDisputeLikelihood({
    transactionId: "h",
    features: {
      amountKobo: Number.NaN,
      deliveryConfirmationGapDays: -50,
      categoryDisputeRate: 99,
      buyerPriorDisputeRate: -3,
      daysSincePayment: Number.POSITIVE_INFINITY,
    },
  });
  assert.ok(result.likelihood >= 0 && result.likelihood <= 1);
});

test("PURE: identical input yields identical output, input unmutated", () => {
  const features: DisputeFeatures = { amountKobo: 100_000, itemNotReceivedReported: true };
  const snapshot = JSON.stringify(features);
  const a = scoreDisputeLikelihood({ transactionId: "p", features });
  const b = scoreDisputeLikelihood({ transactionId: "p", features });
  assert.deepEqual(a, b);
  assert.equal(JSON.stringify(features), snapshot);
});

test("STRUCTURAL: the scorer cannot reach a wallet, the money RPCs or a gateway", () => {
  const source = readFileSync(path.join(HERE, "..", "dispute.ts"), "utf8");
  for (const forbidden of [
    "ai-gateway",
    "runAiTask",
    "payments_private",
    "customer_wallet",
    "post_ai_usage_charge",
    "supabase",
    "fetch(",
  ]) {
    assert.equal(source.includes(forbidden), false, `must not reference "${forbidden}"`);
  }
});
