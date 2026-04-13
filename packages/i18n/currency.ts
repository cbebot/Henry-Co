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

export interface MoneyFormatOptions {
  locale?: string;
  notation?: Intl.NumberFormatOptions["notation"];
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
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

export const DEFAULT_CURRENCY = 'NGN';

export function normalizeCurrencyCode(code: string | null | undefined): string {
  const normalized = String(code || "").trim().toUpperCase();
  return normalized || DEFAULT_CURRENCY;
}

export function resolveCurrencyLocale(
  currencyCode: string,
  locale?: string | null
): string {
  const explicit = String(locale || "").trim();
  if (explicit) return explicit;
  return parseCurrencyConfig(currencyCode).locale;
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
  amountKobo: number,
  currencyCode: string = DEFAULT_CURRENCY,
  options?: MoneyFormatOptions,
): string {
  const config = parseCurrencyConfig(currencyCode);
  const major = amountKobo / Math.pow(10, config.decimals);

  return formatMoneyMajor(major, config.code, options);
}

export function formatMoneyMajor(
  amountMajor: number,
  currencyCode: string = DEFAULT_CURRENCY,
  options?: MoneyFormatOptions,
): string {
  const config = parseCurrencyConfig(currencyCode);
  const normalizedAmount = Number.isFinite(amountMajor) ? amountMajor : 0;
  const minimumFractionDigits =
    options?.minimumFractionDigits ??
    (config.decimals === 0
      ? 0
      : normalizedAmount % 1 === 0
        ? 0
        : Math.min(2, config.decimals));
  const maximumFractionDigits = Math.max(
    minimumFractionDigits,
    options?.maximumFractionDigits ?? config.decimals
  );

  const formatter = new Intl.NumberFormat(
    resolveCurrencyLocale(config.code, options?.locale),
    {
      style: 'currency',
      currency: config.code,
      notation: options?.notation,
      minimumFractionDigits,
      maximumFractionDigits,
    }
  );

  return formatter.format(normalizedAmount);
}
