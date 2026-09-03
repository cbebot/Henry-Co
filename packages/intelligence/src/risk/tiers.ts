// V3-40 — config-driven tier mapping. Tiers come from `model_versions.config`, never from
// hardcoded numbers, so an owner-ratified new model version can move the lines without a
// deploy. Validation is strict: a malformed config must fail loudly BEFORE any entity is
// scored under it, never silently mis-tier.

import { RiskModelConfigError, type RiskModelConfig, type RiskTier, type RiskTierThresholds } from "./types";

/** The v1 default mapping from the pass spec: 0–30 pass · 30–60 monitor · 60–85 review · 85–100 freeze. */
export const DEFAULT_RISK_TIER_THRESHOLDS: RiskTierThresholds = {
  monitor: 30,
  review: 60,
  freeze: 85,
};

export function validateTierThresholds(t: RiskTierThresholds): void {
  const values = [t.monitor, t.review, t.freeze];
  if (values.some((v) => !Number.isFinite(v))) {
    throw new RiskModelConfigError("tier thresholds must be finite numbers");
  }
  if (!(t.monitor > 0 && t.monitor < t.review && t.review < t.freeze && t.freeze <= 100)) {
    throw new RiskModelConfigError(
      "tier thresholds must satisfy 0 < monitor < review < freeze <= 100",
    );
  }
}

export function tierForScore(score: number, thresholds: RiskTierThresholds): RiskTier {
  validateTierThresholds(thresholds);
  if (score >= thresholds.freeze) return "freeze";
  if (score >= thresholds.review) return "review";
  if (score >= thresholds.monitor) return "monitor";
  return "pass";
}

/** Full config validation — run once per model version before scoring a batch under it. */
export function validateRiskModelConfig(config: RiskModelConfig): void {
  if (!config.modelKind || !config.version) {
    throw new RiskModelConfigError("model config requires modelKind and version");
  }
  validateTierThresholds(config.thresholds);
  if (!Number.isFinite(config.advisoryCapPoints) || config.advisoryCapPoints < 0) {
    throw new RiskModelConfigError("advisoryCapPoints must be a finite number >= 0");
  }
  for (const [key, weight] of Object.entries(config.weights)) {
    if (!Number.isFinite(weight)) {
      throw new RiskModelConfigError(`weight for "${key}" must be a finite number`);
    }
    if (!/^(signal|threat|behavioral)\.[a-z0-9_]+$/.test(key)) {
      throw new RiskModelConfigError(`weight key "${key}" is not a namespaced feature key`);
    }
  }
  for (const [key, scale] of Object.entries(config.behavioralScales)) {
    if (!Number.isFinite(scale) || (scale as number) <= 0) {
      throw new RiskModelConfigError(`behavioral scale for "${key}" must be > 0`);
    }
  }
}
