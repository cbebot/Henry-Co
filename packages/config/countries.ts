export type CountryAvailability =
  | "active"
  | "limited"
  | "coming_soon"
  | "language_only"
  | "unavailable";

export type SupportedCountry = {
  code: string;
  name: string;
  currency: string;
  currencySymbol: string;
  dialCode: string;
  flag: string;
  locale: string;
  availability: CountryAvailability;
  default?: boolean;
};

/**
 * Countries HenryCo currently exposes as region preferences or target markets.
 * Availability is honest service readiness and is intentionally separate from
 * language support or locale formatting.
 */
export const SUPPORTED_COUNTRIES: SupportedCountry[] = [
  {
    code: "NG",
    name: "Nigeria",
    currency: "NGN",
    currencySymbol: "₦",
    dialCode: "+234",
    flag: "🇳🇬",
    locale: "en-NG",
    availability: "active",
    default: true,
  },
  {
    code: "BJ",
    name: "Benin Republic",
    currency: "XOF",
    currencySymbol: "CFA",
    dialCode: "+229",
    flag: "🇧🇯",
    locale: "fr-BJ",
    availability: "limited",
  },
  {
    code: "GH",
    name: "Ghana",
    currency: "GHS",
    currencySymbol: "₵",
    dialCode: "+233",
    flag: "🇬🇭",
    locale: "en-GH",
    availability: "limited",
  },
  {
    code: "TG",
    name: "Togo",
    currency: "XOF",
    currencySymbol: "CFA",
    dialCode: "+228",
    flag: "🇹🇬",
    locale: "fr-TG",
    availability: "limited",
  },
  {
    code: "CI",
    name: "Côte d’Ivoire",
    currency: "XOF",
    currencySymbol: "CFA",
    dialCode: "+225",
    flag: "🇨🇮",
    locale: "fr-CI",
    availability: "limited",
  },
  {
    code: "SN",
    name: "Senegal",
    currency: "XOF",
    currencySymbol: "CFA",
    dialCode: "+221",
    flag: "🇸🇳",
    locale: "fr-SN",
    availability: "limited",
  },
  {
    code: "KE",
    name: "Kenya",
    currency: "KES",
    currencySymbol: "KSh",
    dialCode: "+254",
    flag: "🇰🇪",
    locale: "en-KE",
    availability: "limited",
  },
  {
    code: "ZA",
    name: "South Africa",
    currency: "ZAR",
    currencySymbol: "R",
    dialCode: "+27",
    flag: "🇿🇦",
    locale: "en-ZA",
    availability: "limited",
  },
  {
    code: "GB",
    name: "United Kingdom",
    currency: "GBP",
    currencySymbol: "£",
    dialCode: "+44",
    flag: "🇬🇧",
    locale: "en-GB",
    availability: "limited",
  },
  {
    code: "US",
    name: "United States",
    currency: "USD",
    currencySymbol: "$",
    dialCode: "+1",
    flag: "🇺🇸",
    locale: "en-US",
    availability: "limited",
  },
  {
    code: "CA",
    name: "Canada",
    currency: "CAD",
    currencySymbol: "CA$",
    dialCode: "+1",
    flag: "🇨🇦",
    locale: "en-CA",
    availability: "limited",
  },
  {
    code: "FR",
    name: "France",
    currency: "EUR",
    currencySymbol: "€",
    dialCode: "+33",
    flag: "🇫🇷",
    locale: "fr-FR",
    availability: "limited",
  },
  {
    code: "DE",
    name: "Germany",
    currency: "EUR",
    currencySymbol: "€",
    dialCode: "+49",
    flag: "🇩🇪",
    locale: "de-DE",
    availability: "limited",
  },
  {
    code: "IT",
    name: "Italy",
    currency: "EUR",
    currencySymbol: "€",
    dialCode: "+39",
    flag: "🇮🇹",
    locale: "it-IT",
    availability: "language_only",
  },
  {
    code: "ES",
    name: "Spain",
    currency: "EUR",
    currencySymbol: "€",
    dialCode: "+34",
    flag: "🇪🇸",
    locale: "es-ES",
    availability: "language_only",
  },
  {
    code: "PT",
    name: "Portugal",
    currency: "EUR",
    currencySymbol: "€",
    dialCode: "+351",
    flag: "🇵🇹",
    locale: "pt-PT",
    availability: "language_only",
  },
  {
    code: "MA",
    name: "Morocco",
    currency: "MAD",
    currencySymbol: "MAD",
    dialCode: "+212",
    flag: "🇲🇦",
    locale: "ar-MA",
    availability: "language_only",
  },
  {
    code: "EG",
    name: "Egypt",
    currency: "EGP",
    currencySymbol: "E£",
    dialCode: "+20",
    flag: "🇪🇬",
    locale: "ar-EG",
    availability: "language_only",
  },
  {
    code: "AE",
    name: "United Arab Emirates",
    currency: "AED",
    currencySymbol: "AED",
    dialCode: "+971",
    flag: "🇦🇪",
    locale: "ar-AE",
    availability: "limited",
  },
  {
    code: "SA",
    name: "Saudi Arabia",
    currency: "SAR",
    currencySymbol: "SAR",
    dialCode: "+966",
    flag: "🇸🇦",
    locale: "ar-SA",
    availability: "language_only",
  },
  {
    code: "IN",
    name: "India",
    currency: "INR",
    currencySymbol: "₹",
    dialCode: "+91",
    flag: "🇮🇳",
    locale: "hi-IN",
    availability: "language_only",
  },
  {
    code: "CN",
    name: "China",
    currency: "CNY",
    currencySymbol: "¥",
    dialCode: "+86",
    flag: "🇨🇳",
    locale: "zh-CN",
    availability: "language_only",
  },
];

export const DEFAULT_COUNTRY =
  SUPPORTED_COUNTRIES.find((country) => country.default) || SUPPORTED_COUNTRIES[0];

export function findCountryByCode(code?: string | null): SupportedCountry | undefined {
  if (!code) return undefined;
  const upper = code.trim().toUpperCase();
  return SUPPORTED_COUNTRIES.find((country) => country.code === upper);
}

export function findCountryByName(name?: string | null): SupportedCountry | undefined {
  if (!name) return undefined;
  const normalized = name.trim().toLowerCase();
  return SUPPORTED_COUNTRIES.find((country) => country.name.toLowerCase() === normalized);
}

export function resolveCountry(value?: string | null): SupportedCountry {
  return findCountryByCode(value) || findCountryByName(value) || DEFAULT_COUNTRY;
}

export function formatCurrencyForCountry(
  value: number,
  countryCodeOrName?: string | null,
): string {
  const country = resolveCountry(countryCodeOrName);
  try {
    return new Intl.NumberFormat(country.locale, {
      style: "currency",
      currency: country.currency,
      maximumFractionDigits: country.currency === "XOF" ? 0 : 2,
    }).format(value);
  } catch {
    return `${country.currencySymbol} ${Math.round(value).toLocaleString()}`;
  }
}
