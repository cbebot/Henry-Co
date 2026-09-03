import "server-only";

import {
  DEFAULT_COUNTRY,
  formatDate,
  formatDateTime,
  formatMoney,
  getCountry,
  normalizeLocale,
  type AppLocale,
} from "@henryco/i18n";

export type AccountRegionalContext = {
  countryCode: string;
  countryName: string;
  locale: string;
  appLocale: AppLocale;
  currencyCode: string;
  timezone: string;
  settlementNote: string;
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
  const currencyCode = String(input.currency || country.currencyCode || "NGN").toUpperCase();
  const timezone = String(input.timezone || country.timezone || "Africa/Lagos");

  return {
    countryCode: country.code,
    countryName: country.name,
    locale: country.locale,
    appLocale,
    currencyCode,
    timezone,
    settlementNote:
      currencyCode === "NGN"
        ? "Your wallet is in Nigerian Naira (NGN)."
        : `Prices can display in ${currencyCode}. Your wallet is in Nigerian Naira (NGN).`,
  };
}

export function formatRegionalMoney(
  amountKobo: number,
  context: AccountRegionalContext,
  currencyCode = context.currencyCode
) {
  return formatMoney(amountKobo, currencyCode);
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
