/**
 * V3-41 S3 — the dispute-likelihood scorer (ARCHITECTURE §5.4).
 *
 * Predicts the chance a transaction attracts a dispute/chargeback inside a
 * window, so staff can pre-empt it (call the buyer, chase the delivery proof)
 * rather than meet it as a surprise.
 *
 * PROVABLY DISTINCT FROM V3-40 FRAUD RISK. This is the pass spec's load-bearing
 * requirement, so it is enforced by construction rather than asserted in prose:
 * `DISPUTE_FACTORS` shares ZERO members with the eight `RiskSignalType`s that
 * form V3-40's adversarial-fraud vocabulary, and `__tests__/dispute.test.ts`
 * asserts the intersection is empty against the REAL exported union. A clean,
 * honest buyer with a perfect trust record can still file "item not received" —
 * that is a FULFILMENT failure, not an adversarial one, and the two models must
 * never be confused for each other.
 *
 * Model: transparent logistic regression over bounded, explainable features.
 * Coefficients are config (versioned, owner-tunable) — not learned weights, per
 * E-D3-A (no labelled corpus exists yet; V3-90 is the checkpoint to revisit).
 *
 * As with the sibling engines: NO AI on this path, PURE + DETERMINISTIC (no
 * clock, no I/O), and DB-LESS (features arrive injected from the caller batch).
 *
 * NEVER AUTO-ACTS. A likelihood never holds, blocks, reverses or refunds a
 * transaction — it populates a staff watch-list. Enforcement is V3-40's domain
 * and even there only through a staff-reviewed tier.
 */

export type DisputeBand = "low" | "watch" | "high";

/**
 * The dispute feature vocabulary. Deliberately fulfilment/settlement-shaped.
 * Intersection with V3-40 `RiskSignalType` is EMPTY and tested.
 */
export const DISPUTE_FACTORS = [
  "high_value_transaction",
  "delivery_confirmation_gap",
  "category_base_rate",
  "buyer_prior_dispute_rate",
  "seller_prior_dispute_rate",
  "refund_requested_unresolved",
  "item_not_received_reported",
  "settlement_age",
] as const;

export type DisputeFactor = (typeof DISPUTE_FACTORS)[number];

export interface DisputeFeatures {
  /** Transaction value in kobo (integer minor units — Prime Directive 1). */
  amountKobo?: number | null;
  /** Days since payment with no delivery/completion confirmation. */
  deliveryConfirmationGapDays?: number | null;
  /** Historical dispute rate for this product/service category, 0..1. */
  categoryDisputeRate?: number | null;
  /** This buyer's historical dispute rate, 0..1. */
  buyerPriorDisputeRate?: number | null;
  /** This seller/provider's historical dispute rate, 0..1. */
  sellerPriorDisputeRate?: number | null;
  /** A refund was asked for and is still unresolved. */
  refundRequestedUnresolved?: boolean | null;
  /** The buyer has reported non-receipt. */
  itemNotReceivedReported?: boolean | null;
  /** Days since the payment settled (dispute pressure peaks then decays). */
  daysSincePayment?: number | null;
}

export interface DisputeFactorContribution {
  factor: DisputeFactor;
  /** Signed contribution to the logit. Server-only detail; staff-visible only as ordering. */
  weight: number;
}

export interface DisputeLikelihood {
  transactionId: string;
  /** 0..1. SERVER-ONLY — the staff projection exposes the band, not this number. */
  likelihood: number;
  band: DisputeBand;
  windowDays: number;
  topFactors: DisputeFactorContribution[];
  /** How many features were actually present (honesty about pre-data domains). */
  featuresPresent: number;
  modelVersion: string;
  /** Discriminator: this output is advisory and can never auto-act on money. */
  readonly advisory: true;
}

export interface DisputeModelConfig {
  intercept: number;
  coefficients: Record<DisputeFactor, number>;
  /** likelihood >= watchAt  => "watch"; >= highAt => "high". */
  watchAt: number;
  highAt: number;
  windowDays: number;
  /** Value (kobo) at which `high_value_transaction` reaches its full weight. */
  highValueReferenceKobo: number;
  /** Days of delivery silence at which that feature saturates. */
  deliveryGapSaturationDays: number;
}

/**
 * Default coefficients. Chosen so the deterministic ordering is defensible from
 * first principles (non-receipt and an unresolved refund dominate; a large value
 * and a stale delivery raise pressure; category/party base rates modulate).
 * E-D3-A: "learning" = an owner-ratified version bump, not silent drift.
 */
