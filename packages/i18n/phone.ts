// ---------------------------------------------------------------------------
// @henryco/i18n  --  Phone number formatting & normalisation
// Zero external dependencies.
// ---------------------------------------------------------------------------

import { getCountry, DEFAULT_COUNTRY } from "./countries";

/**
 * Get the E.164 phone prefix for a country code (e.g. "NG" -> "+234").
 * Falls back to the default country when the code is unknown.
 */
export function getPhonePrefix(countryCode: string): string {
  const country = getCountry(countryCode);
  return country?.phonePrefix ?? getCountry(DEFAULT_COUNTRY)!.phonePrefix;
}

/**
 * Strip every character that is not a digit or a leading "+".
 */
function stripNonDigits(phone: string): string {
  // Keep a leading "+" if present, then only digits.
  const hasPlus = phone.startsWith('+');
  const digits = phone.replace(/\D/g, '');
  return hasPlus ? `+${digits}` : digits;
}

/**
 * Normalise a phone number into E.164 format.
 *
 * Rules applied (using Nigeria / +234 as the example default):
 *  - Already starts with "+"  ->  strip non-digits, keep as-is.
 *  - Starts with the country dialling code without "+" (e.g. "2348012345678")
 *    ->  prefix with "+".
 *  - Starts with a leading zero (local format, e.g. "08012345678")
 *    ->  drop the zero, prefix with the country code.
 *  - Otherwise  ->  prefix with the country code.
 *
 * @param phone       Raw phone string.
 * @param countryCode ISO 3166-1 alpha-2 code. Defaults to DEFAULT_COUNTRY.
 * @returns           E.164 string, e.g. "+2348012345678".
 */
export function normalizePhone(
  phone: string,
  countryCode: string = DEFAULT_COUNTRY,
): string {
  const cleaned = stripNonDigits(phone);
  if (!cleaned || cleaned === '+') return '';

  const prefix = getPhonePrefix(countryCode);
  const prefixDigits = prefix.replace('+', '');

  // Already in international form.
  if (cleaned.startsWith('+')) {
    return cleaned;
  }

  // Starts with the country digits (e.g. "234...")
  if (cleaned.startsWith(prefixDigits)) {
    return `+${cleaned}`;
  }

  // Local format with leading zero.
  if (cleaned.startsWith('0')) {
    return `${prefix}${cleaned.slice(1)}`;
  }

  // Bare local number without leading zero.
  return `${prefix}${cleaned}`;
}

/**
 * Format a phone number for human-readable display.
 *
 * For Nigerian numbers the output shape is: +234 801 234 5678
 * Other countries follow a generic grouping pattern.
 *
 * @param phone       Raw phone string.
 * @param countryCode ISO 3166-1 alpha-2 code. Defaults to DEFAULT_COUNTRY.
 */
export function formatPhone(
  phone: string,
  countryCode: string = DEFAULT_COUNTRY,
): string {
  const e164 = normalizePhone(phone, countryCode);
  if (!e164) return '';

  const prefix = getPhonePrefix(countryCode);
  const prefixDigits = prefix.replace('+', '');

  // If the number starts with the expected prefix, format the local part.
  if (e164.startsWith(prefix)) {
    const local = e164.slice(prefix.length);
    const formatted = formatLocalDigits(local);
    return `${prefix} ${formatted}`;
  }

  // Fallback: generic grouping.
  return e164.replace(/(\+\d{1,3})(\d{3})(\d{3})(\d+)/, '$1 $2 $3 $4');
}

/**
 * Simple digit grouper for the local part of a phone number.
 * Produces groups of 3-3-4 for 10-digit numbers (common in NG, US, GH),
 * and falls back to groups of three otherwise.
 */
function formatLocalDigits(digits: string): string {
  if (digits.length === 10) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  if (digits.length === 9) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  // Generic: groups of 3.
  return digits.replace(/(\d{3})(?=\d)/g, '$1 ');
}
