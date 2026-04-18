// ---------------------------------------------------------------------------
// @henryco/i18n  --  Country registry
// Static country data with helpers. Zero external dependencies.
// ---------------------------------------------------------------------------

export type CountryAvailability =
  | "active"
  | "limited"
  | "coming_soon"
  | "language_only"
  | "unavailable";

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
  /**
   * Honest HenryCo readiness signal.
   * This models service availability, not language support.
   */
  availability: CountryAvailability;
}

export const DEFAULT_COUNTRY = "NG";

export const COUNTRIES: readonly Country[] = [
  {
    code: "NG",
    name: "Nigeria",
    currencyCode: "NGN",
    currencySymbol: "\u20A6",
    phonePrefix: "+234",
    timezone: "Africa/Lagos",
    locale: "en-NG",
    flag: "\uD83C\uDDF3\uD83C\uDDEC",
    availability: "active",
  },
  {
    code: "BJ",
    name: "Benin Republic",
    currencyCode: "XOF",
    currencySymbol: "CFA",
    phonePrefix: "+229",
    timezone: "Africa/Porto-Novo",
    locale: "fr-BJ",
    flag: "\uD83C\uDDE7\uD83C\uDDEF",
    availability: "limited",
  },
  {
    code: "GH",
    name: "Ghana",
    currencyCode: "GHS",
    currencySymbol: "GH\u20B5",
    phonePrefix: "+233",
    timezone: "Africa/Accra",
    locale: "en-GH",
    flag: "\uD83C\uDDEC\uD83C\uDDED",
    availability: "limited",
  },
  {
    code: "TG",
    name: "Togo",
    currencyCode: "XOF",
    currencySymbol: "CFA",
    phonePrefix: "+228",
    timezone: "Africa/Lome",
    locale: "fr-TG",
    flag: "\uD83C\uDDF9\uD83C\uDDEC",
    availability: "limited",
  },
  {
    code: "CI",
    name: "C\u00F4te d\u2019Ivoire",
    currencyCode: "XOF",
    currencySymbol: "CFA",
    phonePrefix: "+225",
    timezone: "Africa/Abidjan",
    locale: "fr-CI",
    flag: "\uD83C\uDDE8\uD83C\uDDEE",
    availability: "limited",
  },
  {
    code: "SN",
    name: "Senegal",
    currencyCode: "XOF",
    currencySymbol: "CFA",
    phonePrefix: "+221",
    timezone: "Africa/Dakar",
    locale: "fr-SN",
    flag: "\uD83C\uDDF8\uD83C\uDDF3",
    availability: "limited",
  },
  {
    code: "KE",
    name: "Kenya",
    currencyCode: "KES",
    currencySymbol: "KSh",
    phonePrefix: "+254",
    timezone: "Africa/Nairobi",
    locale: "en-KE",
    flag: "\uD83C\uDDF0\uD83C\uDDEA",
    availability: "limited",
  },
  {
    code: "ZA",
    name: "South Africa",
    currencyCode: "ZAR",
    currencySymbol: "R",
    phonePrefix: "+27",
    timezone: "Africa/Johannesburg",
    locale: "en-ZA",
    flag: "\uD83C\uDDFF\uD83C\uDDE6",
    availability: "limited",
  },
  {
    code: "GB",
    name: "United Kingdom",
    currencyCode: "GBP",
    currencySymbol: "\u00A3",
    phonePrefix: "+44",
    timezone: "Europe/London",
    locale: "en-GB",
    flag: "\uD83C\uDDEC\uD83C\uDDE7",
    availability: "limited",
  },
  {
    code: "US",
    name: "United States",
    currencyCode: "USD",
    currencySymbol: "$",
    phonePrefix: "+1",
    timezone: "America/New_York",
    locale: "en-US",
    flag: "\uD83C\uDDFA\uD83C\uDDF8",
    availability: "limited",
  },
  {
    code: "CA",
    name: "Canada",
    currencyCode: "CAD",
    currencySymbol: "CA$",
    phonePrefix: "+1",
    timezone: "America/Toronto",
    locale: "en-CA",
    flag: "\uD83C\uDDE8\uD83C\uDDE6",
    availability: "limited",
  },
  {
    code: "FR",
    name: "France",
    currencyCode: "EUR",
    currencySymbol: "\u20AC",
    phonePrefix: "+33",
    timezone: "Europe/Paris",
    locale: "fr-FR",
    flag: "\uD83C\uDDEB\uD83C\uDDF7",
    availability: "limited",
  },
  {
    code: "DE",
    name: "Germany",
    currencyCode: "EUR",
    currencySymbol: "\u20AC",
    phonePrefix: "+49",
    timezone: "Europe/Berlin",
    locale: "de-DE",
    flag: "\uD83C\uDDE9\uD83C\uDDEA",
    availability: "limited",
  },
  {
    code: "IT",
    name: "Italy",
    currencyCode: "EUR",
    currencySymbol: "\u20AC",
    phonePrefix: "+39",
    timezone: "Europe/Rome",
    locale: "it-IT",
    flag: "\uD83C\uDDEE\uD83C\uDDF9",
    availability: "language_only",
  },
  {
    code: "ES",
    name: "Spain",
    currencyCode: "EUR",
    currencySymbol: "\u20AC",
    phonePrefix: "+34",
    timezone: "Europe/Madrid",
    locale: "es-ES",
    flag: "\uD83C\uDDEA\uD83C\uDDF8",
    availability: "language_only",
  },
  {
    code: "PT",
    name: "Portugal",
    currencyCode: "EUR",
    currencySymbol: "\u20AC",
    phonePrefix: "+351",
    timezone: "Europe/Lisbon",
    locale: "pt-PT",
    flag: "\uD83C\uDDF5\uD83C\uDDF9",
    availability: "language_only",
  },
  {
    code: "MA",
    name: "Morocco",
    currencyCode: "MAD",
    currencySymbol: "MAD",
    phonePrefix: "+212",
    timezone: "Africa/Casablanca",
    locale: "ar-MA",
    flag: "\uD83C\uDDF2\uD83C\uDDE6",
    availability: "language_only",
  },
  {
    code: "EG",
    name: "Egypt",
    currencyCode: "EGP",
    currencySymbol: "E\u00A3",
    phonePrefix: "+20",
    timezone: "Africa/Cairo",
    locale: "ar-EG",
    flag: "\uD83C\uDDEA\uD83C\uDDEC",
    availability: "language_only",
  },
  {
    code: "AE",
    name: "United Arab Emirates",
    currencyCode: "AED",
    currencySymbol: "AED",
    phonePrefix: "+971",
    timezone: "Asia/Dubai",
    locale: "ar-AE",
    flag: "\uD83C\uDDE6\uD83C\uDDEA",
    availability: "limited",
  },
  {
    code: "SA",
    name: "Saudi Arabia",
    currencyCode: "SAR",
    currencySymbol: "SAR",
    phonePrefix: "+966",
    timezone: "Asia/Riyadh",
    locale: "ar-SA",
    flag: "\uD83C\uDDF8\uD83C\uDDE6",
    availability: "language_only",
  },
  {
    code: "IN",
    name: "India",
    currencyCode: "INR",
    currencySymbol: "\u20B9",
    phonePrefix: "+91",
    timezone: "Asia/Kolkata",
    locale: "hi-IN",
    flag: "\uD83C\uDDEE\uD83C\uDDF3",
    availability: "language_only",
  },
  {
    code: "CN",
    name: "China",
    currencyCode: "CNY",
    currencySymbol: "\u00A5",
    phonePrefix: "+86",
    timezone: "Asia/Shanghai",
    locale: "zh-CN",
    flag: "\uD83C\uDDE8\uD83C\uDDF3",
    availability: "language_only",
  },
] as const;

/** Map for O(1) lookups by country code. */
const countryMap = new Map<string, Country>(COUNTRIES.map((country) => [country.code, country]));

/**
 * Get a single country by its ISO 3166-1 alpha-2 code.
 * Returns `undefined` when the code is not found.
 */
export function getCountry(code: string): Country | undefined {
  return countryMap.get(code.toUpperCase());
}

/**
 * Historical helper name kept for compatibility.
 * This is the customer-facing selector list, not just currently "active" markets.
 */
export function getActiveCountries(): readonly Country[] {
  return COUNTRIES;
}
