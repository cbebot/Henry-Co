export type Money = {
  currency: string;
  /** Integer minor units (kobo for NGN). */
  amount: number;
};

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

