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

/**
 * Look up the configuration for a given ISO 4217 currency code.
 * Falls back to NGN when the code is unknown.
 */
export function parseCurrencyConfig(code: string): CurrencyConfig {
  const upper = code.toUpperCase();
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
  amountKobo: number,
  currencyCode: string = DEFAULT_CURRENCY,
): string {
  const config = parseCurrencyConfig(currencyCode);
  const major = amountKobo / Math.pow(10, config.decimals);

  const formatter = new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.code,
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  });

  return formatter.format(major);
}
