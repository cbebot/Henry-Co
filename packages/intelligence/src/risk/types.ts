// V3-40 — predictive fraud & risk: the shared vocabulary.
//
// Everything here is data-shape only. The engine (`score.ts`) is pure and DB-less: every
// feature arrives injected by the caller (the hub batch adapter), the engine never reads a
// table, and nothing in this module may import from an app. The watchtower threat engine
// (apps/hub/lib/security/threat-signals.ts) stays the ONE account-threat detector — its
// detections arrive here as `ThreatInvolvement` features, mirrored by vocabulary (kind +
// severity strings), never re-derived.

import type { RiskSignal } from "../index";

export type RiskEntityType = "account" | "listing" | "transaction" | "support_ticket";

export const RISK_ENTITY_TYPES: readonly RiskEntityType[] = [
  "account",
  "listing",
  "transaction",
  "support_ticket",
] as const;

export type RiskTier = "pass" | "monitor" | "review" | "freeze";

export type RiskModelStatus = "shadow" | "live" | "rolled_back" | "retired";

/** Lower bounds (inclusive) for each tier above `pass`. Scores are 0–100. */
export interface RiskTierThresholds {
  monitor: number;
  review: number;
  freeze: number;
}

/**
 * One account's involvement in a watchtower threat signal. Vocabulary mirrors
 * `ThreatKind`/`ThreatSeverity` from the hub threat engine (credential_spray, shared_device,
 * impossible_travel, new_device_alert, revoked_reuse, reset_pressure, high_risk_cluster) —
 * kept as `string` so new watchtower kinds flow through without a lockstep release.
 */
export interface ThreatInvolvement {
  kind: string;
  severity: "critical" | "warning" | "watch";
  /** Real evidence rows behind the signal — never an invented count. */
  evidenceCount: number;
}

/** Cheap behavioral aggregates the batch adapter can compute per entity. All optional. */
export type BehavioralFeatureKey =
  | "velocity_events_24h"
  | "recency_days"
  | "graph_degree"
  | "failed_actions_7d"
  | "disputes_open"
  | "account_age_days"
  | "trust_deficit"; // 100 - calculateTrustScore(...), so higher = riskier like every other feature

/**
 * The closed vocabulary an advisory may attach as a staff-facing note. Narrowing this
 * to a literal union is a structural guarantee: no model-produced free text (which could
 * carry a leaked provider/model name from a jailbroken reply) can be typed into the
 * advisory, and the engine additionally clamps to this list at runtime (types erase).
 */
export const RISK_ADVISORY_NOTE_KEYS = [
  "corroborating_pattern",
  "likely_benign",
  "insufficient_evidence",
] as const;

export type RiskAdvisoryNoteKey = (typeof RISK_ADVISORY_NOTE_KEYS)[number];

/**
 * Advisory (LLM-assisted) input — E-D1 Option A. Strictly optional, strictly bounded:
 * the engine clamps `adjustmentPoints` to the model's `advisoryCapPoints`, and a freeze
 * tier can NEVER rest on the advisory alone (see score.ts). The deterministic floor must
 * be a complete result with this absent.
 */
export interface RiskAdvisoryInput {
  /** Points to add (or subtract) from the deterministic score. Clamped by config. */
  adjustmentPoints: number;
  /** Fixed-vocabulary note for the staff queue — NEVER free text with PII/provider names. */
  noteKey?: RiskAdvisoryNoteKey;
}

export interface RiskFeatures {
  /** Instances of the eight deterministic `RiskSignalType`s observed for this entity. */
  signals: RiskSignal[];
  /** Watchtower involvement — account entities only; empty elsewhere. */
  threats?: ThreatInvolvement[];
  /** Injected numeric aggregates (see `behavioralScales` in the model config). */
  behavioral?: Partial<Record<BehavioralFeatureKey, number>>;
  /** Optional, clamped, non-authoritative AI adjustment (E-D1-A). */
  advisory?: RiskAdvisoryInput | null;
}

/**
 * A versioned scoring configuration — one row of `model_versions.config`, parsed.
 * "Learning" under E-D3 Option A = the owner ratifying a new version of THIS object
 * (weights/thresholds), informed by shadow precision/recall reports. Never a provider or
 * model name anywhere in here: config crossing to any client is a leak (assertClientSafe
 * guards the gateway boundary; risk configs additionally never leave the server at all).
 */
export interface RiskModelConfig {
  modelKind: string; // 'fraud_risk'
  version: string;
  status: RiskModelStatus;
  /**
   * Feature weights in score points, keyed by namespaced feature key:
   *   signal.<RiskSignalType>       — base points for one deterministic signal
   *   threat.<ThreatKind>           — base points for one watchtower involvement
   *   behavioral.<BehavioralFeatureKey> — full points at/above the configured scale
   */
  weights: Record<string, number>;
  /** Saturation scale per behavioral key: contribution = weight * min(value/scale, 1). */
  behavioralScales: Partial<Record<BehavioralFeatureKey, number>>;
  thresholds: RiskTierThresholds;
  /** Hard clamp on the advisory adjustment, in points. 0 disables advisory entirely. */
  advisoryCapPoints: number;
}

export interface RiskContributingFactor {
  /** Namespaced feature key (`signal.*` / `threat.*` / `behavioral.*` / `advisory.*`). */
  signal: string;
  /** Points contributed to the score (rounded to 2dp; may be negative for advisory). */
  weight: number;
  /** The raw observed value backing the contribution — count, days, severity, etc. */
  value: number | string;
}

export interface RiskScoreResult {
  entityType: RiskEntityType;
  entityId: string;
  /** Final 0–100 score (deterministic + clamped advisory). */
  riskScore: number;
  /** The AI-free floor — what the score is with the advisory stripped. */
  deterministicScore: number;
  tier: RiskTier;
  /** Tier from `deterministicScore` alone — what enforcement doctrine anchors on. */
  deterministicTier: RiskTier;
  /** Deterministically ordered (points desc, then key asc) — staff explanations reproduce. */
  contributingFactors: RiskContributingFactor[];
  modelKind: string;
  modelVersion: string;
  /** True unless the model row is `live` — shadow scores must never drive enforcement. */
  shadow: boolean;
}

export class RiskModelConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RiskModelConfigError";
  }
}
