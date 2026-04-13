import "server-only";

import {
  extractCurrencyContext,
  formatMoney,
  resolveCurrencyTruth,
  type CurrencyTruthContext,
} from "@henryco/i18n";

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function resolveAccountLedgerCurrencyTruth(
  record: Record<string, unknown>,
  input?: {
    country?: string | null;
    locale?: string | null;
    preferredCurrency?: string | null;
  }
): CurrencyTruthContext {
  const metadataContext = extractCurrencyContext(record.metadata);
  const lineItemContext = extractCurrencyContext(record.line_items);

  return resolveCurrencyTruth({
    ...metadataContext,
    ...lineItemContext,
    country: input?.country || metadataContext.country || lineItemContext.country,
    locale: input?.locale || metadataContext.locale || lineItemContext.locale,
    preferredCurrency:
      input?.preferredCurrency ||
      metadataContext.preferredCurrency ||
      lineItemContext.preferredCurrency,
    detectedCurrency:
      metadataContext.detectedCurrency ||
      lineItemContext.detectedCurrency ||
      asText(record.currency) ||
      input?.preferredCurrency,
    pricingCurrency:
      lineItemContext.pricingCurrency ||
      metadataContext.pricingCurrency ||
      asText(record.currency),
  });
}

export function formatLedgerMinorAmount(
  amountMinor: number,
  truth: CurrencyTruthContext
) {
  return formatMoney(amountMinor, truth.pricingCurrency, {
    locale: truth.locale,
  });
}
