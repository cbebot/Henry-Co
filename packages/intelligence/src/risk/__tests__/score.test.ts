import { test } from "node:test";
import assert from "node:assert/strict";

import { scoreEntity } from "../score";
import { tierForScore, validateRiskModelConfig, DEFAULT_RISK_TIER_THRESHOLDS } from "../tiers";
import { RiskModelConfigError, type RiskModelConfig } from "../types";
import type { RiskSignal } from "../../index";

function model(overrides: Partial<RiskModelConfig> = {}): RiskModelConfig {
  return {
    modelKind: "fraud_risk",
    version: "1.0.0",
    status: "shadow",
    weights: {
      "signal.wallet_velocity_anomaly": 22,
      "signal.failed_sensitive_action_burst": 18,
      "signal.verification_mismatch": 16,
      "threat.credential_spray": 25,
      "threat.impossible_travel": 20,
      "behavioral.velocity_events_24h": 100,
      "behavioral.disputes_open": 10,
    },
    behavioralScales: { velocity_events_24h: 100, disputes_open: 3 },
    thresholds: { ...DEFAULT_RISK_TIER_THRESHOLDS },
    advisoryCapPoints: 10,
    ...overrides,
  };
}

function signal(type: RiskSignal["type"], severity: RiskSignal["severity"]): RiskSignal {
  return {
    id: `${type}-${severity}`,
    type,
    severity,
    subjectRef: "entity-1",
    recordedAt: "2026-07-25T00:00:00.000Z",
    metadataKeys: [],
  };
}

/** Drive an exact deterministic score through the saturating behavioral feature. */
function exactScore(points: number) {
  return scoreEntity({
    entityType: "account",
    entityId: "acct-1",
    features: { signals: [], behavioral: { velocity_events_24h: points } },
    model: model(),
  });
}

test("empty features score to a pass-tier zero", () => {
  const result = scoreEntity({
    entityType: "account",
    entityId: "acct-1",
    features: { signals: [] },
    model: model(),
  });
  assert.equal(result.riskScore, 0);
  assert.equal(result.deterministicScore, 0);
  assert.equal(result.tier, "pass");
  assert.equal(result.deterministicTier, "pass");
  assert.deepEqual(result.contributingFactors, []);
  assert.equal(result.shadow, true);
});

test("tier boundaries: 29/30, 59/60, 84/85, 100", () => {
  assert.equal(exactScore(29).tier, "pass");
  assert.equal(exactScore(30).tier, "monitor");
  assert.equal(exactScore(59).tier, "monitor");
  assert.equal(exactScore(60).tier, "review");
  assert.equal(exactScore(84).tier, "review");
  assert.equal(exactScore(85).tier, "freeze");
  assert.equal(exactScore(100).tier, "freeze");
  assert.equal(exactScore(100).riskScore, 100);
});

test("signal severity multiplies the configured weight", () => {
  const high = scoreEntity({
    entityType: "account",
    entityId: "a",
    features: { signals: [signal("wallet_velocity_anomaly", "high")] },
    model: model(),
  });
  const medium = scoreEntity({
    entityType: "account",
    entityId: "a",
    features: { signals: [signal("wallet_velocity_anomaly", "medium")] },
    model: model(),
  });
  const info = scoreEntity({
    entityType: "account",
    entityId: "a",
    features: { signals: [signal("wallet_velocity_anomaly", "info")] },
    model: model(),
  });
  assert.equal(high.deterministicScore, 22);
  assert.equal(medium.deterministicScore, 16.5);
  assert.equal(info.deterministicScore, 5.5);
});

test("repeat instances of one signal type accumulate and report their count", () => {
  const result = scoreEntity({
    entityType: "listing",
    entityId: "l-1",
    features: {
      signals: [
        signal("wallet_velocity_anomaly", "high"),
        signal("wallet_velocity_anomaly", "low"),
      ],
    },
    model: model(),
  });
  assert.equal(result.deterministicScore, 33); // 22 + 11
  const factor = result.contributingFactors.find((f) => f.signal === "signal.wallet_velocity_anomaly");
  assert.ok(factor);
  assert.equal(factor?.value, "2x high");
});

test("unweighted signal types contribute nothing", () => {
  const result = scoreEntity({
    entityType: "account",
    entityId: "a",
    features: { signals: [signal("listing_spam_pattern", "high")] },
    model: model(),
  });
  assert.equal(result.deterministicScore, 0);
  assert.deepEqual(result.contributingFactors, []);
});

