// ---------------------------------------------------------------------------
// @henryco/pricing — the tax RATE ENGINE core (V3-21).
//
// A single, pure, integer-exact VAT computation that every billed surface uses.
// It does NOT invent tax policy and it does NOT hardcode a rate: the rate +
// version are dependency-INJECTED (the canonical source is `@henryco/config`
// TAX.vat / the VAT catalog), and the per-supply TREATMENT + display CONVENTION
// are passed in by the caller (resolved from `@henryco/config`
// resolveCheckoutVat). This keeps `@henryco/pricing` a dependency-free leaf.
//
// It REUSES the proven V3-VAT-01 machinery rather than re-deriving it:
//   - inclusive convention → `splitVatInclusive`  (carve VAT OUT of a quoted total)
//   - exclusive convention → `computeOutputVat`   (add VAT ON TOP of a base)
// Those are inverses (add-then-split round-trips), so the two conventions stay
// coherent with the ledger (`post_sale_revenue` carves the same VAT out of the
// gross) and the receipt (`subtotal = gross − fees − tax`). Whole kobo — never
// float, never ×100.
// ---------------------------------------------------------------------------

import {
  splitVatInclusive,
  computeOutputVat,
  type VatTreatment,
  type VatRatePolicy,
} from "../vat";

/** How a price is quoted, and therefore what the customer pays. */
export type TaxConvention = "inclusive" | "exclusive";

/** The integer-exact result of a VAT computation over a single taxable base. */
export type VatComputation = {
  /** VAT in whole minor units (kobo). 0 for zero-rated / exempt supplies. */
  vatMinor: number;
  /** The taxable amount NET of VAT. inclusive: base − vat; exclusive: base. */
  netMinor: number;
  /** The VAT-inclusive GROSS the customer pays. inclusive: base; exclusive: base + vat. */
  grossMinor: number;
  /** The fractional rate it was assessed under (recorded even when VAT is 0). */
  rate: number;
  /** The rate-version stamp for the audit trail. */
  version: string;
  treatment: VatTreatment;
  convention: TaxConvention;
};

function assertWholeKobo(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`[pricing/tax] ${label} must be a whole non-negative kobo integer, got ${value}`);
  }
}

/**
 * The CORE: compute VAT on a single taxable base, in whatever integer minor unit
 * the base is denominated, given a treatment + display convention + an injected
 * rate policy.
 *
 *   - `inclusive` + `standard` → VAT is carved OUT of the base (the base IS the
 *     gross). `net + vat === base` exactly (no rounding drift), so the customer
 *     total never moves — the line only REVEALS the VAT already inside the price.
 *   - `exclusive` + `standard` → VAT is added ON TOP (the base is the ex-VAT
 *     net). `gross = base + vat`.
 *   - `zero_rated` / `exempt` → no VAT under either convention; the rate it was
 *     assessed under is still recorded for the audit trail.
 *
 * Pure + integer-exact. Throws only on a non-kobo base (a programming error),
 * NEVER on tax policy — a missing rate degrades to zero upstream.
 */
export function computeVat(
  input: { baseMinor: number; treatment: VatTreatment; convention: TaxConvention },
  policy: VatRatePolicy,
): VatComputation {
  assertWholeKobo(input.baseMinor, "baseMinor");
  const { baseMinor, treatment, convention } = input;
  const rate = policy.standardRate;
  const version = policy.rateVersion;

  if (treatment !== "standard") {
    // Zero-rated / exempt: no VAT either way; base passes through untouched.
    return { vatMinor: 0, netMinor: baseMinor, grossMinor: baseMinor, rate, version, treatment, convention };
  }

  if (convention === "inclusive") {
    const { exVatMinor, vatMinor } = splitVatInclusive(baseMinor, rate);
    return { vatMinor, netMinor: exVatMinor, grossMinor: baseMinor, rate, version, treatment, convention };
  }

  // exclusive
  const { vatMinor } = computeOutputVat({ baseMinor, treatment }, policy);
  return { vatMinor, netMinor: baseMinor, grossMinor: baseMinor + vatMinor, rate, version, treatment, convention };
}

