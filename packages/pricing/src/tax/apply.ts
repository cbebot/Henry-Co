// ---------------------------------------------------------------------------
// @henryco/pricing — put the correct output-VAT line on a checkout breakdown (V3-21).
//
// This is the seam the marketplace + division checkout breakdowns use to carry a
// VAT line. It generalises V3-VAT-01's `applyOutputVat` (which is the exclusive,
// whole-base special case) with two policy axes the rate engine resolves from
// `@henryco/config`:
//
//   - CONVENTION — `inclusive` carves VAT OUT of the quoted total (the customer
//     total does NOT change; the line only reveals the VAT already inside the
//     price — Nigeria's retail norm). `exclusive` adds VAT ON TOP (the total
//     grows).
//   - TAXABLE BASE — which line codes are the PLATFORM's VATable supply
//     (`principal` taxes the whole sale; `facilitator` taxes only its own fee).
//
// Pure (returns a copy), idempotent (strips any prior `tax` line first), and
// integer-exact (delegates to `computeVat`, which reuses splitVatInclusive /
// computeOutputVat). The rate is dependency-injected — never hardcoded.
// ---------------------------------------------------------------------------

import type { Money, PricingBreakdown, PricingBreakdownLine } from "../index";
import type { VatRatePolicy, VatTreatment } from "../vat";
import { computeVat, type TaxConvention } from "./compute-tax";

export type ApplyVatOptions = {
  treatment: VatTreatment;
  convention: TaxConvention;
  /**
   * The breakdown line codes that form the platform's taxable base. Omit to tax
   * the WHOLE sale (every non-tax line). A negative `discount` line in the set
   * correctly reduces the base.
   */
  taxableLineCodes?: readonly string[];
  /** Jurisdiction stamped on the line meta (informational). Defaults to "NG". */
  jurisdiction?: string;
};

function roundInt(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n);
}

function sumLines(lines: PricingBreakdownLine[]): number {
  return lines.reduce((sum, line) => sum + roundInt(line.amount.amount), 0);
}

/**
 * Return a COPY of `breakdown` carrying the correct output-VAT line.
 *
 *   - `inclusive`: VAT is carved out of the taxable base; `customerTotal` is
 *     UNCHANGED (the line reveals VAT already in the price). The receipt's
 *     `subtotal = gross − fees − tax` and the ledger's `post_sale_revenue`
 *     (`revenue = gross − vat`) carve the SAME VAT — all three reconcile.
 *   - `exclusive`: VAT is added on top; `customerTotal = base + vat`.
 *
 * Idempotent: any existing `tax` line is stripped before recomputation, so
 * applying twice yields one line. Zero-rated / exempt → no line, total
 * unchanged. The taxable base can be a SUBSET of the lines (facilitator), while
 * the customer total always reflects EVERY non-tax line the customer pays.
 */
export function applyVatToBreakdown(
  breakdown: PricingBreakdown,
  options: ApplyVatOptions,
  policy: VatRatePolicy,
): PricingBreakdown {
  const currency = breakdown.currency;
  const nonTaxLines = breakdown.lines.filter((line) => line.code !== "tax");

  // The full amount the customer pays across every non-tax line.
  const fullBaseMinor = Math.max(0, sumLines(nonTaxLines));

  // The taxable base = the selected non-tax lines (default: all of them).
  const codes = options.taxableLineCodes;
  const taxableLines = codes ? nonTaxLines.filter((line) => codes.includes(line.code)) : nonTaxLines;
  const taxableBaseMinor = Math.max(0, sumLines(taxableLines));

  const vat = computeVat(
    { baseMinor: taxableBaseMinor, treatment: options.treatment, convention: options.convention },
    policy,
  );

  const lines: PricingBreakdownLine[] = [...nonTaxLines];
  if (vat.vatMinor > 0) {
    lines.push({
      code: "tax",
      label: "VAT",
      amount: { currency, amount: vat.vatMinor },
      meta: {
        rate: vat.rate,
        version: vat.version,
        treatment: options.treatment,
        convention: options.convention,
        // `inclusive` tax lines are NON-ADDITIVE: their amount is already within
        // customerTotal. Consumers must read totals.customerTotal, not re-sum lines.
        inclusive: options.convention === "inclusive",
        jurisdiction: options.jurisdiction ?? "NG",
      },
    });
  }

  const customerTotalMinor =
    options.convention === "inclusive" ? fullBaseMinor : fullBaseMinor + vat.vatMinor;

  return {
    ...breakdown,
    lines,
    totals: {
      ...breakdown.totals,
      customerTotal: { currency, amount: customerTotalMinor } satisfies Money,
    },
  };
}
