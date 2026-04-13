export type SupportedCountry = {
  code: string;
  name: string;
  currency: string;
  currencySymbol: string;
  dialCode: string;
  flag: string;
  locale: string;
  default?: boolean;
};

/**
 * Countries HenryCo currently serves or has partial readiness for.
 * Adding a country here unlocks it across address forms, checkout,
 * dashboards, and currency formatting helpers.
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
  },
  {
    code: "GH",
    name: "Ghana",
    currency: "GHS",
    currencySymbol: "₵",
    dialCode: "+233",
    flag: "🇬🇭",
    locale: "en-GH",
  },
  {
    code: "TG",
    name: "Togo",
    currency: "XOF",
    currencySymbol: "CFA",
    dialCode: "+228",
    flag: "🇹🇬",
    locale: "fr-TG",
  },
  {
    code: "CI",
    name: "Côte d'Ivoire",
    currency: "XOF",
    currencySymbol: "CFA",
    dialCode: "+225",
    flag: "🇨🇮",
    locale: "fr-CI",
  },
  {
    code: "SN",
    name: "Senegal",
    currency: "XOF",
    currencySymbol: "CFA",
    dialCode: "+221",
    flag: "🇸🇳",
    locale: "fr-SN",
  },
  {
    code: "KE",
    name: "Kenya",
    currency: "KES",
    currencySymbol: "KSh",
    dialCode: "+254",
    flag: "🇰🇪",
    locale: "en-KE",
  },
  {
    code: "ZA",
    name: "South Africa",
    currency: "ZAR",
    currencySymbol: "R",
    dialCode: "+27",
    flag: "🇿🇦",
    locale: "en-ZA",
  },
  {
    code: "GB",
    name: "United Kingdom",
    currency: "GBP",
    currencySymbol: "£",
    dialCode: "+44",
    flag: "🇬🇧",
    locale: "en-GB",
  },
  {
    code: "US",
    name: "United States",
    currency: "USD",
    currencySymbol: "$",
    dialCode: "+1",
    flag: "🇺🇸",
    locale: "en-US",
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
  return SUPPORTED_COUNTRIES.find(
    (country) => country.name.toLowerCase() === normalized,
  );
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
