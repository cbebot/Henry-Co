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

/**
 * How a supply is treated for VAT. The vocabulary is mirrored in `@henryco/config`
 * (`VatTreatment` there), which owns the per-supply CLASSIFICATION; this layer owns
 * the MATHS. Keep the two literal unions in sync. Only `standard` carries output VAT.
 */
export type VatTreatment =
  /** Standard-rated: output VAT at the policy rate applies. */
  | "standard"
  /** Taxable at 0% (e.g. exports): no output VAT, input VAT still recoverable. */
  | "zero_rated"
  /** Outside VAT: no output VAT, and input VAT is not reclaimable. */
  | "exempt"
  /** Not a taxable supply at all (e.g. sale of land/buildings): no output VAT. */
  | "out_of_scope";

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

// ---------------------------------------------------------------------------
// V3-VAT-CLASSIFICATION-01 — INCLUSIVE output VAT (the consumer-facing model)
//
// `applyOutputVat` above ADDS VAT on top of a VAT-exclusive base (the price grows).
// The customer-facing regime is the opposite: a displayed price is VAT-INCLUSIVE and
// the 7.5% is CARVED OUT of the full transaction value — the customer pays the same
// total, and the VAT line is informational (already inside the total). This is what
// the marketplace/division checkout shows, and what feeds `post_sale_revenue`
// (DR clearing(gross) / CR revenue(gross−vat) / CR vat_output_payable(vat)).
//
// CRITICAL kobo rule: everything here is whole kobo. The division breakdowns are
// built in naira and converted ×100 at the persistence boundary — a VAT figure must
// NEVER be carved in naira then fed to a `*_minor`/`*_kobo` param (the ~100×
// understatement bug). At the ledger bridge, carve from the KOBO gross.
// ---------------------------------------------------------------------------

/**
 * Carve VAT OUT of a VAT-INCLUSIVE kobo amount under a treatment. `standard` →
 * `vat = total − round(total/(1+rate))` (so `exVat + vat === total` exactly, no
 * drift); every non-standard treatment (zero-rated / exempt / out-of-scope) → 0 VAT
 * with the whole amount as ex-VAT. The inclusive total is preserved either way.
 */
export function carveInclusiveVat(
  input: { inclusiveMinor: number; treatment: VatTreatment },
  policy: VatRatePolicy,
): { exVatMinor: number; vatMinor: number; rate: number; version: string } {
  assertWholeKobo(input.inclusiveMinor, "inclusiveMinor");
  assertRate(policy.standardRate);
  if (input.treatment !== "standard") {
    return { exVatMinor: input.inclusiveMinor, vatMinor: 0, rate: policy.standardRate, version: policy.rateVersion };
  }
  const { exVatMinor, vatMinor } = splitVatInclusive(input.inclusiveMinor, policy.standardRate);
  return { exVatMinor, vatMinor, rate: policy.standardRate, version: policy.rateVersion };
}

function pushInclusiveTaxLine(
  lines: PricingBreakdownLine[],
  currency: string,
  vatMinor: number,
  meta: Record<string, unknown>,
): void {
  if (vatMinor > 0) {
    lines.push({
      code: "tax",
      label: "VAT included",
      amount: { currency, amount: vatMinor },
      // `inclusive: true` tells the receipt/invoice the VAT is WITHIN customerTotal
      // (base = total − vat), not added on top. `unit: "minor"` guards the kobo trap.
      meta: { jurisdiction: "NG", inclusive: true, unit: "minor", ...meta },
    });
  }
}

/**
 * Single-supply INCLUSIVE VAT: carve VAT out of the sum of the breakdown's non-tax
 * lines under ONE treatment, append an informational `tax` line, and leave
 * `customerTotal` UNCHANGED (the VAT is already inside it). Idempotent (drops any
 * prior `tax` line first) and pure. For property fees, studio, learn, logistics,
 * care — anything assessed under a single treatment.
 */
export function applyInclusiveVat(
  breakdown: PricingBreakdown,
  options: { treatment: VatTreatment },
  policy: VatRatePolicy,
): PricingBreakdown {
  const currency = breakdown.currency;
  const nonTaxLines = breakdown.lines.filter((line) => line.code !== "tax");
  const inclusiveTotal = Math.max(0, nonTaxLines.reduce((sum, line) => sum + Math.round(line.amount.amount), 0));
  const { vatMinor, rate, version } = carveInclusiveVat({ inclusiveMinor: inclusiveTotal, treatment: options.treatment }, policy);

  const lines: PricingBreakdownLine[] = [...nonTaxLines];
  pushInclusiveTaxLine(lines, currency, vatMinor, { rate, version, treatment: options.treatment });

  return {
    ...breakdown,
    lines,
    totals: { ...breakdown.totals, customerTotal: { currency, amount: inclusiveTotal } satisfies Money },
  };
}

