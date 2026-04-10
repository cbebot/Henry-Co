// ---------------------------------------------------------------------------
// @henryco/i18n  --  Country registry
// Static country data with helpers. Zero external dependencies.
// ---------------------------------------------------------------------------

export interface Country {
  /** ISO 3166-1 alpha-2 code */
  code: string;
  name: string;
  currencyCode: string;
  currencySymbol: string;
  /** E.164 phone prefix including leading "+" */
  phonePrefix: string;
  /** IANA timezone identifier */
  timezone: string;
  /** BCP 47 locale tag */
  locale: string;
  /** Unicode flag emoji */
  flag: string;
}

export const DEFAULT_COUNTRY = 'NG';

export const COUNTRIES: readonly Country[] = [
  {
    code: 'NG',
    name: 'Nigeria',
    currencyCode: 'NGN',
    currencySymbol: '\u20A6',
    phonePrefix: '+234',
    timezone: 'Africa/Lagos',
    locale: 'en-NG',
    flag: '\uD83C\uDDF3\uD83C\uDDEC',
  },
  {
    code: 'BJ',
    name: 'Benin Republic',
    currencyCode: 'XOF',
    currencySymbol: 'CFA',
    phonePrefix: '+229',
    timezone: 'Africa/Porto-Novo',
    locale: 'fr-BJ',
    flag: '\uD83C\uDDE7\uD83C\uDDEF',
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    currencyCode: 'GBP',
    currencySymbol: '\u00A3',
    phonePrefix: '+44',
    timezone: 'Europe/London',
    locale: 'en-GB',
    flag: '\uD83C\uDDEC\uD83C\uDDE7',
  },
  {
    code: 'US',
    name: 'United States',
    currencyCode: 'USD',
    currencySymbol: '$',
    phonePrefix: '+1',
    timezone: 'America/New_York',
    locale: 'en-US',
    flag: '\uD83C\uDDFA\uD83C\uDDF8',
  },
  {
    code: 'GH',
    name: 'Ghana',
    currencyCode: 'GHS',
    currencySymbol: 'GH\u20B5',
    phonePrefix: '+233',
    timezone: 'Africa/Accra',
    locale: 'en-GH',
    flag: '\uD83C\uDDEC\uD83C\uDDED',
  },
  {
    code: 'KE',
    name: 'Kenya',
    currencyCode: 'KES',
    currencySymbol: 'KSh',
    phonePrefix: '+254',
    timezone: 'Africa/Nairobi',
    locale: 'en-KE',
    flag: '\uD83C\uDDF0\uD83C\uDDEA',
  },
  {
    code: 'ZA',
    name: 'South Africa',
    currencyCode: 'ZAR',
    currencySymbol: 'R',
    phonePrefix: '+27',
    timezone: 'Africa/Johannesburg',
    locale: 'en-ZA',
    flag: '\uD83C\uDDFF\uD83C\uDDE6',
  },
  {
    code: 'CA',
    name: 'Canada',
    currencyCode: 'CAD',
    currencySymbol: 'CA$',
    phonePrefix: '+1',
    timezone: 'America/Toronto',
    locale: 'en-CA',
    flag: '\uD83C\uDDE8\uD83C\uDDE6',
  },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    currencyCode: 'AED',
    currencySymbol: 'AED',
    phonePrefix: '+971',
    timezone: 'Asia/Dubai',
    locale: 'en-AE',
    flag: '\uD83C\uDDE6\uD83C\uDDEA',
  },
  {
    code: 'DE',
    name: 'Germany',
    currencyCode: 'EUR',
    currencySymbol: '\u20AC',
    phonePrefix: '+49',
    timezone: 'Europe/Berlin',
    locale: 'de-DE',
    flag: '\uD83C\uDDE9\uD83C\uDDEA',
  },
  {
    code: 'FR',
    name: 'France',
    currencyCode: 'EUR',
    currencySymbol: '\u20AC',
    phonePrefix: '+33',
    timezone: 'Europe/Paris',
    locale: 'fr-FR',
    flag: '\uD83C\uDDEB\uD83C\uDDF7',
  },
] as const;

/** Map for O(1) lookups by country code. */
const countryMap = new Map<string, Country>(
  COUNTRIES.map((c) => [c.code, c]),
);

/**
 * Get a single country by its ISO 3166-1 alpha-2 code.
 * Returns `undefined` when the code is not found.
 */
export function getCountry(code: string): Country | undefined {
  return countryMap.get(code.toUpperCase());
}

/**
 * Return all active / supported countries.
 * Currently this is the full list -- extend with an `active` flag when needed.
 */
export function getActiveCountries(): readonly Country[] {
  return COUNTRIES;
}
