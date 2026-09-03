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

// ---------------------------------------------------------------------------
// V3-VAT-CLASSIFICATION-01 — per-supply VAT classification (additive)
//
// V3-VAT-01 (above) holds the ONE statutory RATE. This block adds the missing
// piece: WHICH supply gets WHICH treatment. There is still exactly one rate
// (7.5%); "never a global rate" means the TREATMENT (standard / zero-rated /
// exempt / out-of-scope) is decided PER ITEM, not that the rate varies.
//
// The classification is a business/tax FACT, so it lives here in @henryco/config
// (the single source of truth), exactly like LEGAL. The pure VAT MATH lives in
// @henryco/pricing (a dependency-free leaf) and consumes a treatment string. The
// two `VatTreatment` vocabularies are intentionally mirrored literal unions —
// keep them in sync (config owns the classification, pricing owns the maths).
//
// Owner-confirmed regime (principal / merchant-of-record, own FIRS TIN):
//   • Marketplace  standard; per-category zero-rated/exempt for food/books/pharma/baby.
//   • Studio · Jobs · Care (Fabric Care) · Logistics  standard. (Courier delivery is
//     a commercial logistics service — standard-rated, NOT transport-exempt.)
//   • Learn  standard, PENDING tax review, switchable per course.
//   • Property  residential rent = exempt; sale of land/buildings = out of scope;
//     service/management/commission FEES = standard; commercial + short-let =
//     standard PENDING review, switchable.
//
// `reviewStatus: "pending_review"` + `signOff: "assumed_pending_accountant"` mark a
// WORKING default to be confirmed before live filing — switchable WITHOUT a code
// change by editing this map only (mirrors the LEGAL `[OWNER-TO-CONFIRM]` rule:
// never assert an unverified tax position as settled fact).
// ---------------------------------------------------------------------------

/**
 * How a supply is treated for output VAT. Mirrors `@henryco/pricing` `VatTreatment`.
 *  - `standard`     → output VAT at {@link TAX}.vat.standardRate (7.5%).
 *  - `zero_rated`   → taxable at 0% (no output VAT; input VAT still recoverable).
 *  - `exempt`       → outside VAT (no output VAT; input VAT not reclaimable).
 *  - `out_of_scope` → not a taxable supply at all (e.g. sale of land/buildings).
 */
export type VatTreatment = "standard" | "zero_rated" | "exempt" | "out_of_scope";

/** Whether a classification is accountant-confirmed or a working default pending review. */
export type VatReviewStatus = "confirmed" | "pending_review";

/** Sign-off provenance for a classification (mirrors the LEGAL `[OWNER-TO-CONFIRM]` rule). */
export type VatSignOff = "owner_confirmed" | "assumed_pending_accountant";

export type VatClassification = {
  readonly treatment: VatTreatment;
  readonly reviewStatus: VatReviewStatus;
  readonly signOff: VatSignOff;
  /** Plain-language basis + statutory hook, for the audit trail and the owner UI. */
  readonly note: string;
};

/** The divisions that can sell a supply the platform collects on, as principal. */
export type TaxDivisionKey =
  | "marketplace"
  | "studio"
  | "jobs"
  | "care"
  | "learn"
  | "property"
  | "logistics";

type DivisionTaxRule = {
  /** Treatment when no per-item override and no taxonomy override matches. */
  readonly default: VatClassification;
  /** Taxonomy-keyed overrides (marketplace category slug, property serviceType, …). */
  readonly overrides?: Readonly<Record<string, VatClassification>>;
};

const STANDARD_CONFIRMED: VatClassification = {
  treatment: "standard",
  reviewStatus: "confirmed",
  signOff: "owner_confirmed",
  note: "Standard-rated supply — output VAT at the FIRS 7.5% rate (owner is principal / merchant of record).",
};

/**
 * Per-division VAT classification. Override keys are the EXISTING taxonomy fields
 * each division already carries (marketplace `categorySlug`, property
 * `serviceType`/`kind`, …) so resolution needs no new data plumbing.
 */
