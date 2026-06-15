export type Money = {
  currency: string;
  /** Integer minor units (kobo for NGN). */
  amount: number;
};

export {
  SYSTEM_BASE_CURRENCY,
  resolveDisplayCurrencyForCountry,
  resolveSettlementCurrencyForDivision,
  describeSettlementTruth,
  buildCurrencySnapshot,
  buildExchangeRateSnapshot,
  buildFallbackExchangeRateSnapshot,
  assertNoAmbiguousCurrency,
  type CurrencyLayerSnapshot,
  type ExchangeRateSnapshot,
  type SettlementAvailabilityStatus,
} from './currency-model';

// Live FX access (Open Exchange Rates, 30-min cache). SERVER-ONLY — these read
// server env (`OPENRATE_APP_ID`) and `fetch` rates; never import the resulting
// symbols into a client bundle. They have no import-time side effects, so the
// barrel stays client-safe for the currency-model exports above (tree-shaken out
// of any client importer that doesn't call them).
export {
  getExchangeRateSnapshot,
  convertMinorUnits,
} from './exchange-rate';

// V3-VAT-01 — VAT math (output VAT on sales, inclusive-split for processor fees).
export {
  splitVatInclusive,
  computeOutputVat,
  applyOutputVat,
  type VatTreatment,
  type VatRatePolicy,
} from './vat';

// V3-49 — services-catalog pricing model (display hint validator, not a quote engine).
export {
  normalizeServicePricingModel,
  describeServicePrice,
  type ServicePricingKind,
  type ServicePricingModel,
  type ServicePriceDescription,
} from './service-catalog';

export type PricingBreakdownLine = {
  code:
    | "items_subtotal"
    | "delivery"
    | "platform_fee"
    | "service_fee"
    | "inspection_fee"
    | "discount"
    | "hold_reserve"
    | "payout_fee"
    // V3-18: the VAT/tax SEAM. No engine computes it yet (V3-21 owns that) and the
    // rate is NEVER hardcoded — a breakdown only carries a `tax` line once a tax
    // engine populates one. Receipts/invoices render a VAT line iff such a line is
    // present (see extractTaxFromBreakdown). `meta.rate` (e.g. 0.075) is optional
    // and informational only.
    | "tax"
    | "other";
  label: string;
  amount: Money;
  meta?: Record<string, unknown>;
};

export type PricingBreakdown = {
  currency: string;
  lines: PricingBreakdownLine[];
  totals: {
    customerTotal: Money;
    /** Amount attributable to vendor(s) before payout fees/holds. */
    vendorGross: Money;
    platformNet: Money;
    vendorNet: Money;
  };
  /** Machine-friendly snapshot for auditability. */
  meta: {
    division: "marketplace" | "property" | "logistics" | "shared";
    ruleBookKey: string;
    ruleVersion: string;
    computedAt: string;
  };
};

function roundInt(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n);
}

function sumAmounts(lines: PricingBreakdownLine[]) {
  return lines.reduce((sum, line) => sum + roundInt(line.amount.amount), 0);
}

export type BreakdownTax = {
  /** Total VAT/tax in minor units (kobo), summed across every `tax` line. */
  taxMinor: number;
  /** ISO 4217 currency of the breakdown the tax was extracted from. */
  currency: string;
  /** Optional fractional rate carried on a `tax` line's meta (e.g. 0.075), else null. */
  rate: number | null;
};

/**
 * Extract the VAT/tax represented in a pricing breakdown, or `null` when there is
 * none. This is the ONLY way a receipt/invoice learns its VAT — the rate is never
 * hardcoded. Returns `null` (→ no VAT line) when the breakdown carries no `tax`
 * line or the tax sums to ≤ 0, satisfying the V3-18 rule
 * "no VAT in the breakdown → no VAT line". Amounts stay whole minor units.
 */
export function extractTaxFromBreakdown(
  breakdown: PricingBreakdown | null | undefined,
): BreakdownTax | null {
  if (!breakdown || !Array.isArray(breakdown.lines)) return null;
  const taxLines = breakdown.lines.filter((line) => line.code === "tax");
  if (taxLines.length === 0) return null;
  const taxMinor = taxLines.reduce((sum, line) => sum + roundInt(line.amount.amount), 0);
  if (taxMinor <= 0) return null;
  const rateMeta = taxLines
    .map((line) => line.meta?.rate)
    .find((rate): rate is number => typeof rate === "number" && Number.isFinite(rate));
  return {
    taxMinor,
    currency: breakdown.currency,
    rate: typeof rateMeta === "number" ? rateMeta : null,
  };
}

export type MarketplacePricingRuleSet = {
  key: string;
  version: string;
  currency: string;
  delivery: {
    freeThresholdAmount: number;
    baseAmount: number;
  };
  platformFee: {
    /** e.g. 0.01 = 1% */
    rate: number;
    flatAmount: number;
    /** Max platform fee, 0 = uncapped */
    capAmount: number;
  };
};

export function defaultMarketplacePricingRules(): MarketplacePricingRuleSet {
  return {
    key: "marketplace_default_ngn",
    version: "2026-04-17",
    currency: "NGN",
    delivery: {
      freeThresholdAmount: 350000,
      baseAmount: 18000,
    },
    platformFee: {
      rate: 0,
      flatAmount: 0,
      capAmount: 0,
    },
  };
}