test("watchtower threat involvement scores by severity — one vocabulary, injected", () => {
  const result = scoreEntity({
    entityType: "account",
    entityId: "a",
    features: {
      signals: [],
      threats: [
        { kind: "credential_spray", severity: "critical", evidenceCount: 12 },
        { kind: "impossible_travel", severity: "watch", evidenceCount: 2 },
        { kind: "unknown_future_kind", severity: "critical", evidenceCount: 9 },
      ],
    },
    model: model(),
  });
  assert.equal(result.deterministicScore, 31); // 25*1 + 20*0.3; unknown kind unweighted
  const spray = result.contributingFactors.find((f) => f.signal === "threat.credential_spray");
  assert.equal(spray?.value, "critical, 12 rows");
});

test("behavioral features saturate at the configured scale and clamp negatives", () => {
  const saturated = scoreEntity({
    entityType: "account",
    entityId: "a",
    features: { signals: [], behavioral: { disputes_open: 30 } },
    model: model(),
  });
  assert.equal(saturated.deterministicScore, 10); // weight 10, saturated
  const negative = scoreEntity({
    entityType: "account",
    entityId: "a",
    features: { signals: [], behavioral: { disputes_open: -5 } },
    model: model(),
  });
  assert.equal(negative.deterministicScore, 0);
});

test("score clamps at 100 even when contributions exceed it", () => {
  const result = scoreEntity({
    entityType: "account",
    entityId: "a",
    features: {
      signals: [signal("wallet_velocity_anomaly", "high"), signal("failed_sensitive_action_burst", "high")],
      threats: [{ kind: "credential_spray", severity: "critical", evidenceCount: 40 }],
      behavioral: { velocity_events_24h: 500 },
    },
    model: model(),
  });
  assert.equal(result.riskScore, 100);
  assert.equal(result.tier, "freeze");
});

test("factor ordering is deterministic across input permutations (weight desc, key asc)", () => {
  const features = {
    signals: [signal("failed_sensitive_action_burst", "high"), signal("verification_mismatch", "high")],
    threats: [{ kind: "impossible_travel", severity: "critical" as const, evidenceCount: 3 }],
    behavioral: { disputes_open: 3 },
  };
  const permuted = {
    signals: [...features.signals].reverse(),
    threats: [...features.threats],
    behavioral: { ...features.behavioral },
  };
  const a = scoreEntity({ entityType: "account", entityId: "a", features, model: model() });
  const b = scoreEntity({ entityType: "account", entityId: "a", features: permuted, model: model() });
  assert.deepEqual(a.contributingFactors, b.contributingFactors);
  const weights = a.contributingFactors.map((f) => f.weight);
  assert.deepEqual(weights, [...weights].sort((x, y) => y - x));
});

test("advisory adjusts within the cap and is clamped beyond it", () => {
  const base = { entityType: "account" as const, entityId: "a", model: model() };
  const inCap = scoreEntity({
    ...base,
    features: { signals: [], behavioral: { velocity_events_24h: 50 }, advisory: { adjustmentPoints: 6 } },
  });
  assert.equal(inCap.riskScore, 56);
  assert.equal(inCap.deterministicScore, 50);
  const overCap = scoreEntity({
    ...base,
    features: { signals: [], behavioral: { velocity_events_24h: 50 }, advisory: { adjustmentPoints: 40 } },
  });
  assert.equal(overCap.riskScore, 60); // clamped to +10
  const negative = scoreEntity({
    ...base,
    features: { signals: [], behavioral: { velocity_events_24h: 50 }, advisory: { adjustmentPoints: -40 } },
  });
  assert.equal(negative.riskScore, 40); // clamped to -10
});

test("ABSOLUTE: a freeze tier never rests on the advisory alone — demoted to review", () => {
  const result = scoreEntity({
    entityType: "account",
    entityId: "a",
    features: { signals: [], behavioral: { velocity_events_24h: 80 }, advisory: { adjustmentPoints: 10 } },
    model: model(),
  });
  assert.equal(result.deterministicScore, 80);
  assert.equal(result.deterministicTier, "review");
  assert.equal(result.riskScore, 90); // numerically in freeze territory…
  assert.equal(result.tier, "review"); // …but demoted
  assert.ok(result.contributingFactors.some((f) => f.signal === "advisory.freeze_demoted"));
});

