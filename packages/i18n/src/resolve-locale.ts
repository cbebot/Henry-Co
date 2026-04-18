import {
  DEFAULT_LOCALE,
  type AppLocale,
  isAppLocale,
  localeFromAcceptLanguage,
} from "./locales";

function localeFromCountry(country: string | null | undefined): AppLocale | null {
  if (!country || typeof country !== "string") return null;
  const c = country.trim().toUpperCase();

  const FR_COUNTRIES = ["FR", "BE", "CH", "LU", "MC", "SN", "CI", "ML", "NE", "BF", "TG", "BJ", "GA", "CG", "CD", "CM"];
  if (FR_COUNTRIES.includes(c)) return "fr";

  const AR_COUNTRIES = ["SA", "AE", "QA", "KW", "BH", "OM", "EG", "JO", "LB", "IQ", "SY", "LY", "TN", "DZ", "MA", "SD", "YE"];
  if (AR_COUNTRIES.includes(c)) return "ar";

  const ES_COUNTRIES = ["ES", "MX", "AR", "CO", "PE", "CL", "VE", "EC", "GT", "CU", "BO", "DO", "HN", "PY", "SV", "NI", "CR", "PA", "UY"];
  if (ES_COUNTRIES.includes(c)) return "es";

  const PT_COUNTRIES = ["PT", "BR", "AO", "MZ", "GW", "CV", "ST", "TL"];
  if (PT_COUNTRIES.includes(c)) return "pt";

  const IT_COUNTRIES = ["IT", "SM", "VA"];
  if (IT_COUNTRIES.includes(c)) return "it";

  const DE_COUNTRIES = ["DE", "AT", "LI"];
  if (DE_COUNTRIES.includes(c)) return "de";

  const ZH_COUNTRIES = ["CN", "TW", "SG", "HK", "MO"];
  if (ZH_COUNTRIES.includes(c)) return "zh";

  if (c === "IN") return "hi";

  return null;
}

/**
 * Single resolution order for the ecosystem:
 * 1. Explicit locale cookie `henryco_locale`
 * 2. Authenticated saved language (caller supplies from profile)
 * 3. Accept-Language
 * 4. Country / region hint (non-invasive, from CDN headers)
 * 5. Platform default (`en`)
 */
export function resolveLocaleOrder(input: {
  savedLanguage?: string | null;
  cookieLocale?: string | null;
  acceptLanguage?: string | null;
  country?: string | null;
}): AppLocale {
  // Use the raw base tag for validity — normalizeLocale always returns "en" for garbage
  // strings (the DEFAULT_LOCALE fallback), so isAppLocale(normalizeLocale(x)) is always
  // true for any non-empty string and cannot guard against invalid cookie/profile values.
  const cookieBase = (input.cookieLocale || "").trim().toLowerCase().split("-")[0];
  if (cookieBase && isAppLocale(cookieBase)) {
    return cookieBase;
  }

  const savedBase = (input.savedLanguage || "").trim().toLowerCase().split("-")[0];
  if (savedBase && isAppLocale(savedBase)) {
    return savedBase;
  }

  const fromAL = localeFromAcceptLanguage(input.acceptLanguage || null);
  if (fromAL) return fromAL;

  const fromCountry = localeFromCountry(input.country);
  if (fromCountry) return fromCountry;

  return DEFAULT_LOCALE;
}
