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
  AED: { code: 'AED', symbol: 'AED', decimals: 2, locale: 'ar-AE' },
  MAD: { code: 'MAD', symbol: 'MAD', decimals: 2, locale: 'ar-MA' },
  EGP: { code: 'EGP', symbol: 'E\u00A3', decimals: 2, locale: 'ar-EG' },
  SAR: { code: 'SAR', symbol: 'SAR', decimals: 2, locale: 'ar-SA' },
  INR: { code: 'INR', symbol: '\u20B9', decimals: 2, locale: 'hi-IN' },
  CNY: { code: 'CNY', symbol: '\u00A5', decimals: 2, locale: 'zh-CN' },
};

export const SYSTEM_BASE_CURRENCY = 'NGN' as const;
const DEFAULT_CURRENCY = SYSTEM_BASE_CURRENCY;

/**
 * All ISO 4217 codes the platform can format.
 */
export const SUPPORTED_CURRENCY_CODES = Object.keys(CURRENCY_MAP) as ReadonlyArray<string>;

/**
 * Return true if the currency code is known to the platform.
 */
export function isSupportedCurrency(code: string): boolean {
  return Object.prototype.hasOwnProperty.call(CURRENCY_MAP, code.toUpperCase());
}

/**
 * Look up the configuration for a given ISO 4217 currency code.
 * Falls back to NGN when the code is unknown.
 */
export function parseCurrencyConfig(code: string): CurrencyConfig {
  const upper = code.toUpperCase();
  return CURRENCY_MAP[upper] ?? CURRENCY_MAP[DEFAULT_CURRENCY];
}

/**
 * Return the number of minor units (decimal places) for a currency.
 * e.g. NGN=2 (kobo), XOF=0, USD=2 (cents)
 */
export function getCurrencyMinorUnit(currencyCode: string): number {
  return parseCurrencyConfig(currencyCode).decimals;
}

/**
 * Format a monetary amount stored in the smallest unit (kobo / cents) into a
 * human-readable string using the platform Intl.NumberFormat API.
 *
 * @param amountMinorUnits - Amount in the smallest currency unit (e.g. 150000 kobo = ₦1,500.00)
 * @param currencyCode - ISO 4217 code. Defaults to "NGN".
 * @returns Formatted string, e.g. "₦1,500.00"
 */
export function formatMoney(
  amountMinorUnits: number,
  currencyCode: string = DEFAULT_CURRENCY,
): string {
  const config = parseCurrencyConfig(currencyCode);
  const major = amountMinorUnits / Math.pow(10, config.decimals);

  const formatter = new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.code,
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  });

  return formatter.format(major);
}

/**
 * Format a min–max price range. Omit max to show "from X".
 */
export function formatMoneyRange(
  minMinorUnits: number,
  maxMinorUnits: number | null | undefined,
  currencyCode: string = DEFAULT_CURRENCY,
): string {
  const min = formatMoney(minMinorUnits, currencyCode);
  if (maxMinorUnits == null || maxMinorUnits <= minMinorUnits) return min;
  return `${min} – ${formatMoney(maxMinorUnits, currencyCode)}`;
}

/**
 * Convert a major-unit amount to minor units (e.g. 15.50 NGN → 1550 kobo).
 */
export function toMinorUnits(majorAmount: number, currencyCode: string = DEFAULT_CURRENCY): number {
  const decimals = getCurrencyMinorUnit(currencyCode);
  return Math.round(majorAmount * Math.pow(10, decimals));
}

/**
 * Convert a minor-unit amount to major units (e.g. 1550 kobo → 15.50 NGN).
 */
export function toMajorUnits(minorAmount: number, currencyCode: string = DEFAULT_CURRENCY): number {
  const decimals = getCurrencyMinorUnit(currencyCode);
  return minorAmount / Math.pow(10, decimals);
}
