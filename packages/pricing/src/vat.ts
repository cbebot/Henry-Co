// ---------------------------------------------------------------------------
// @henryco/pricing — VAT math (V3-VAT-01)
//
// The pure, integer-kobo VAT computations. Two genuinely different real-world
// shapes, kept distinct so neither is mis-applied:
//
//   - splitVatInclusive  — decompose a VAT-INCLUSIVE total (a processor fee, which
//                          Nigerian providers report as one VAT-inclusive number).
//   - computeOutputVat /  — output VAT on a VAT-EXCLUSIVE taxable base (a sale): VAT
//     applyOutputVat        is computed and added on top to form the gross.
//
// They are inverses (add-then-split round-trips), which keeps the pricing and the
// ledger postings coherent. Amounts are whole kobo — never float, never ×100.
//
// Dependency-free by design: the rate + version are dependency-INJECTED via a
// {@link VatRatePolicy} (the canonical value is `@henryco/config` TAX.vat). That
// keeps pricing a leaf package and the rate config-driven, never hardcoded here.
// ---------------------------------------------------------------------------

import type { Money, PricingBreakdown, PricingBreakdownLine } from "./index";

/** How a supply is treated for VAT (a per-supply decision, owned by the pricing layer). */
export type VatTreatment =
  /** Standard-rated: output VAT at the policy rate applies. */
  | "standard"
  /** Taxable at 0% (e.g. exports): no output VAT, input VAT still recoverable. */
  | "zero_rated"
  /** Outside VAT: no output VAT, and input VAT is not reclaimable. */
  | "exempt";

/** The minimal VAT policy a computation needs. `@henryco/config` TAX.vat satisfies it. */
export type VatRatePolicy = {
  /** Fractional standard rate, e.g. 0.075 for 7.5%. */
  standardRate: number;
  /** Version stamp recorded on each VAT line for audit / historical repricing. */
  rateVersion: string;
};

function assertWholeKobo(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`[pricing/vat] ${label} must be a whole non-negative kobo integer, got ${value}`);
  }
}

function assertRate(rate: number): void {
  if (!Number.isFinite(rate) || rate < 0) {
    throw new Error(`[pricing/vat] rate must be a finite non-negative number, got ${rate}`);
  }
}

/**
 * Decompose a VAT-INCLUSIVE kobo amount into ex-VAT + VAT. `exVat = round(total /
 * (1 + rate))`, then `vat = total − exVat`, so the two ALWAYS reconcile back to
 * `total` exactly (no rounding drift posted to the ledger). Used for processor fees.
 */
export function splitVatInclusive(totalMinor: number, rate: number): { exVatMinor: number; vatMinor: number } {
  assertWholeKobo(totalMinor, "totalMinor");
  assertRate(rate);
  const exVatMinor = Math.round(totalMinor / (1 + rate));
  const vatMinor = totalMinor - exVatMinor;
  return { exVatMinor, vatMinor };
}

/**
 * Output VAT on a VAT-EXCLUSIVE taxable base. Standard supplies are charged at the
 * policy rate; zero-rated and exempt supplies carry no output VAT (the rate it was
 * assessed under is still returned for the audit trail). Whole kobo.
 */
export function computeOutputVat(
  input: { baseMinor: number; treatment: VatTreatment },
  policy: VatRatePolicy,
): { vatMinor: number; rate: number; version: string } {
  assertWholeKobo(input.baseMinor, "baseMinor");
  assertRate(policy.standardRate);
  const vatMinor = input.treatment === "standard" ? Math.round(input.baseMinor * policy.standardRate) : 0;
  return { vatMinor, rate: policy.standardRate, version: policy.rateVersion };
}

/**
 * Return a COPY of `breakdown` with output VAT represented as a `tax` line — the
 * V3-18 receipt/invoice VAT seam (extractTaxFromBreakdown reads it back). The
 * taxable base is the sum of the breakdown's NON-tax lines (so re-applying never
 * taxes the VAT — idempotent). VAT is config-driven (rate + version stamped onto the
 * line's `meta`, never hardcoded in JSX) and added on top, so the new customerTotal
 * is the VAT-inclusive gross the customer pays. Pure — does not mutate the input.
 *
 * Single-supply scope (V3-VAT-01): this assesses the whole base under one treatment,
 * which fits a platform's own VATable service. Per-line / multi-party (vendor-vs-
 * platform) VAT is the multi-jurisdiction engine's job (V3-21).
 */
export function applyOutputVat(
  breakdown: PricingBreakdown,
  options: { treatment: VatTreatment },
  policy: VatRatePolicy,
): PricingBreakdown {
  const currency = breakdown.currency;
  const nonTaxLines = breakdown.lines.filter((line) => line.code !== "tax");
  const baseMinor = Math.max(0, nonTaxLines.reduce((sum, line) => sum + Math.round(line.amount.amount), 0));
  const { vatMinor, rate, version } = computeOutputVat({ baseMinor, treatment: options.treatment }, policy);

  const lines: PricingBreakdownLine[] = [...nonTaxLines];
  if (vatMinor > 0) {
    lines.push({
      code: "tax",
      label: "VAT",
      amount: { currency, amount: vatMinor },
      meta: { rate, version, treatment: options.treatment, jurisdiction: "NG" },
    });
  }

  return {
    ...breakdown,
    lines,
    totals: {
      ...breakdown.totals,
      customerTotal: { currency, amount: baseMinor + vatMinor } satisfies Money,
    },
  };
}
