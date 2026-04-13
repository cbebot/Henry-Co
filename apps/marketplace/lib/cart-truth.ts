import { resolveCurrencyTruth, type CurrencyTruthContext } from "@henryco/i18n";

type CurrencyLikeItem = {
  quantity: number;
  price: number;
  currency: string;
};

export type CartCurrencySummary = {
  currencies: string[];
  primaryCurrency: string | null;
  mixedPricing: boolean;
  truth: CurrencyTruthContext | null;
  subtotal: number;
  shipping: number | null;
  grandTotal: number | null;
  canCheckout: boolean;
  blockingReason: string | null;
  helperText: string;
};

function unique<T>(items: T[]) {
  return [...new Set(items)];
}

export function summarizeMarketplaceCartCurrencies(items: CurrencyLikeItem[]): CartCurrencySummary {
  const currencies = unique(
    items
      .map((item) => String(item.currency || "NGN").trim().toUpperCase())
      .filter(Boolean)
  );
  const primaryCurrency = currencies[0] || null;
  const mixedPricing = currencies.length > 1;
  const subtotal = items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
  const truth = primaryCurrency
    ? resolveCurrencyTruth({
        detectedCurrency: primaryCurrency,
        pricingCurrency: primaryCurrency,
      })
    : null;

  if (!items.length) {
    return {
      currencies,
      primaryCurrency,
      mixedPricing,
      truth,
      subtotal,
      shipping: 0,
      grandTotal: 0,
      canCheckout: false,
      blockingReason: null,
      helperText: "Add items to start a truthful checkout flow.",
    };
  }

  if (mixedPricing) {
    return {
      currencies,
      primaryCurrency,
      mixedPricing,
      truth,
      subtotal,
      shipping: null,
      grandTotal: null,
      canCheckout: false,
      blockingReason:
        "This basket mixes pricing currencies. HenryCo Marketplace does not combine multi-currency baskets into one checkout yet.",
      helperText:
        "Finish or clear one pricing currency before adding another. Mixed-currency settlement is not live yet.",
    };
  }

  const supportsNativeSettlement = truth?.supportsNativeSettlement ?? false;
  if (!supportsNativeSettlement) {
    return {
      currencies,
      primaryCurrency,
      mixedPricing,
      truth,
      subtotal,
      shipping: null,
      grandTotal: null,
      canCheckout: false,
      blockingReason:
        truth?.settlementMessage ||
        "Marketplace settlement is still NGN-first, so this basket cannot settle natively in its current pricing currency yet.",
      helperText:
        "Display currency can be localized, but checkout only runs where the settlement rail is live.",
    };
  }

  const shipping = subtotal > 350000 ? 0 : 18000;
  return {
    currencies,
    primaryCurrency,
    mixedPricing,
    truth,
    subtotal,
    shipping,
    grandTotal: subtotal + shipping,
    canCheckout: true,
    blockingReason: null,
    helperText: truth?.settlementMessage || "Checkout and settlement are aligned for this basket.",
  };
}