/**
 * Build the kobo-exact OUTPUT-VAT figures for a SETTLED sale, ready to hand to the
 * `post_sale_revenue(gross, outputVat)` ledger RPC (DR payments_clearing(gross) /
 * CR platform_revenue(gross−vat) / CR vat_output_payable(vat)). VAT is carved
 * INCLUSIVE from the KOBO gross — NEVER from a naira figure ×100 (the V3-21 ~100×
 * trap). The three figures always reconcile: `gross === revenue + outputVat`.
 *
 * Pure: it computes; it does NOT post. The live caller (the gated division-sale
 * reconcile) owns the RPC call, so this stays isolated from the collection path.
 *
 * SINGLE-TREATMENT ONLY: the whole `grossMinor` is assessed under one treatment.
 * For a MIXED cart (some lines standard, some exempt/zero-rated) this would over-
 * state output VAT — the ledger figure must match the receipt's per-line carve, so
 * use {@link buildSaleVatRecognitionByLine} there. Wiring the wrong one would post a
 * receipt/ledger VAT mismatch.
 */
export function buildSaleVatRecognition(
  input: { grossMinor: number; treatment: VatTreatment },
  policy: VatRatePolicy,
): { grossMinor: number; outputVatMinor: number; revenueMinor: number; rate: number; version: string } {
  const { exVatMinor, vatMinor, rate, version } = carveInclusiveVat(
    { inclusiveMinor: input.grossMinor, treatment: input.treatment },
    policy,
  );
  return { grossMinor: input.grossMinor, outputVatMinor: vatMinor, revenueMinor: exVatMinor, rate, version };
}

/**
 * Per-line INCLUSIVE VAT for a MIXED supply (e.g. a marketplace cart with some
 * standard and some exempt/zero-rated items). Each non-tax line is classified by
 * `resolveTreatment`; VAT is carved from the aggregate of the STANDARD-rated lines
 * only. `customerTotal` is unchanged. The `tax` line's `meta.basis` records the
 * standard-rated base so the posting/receipt is auditable.
 */
export function applyInclusiveVatByLine(
  breakdown: PricingBreakdown,
  resolveTreatment: (line: PricingBreakdownLine, index: number) => VatTreatment,
  policy: VatRatePolicy,
): PricingBreakdown {
  const currency = breakdown.currency;
  const nonTaxLines = breakdown.lines.filter((line) => line.code !== "tax");
  const inclusiveTotal = Math.max(0, nonTaxLines.reduce((sum, line) => sum + Math.round(line.amount.amount), 0));
  const standardBase = Math.max(
    0,
    nonTaxLines.reduce(
      (sum, line, index) => (resolveTreatment(line, index) === "standard" ? sum + Math.round(line.amount.amount) : sum),
      0,
    ),
  );
  const { vatMinor, rate, version } = carveInclusiveVat({ inclusiveMinor: standardBase, treatment: "standard" }, policy);

  const lines: PricingBreakdownLine[] = [...nonTaxLines];
  pushInclusiveTaxLine(lines, currency, vatMinor, { rate, version, treatment: "standard", basis: standardBase });

  return {
    ...breakdown,
    lines,
    totals: { ...breakdown.totals, customerTotal: { currency, amount: inclusiveTotal } satisfies Money },
  };
}

/**
 * Ledger output-VAT for a MIXED-supply settled sale — the per-line counterpart of
 * {@link buildSaleVatRecognition}, kept consistent with {@link applyInclusiveVatByLine}
 * so the receipt and the ledger ALWAYS carry the same VAT figure. `grossMinor` is the
 * full settled amount (every non-tax line); output VAT is carved INCLUSIVE from the
 * STANDARD-rated lines only; revenue is the remainder (it includes the exempt/zero-
 * rated portion). Reconciles by construction: `gross === revenue + outputVat`. Whole
 * kobo. Pure — computes, does not post.
 */
export function buildSaleVatRecognitionByLine(
  breakdown: PricingBreakdown,
  resolveTreatment: (line: PricingBreakdownLine, index: number) => VatTreatment,
  policy: VatRatePolicy,
): { grossMinor: number; outputVatMinor: number; revenueMinor: number; rate: number; version: string } {
  const nonTaxLines = breakdown.lines.filter((line) => line.code !== "tax");
  const grossMinor = Math.max(0, nonTaxLines.reduce((sum, line) => sum + Math.round(line.amount.amount), 0));
  const standardBase = Math.max(
    0,
    nonTaxLines.reduce(
      (sum, line, index) => (resolveTreatment(line, index) === "standard" ? sum + Math.round(line.amount.amount) : sum),
      0,
    ),
  );
  const { vatMinor, rate, version } = carveInclusiveVat({ inclusiveMinor: standardBase, treatment: "standard" }, policy);
  return { grossMinor, outputVatMinor: vatMinor, revenueMinor: grossMinor - vatMinor, rate, version };
}
