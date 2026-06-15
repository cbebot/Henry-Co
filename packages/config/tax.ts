/**
 * TAX — the single typed source of truth for the VAT regime Henry Onyx Limited
 * (FIRS TIN in LEGAL.entity.tin) operates under.
 *
 * Nigeria VAT (VAT Act Cap V1 LFN 2004, as amended by the Finance Act 2019 which
 * raised the standard rate to 7.5% with effect from 1 February 2020): a SINGLE
 * standard rate. V3-VAT-01 represents this ONE rate exactly and rigorously; the
 * multi-jurisdiction tax engine (V3-21) is deliberately deferred.
 *
 * The rate + version live here so a statutory change is ONE edit — never a hunt
 * across pricing, the ledger, receipts, and JSX. The rate is NEVER hardcoded at a
 * call site: pricing reads {@link TAX}, stamps {@link VatPolicy.rateVersion} onto
 * the breakdown's `tax` line, and the receipt renders whatever rate the breakdown
 * carries (a historical document therefore always shows the rate that applied).
 *
 * VAT is computed in whole kobo (NGN minor units) with integer math — never float.
 */

/**
 * The VAT policy a pricing/ledger computation is parameterised by. Dependency-
 * injected so `@henryco/pricing` stays a pure, dependency-free computation library:
 * callers pass {@link TAX}`.vat`, tests pass an explicit policy. The single source
 * of the actual numbers is {@link TAX} in this file. (The per-supply `VatTreatment`
 * vocabulary lives with the math, in `@henryco/pricing`.)
 */
export type VatPolicy = {
  /** Fractional standard rate, e.g. `0.075` for 7.5%. */
  readonly standardRate: number;
  /** Opaque version stamp recorded on every VAT line for audit / historical repricing. */
  readonly rateVersion: string;
};

export const TAX = {
  vat: {
    /** ISO 3166-1 alpha-2 of the taxing jurisdiction. Nigeria only in V3-VAT-01. */
    jurisdiction: "NG",
    /** FIRS standard VAT rate — 7.5% since the Finance Act 2019 (effective 2020-02-01). */
    standardRate: 0.075,
    /**
     * Version stamp for the rate in force. Bump on any statutory rate change; it is
     * recorded on each breakdown `tax` line + receipt so a historical document always
     * shows the rate that actually applied.
     */
    rateVersion: "NG-VAT-7.5-2020-02-01",
    /** ISO 4217 the VAT is computed/declared in (the NGN system base). */
    currency: "NGN",
  },
} as const satisfies { vat: VatPolicy & { jurisdiction: string; currency: string } };

export type TaxRegistry = typeof TAX;

// ===========================================================================
// V3-21 — the tax RATE ENGINE's POLICY + CATALOG layer.
//
// V3-VAT-01 modelled the ONE Nigeria rate (TAX.vat above). V3-21 generalises it
// into a versioned, authority-referenced rate CATALOG (integer BASIS POINTS —
// never a float percentage in tax math) plus the per-division VAT TREATMENT:
// WHO is the taxable supplier, how prices are quoted, and which breakdown lines
// form the taxable base.
//
// ── The line we do NOT cross in code ──
// The marketplace VAT TREATMENT (taxable supplier / facilitator vs principal /
// exemptions) is an OWNER + ACCOUNTANT determination, not an engineering one.
// This file declares a CONFIGURABLE rule with a documented default; the engine
// in @henryco/pricing APPLIES it. The shipped default carries an explicit
// `signOff: "ASSUMED_PENDING_ACCOUNTANT"` flag — change the policy HERE (data),
// never by hardcoding a judgment in application code. See VAT_TREATMENT_NOTE.
//
// Data + resolution only. The integer-exact VAT MATH lives in @henryco/pricing
// (a dependency-free leaf): a caller resolves a rate here and injects the
// resulting VatPolicy into pricing — the same DI seam TAX.vat already uses.
// ===========================================================================

/** A supply's VAT treatment. Mirrors `@henryco/pricing` `VatTreatment` exactly. */
export type VatTreatmentKind = "standard" | "zero_rated" | "exempt";

/** Who, for VAT, is the supplier of a marketplace / division sale. */
export type VatSupplierModel =
  /** Henry Onyx is the merchant of record for the whole sale — output VAT on the full price. */
  | "principal"
  /** Henry Onyx is an agent/facilitator — output VAT only on its own fee; the vendor accounts for the goods. */
  | "facilitator";

/** How prices are quoted, and therefore what the customer pays. */
export type VatPricingConvention =
  /** Quoted prices already INCLUDE VAT (Nigeria retail norm). VAT is carved out; the total is unchanged. */
  | "inclusive"
  /** Quoted prices EXCLUDE VAT. VAT is added on top and the total grows. */
  | "exclusive";