export function computeMarketplaceCheckoutBreakdown(input: {
  rules?: MarketplacePricingRuleSet;
  itemsSubtotalAmount: number;
  /** Optional override for delivery quote (e.g. Mapbox/logistics quote). */
  deliveryAmount?: number | null;
  /** Optional discount amount (positive int reduces total). */
  discountAmount?: number | null;
}): PricingBreakdown {
  const rules = input.rules ?? defaultMarketplacePricingRules();
  const currency = rules.currency;
  const subtotal = Math.max(0, roundInt(input.itemsSubtotalAmount));
  const discount = Math.max(0, roundInt(input.discountAmount ?? 0));
  const delivery =
    input.deliveryAmount != null
      ? Math.max(0, roundInt(input.deliveryAmount))
      : subtotal >= rules.delivery.freeThresholdAmount
        ? 0
        : Math.max(0, roundInt(rules.delivery.baseAmount));

  const platformFeeRaw = Math.max(
    0,
    Math.round(subtotal * Number(rules.platformFee.rate || 0)) + roundInt(rules.platformFee.flatAmount)
  );
  const platformFee =
    rules.platformFee.capAmount && rules.platformFee.capAmount > 0
      ? Math.min(platformFeeRaw, roundInt(rules.platformFee.capAmount))
      : platformFeeRaw;

  const lines: PricingBreakdownLine[] = [
    { code: "items_subtotal", label: "Items subtotal", amount: { currency, amount: subtotal } },
    { code: "delivery", label: "Delivery", amount: { currency, amount: delivery } },
  ];

  if (platformFee > 0) {
    lines.push({ code: "platform_fee", label: "Platform fee", amount: { currency, amount: platformFee } });
  }

  if (discount > 0) {
    lines.push({ code: "discount", label: "Discount", amount: { currency, amount: -discount } });
  }

  const customerTotal = Math.max(0, sumAmounts(lines));

  return {
    currency,
    lines,
    totals: {
      customerTotal: { currency, amount: customerTotal },
      vendorGross: { currency, amount: subtotal },
      platformNet: { currency, amount: platformFee },
      vendorNet: { currency, amount: subtotal },
    },
    meta: {
      division: "marketplace",
      ruleBookKey: rules.key,
      ruleVersion: rules.version,
      computedAt: new Date().toISOString(),
    },
  };
}

export type PropertyPricingRuleSet = {
  key: string;
  version: string;
  currency: string;
  fees: {
    listingReviewFeeAmount: number;
    inspectionFeeAmount: number;
    managedServiceFeeAmount: number;
    verifiedListingFeeAmount: number;
    premiumPlacementFeeAmount: number;
  };
};

export function defaultPropertyPricingRules(): PropertyPricingRuleSet {
  return {
    key: "property_default_ngn",
    version: "2026-04-17",
    currency: "NGN",
    fees: {
      listingReviewFeeAmount: 0,
      inspectionFeeAmount: 0,
      managedServiceFeeAmount: 0,
      verifiedListingFeeAmount: 0,
      premiumPlacementFeeAmount: 0,
    },
  };
}

export function computePropertySubmissionFeeBreakdown(input: {
  rules?: PropertyPricingRuleSet;
  serviceType:
    | "rent"
    | "sale"
    | "shortlet"
    | "land"
    | "commercial"
    | "agent_assisted"
    | "inspection_request"
    | "managed_property"
    | "verified_property";
  requiresInspection: boolean;
  premiumPlacementRequested?: boolean;
}): PricingBreakdown {
  const rules = input.rules ?? defaultPropertyPricingRules();
  const currency = rules.currency;

  const reviewFee = Math.max(0, roundInt(rules.fees.listingReviewFeeAmount));
  const inspectionFee =
    input.requiresInspection || input.serviceType === "inspection_request"
      ? Math.max(0, roundInt(rules.fees.inspectionFeeAmount))
      : 0;
  const managedFee =
    input.serviceType === "managed_property"
      ? Math.max(0, roundInt(rules.fees.managedServiceFeeAmount))
      : 0;
  const verifiedFee =
    input.serviceType === "verified_property"
      ? Math.max(0, roundInt(rules.fees.verifiedListingFeeAmount))
      : 0;
  const premiumFee = input.premiumPlacementRequested
    ? Math.max(0, roundInt(rules.fees.premiumPlacementFeeAmount))
    : 0;

  const lines: PricingBreakdownLine[] = [];
  if (reviewFee > 0) lines.push({ code: "service_fee", label: "Listing review", amount: { currency, amount: reviewFee } });
  if (inspectionFee > 0) lines.push({ code: "inspection_fee", label: "Inspection", amount: { currency, amount: inspectionFee } });
  if (managedFee > 0) lines.push({ code: "service_fee", label: "Managed listing service", amount: { currency, amount: managedFee } });
  if (verifiedFee > 0) lines.push({ code: "service_fee", label: "Verified listing service", amount: { currency, amount: verifiedFee } });
  if (premiumFee > 0) lines.push({ code: "service_fee", label: "Premium placement", amount: { currency, amount: premiumFee } });

  const total = Math.max(0, sumAmounts(lines));

  return {
    currency,
    lines,
    totals: {
      customerTotal: { currency, amount: total },
      vendorGross: { currency, amount: 0 },
      platformNet: { currency, amount: total },
      vendorNet: { currency, amount: 0 },
    },
    meta: {
      division: "property",
      ruleBookKey: rules.key,
      ruleVersion: rules.version,
      computedAt: new Date().toISOString(),
    },
  };
}

