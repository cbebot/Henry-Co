import "server-only";

import {
  DEFAULT_COUNTRY,
  formatDate,
  formatDateTime,
  formatMoney,
  getCountry,
  normalizeLocale,
  resolveCurrencyTruth,
  type AppLocale,
} from "@henryco/i18n";

export type AccountRegionalContext = {
  countryCode: string;
  countryName: string;
  locale: string;
  appLocale: AppLocale;
  currencyCode: string;
  displayCurrency: string;
  pricingCurrency: string;
  settlementCurrency: string;
  baseCurrency: string;
  supportsNativeSettlement: boolean;
  timezone: string;
  settlementNote: string;
  settlementLabel: string;
};

export function resolveAccountRegionalContext(input: {
  country?: string | null;
  currency?: string | null;
  timezone?: string | null;
  language?: string | null;
}): AccountRegionalContext {
  const country =
    getCountry(String(input.country || "").trim()) || getCountry(DEFAULT_COUNTRY)!;
  const appLocale = normalizeLocale(input.language || country.locale);
  const truth = resolveCurrencyTruth({
    country: country.code,
    locale: country.locale,
    preferredCurrency: input.currency || country.currencyCode,
    detectedCurrency: input.currency || country.currencyCode,
  });
  const timezone = String(input.timezone || country.timezone || "Africa/Lagos");

  return {
    countryCode: country.code,
    countryName: country.name,
    locale: country.locale,
    appLocale,
    currencyCode: truth.displayCurrency,
    displayCurrency: truth.displayCurrency,
    pricingCurrency: truth.pricingCurrency,
    settlementCurrency: truth.settlementCurrency,
    baseCurrency: truth.baseCurrency,
    supportsNativeSettlement: truth.supportsNativeSettlement,
    timezone,
    settlementNote: truth.settlementMessage,
    settlementLabel: truth.settlementLabel,
  };
}

export function formatRegionalMoney(
  amountKobo: number,
  context: AccountRegionalContext,
  currencyCode = context.currencyCode
) {
  return formatMoney(amountKobo, currencyCode, {
    locale: context.locale,
  });
}

export function formatRegionalDate(
  value: string,
  context: AccountRegionalContext
) {
  return formatDate(value, context.timezone, context.locale);
}

export function formatRegionalDateTime(
  value: string,
  context: AccountRegionalContext
) {
  return formatDateTime(value, context.timezone, context.locale);
}
