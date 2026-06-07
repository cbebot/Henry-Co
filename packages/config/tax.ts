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
