// ---------------------------------------------------------------------------
// V3-58 — Seller-tier derivation (deterministic, server-derived)
//
// This is the PURE specification of the Bronze/Silver/Gold thresholds. The
// authoritative ENFORCEMENT lives in the SECURITY DEFINER SQL function
// public.recompute_seller_tier (see the v3_58_seller_tiers migration) — the SQL
// CASE expression is a 1:1 mirror of deriveSellerTier() below, and the two MUST
// stay in lockstep. Keeping the thresholds here as well lets the boundary cases be
// unit-tested without a database (seller-tier-engine.sanity.ts).
//
// Tiers are DERIVED, never self-asserted:
//   - Bronze : foundational academy course completed.
//   - Silver : foundational + intermediate completed AND >= 50 completed txns.
//   - Gold   : all three courses completed AND >= 200 completed txns AND
//              >= 4.5 average rating.
// A tier never rises without the underlying signal; a downgrade on signal loss
// (e.g. average rating dropping below 4.5) is allowed and audited by the caller.
//
// Course signals come from real Learn data TODAY (a business member's verified
// learn_enrollments). Transaction count + average rating come from the marketplace
// quality substrate (delivered order groups + approved reviews) resolved through
// the business→vendor bridge (marketplace_vendors.owner_user_id ∈ the business
// members). Where no vendor is linked yet, the transaction/rating signals are 0 and
// the realistic ceiling is Bronze — exactly the V3-50 seam.
// ---------------------------------------------------------------------------

export type SellerTier = "none" | "bronze" | "silver" | "gold";

/** Thresholds — the single numeric source of truth, mirrored in the SQL RPC. */
export const SELLER_TIER_THRESHOLDS = {
  silver: { minCompletedTransactions: 50 },
  gold: { minCompletedTransactions: 200, minAverageRating: 4.5 },
} as const;

/**
 * The verified signals that produce a tier. This shape is snapshotted verbatim
 * into seller_tiers.inputs (jsonb) for auditability.
 */
export type SellerTierInputs = {
  /** Foundational academy course completed by a member of the business. */
  foundationalCourseCompleted: boolean;
  /** Intermediate academy course completed by a member of the business. */
  intermediateCourseCompleted: boolean;
  /** Advanced academy course completed by a member of the business. */
  advancedCourseCompleted: boolean;
  /** Count of completed (delivered) marketplace transactions for the linked vendor. */
  completedTransactions: number;
  /**
   * Average approved rating for the linked vendor, or null when there are no
   * ratings / no linked vendor yet (treated as "below threshold").
   */
  averageRating: number | null;
};

function toCount(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

function toRating(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return n;
}

/**
 * Derive the seller tier from verified signals. Pure and total: it makes no
 * I/O and never throws. The highest tier whose every condition is met wins.
 */
export function deriveSellerTier(inputs: SellerTierInputs): SellerTier {
  const foundational = inputs.foundationalCourseCompleted === true;
  const intermediate = inputs.intermediateCourseCompleted === true;
  const advanced = inputs.advancedCourseCompleted === true;
  const txns = toCount(inputs.completedTransactions);
  const rating = toRating(inputs.averageRating);

  const goldOk =
    foundational &&
    intermediate &&
    advanced &&
    txns >= SELLER_TIER_THRESHOLDS.gold.minCompletedTransactions &&
    rating !== null &&
    rating >= SELLER_TIER_THRESHOLDS.gold.minAverageRating;
  if (goldOk) return "gold";

  const silverOk =
    foundational &&
    intermediate &&
    txns >= SELLER_TIER_THRESHOLDS.silver.minCompletedTransactions;
  if (silverOk) return "silver";

  if (foundational) return "bronze";

  return "none";
}

/** Rank used to detect upgrade vs downgrade direction for telemetry/audit. */
export const SELLER_TIER_RANK: Record<SellerTier, number> = {
  none: 0,
  bronze: 1,
  silver: 2,
  gold: 3,
};

/** "up" | "down" | "same" for a tier transition (drives telemetry direction). */
export function tierTransitionDirection(from: SellerTier, to: SellerTier): "up" | "down" | "same" {
  const delta = SELLER_TIER_RANK[to] - SELLER_TIER_RANK[from];
  if (delta > 0) return "up";
  if (delta < 0) return "down";
  return "same";
}
