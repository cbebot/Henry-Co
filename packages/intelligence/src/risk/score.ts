// V3-40 — scoreEntity: the pure fusion engine.
//
// Doctrine (E-D1-A / E-D3-A, directive ABSOLUTEs):
//   * Deterministic floor FIRST — the score is complete and correct with the advisory
//     (AI) input absent. A prediction never requires the model to function.
//   * The advisory is enhancement only, clamped to `advisoryCapPoints`, and structurally
//     unable to corrupt the floor: `deterministicScore`/`deterministicTier` are computed
//     before it is even looked at, and a `freeze` tier NEVER rests on the advisory alone —
//     if the advisory pushes the total into freeze but the floor is below it, the final
//     tier is demoted to `review` and the demotion is itself a visible factor.
//   * Pure and side-effect-free: no I/O, no clock, no randomness — same input, same output
//     (staff explanations must reproduce). Persistence is the batch adapter's job.

import type { RiskSeverity } from "../index";
import { tierForScore, validateRiskModelConfig } from "./tiers";
import type {
  RiskContributingFactor,
  RiskEntityType,
  RiskFeatures,
  RiskModelConfig,
  RiskScoreResult,
} from "./types";

/** Fixed, documented severity multipliers — deterministic and explainable. */
const SIGNAL_SEVERITY_MULTIPLIER: Record<RiskSeverity, number> = {
  info: 0.25,
  low: 0.5,
  medium: 0.75,
  high: 1,
};

const THREAT_SEVERITY_MULTIPLIER: Record<"critical" | "warning" | "watch", number> = {
  critical: 1,
  warning: 0.6,
  watch: 0.3,
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function clampScore(n: number): number {
  return Math.max(0, Math.min(100, n));
}

/** Stable factor ordering: points desc, then key asc — reproducible staff explanations. */
function sortFactors(factors: RiskContributingFactor[]): RiskContributingFactor[] {
  return [...factors].sort((a, b) => {
    if (b.weight !== a.weight) return b.weight - a.weight;
    return a.signal < b.signal ? -1 : a.signal > b.signal ? 1 : 0;
  });
}

export interface ScoreEntityInput {
  entityType: RiskEntityType;
  entityId: string;
  features: RiskFeatures;
  model: RiskModelConfig;
}

export function scoreEntity(input: ScoreEntityInput): RiskScoreResult {
  const { features, model } = input;
  validateRiskModelConfig(model);

  const factors: RiskContributingFactor[] = [];
  let deterministicPoints = 0;

  // 1) The eight deterministic rule signals — the rules floor. Multiple instances of the
  //    same signal type accumulate (each is real evidence), each listed once per type with
  //    the instance count as the value.
  const byType = new Map<string, { points: number; count: number; topSeverity: RiskSeverity }>();
  for (const signal of features.signals) {
    const weight = model.weights[`signal.${signal.type}`];
    if (!Number.isFinite(weight)) continue; // unweighted signal types contribute nothing
    const points = (weight as number) * SIGNAL_SEVERITY_MULTIPLIER[signal.severity];
    const prior = byType.get(signal.type);
    if (prior) {
      prior.points += points;
      prior.count += 1;
      if (
        SIGNAL_SEVERITY_MULTIPLIER[signal.severity] > SIGNAL_SEVERITY_MULTIPLIER[prior.topSeverity]
      ) {
        prior.topSeverity = signal.severity;
      }
    } else {
      byType.set(signal.type, { points, count: 1, topSeverity: signal.severity });
    }
  }
  for (const [type, agg] of byType) {
    deterministicPoints += agg.points;
    factors.push({
      signal: `signal.${type}`,
      weight: round2(agg.points),
      value: `${agg.count}x ${agg.topSeverity}`,
    });
  }

  // 2) Watchtower threat involvement (account entities) — one vocabulary, one engine:
  //    these arrive as detections from apps/hub/lib/security/threat-signals.ts, never
  //    re-derived here.
  for (const threat of features.threats ?? []) {
    const weight = model.weights[`threat.${threat.kind}`];
    if (!Number.isFinite(weight)) continue;
    const points = (weight as number) * THREAT_SEVERITY_MULTIPLIER[threat.severity];
    deterministicPoints += points;
    factors.push({
      signal: `threat.${threat.kind}`,
      weight: round2(points),
      value: `${threat.severity}, ${threat.evidenceCount} rows`,
    });
  }

  // 3) Behavioral aggregates — saturating: full weight at/above the configured scale.
  for (const [key, raw] of Object.entries(features.behavioral ?? {})) {
    if (!Number.isFinite(raw)) continue;
    const weight = model.weights[`behavioral.${key}`];
    const scale = model.behavioralScales[key as keyof typeof model.behavioralScales];
    if (!Number.isFinite(weight) || !Number.isFinite(scale)) continue;
    const points = (weight as number) * Math.min(Math.max(raw as number, 0) / (scale as number), 1);
    deterministicPoints += points;
    factors.push({ signal: `behavioral.${key}`, weight: round2(points), value: raw as number });
  }

  const deterministicScore = round2(clampScore(deterministicPoints));
  const deterministicTier = tierForScore(deterministicScore, model.thresholds);

  // 4) Advisory (AI) — clamped, non-authoritative, freeze-incapable on its own.
  let riskScore = deterministicScore;
  const advisory = features.advisory ?? null;
  if (advisory && model.advisoryCapPoints > 0 && Number.isFinite(advisory.adjustmentPoints)) {
    const capped = Math.max(
      -model.advisoryCapPoints,
      Math.min(model.advisoryCapPoints, advisory.adjustmentPoints),
    );
    riskScore = round2(clampScore(deterministicScore + capped));
    factors.push({
      signal: "advisory.adjustment",
      weight: round2(riskScore - deterministicScore),
      value: advisory.noteKey ?? "advisory",
    });
  }

  let tier = tierForScore(riskScore, model.thresholds);
  if (tier === "freeze" && deterministicTier !== "freeze") {
    // A freeze must never rest on the LLM alone (E-D1 rule 5). Demote and say so.
    tier = "review";
    factors.push({ signal: "advisory.freeze_demoted", weight: 0, value: "deterministic floor below freeze" });
  }

  return {
    entityType: input.entityType,
    entityId: input.entityId,
    riskScore,
    deterministicScore,
    tier,
    deterministicTier,
    contributingFactors: sortFactors(factors),
    modelKind: model.modelKind,
    modelVersion: model.version,
    shadow: model.status !== "live",
  };
}
