// ---------------------------------------------------------------------------
// @henryco/i18n  --  Currency formatting utilities
// Uses Intl.NumberFormat internally. Zero external dependencies.
// ---------------------------------------------------------------------------

export interface CurrencyConfig {
  code: string;
  symbol: string;
  decimals: number;
  locale: string;
}

export interface FormatMoneyOptions {
  locale?: string | null;
  unit?: "major" | "minor";
  notation?: Intl.NumberFormatOptions["notation"];
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  currencyDisplay?: Intl.NumberFormatOptions["currencyDisplay"];
  signDisplay?: Intl.NumberFormatOptions["signDisplay"];
  includeCode?: boolean;
}

export interface CurrencyTruthContext {
  displayCurrency: string;
  pricingCurrency: string;
  settlementCurrency: string;
  baseCurrency: string;
  locale: string;
  exchangeRateSource: string | null;
  exchangeRateTimestamp: string | null;
}

const CURRENCY_MAP: Record<string, CurrencyConfig> = {
  NGN: { code: 'NGN', symbol: '\u20A6', decimals: 2, locale: 'en-NG' },
  USD: { code: 'USD', symbol: '$', decimals: 2, locale: 'en-US' },
  GBP: { code: 'GBP', symbol: '\u00A3', decimals: 2, locale: 'en-GB' },
  XOF: { code: 'XOF', symbol: 'CFA', decimals: 0, locale: 'fr-BJ' },
  GHS: { code: 'GHS', symbol: 'GH\u20B5', decimals: 2, locale: 'en-GH' },
  EUR: { code: 'EUR', symbol: '\u20AC', decimals: 2, locale: 'de-DE' },
  KES: { code: 'KES', symbol: 'KSh', decimals: 2, locale: 'en-KE' },
  ZAR: { code: 'ZAR', symbol: 'R', decimals: 2, locale: 'en-ZA' },
  CAD: { code: 'CAD', symbol: 'CA$', decimals: 2, locale: 'en-CA' },
  AED: { code: 'AED', symbol: 'AED', decimals: 2, locale: 'en-AE' },
};

const DEFAULT_CURRENCY = 'NGN';

export function normalizeCurrencyCode(code?: string | null): string {
  const normalized = String(code || "").trim().toUpperCase();
  return normalized || DEFAULT_CURRENCY;
}

export function resolveCurrencyLocale(
  currencyCode: string,
  preferredLocale?: string | null,
): string {
  return preferredLocale || parseCurrencyConfig(currencyCode).locale;
}

/**
 * Look up the configuration for a given ISO 4217 currency code.
 * Falls back to NGN when the code is unknown.
 */
export function parseCurrencyConfig(code: string): CurrencyConfig {
  const upper = normalizeCurrencyCode(code);
  return CURRENCY_MAP[upper] ?? CURRENCY_MAP[DEFAULT_CURRENCY];
}

/**
 * Format a monetary amount stored in the smallest unit (kobo / cents) into a
 * human-readable string using the platform Intl.NumberFormat API.
 *
 * @param amountKobo - Amount in the smallest currency unit (e.g. 150000 kobo = 1,500.00 NGN)
 * @param currencyCode - ISO 4217 code. Defaults to "NGN".
 * @returns Formatted string, e.g. "\u20A61,500.00"
 */
export function formatMoney(
  amount: number,
  currencyCode: string = DEFAULT_CURRENCY,
  options?: FormatMoneyOptions,
): string {
  const config = parseCurrencyConfig(currencyCode);
  const normalizedAmount =
    (options?.unit || "minor") === "major"
      ? amount
      : amount / Math.pow(10, config.decimals);
  const minimumFractionDigits =
    options?.minimumFractionDigits ?? (Number.isInteger(normalizedAmount) ? 0 : config.decimals);
  const maximumFractionDigits = options?.maximumFractionDigits ?? config.decimals;

  const formatter = new Intl.NumberFormat(resolveCurrencyLocale(config.code, options?.locale), {
    style: 'currency',
    currency: config.code,
    currencyDisplay: options?.currencyDisplay,
    notation: options?.notation,
    signDisplay: options?.signDisplay,
    minimumFractionDigits,
    maximumFractionDigits,
  });

  const formatted = formatter.format(normalizedAmount);
  return options?.includeCode ? `${formatted} ${config.code}` : formatted;
}

export function resolveCurrencyTruthContext(
  input: Partial<CurrencyTruthContext> & {
    displayCurrency?: string | null;
    pricingCurrency?: string | null;
    settlementCurrency?: string | null;
    baseCurrency?: string | null;
    locale?: string | null;
    exchangeRateSource?: string | null;
    exchangeRateTimestamp?: string | null;
  },
): CurrencyTruthContext {
  const pricingCurrency = normalizeCurrencyCode(
    input.pricingCurrency || input.settlementCurrency || input.displayCurrency,
  );
  const settlementCurrency = normalizeCurrencyCode(
    input.settlementCurrency || input.pricingCurrency || pricingCurrency,
  );
  const baseCurrency = normalizeCurrencyCode(input.baseCurrency || settlementCurrency);
  const displayCurrency = normalizeCurrencyCode(input.displayCurrency || pricingCurrency);

  return {
    displayCurrency,
    pricingCurrency,
    settlementCurrency,
    baseCurrency,
    locale: resolveCurrencyLocale(pricingCurrency, input.locale),
    exchangeRateSource: input.exchangeRateSource || null,
    exchangeRateTimestamp: input.exchangeRateTimestamp || null,
  };
}