// --- S3 shape: a catalog-resolved compute + result, for the adapter seam (S7) ---

/** A tax computation request against a resolved rate. Integer minor units only. */
export interface TaxInput {
  /** The taxable base (kobo/cents), as an integer. */
  subtotalMinor: number;
  /** ISO-4217 of the base (NGN in V3-21). */
  currency: string;
  convention: TaxConvention;
}

/** A rate resolved from the catalog (`@henryco/config` resolveVatRate / vatPolicyFromRate). */
export interface ResolvedRate {
  /** Fractional rate (bp / 10000). */
  rate: number;
  version: string;
  treatment: VatTreatment;
  /** Integer basis points (audit). */
  basisPoints: number;
  rateId: string | null;
  authorityName: string | null;
  authorityRef: string | null;
  jurisdiction: string;
}

/** The full result a billed flow persists / a document renders. */
export interface TaxResult extends VatComputation {
  currency: string;
  /** True for a zero-rated/exempt supply (VAT correctly 0 by policy). */
  exemptApplied: boolean;
  /** True when no rate existed for the jurisdiction → degraded to zero (emit henry.tax.rate.missing). */
  rateMissing: boolean;
  basisPoints: number;
  rateId: string | null;
  authorityName: string | null;
  authorityRef: string | null;
  jurisdiction: string;
}

/**
 * Compute tax against a resolved rate (or `null` for a jurisdiction with no
 * rate — degrade to zero, never throw). The deterministic S3 entry the
 * {@link InternalTaxAdapter} wraps. Pure + integer-exact.
 */
export function computeTax(input: TaxInput, resolved: ResolvedRate | null): TaxResult {
  if (!resolved) {
    return {
      vatMinor: 0,
      netMinor: input.subtotalMinor,
      grossMinor: input.subtotalMinor,
      rate: 0,
      version: "",
      treatment: "standard",
      convention: input.convention,
      currency: input.currency,
      exemptApplied: false,
      rateMissing: true,
      basisPoints: 0,
      rateId: null,
      authorityName: null,
      authorityRef: null,
      jurisdiction: "",
    };
  }
  const computation = computeVat(
    { baseMinor: input.subtotalMinor, treatment: resolved.treatment, convention: input.convention },
    { standardRate: resolved.rate, rateVersion: resolved.version },
  );
  return {
    ...computation,
    currency: input.currency,
    exemptApplied: resolved.treatment !== "standard",
    rateMissing: false,
    basisPoints: resolved.basisPoints,
    rateId: resolved.rateId,
    authorityName: resolved.authorityName,
    authorityRef: resolved.authorityRef,
    jurisdiction: resolved.jurisdiction,
  };
}

// --- S8: telemetry descriptors (pure; the caller emits, keeping pricing pure) ---

export const TAX_TELEMETRY = {
  computationCompleted: "henry.tax.computation.completed",
  exemptionApplied: "henry.tax.exemption.applied",
  rateMissing: "henry.tax.rate.missing",
} as const;

/**
 * The telemetry event a billed flow should emit for a tax computation — NO PII,
 * NO raw amounts beyond the minor-unit tax/total class needed for ops. The
 * caller (route / handler) emits it through `@henryco/observability`, so the
 * pricing engine itself stays pure + dependency-free.
 */
export function describeTaxTelemetry(result: TaxResult): {
  name: (typeof TAX_TELEMETRY)[keyof typeof TAX_TELEMETRY];
  payload: Record<string, unknown>;
} {
  const name = result.rateMissing
    ? TAX_TELEMETRY.rateMissing
    : result.exemptApplied
      ? TAX_TELEMETRY.exemptionApplied
      : TAX_TELEMETRY.computationCompleted;
  return {
    name,
    payload: {
      jurisdiction: result.jurisdiction || null,
      basisPoints: result.basisPoints,
      rateId: result.rateId,
      treatment: result.treatment,
      convention: result.convention,
      currency: result.currency,
      taxMinor: result.vatMinor,
      grossMinor: result.grossMinor,
    },
  };
}
