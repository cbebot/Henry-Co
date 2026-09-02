/**
 * V3-41 — the client boundary. Opaque scoring, made structural.
 *
 * Phase E Prime Directive 11: "Scores are server-only. Relevance scores, risk
 * scores, confidence values never serialize to a client. Clients receive ordered
 * items + localized reason codes."
 *
 * The line drawn here, deliberately:
 *
 *   - A DISPUTE LIKELIHOOD is a score ABOUT A PERSON's transaction. The raw
 *     0..1 number never crosses — staff receive the BAND and the factor codes in
 *     rank order, never the weights that produced them. Ordering is the useful
 *     part; the number invites false precision and, if it ever leaked past the
 *     staff shell, would be a score about a customer in a customer's browser.
 *   - A QUALITY ASSESSMENT already exposes no raw score by construction (the
 *     internal points never leave `assessQuality`), so its projection only strips
 *     the model-internal bookkeeping.
 *   - A WORKLOAD FORECAST is NOT a score about anyone — it is an operational
 *     volume count. Predicted counts and the CI DO cross, because a staffing
 *     panel is useless without them, and no person is being scored.
 *
 * `assertNoRawScore` is the enforcement: a deep walk that throws if a forbidden
 * key survives into a client-bound payload. The tests run it over every
 * projection, so the invariant fails CI rather than leaking quietly.
 */

import type { DisputeBand, DisputeFactor, DisputeLikelihood } from "./dispute";
import type { QualityAssessment, QualityIntervention, QualityReasonCode, RiskBand, ServiceUnitType } from "./quality";
import type { QueueKey, StaffingRecommendation, WorkloadForecast, WorkloadForecastPoint, ForecastBasis } from "./workload";

/** Keys that must never appear in a client-bound predictive payload. */
export const FORBIDDEN_CLIENT_KEYS = ["likelihood", "score", "weight", "logit", "coefficients"] as const;

export interface StaffDisputeView {
  transactionId: string;
  band: DisputeBand;
  windowDays: number;
  /** Factor codes in descending pressure order — NO weights. */
  factors: DisputeFactor[];
  featuresPresent: number;
  modelVersion: string;
}

export interface StaffQualityView {
  unitType: ServiceUnitType;
  unitId: string;
  atRisk: boolean;
  riskBand: RiskBand;
  reasons: QualityReasonCode[];
  suggestedIntervention?: QualityIntervention;
  signalsPresent: number;
  modelVersion: string;
}

export interface StaffWorkloadView {
  queue: QueueKey;
  horizonHours: number;
  perHour: WorkloadForecastPoint[];
  staffingRecommendation: StaffingRecommendation[];
  sampleSize: number;
  basis: ForecastBasis;
  modelVersion: string;
}

/** Drop the raw likelihood and every factor weight; keep the ranked codes. */
export function toStaffDisputeView(row: DisputeLikelihood): StaffDisputeView {
  return {
    transactionId: row.transactionId,
    band: row.band,
    windowDays: row.windowDays,
    factors: row.topFactors.map((f) => f.factor),
    featuresPresent: row.featuresPresent,
    modelVersion: row.modelVersion,
  };
}

export function toStaffQualityView(row: QualityAssessment): StaffQualityView {
  return {
    unitType: row.unitType,
    unitId: row.unitId,
    atRisk: row.atRisk,
    riskBand: row.riskBand,
    reasons: row.reasons,
    suggestedIntervention: row.suggestedIntervention,
    signalsPresent: row.signalsPresent,
    modelVersion: row.modelVersion,
  };
}

export function toStaffWorkloadView(row: WorkloadForecast): StaffWorkloadView {
  return {
    queue: row.queue,
    horizonHours: row.horizonHours,
    perHour: row.perHour,
    staffingRecommendation: row.staffingRecommendation,
    sampleSize: row.sampleSize,
    basis: row.basis,
    modelVersion: row.modelVersion,
  };
}

/**
 * Deep-walk a client-bound payload and throw if any forbidden score key
 * survived. Cheap, and it turns "we were careful" into "CI proves it".
 */
export function assertNoRawScore(payload: unknown, path = "$"): void {
  if (payload === null || payload === undefined) return;
  if (Array.isArray(payload)) {
    payload.forEach((item, i) => assertNoRawScore(item, `${path}[${i}]`));
    return;
  }
  if (typeof payload !== "object") return;
  for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
    if ((FORBIDDEN_CLIENT_KEYS as readonly string[]).includes(key)) {
      throw new Error(
        `V3-41 opacity invariant: raw score key "${key}" reached the client boundary at ${path}.${key}`,
      );
    }
    assertNoRawScore(value, `${path}.${key}`);
  }
}