test("a deterministic freeze stands on its own", () => {
  const result = exactScore(85);
  assert.equal(result.deterministicTier, "freeze");
  assert.equal(result.tier, "freeze");
});

test("AI OFF: absent advisory leaves the deterministic result untouched — the floor is the result", () => {
  const withOut = scoreEntity({
    entityType: "account",
    entityId: "a",
    features: { signals: [signal("wallet_velocity_anomaly", "high")], behavioral: { disputes_open: 1 } },
    model: model(),
  });
  assert.equal(withOut.riskScore, withOut.deterministicScore);
  assert.equal(withOut.tier, withOut.deterministicTier);
  assert.ok(!withOut.contributingFactors.some((f) => f.signal.startsWith("advisory.")));
});

test("ABSOLUTE: the engine clamps a hostile advisory note to the fixed vocabulary (no verbatim model text stored)", () => {
  const result = scoreEntity({
    entityType: "account",
    entityId: "a",
    features: {
      signals: [],
      behavioral: { velocity_events_24h: 40 },
      // A jailbroken advisory reply forwarded unchecked by a hypothetical caller —
      // the engine, not the caller, must refuse to store it verbatim.
      advisory: { adjustmentPoints: 5, noteKey: "claude-secret-model-xyz leaked here" as never },
    },
    model: model(),
  });
  const advisoryFactor = result.contributingFactors.find((f) => f.signal === "advisory.adjustment");
  assert.ok(advisoryFactor);
  assert.equal(advisoryFactor?.value, "advisory", "an unrecognized note is replaced, never stored verbatim");
  assert.equal(JSON.stringify(result).includes("claude-secret-model-xyz"), false);
});

test("advisoryCapPoints 0 disables the advisory entirely", () => {
  const result = scoreEntity({
    entityType: "account",
    entityId: "a",
    features: { signals: [], behavioral: { velocity_events_24h: 50 }, advisory: { adjustmentPoints: 9 } },
    model: model({ advisoryCapPoints: 0 }),
  });
  assert.equal(result.riskScore, 50);
  assert.ok(!result.contributingFactors.some((f) => f.signal.startsWith("advisory.")));
});

test("shadow reflects model status — only live clears it", () => {
  for (const [status, shadow] of [
    ["shadow", true],
    ["live", false],
    ["rolled_back", true],
    ["retired", true],
  ] as const) {
    const result = scoreEntity({
      entityType: "account",
      entityId: "a",
      features: { signals: [] },
      model: model({ status }),
    });
    assert.equal(result.shadow, shadow, status);
  }
});

test("malformed configs fail loudly before scoring", () => {
  assert.throws(
    () => scoreEntity({ entityType: "account", entityId: "a", features: { signals: [] }, model: model({ thresholds: { monitor: 60, review: 30, freeze: 85 } }) }),
    RiskModelConfigError,
  );
  assert.throws(
    () => scoreEntity({ entityType: "account", entityId: "a", features: { signals: [] }, model: model({ weights: { "signal.wallet_velocity_anomaly": Number.NaN } }) }),
    RiskModelConfigError,
  );
  assert.throws(
    () => validateRiskModelConfig(model({ weights: { "wallet_velocity_anomaly": 5 } })),
    RiskModelConfigError,
  );
  assert.throws(
    () => validateRiskModelConfig(model({ behavioralScales: { disputes_open: 0 } })),
    RiskModelConfigError,
  );
  assert.throws(() => tierForScore(50, { monitor: 0, review: 60, freeze: 85 }), RiskModelConfigError);
});

test("pure: identical input twice → identical output; input not mutated", () => {
  const features = {
    signals: [signal("verification_mismatch", "medium")],
    threats: [{ kind: "credential_spray", severity: "warning" as const, evidenceCount: 4 }],
    behavioral: { disputes_open: 2 },
    advisory: { adjustmentPoints: 3 },
  };
  const frozen = JSON.parse(JSON.stringify(features));
  const a = scoreEntity({ entityType: "support_ticket", entityId: "t", features, model: model() });
  const b = scoreEntity({ entityType: "support_ticket", entityId: "t", features, model: model() });
  assert.deepEqual(a, b);
  assert.deepEqual(features, frozen);
});