/**
 * One versioned, authority-referenced rate in the catalog. The rate is INTEGER
 * basis points (750 = 7.5%) — never a float in tax math. A rate is never
 * mutated: supersede it by setting `effectiveTo` and adding a new row (full
 * audit history), exactly as the future DB-backed catalog (the Avalara/TaxJar
 * seam) would.
 */
export type VatRateRow = {
  /** Stable audit id (referenced from the receipt / ledger note). */
  readonly id: string;
  /** ISO-3166 alpha-2, e.g. 'NG'. */
  readonly country: string;
  /** State/province; null = country-wide. */
  readonly region?: string | null;
  /** standard | food | medical | education | export | ... — matches the supply's category. */
  readonly productCategory: string;
  readonly buyerType: "any" | "consumer" | "business";
  /** Integer basis points: 750 = 7.5%. NO floats. */
  readonly basisPoints: number;
  readonly treatment: VatTreatmentKind;
  /** The jurisdiction's default display convention. */
  readonly inclusiveDefault: boolean;
  /** ISO date (YYYY-MM-DD) the rate took effect. */
  readonly effectiveFrom: string;
  /** ISO date the rate stopped applying; null = currently in force. */
  readonly effectiveTo?: string | null;
  readonly authorityName: string;
  readonly authorityRef: string | null;
};

/**
 * The Nigeria VAT catalog (the only jurisdiction live in V3-21; D10 commits more
 * markets, which are then a SEED-ONLY change here — zero application code).
 *
 * Standard rate 750bp since the Finance Act 2019 (effective 2020-02-01). The
 * zero/exempt rows reflect the VAT Act First Schedule classes (basic food,
 * medical/pharmaceutical, educational materials, baby products) and zero-rated
 * exports. They are 0bp so the engine returns taxMinor=0 with the correct
 * `treatment` recorded for the audit trail.
 */
export const VAT_RATE_CATALOG: readonly VatRateRow[] = [
  {
    id: "ng-vat-standard-2020",
    country: "NG",
    region: null,
    productCategory: "standard",
    buyerType: "any",
    basisPoints: 750,
    treatment: "standard",
    inclusiveDefault: true,
    effectiveFrom: "2020-02-01",
    effectiveTo: null,
    authorityName: "Federal Inland Revenue Service (FIRS)",
    authorityRef: "VAT Act Cap V1 LFN 2004, as amended by the Finance Act 2019 (rate 7.5% w.e.f. 2020-02-01)",
  },
  {
    id: "ng-vat-food-exempt",
    country: "NG",
    region: null,
    productCategory: "food",
    buyerType: "any",
    basisPoints: 0,
    treatment: "exempt",
    inclusiveDefault: true,
    effectiveFrom: "2020-02-01",
    effectiveTo: null,
    authorityName: "Federal Inland Revenue Service (FIRS)",
    authorityRef: "VAT Act Cap V1 LFN 2004, First Schedule — basic food items (as amended by Finance Acts 2019–2020)",
  },
  {
    id: "ng-vat-medical-exempt",
    country: "NG",
    region: null,
    productCategory: "medical",
    buyerType: "any",
    basisPoints: 0,
    treatment: "exempt",
    inclusiveDefault: true,
    effectiveFrom: "2020-02-01",
    effectiveTo: null,
    authorityName: "Federal Inland Revenue Service (FIRS)",
    authorityRef: "VAT Act Cap V1 LFN 2004, First Schedule — medical and pharmaceutical products",
  },
  {
    id: "ng-vat-education-exempt",
    country: "NG",
    region: null,
    productCategory: "education",
    buyerType: "any",
    basisPoints: 0,
    treatment: "exempt",
    inclusiveDefault: true,
    effectiveFrom: "2020-02-01",
    effectiveTo: null,
    authorityName: "Federal Inland Revenue Service (FIRS)",
    authorityRef: "VAT Act Cap V1 LFN 2004, First Schedule — educational materials / tuition",
  },
  {
    id: "ng-vat-baby-exempt",
    country: "NG",
    region: null,
    productCategory: "baby_products",
    buyerType: "any",
    basisPoints: 0,
    treatment: "exempt",
    inclusiveDefault: true,
    effectiveFrom: "2020-02-01",
    effectiveTo: null,
    authorityName: "Federal Inland Revenue Service (FIRS)",
    authorityRef: "VAT Act Cap V1 LFN 2004, First Schedule — children's / baby products",
  },
  {
    id: "ng-vat-export-zero",
    country: "NG",
    region: null,
    productCategory: "export",
    buyerType: "any",
    basisPoints: 0,
    treatment: "zero_rated",
    inclusiveDefault: false,
    effectiveFrom: "2020-02-01",
    effectiveTo: null,
    authorityName: "Federal Inland Revenue Service (FIRS)",
    authorityRef: "VAT Act Cap V1 LFN 2004 — exported goods/services are zero-rated",
  },
];