export const DEFAULT_DISPUTE_MODEL: DisputeModelConfig = {
  intercept: -3.2,
  coefficients: {
    high_value_transaction: 0.9,
    delivery_confirmation_gap: 1.6,
    category_base_rate: 1.2,
    buyer_prior_dispute_rate: 1.4,
    seller_prior_dispute_rate: 1.5,
    refund_requested_unresolved: 1.8,
    item_not_received_reported: 2.4,
    settlement_age: -0.6,
  },
  watchAt: 0.15,
  highAt: 0.4,
  windowDays: 60,
  highValueReferenceKobo: 5_000_000, // NGN 50,000
  deliveryGapSaturationDays: 14,
};

export const DISPUTE_MODEL_VERSION = "dispute-logistic-v1";

export interface ScoreDisputeLikelihoodInput {
  transactionId: string;
  features: DisputeFeatures;
  config?: Partial<DisputeModelConfig>;
}

/** Clamp to [0,1]; non-finite becomes null so it is never counted as present. */
function unit(value: number | null | undefined): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.max(0, Math.min(1, value));
}

function positive(value: number | null | undefined): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.max(0, value);
}

function logistic(x: number): number {
  if (x >= 0) return 1 / (1 + Math.exp(-x));
  const e = Math.exp(x);
  return e / (1 + e);
}

function round4(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

/**
 * Score one transaction. Every non-zero contribution is reported in
 * `topFactors`, so a staff member can always see WHY a transaction is on the
 * watch-list — an unexplainable score is not usable evidence.
 */
export function scoreDisputeLikelihood(input: ScoreDisputeLikelihoodInput): DisputeLikelihood {
  const config: DisputeModelConfig = {
    ...DEFAULT_DISPUTE_MODEL,
    ...(input.config ?? {}),
    coefficients: { ...DEFAULT_DISPUTE_MODEL.coefficients, ...(input.config?.coefficients ?? {}) },
  };
  const f = input.features ?? {};
  const contributions: DisputeFactorContribution[] = [];
  let logit = config.intercept;
  let featuresPresent = 0;

  const add = (factor: DisputeFactor, normalized: number) => {
    const weight = config.coefficients[factor] * normalized;
    logit += weight;
    if (weight !== 0) contributions.push({ factor, weight: round4(weight) });
  };

  const amount = positive(f.amountKobo);
  if (amount !== null) {
    featuresPresent += 1;
    // Log-scaled so a 10x larger order is not 10x more disputable.
    const ref = Math.max(1, config.highValueReferenceKobo);
    add("high_value_transaction", Math.min(1, Math.log10(1 + amount) / Math.log10(1 + ref)));
  }

  const gap = positive(f.deliveryConfirmationGapDays);
  if (gap !== null) {
    featuresPresent += 1;
    add("delivery_confirmation_gap", Math.min(1, gap / Math.max(1, config.deliveryGapSaturationDays)));
  }

  const categoryRate = unit(f.categoryDisputeRate);
  if (categoryRate !== null) {
    featuresPresent += 1;
    add("category_base_rate", categoryRate);
  }

  const buyerRate = unit(f.buyerPriorDisputeRate);
  if (buyerRate !== null) {
    featuresPresent += 1;
    add("buyer_prior_dispute_rate", buyerRate);
  }

  const sellerRate = unit(f.sellerPriorDisputeRate);
  if (sellerRate !== null) {
    featuresPresent += 1;
    add("seller_prior_dispute_rate", sellerRate);
  }

  if (typeof f.refundRequestedUnresolved === "boolean") {
    featuresPresent += 1;
    add("refund_requested_unresolved", f.refundRequestedUnresolved ? 1 : 0);
  }

  if (typeof f.itemNotReceivedReported === "boolean") {
    featuresPresent += 1;
    add("item_not_received_reported", f.itemNotReceivedReported ? 1 : 0);
  }

  const age = positive(f.daysSincePayment);
  if (age !== null) {
    featuresPresent += 1;
    // Pressure decays as the window closes: at windowDays the feature is fully applied.
    add("settlement_age", Math.min(1, age / Math.max(1, config.windowDays)));
  }

  const likelihood = round4(logistic(logit));
  const band: DisputeBand =
    likelihood >= config.highAt ? "high" : likelihood >= config.watchAt ? "watch" : "low";

  // Strongest UPWARD pressure first — that is what a watch-list reader needs.
  const topFactors = [...contributions].sort((a, b) => b.weight - a.weight);

  return {
    transactionId: input.transactionId,
    likelihood,
    band,
    windowDays: config.windowDays,
    topFactors,
    featuresPresent,
    modelVersion: DISPUTE_MODEL_VERSION,
    advisory: true,
  };
}
