/**
 * V3-41 S2 — the service-quality at-risk detector (ARCHITECTURE §5.4).
 *
 * Predicts whether an IN-FLIGHT service unit (care booking, studio project,
 * learn enrolment, marketplace order) is heading for a bad outcome, so a human
 * can intervene before the customer complains.
 *
 * The hard line this file enforces STRUCTURALLY — not by convention:
 *
 *   NO AUTO-PUNISHMENT. A quality assessment is advisory. It cannot express an
 *   enforcement action, because `QualityIntervention` is a closed union of
 *   HUMAN-PERFORMED steps only (review / call / reassign / apologise). There is
 *   no "suspend", "block", "hold", "refund" or "charge" member for a caller to
 *   reach for, and `assertAdvisoryOnly` re-checks the value at runtime before it
 *   is persisted. The DB CHECK constraint on `quality_assessments.suggested_intervention`
 *   mirrors the same list, so all three layers must be edited together to break it.
 *   Rationale: a false positive on a paying customer is worse than a missed signal.
 *
 * Also, as with the forecaster: NO AI on this path (rules over caller-supplied
 * signals only), PURE + DETERMINISTIC (no clock, no I/O — `asOf` is an input),
 * and DB-LESS (the caller's batch supplies already-scoped signals).
 */

export type ServiceUnitType = "care_booking" | "studio_project" | "learn_enrolment" | "marketplace_order";

export const SERVICE_UNIT_TYPES: readonly ServiceUnitType[] = [
  "care_booking",
  "studio_project",
  "learn_enrolment",
  "marketplace_order",
] as const;

export type RiskBand = "low" | "elevated" | "high";

/**
 * Explainable reason codes. Localized at the surface (`surface:staff_predictive`),
 * never rendered from here. Each maps 1:1 to a rule below, so every band is
 * traceable to the exact signals that produced it.
 */
export const QUALITY_REASON_CODES = [
  "provider_silent",
  "milestone_overdue",
  "payment_stalled",
  "provider_low_completion_rate",
  "provider_slow_response",
  "customer_disengaged",
  "prior_complaint_on_unit",
  "delivery_window_missed",
] as const;

export type QualityReasonCode = (typeof QUALITY_REASON_CODES)[number];

/**
 * The CLOSED set of suggested interventions. Every member is an action a HUMAN
 * takes. Adding an enforcement verb here would also have to pass the runtime
 * guard below AND the DB CHECK constraint — deliberately three edits, not one.
 */
export const QUALITY_INTERVENTIONS = [
  "staff_review",
  "staff_contact_customer",
  "staff_contact_provider",
  "staff_reassign_provider",
  "staff_offer_goodwill",
] as const;

export type QualityIntervention = (typeof QUALITY_INTERVENTIONS)[number];

export interface QualitySignals {
  /** Hours since the provider last messaged on this unit. Null = unknown. */
  hoursSinceProviderMessage?: number | null;
  /** Days a milestone/appointment has been overdue. 0/absent = on time. */
  milestoneOverdueDays?: number | null;
  /** Days a required payment step has been stalled. */
  paymentStalledDays?: number | null;
  /** Provider's historical completion rate, 0..1. Null = no history (pre-data). */
  providerCompletionRate?: number | null;
  /** Provider's median first-response latency, hours. */
  providerResponseHours?: number | null;
  /** Customer engagement on this unit, 0..1 (views/replies). Null = unknown. */
  customerEngagement?: number | null;
  /** Complaints already filed against THIS unit. */
  priorComplaints?: number | null;
  /** Delivery/appointment window already passed without confirmation. */
  deliveryWindowMissed?: boolean | null;
}

export interface QualityAssessment {
  unitType: ServiceUnitType;
  unitId: string;
  atRisk: boolean;
  riskBand: RiskBand;
  /** Explainable codes — the surface localizes them. */
  reasons: QualityReasonCode[];
  /** Advisory next step for a HUMAN. Never an enforcement action. */
  suggestedIntervention?: QualityIntervention;
  /**
   * Discriminator proving this output is advisory. Persisted and asserted; a
   * consumer that ever branches on "can I act automatically?" reads `false`.
   */
  readonly advisory: true;
  /** Absolute count of signals actually present (honesty about pre-data units). */
  signalsPresent: number;
  modelVersion: string;
}

export const QUALITY_MODEL_VERSION = "quality-rules-v1";

/** Per-unit-type thresholds. Config, not bespoke code — tunable per version. */
export interface QualityThresholds {
  providerSilentHours: number;
  slowResponseHours: number;
  lowCompletionRate: number;
  disengagedBelow: number;
  elevatedAtScore: number;
  highAtScore: number;
}