/** A resolution query for {@link resolveVatRate}. */
export type VatRateQuery = {
  /** ISO-3166 alpha-2. */
  country: string;
  region?: string | null;
  /** Supply category; defaults to 'standard'. */
  productCategory?: string;
  /** 'consumer' | 'business'; defaults to 'consumer'. */
  buyerType?: "consumer" | "business";
  /**
   * ISO date for historical repricing. Omit for "currently in force" — which
   * deterministically selects open rows (effectiveTo === null) with NO clock
   * read (keeps callers reproducible; pricing forbids Date.now()-style reads).
   */
  asOf?: string;
};

function rateRowApplies(row: VatRateRow, query: VatRateQuery): boolean {
  if (row.country.toUpperCase() !== query.country.toUpperCase()) return false;

  // Time window. asOf given → half-open [from, to). asOf omitted → currently-open rows only.
  if (query.asOf) {
    if (query.asOf < row.effectiveFrom) return false;
    if (row.effectiveTo && query.asOf >= row.effectiveTo) return false;
  } else if (row.effectiveTo) {
    return false;
  }

  // Region: a region-specific row must match the query's region; a country-wide
  // row (region null) always applies.
  if (row.region && row.region !== (query.region ?? null)) return false;

  // Category: an exact match, or the catch-all 'standard' fallback.
  const category = query.productCategory ?? "standard";
  if (row.productCategory !== category && row.productCategory !== "standard") return false;

  // Buyer type: an exact match, or the 'any' fallback.
  const buyerType = query.buyerType ?? "consumer";
  if (row.buyerType !== buyerType && row.buyerType !== "any") return false;

  return true;
}

function rateRowSpecificity(row: VatRateRow, query: VatRateQuery): number {
  const category = query.productCategory ?? "standard";
  const buyerType = query.buyerType ?? "consumer";
  let score = 0;
  if (row.region) score += 4; // region beats country-wide
  if (row.productCategory === category && category !== "standard") score += 2; // specific category beats 'standard'
  if (row.buyerType === buyerType) score += 1; // specific buyer type beats 'any'
  return score;
}

/**
 * Resolve the effective rate row for a supply with DETERMINISTIC precedence:
 * region beats country-wide, a specific category beats `standard`, a specific
 * `buyerType` beats `any`; ties break to the most-recent `effectiveFrom`.
 *
 * Returns `null` for a jurisdiction with no rate (the caller degrades to zero
 * and emits `henry.tax.rate.missing` — the engine NEVER throws on a missing
 * rate). Pure + clock-free.
 */
export function resolveVatRate(query: VatRateQuery): VatRateRow | null {
  const candidates = VAT_RATE_CATALOG.filter((row) => rateRowApplies(row, query));
  if (candidates.length === 0) return null;
  return candidates.reduce((best, row) => {
    const bestScore = rateRowSpecificity(best, query);
    const rowScore = rateRowSpecificity(row, query);
    if (rowScore > bestScore) return row;
    if (rowScore === bestScore && row.effectiveFrom > best.effectiveFrom) return row;
    return best;
  });
}

/**
 * Build the dependency-injected {@link VatPolicy} a `@henryco/pricing` VAT
 * computation needs from a catalog row. The fractional rate is derived from the
 * integer basis points (`bp / 10000`); the version string is the stable stamp
 * recorded on every breakdown `tax` line + receipt (e.g. `NG-VAT-7.5-2020-02-01`).
 */
export function vatPolicyFromRate(row: VatRateRow): VatPolicy {
  return {
    standardRate: row.basisPoints / 10000,
    rateVersion: `${row.country.toUpperCase()}-VAT-${row.basisPoints / 100}-${row.effectiveFrom}`,
  };
}

/**
 * The per-division VAT treatment — the OWNER/ACCOUNTANT determination the engine
 * applies. `signOff` is machine-readable: a treatment stays
 * `ASSUMED_PENDING_ACCOUNTANT` until the accountant confirms it (then
 * `ACCOUNTANT_CONFIRMED`). The finance dashboard / report surface this flag.
 */
export type DivisionVatTreatment = {
  readonly division: string;
  readonly supplierModel: VatSupplierModel;
  readonly pricingConvention: VatPricingConvention;
  /** Supply category used to resolve the rate (e.g. 'standard'). */
  readonly productCategory: string;
  readonly buyerType: "consumer" | "business";
  /**
   * Breakdown line CODES that form the platform's VATable base. `principal` taxes
   * the whole sale; `facilitator` taxes only the platform's own fee. (A negative
   * `discount` line in the set correctly reduces the taxable base.)
   */
  readonly taxableLineCodes: readonly string[];
  readonly signOff: "ASSUMED_PENDING_ACCOUNTANT" | "ACCOUNTANT_CONFIRMED";
};

