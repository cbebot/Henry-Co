// V3-VAT-WIRING-01 — resolve a marketplace order's KOBO-EXACT output VAT.
//
// THE BUG THIS CLOSES: the live sale reconcile read a `tax` line that nothing ever
// populated → every settled card sale posted output VAT = 0. A standard-rated sale
// therefore UNDER-REMITTED VAT (a real tax liability). The fix resolves each item's
// treatment AT CHECKOUT — the only place the item→product→category join is in hand —
// carves VAT INCLUSIVE from the authoritative KOBO gross, and stamps the result onto
// the breakdown meta for the reconcile to post verbatim (no naira×100 — the V3-21
// ~100× trap).
//
// CLASSIFICATION: per-item via resolveVatClassification — an explicit per-row
// `itemTreatment` (highest precedence) wins, else the product's CATEGORY drives it
// (marketplace default = standard; food/pharma/baby exempt, books zero-rated). We do
// NOT use `inventory_owner_type` ('company') as an "exempt test" marker: ownership is
// not test-status, and conflating them would under-remit the day the company sells its
// own standard-rated goods. A row that must be exempt carries an explicit treatment.
//
// TREATMENT MODEL (owner/accountant-confirmed regime; the COMPOSITE rule is FLAGGED
// pending accountant sign-off via meta.vat.reviewStatus): principal / merchant-of-
// record, 7.5% VAT-INCLUSIVE on the full transaction value. Delivery + platform fee are
// treated as a COMPOSITE supply that rides with the standard-rated goods — an order
// that carries NO standard-rated item posts ZERO output VAT (exempt/zero-rated/out-of-
// scope goods → 0, delivery follows); an order with standard goods VATs the goods +
// delivery + fee. Pure + dependency-free; the rate is injected (TAX.vat), never hardcoded.

import { resolveVatClassification, TAX, type VatTreatment } from "@henryco/config";
import { carveInclusiveVat, type VatRatePolicy } from "@henryco/pricing";

export type OrderVatLineInput = {
  /** marketplace category slug (resolveVatClassification taxonomy key), or null. */
  categoryKey: string | null;
  /** explicit per-row treatment override (highest precedence), when a catalog row carries one. */
  itemTreatment?: VatTreatment | null;
  /** this line's NAIRA total (unit price × qty). */
  lineNaira: number;
};

export type OrderVatResult = {
  /** Output VAT in whole KOBO — feeds post_sale_revenue + the receipt. */
  outputVatMinor: number;
  /** The KOBO base the inclusive carve was taken from (≤ grossMinor). */
  standardBaseMinor: number;
  /** Rate stamp for audit / historical repricing. */
  rateVersion: string;
  /** Taxing jurisdiction (NG). */
  jurisdiction: string;
  /**
   * `pending_review` when output VAT > 0 — the marketplace treatment (and the novel
   * composite delivery/fee rule) is an owner/accountant assumption awaiting sign-off;
   * `confirmed` for a 0-VAT (no standard-rated item) sale, which is unambiguous.
   */
  reviewStatus: "pending_review" | "confirmed";
  /** Per-item resolved treatments, for the audit trail. */
  treatments: VatTreatment[];
};

/**
 * Compute the kobo-exact output VAT for a settled marketplace order. `grossMinor` is
 * the authoritative kobo gross (`round(grand_total × 100)`), so the carve satisfies
 * `outputVatMinor + revenue === grossMinor` exactly and never exceeds the gross.
 */
export function resolveOrderOutputVat(
  input: {
    items: OrderVatLineInput[];
    /** delivery NAIRA on the order. */
    shippingNaira: number;
    /** platform fee NAIRA on the order. */
    platformFeeNaira: number;
    /** authoritative kobo gross = round(grand_total × 100). */
    grossMinor: number;
  },
  policy: VatRatePolicy = TAX.vat,
): OrderVatResult {
  const treatments = input.items.map(
    (it) =>
      resolveVatClassification({
        division: "marketplace",
        categoryKey: it.categoryKey,
        itemTreatment: it.itemTreatment ?? null,
      }).treatment,
  );

  const standardItemsNaira = input.items.reduce(
    (sum, it, i) => (treatments[i] === "standard" ? sum + Math.max(0, it.lineNaira) : sum),
    0,
  );

  // Composite supply: delivery + platform fee are standard-rated platform services
  // that are VAT-able ONLY when the order actually carries a standard-rated good.
  const anyStandard = standardItemsNaira > 0;
  const standardNairaBase = anyStandard
    ? standardItemsNaira + Math.max(0, input.shippingNaira) + Math.max(0, input.platformFeeNaira)
    : 0;

  // To kobo, clamped to the authoritative gross so the carve can never exceed it.
  const standardBaseMinor = Math.min(
    Math.max(0, Math.round(input.grossMinor)),
    Math.max(0, Math.round(standardNairaBase * 100)),
  );

  const { vatMinor } = carveInclusiveVat({ inclusiveMinor: standardBaseMinor, treatment: "standard" }, policy);

  return {
    outputVatMinor: vatMinor,
    standardBaseMinor,
    rateVersion: policy.rateVersion,
    jurisdiction: TAX.vat.jurisdiction,
    reviewStatus: vatMinor > 0 ? "pending_review" : "confirmed",
    treatments,
  };
}