export const DEFAULT_QUALITY_THRESHOLDS: Record<ServiceUnitType, QualityThresholds> = {
  // A carer going quiet mid-booking is the loudest signal in the division.
  care_booking: {
    providerSilentHours: 48,
    slowResponseHours: 12,
    lowCompletionRate: 0.85,
    disengagedBelow: 0.2,
    elevatedAtScore: 2,
    highAtScore: 4,
  },
  // Projects run for weeks; silence tolerance is higher, milestones matter more.
  studio_project: {
    providerSilentHours: 72,
    slowResponseHours: 24,
    lowCompletionRate: 0.8,
    disengagedBelow: 0.15,
    elevatedAtScore: 2,
    highAtScore: 4,
  },
  // Self-paced: the customer's own disengagement is the primary risk.
  learn_enrolment: {
    providerSilentHours: 168,
    slowResponseHours: 48,
    lowCompletionRate: 0.7,
    disengagedBelow: 0.25,
    elevatedAtScore: 2,
    highAtScore: 4,
  },
  // Fulfilment is time-boxed; a missed delivery window dominates.
  marketplace_order: {
    providerSilentHours: 72,
    slowResponseHours: 24,
    lowCompletionRate: 0.9,
    disengagedBelow: 0.1,
    elevatedAtScore: 2,
    highAtScore: 4,
  },
};

export interface AssessQualityInput {
  unitType: ServiceUnitType;
  unitId: string;
  signals: QualitySignals;
  thresholds?: Partial<QualityThresholds>;
}

function num(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/**
 * Runtime backstop for the no-auto-punishment invariant. Throws if a caller
 * ever hands through an intervention outside the advisory set (e.g. a value
 * widened by an `as` cast or arriving from JSON).
 */
export function assertAdvisoryOnly(intervention: string): asserts intervention is QualityIntervention {
  if (!(QUALITY_INTERVENTIONS as readonly string[]).includes(intervention)) {
    throw new Error(
      `V3-41 invariant: "${intervention}" is not an advisory intervention. ` +
        "A prediction may never auto-block, auto-suspend or auto-charge a user.",
    );
  }
}

/**
 * Score an in-flight service unit. Weighted, explainable rules — every point of
 * score attaches to a reason code, so the band is always defensible to the
 * provider it concerns.
 */
export function assessQuality(input: AssessQualityInput): QualityAssessment {
  const t: QualityThresholds = {
    ...DEFAULT_QUALITY_THRESHOLDS[input.unitType],
    ...(input.thresholds ?? {}),
  };
  const s = input.signals ?? {};
  const reasons: QualityReasonCode[] = [];
  let score = 0;
  let signalsPresent = 0;

  const silent = num(s.hoursSinceProviderMessage);
  if (silent !== null) {
    signalsPresent += 1;
    if (silent >= t.providerSilentHours) {
      reasons.push("provider_silent");
      // Silence scales: a full extra window doubles the weight (capped).
      score += Math.min(2, 1 + Math.floor(silent / Math.max(1, t.providerSilentHours)) - 1);
    }
  }

  const overdue = num(s.milestoneOverdueDays);
  if (overdue !== null) {
    signalsPresent += 1;
    if (overdue > 0) {
      reasons.push("milestone_overdue");
      score += overdue >= 3 ? 2 : 1;
    }
  }

  const stalled = num(s.paymentStalledDays);
  if (stalled !== null) {
    signalsPresent += 1;
    if (stalled > 0) {
      reasons.push("payment_stalled");
      score += stalled >= 5 ? 2 : 1;
    }
  }

  const completion = num(s.providerCompletionRate);
  if (completion !== null) {
    signalsPresent += 1;
    if (completion < t.lowCompletionRate) {
      reasons.push("provider_low_completion_rate");
      score += 1;
    }
  }

  const responseHours = num(s.providerResponseHours);
  if (responseHours !== null) {
    signalsPresent += 1;
    if (responseHours > t.slowResponseHours) {
      reasons.push("provider_slow_response");
      score += 1;
    }
  }

  const engagement = num(s.customerEngagement);
  if (engagement !== null) {
    signalsPresent += 1;
    if (engagement < t.disengagedBelow) {
      reasons.push("customer_disengaged");
      score += 1;
    }
  }

  const complaints = num(s.priorComplaints);
  if (complaints !== null) {
    signalsPresent += 1;
    if (complaints > 0) {
      reasons.push("prior_complaint_on_unit");
      score += 2;
    }
  }

  if (typeof s.deliveryWindowMissed === "boolean") {
    signalsPresent += 1;
    if (s.deliveryWindowMissed) {
      reasons.push("delivery_window_missed");
      score += 2;
    }
  }

  const riskBand: RiskBand =
    score >= t.highAtScore ? "high" : score >= t.elevatedAtScore ? "elevated" : "low";

  // The suggested next step is chosen from the ADVISORY union only.
  let suggestedIntervention: QualityIntervention | undefined;
  if (riskBand !== "low") {
    if (reasons.includes("prior_complaint_on_unit") || reasons.includes("delivery_window_missed")) {
      suggestedIntervention = "staff_offer_goodwill";
    } else if (reasons.includes("provider_low_completion_rate") && riskBand === "high") {
      suggestedIntervention = "staff_reassign_provider";
    } else if (reasons.includes("provider_silent") || reasons.includes("provider_slow_response")) {
      suggestedIntervention = "staff_contact_provider";
    } else if (reasons.includes("customer_disengaged") || reasons.includes("payment_stalled")) {
      suggestedIntervention = "staff_contact_customer";
    } else {
      suggestedIntervention = "staff_review";
    }
    assertAdvisoryOnly(suggestedIntervention);
  }

  return {
    unitType: input.unitType,
    unitId: input.unitId,
    atRisk: riskBand !== "low",
    riskBand,
    reasons,
    suggestedIntervention,
    advisory: true,
    signalsPresent,
    modelVersion: QUALITY_MODEL_VERSION,
  };
}