/**
 * The lines a PRINCIPAL (merchant-of-record) treatment taxes — the whole sale.
 * Henry Onyx collects the full payment, holds escrow, and issues ONE unified
 * Henry Onyx receipt (V3-18) → it is the merchant of record for the basket.
 */
export const PRINCIPAL_TAXABLE_LINE_CODES = [
  "items_subtotal",
  "delivery",
  "platform_fee",
  "service_fee",
  "inspection_fee",
  "discount",
] as const;

/**
 * The lines a FACILITATOR/agent treatment taxes — only the platform's own
 * commission/fee. (Third-party vendors then account for VAT on their goods.)
 */
export const FACILITATOR_TAXABLE_LINE_CODES = ["platform_fee", "service_fee"] as const;

/**
 * ⚠️ ACCOUNTANT SIGN-OFF REQUIRED. The shipped marketplace/division treatment is
 * an ASSUMPTION, not a ratified tax position. Documented for the report + the
 * accountant; flip `signOff` to `ACCOUNTANT_CONFIRMED` (or change the policy)
 * once confirmed. See `.codex-temp/v3-21-tax-rate-engine/report.md`.
 */
export const VAT_TREATMENT_NOTE =
  "ASSUMED: Henry Onyx is the PRINCIPAL/merchant-of-record for marketplace + division sales, " +
  "quoting VAT-INCLUSIVE consumer prices (Nigeria retail norm), standard-rated at 7.5%. " +
  "Output VAT is therefore carved OUT of the customer total (the total the customer pays does not change). " +
  "Alternatives requiring accountant confirmation: FACILITATOR treatment (VAT only on the platform fee), " +
  "VAT-EXCLUSIVE quoting (VAT added on top), and per-category exemptions/zero-rating. " +
  "Change the policy in @henryco/config tax.ts (data), never in application code.";

const MARKETPLACE_VAT_TREATMENT: DivisionVatTreatment = {
  division: "marketplace",
  supplierModel: "principal",
  pricingConvention: "inclusive",
  productCategory: "standard",
  buyerType: "consumer",
  taxableLineCodes: PRINCIPAL_TAXABLE_LINE_CODES,
  signOff: "ASSUMED_PENDING_ACCOUNTANT",
};

const PROPERTY_VAT_TREATMENT: DivisionVatTreatment = {
  division: "property",
  supplierModel: "principal",
  pricingConvention: "inclusive",
  productCategory: "standard",
  buyerType: "consumer",
  // Property surfaces only the platform's own service fees → those are the base.
  taxableLineCodes: PRINCIPAL_TAXABLE_LINE_CODES,
  signOff: "ASSUMED_PENDING_ACCOUNTANT",
};

const DIVISION_VAT_TREATMENTS: Record<string, DivisionVatTreatment> = {
  marketplace: MARKETPLACE_VAT_TREATMENT,
  property: PROPERTY_VAT_TREATMENT,
};

/**
 * The VAT treatment for a division (defaults to the marketplace treatment for any
 * division not explicitly mapped — the unified principal/inclusive position).
 */
export function resolveDivisionVatTreatment(division: string | null | undefined): DivisionVatTreatment {
  const key = (division ?? "").toLowerCase();
  return DIVISION_VAT_TREATMENTS[key] ?? MARKETPLACE_VAT_TREATMENT;
}

/**
 * Resolve everything a caller needs to put the correct output-VAT line on a
 * division's checkout breakdown: the treatment, the convention, the taxable-line
 * selector, and the dependency-injected {@link VatPolicy} (resolved from the
 * versioned catalog). One call → pass the result straight into
 * `@henryco/pricing` `computeMarketplaceCheckoutBreakdown({ ..., tax })` /
 * `applyVatToBreakdown`. `rate` is null for a jurisdiction with no catalog rate.
 */
export function resolveCheckoutVat(input: {
  division: string | null | undefined;
  country?: string;
  asOf?: string;
}): {
  treatment: VatTreatmentKind;
  convention: VatPricingConvention;
  taxableLineCodes: readonly string[];
  ratePolicy: VatPolicy;
  rate: VatRateRow | null;
  signOff: DivisionVatTreatment["signOff"];
} {
  const treatment = resolveDivisionVatTreatment(input.division);
  const row = resolveVatRate({
    country: input.country ?? TAX.vat.jurisdiction,
    productCategory: treatment.productCategory,
    buyerType: treatment.buyerType,
    asOf: input.asOf,
  });
  return {
    treatment: row?.treatment ?? "standard",
    convention: treatment.pricingConvention,
    taxableLineCodes: treatment.taxableLineCodes,
    // Resolved-catalog policy when present; else the canonical TAX.vat (NG standard).
    ratePolicy: row ? vatPolicyFromRate(row) : TAX.vat,
    rate: row,
    signOff: treatment.signOff,
  };
}