export const TAX_CLASSIFICATION: Record<TaxDivisionKey, DivisionTaxRule> = {
  marketplace: {
    default: STANDARD_CONFIRMED,
    overrides: {
      // Owner-flagged categories. Pre-registered now (these category slugs do not
      // exist in the current catalog yet) — harmless, and live the moment such a
      // category is added. Basis: VAT (Modification) Order — basic food items,
      // medical/pharmaceutical products and educational books are exempt/zero-rated.
      food: { treatment: "exempt", reviewStatus: "confirmed", signOff: "owner_confirmed", note: "Basic food items — VAT exempt (VAT Modification Order)." },
      books: { treatment: "zero_rated", reviewStatus: "confirmed", signOff: "owner_confirmed", note: "Educational books — zero-rated." },
      pharma: { treatment: "exempt", reviewStatus: "confirmed", signOff: "owner_confirmed", note: "Pharmaceutical / medical products — VAT exempt." },
      baby: { treatment: "exempt", reviewStatus: "confirmed", signOff: "owner_confirmed", note: "Baby products — VAT exempt." },
    },
  },
  studio: { default: STANDARD_CONFIRMED },
  jobs: {
    // VAT applies to the posting / subscription FEE the platform charges, not to a
    // job advert (which is not a sold supply). Standard-rated.
    default: STANDARD_CONFIRMED,
  },
  care: { default: STANDARD_CONFIRMED },
  logistics: {
    // Courier / parcel / last-mile delivery is a commercial logistics service —
    // standard-rated. The transport exemption is for shared/public passenger transport.
    default: STANDARD_CONFIRMED,
  },
  learn: {
    default: {
      treatment: "standard",
      reviewStatus: "pending_review",
      signOff: "assumed_pending_accountant",
      note: "Paid courses default standard-rated, PENDING tax review. The education exemption attaches to formal/accredited tuition at an educational institution; commercial online courses are generally standard-rated. Switchable per course (standard / zero_rated / exempt) without a code change.",
    },
  },
  property: {
    // The property FEE breakdown (listing review, inspection, management, commission)
    // is the platform's own service supply — standard-rated. The serviceType overrides
    // below classify the LISTING value itself (rent/sale/etc.), which the platform does
    // not collect as principal; pass the serviceType only when classifying that value.
    default: STANDARD_CONFIRMED,
    overrides: {
      rent: { treatment: "exempt", reviewStatus: "confirmed", signOff: "owner_confirmed", note: "Residential rent / lease — VAT exempt." },
      sale: { treatment: "out_of_scope", reviewStatus: "confirmed", signOff: "owner_confirmed", note: "Sale of land / buildings — outside the scope of VAT." },
      land: { treatment: "out_of_scope", reviewStatus: "confirmed", signOff: "owner_confirmed", note: "Sale of land — outside the scope of VAT." },
      commercial: { treatment: "standard", reviewStatus: "pending_review", signOff: "assumed_pending_accountant", note: "Commercial lease — standard-rated PENDING review; switchable without a code change." },
      shortlet: { treatment: "standard", reviewStatus: "pending_review", signOff: "assumed_pending_accountant", note: "Short-let / serviced accommodation — standard-rated PENDING review; switchable without a code change." },
    },
  },
};

function classificationForExplicitTreatment(treatment: VatTreatment): VatClassification {
  return {
    treatment,
    reviewStatus: "confirmed",
    signOff: "owner_confirmed",
    note: "Per-item VAT treatment set explicitly on the catalog row.",
  };
}

const SEEDED_TEST_DEFAULT: VatClassification = {
  treatment: "exempt",
  reviewStatus: "confirmed",
  signOff: "owner_confirmed",
  note: "Owner's pre-launch test catalog — exempt until real third-party inventory is published. Does NOT change the global rate; real inventory rates per the division/category rules.",
};

export type ResolvedVatClassification = VatClassification & {
  /** Which rung of the precedence ladder produced this classification. */
  readonly source: "item" | "seeded_test" | "category" | "division";
};

/**
 * Resolve the VAT classification for one supply. Precedence (highest first):
 *   1. `itemTreatment`     — an explicit per-row flag (e.g. a per-course / per-product treatment).
 *   2. `isSeededTestItem`  — the owner's current test catalog defaults EXEMPT (no real supply yet).
 *   3. `categoryKey`       — a taxonomy override in {@link TAX_CLASSIFICATION} (category / serviceType).
 *   4. the division default.
 *
 * Pure and dependency-free; the rate itself comes from {@link TAX}.vat at the pricing layer.
 */
export function resolveVatClassification(input: {
  division: TaxDivisionKey;
  categoryKey?: string | null;
  itemTreatment?: VatTreatment | null;
  isSeededTestItem?: boolean;
}): ResolvedVatClassification {
  const rule = TAX_CLASSIFICATION[input.division];

  if (input.itemTreatment) {
    return { ...classificationForExplicitTreatment(input.itemTreatment), source: "item" };
  }

  if (input.isSeededTestItem) {
    return { ...SEEDED_TEST_DEFAULT, source: "seeded_test" };
  }

  const key = typeof input.categoryKey === "string" ? input.categoryKey.trim().toLowerCase() : "";
  const override = key ? rule.overrides?.[key] : undefined;
  if (override) {
    return { ...override, source: "category" };
  }

  return { ...rule.default, source: "division" };
}
