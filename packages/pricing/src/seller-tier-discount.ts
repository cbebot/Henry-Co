// ---------------------------------------------------------------------------
// @henryco/pricing  --  Seller-tier platform-fee discount resolver (V3-58)
//
// A DORMANT, additive governance-table lookup: it maps a server-derived seller
// tier (bronze/silver/gold) + division to a platform-FEE discount RATE. It is a
// pure function with NO import-time side effects and NO live caller — it is NOT
// invoked by computeMarketplaceCheckoutBreakdown / computePropertySubmissionFee
// Breakdown or any money-movement path. Wiring it into the live fee breakdown is
// owner/Lane-1 work, gated on D9 ratification (see below).
//
// The line that must not be crossed: the discount AMOUNT is config, never a
// hardcoded business literal. D9 (docs/v3/DECISIONS-REQUIRED.md, "Monetization
// rates per division") is UNRATIFIED, and D9 in any case covers base take-rates,
// not tier discounts. So the ratified value for every (tier, division) pair today
// is 0% — this table encodes exactly that. When the owner ratifies a tier-discount
// schedule, replace the zeros here (and bump the version); the resolver and its
// callers do not change shape.
//
// Returned value is a FRACTION in [0, 1) (e.g. 0.05 = a 5% reduction of the
// platform fee), so a caller applies it as `platformFee * (1 - rate)`. 'none' and
// 'bronze' always resolve to 0 by spec; unknown tiers/divisions safely default to
// 0 (never a surprise discount).
// ---------------------------------------------------------------------------

/** The stored seller-tier enum (English; display labels are translated app-side). */
export type SellerTierKey = 'none' | 'bronze' | 'silver' | 'gold';

/**
 * A versioned, division-keyed discount schedule. Outer key = lowercased division,
 * inner key = tier. Missing entries mean "no discount" (0). Mirrors the
 * defaultMarketplacePricingRules() factory idiom (key + version + data).
 */
export type SellerTierDiscountTable = {
  key: string;
  version: string;
  /** True once a real D9 schedule is ratified; while false, every rate is 0. */
  ratified: boolean;
  rates: Record<string, Partial<Record<SellerTierKey, number>>>;
};

/**
 * The default (and currently ONLY) schedule: 0% for every tier on every division,
 * because D9 tier discounts are unratified. The shape is intentionally explicit so
 * a future ratification is a value edit, not a structural change.
 */
export function defaultSellerTierDiscountTable(): SellerTierDiscountTable {
  const zero: Partial<Record<SellerTierKey, number>> = {
    none: 0,
    bronze: 0,
    silver: 0,
    gold: 0,
  };
  return {
    key: 'seller_tier_discount_d9_unratified',
    version: '2026-06-19-d9-unratified',
    ratified: false,
    rates: {
      marketplace: { ...zero },
      care: { ...zero },
      studio: { ...zero },
      learn: { ...zero },
      logistics: { ...zero },
      property: { ...zero },
      jobs: { ...zero },
    },
  };
}

function clampRate(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return 0;
  // A fee DISCOUNT can never be ≥ 100% — clamp defensively so a bad config row
  // can never zero-out or invert a platform fee.
  return n >= 1 ? 0 : n;
}

/**
 * Resolve the platform-fee discount RATE (fraction in [0,1)) for a server-derived
 * seller tier on a given division. Pure, total, and safe: lowercases inputs, and
 * any unknown tier/division — or a deliberately unratified table — resolves to 0.
 *
 * DORMANT: no live pricing path calls this yet. When D9 lands, a caller in the fee
 * computation reads this and applies it to the platform-fee line; the ledger entry
 * shape is unchanged (the discount only lowers the fee amount).
 */
export function sellerTierDiscount(
  tier: string,
  division: string,
  table: SellerTierDiscountTable = defaultSellerTierDiscountTable(),
): number {
  if (!table.ratified) return 0;
  const t = String(tier ?? '').trim().toLowerCase();
  const d = String(division ?? '').trim().toLowerCase();
  if (t === 'none' || t === 'bronze' || t === '') return 0;
  const divisionRates = table.rates[d];
  if (!divisionRates) return 0;
  return clampRate(divisionRates[t as SellerTierKey]);
}
