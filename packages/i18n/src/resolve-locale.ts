import {
  DEFAULT_LOCALE,
  type AppLocale,
  isAppLocale,
  localeFromAcceptLanguage,
  normalizeLocale,
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

  return null;
}

/**
 * Single resolution order for the ecosystem:
 * 1. Authenticated saved language (caller supplies from profile)
 * 2. Guest cookie `henryco_locale`
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
  const saved = input.savedLanguage?.trim();
  if (saved && isAppLocale(normalizeLocale(saved))) {
    return normalizeLocale(saved);
  }

  const cookie = input.cookieLocale?.trim();
  if (cookie && isAppLocale(normalizeLocale(cookie))) {
    return normalizeLocale(cookie);
  }

  const fromAL = localeFromAcceptLanguage(input.acceptLanguage || null);
  if (fromAL) return fromAL;

  const fromCountry = localeFromCountry(input.country);
  if (fromCountry) return fromCountry;

  return DEFAULT_LOCALE;
}
