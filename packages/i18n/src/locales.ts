export const DEFAULT_LOCALE = "en";

export type LocaleTier =
  | "production-ready"
  | "native-ui-ready"
  | "scaffold";

/** Locales with professionally reviewed broad UI coverage across the core public surfaces. */
export const PRIMARY_LOCALES = ["en", "fr"] as const;

/**
 * Extended locale registry aligned with persisted language preferences.
 *
 * `ALL_LOCALES` is the full architecture/registry list.
 *
 * As of the i18n FINAL COMPLETION pass (Wave A2), the public selector
 * exposes ALL 12 registered locales. The previous tiered split between
 * `PUBLIC_SELECTOR_LOCALES` and `INTERNAL_SCAFFOLD_LOCALES` dissolves:
 * every locale meets the same quality bar (translation coverage is filled
 * by Wave B). The `INTERNAL_SCAFFOLD_LOCALES` export is retained as an
 * empty array for backward compatibility with any caller still importing
 * the symbol.
 */
export const ALL_LOCALES = ["en", "fr", "ig", "yo", "ha", "ar", "es", "pt", "de", "it", "zh", "hi"] as const;

export type AppLocale = (typeof ALL_LOCALES)[number];

/**
 * Locale tiering metadata. Now that the scaffold concept has dissolved,
 * every registered locale is treated as production-ready for selector
 * purposes; the type definition is preserved for any diagnostic script
 * that still walks the tier values.
 */
export const LOCALE_TIERS: Record<AppLocale, LocaleTier> = {
  en: "production-ready",
  fr: "production-ready",
  es: "production-ready",
  pt: "production-ready",
  ar: "production-ready",
  de: "production-ready",
  it: "production-ready",
  ig: "production-ready",
  yo: "production-ready",
  ha: "production-ready",
  zh: "production-ready",
  hi: "production-ready",
};

/**
 * Fully user-visible selector locales.
 *
 * Post Wave A2: equal to `ALL_LOCALES`. All 12 locales are exposed.
 */
export const PUBLIC_SELECTOR_LOCALES: readonly AppLocale[] = [...ALL_LOCALES];

/**
 * Internal scaffold locales — kept as an empty array for backward
 * compatibility (Wave A2 promoted every scaffold locale into the public
 * selector). Callers should treat presence in this list as "explicitly
 * hidden from selectors", which no locale now is.
 */
export const INTERNAL_SCAFFOLD_LOCALES: readonly AppLocale[] = [];

export const RTL_LOCALES: readonly AppLocale[] = ["ar"];

export function isAppLocale(value: string | null | undefined): value is AppLocale {
  return Boolean(value && (ALL_LOCALES as readonly string[]).includes(value));
}

export function isPublicSelectorLocale(locale: AppLocale): boolean {
  return PUBLIC_SELECTOR_LOCALES.includes(locale);
}

export function isScaffoldLocale(locale: AppLocale): boolean {
  return INTERNAL_SCAFFOLD_LOCALES.includes(locale);
}

/**
 * Public-facing selectors should expose the final public locale policy while
 * still preserving any already-saved scaffold locale as an explicit option.
 */
export function getUserSelectableLocales(
  ...preservedLocales: Array<AppLocale | null | undefined>
): AppLocale[] {
  const extras = preservedLocales.filter(
    (locale): locale is AppLocale =>
      Boolean(locale && isAppLocale(locale) && isScaffoldLocale(locale)),
  );

  return Array.from(new Set<AppLocale>([...PUBLIC_SELECTOR_LOCALES, ...extras]));
}

export function normalizeLocale(value: string | null | undefined): AppLocale {
  const trimmed = String(value || "").trim().toLowerCase();
  const base = trimmed.split("-")[0] || "";
  if (isAppLocale(base)) return base;
  return DEFAULT_LOCALE;
}

export const LOCALE_LABELS: Record<
  AppLocale,
  { en: string; native: string }
> = {
  // Production-ready
  en: { en: "English", native: "English" },
  fr: { en: "French", native: "Français" },
  // Native UI ready
  de: { en: "German", native: "Deutsch" },
  it: { en: "Italian", native: "Italiano" },
  // Scaffold / internal
  es: { en: "Spanish", native: "Español" },
  ar: { en: "Arabic", native: "العربية" },
  pt: { en: "Portuguese", native: "Português" },
  zh: { en: "Chinese", native: "中文" },
  hi: { en: "Hindi", native: "हिन्दी" },
  ig: { en: "Igbo", native: "Igbo" },
  yo: { en: "Yoruba", native: "Yorùbá" },
  ha: { en: "Hausa", native: "Hausa" },
};

export function isRtlLocale(locale: AppLocale): boolean {
  return RTL_LOCALES.includes(locale);
}

export function getLocaleDisplayLabel(locale: AppLocale): string {
  const labels = LOCALE_LABELS[locale];
  return `${labels.native} (${labels.en})`;
}

export const LOCALE_COOKIE = "henryco_locale";

/** Parse Accept-Language; returns best matching AppLocale or null. */
export function localeFromAcceptLanguage(header: string | null | undefined): AppLocale | null {
  if (!header || typeof header !== "string") return null;

  const candidates = header
    .split(",")
    .map((part) => {
      const [tag, qPart] = part.trim().split(";q=");
      const q = qPart ? Number.parseFloat(qPart) : 1;
      return { tag: tag.trim().toLowerCase(), q: Number.isFinite(q) ? q : 1 };
    })
    .filter((item) => Boolean(item.tag))
    .sort((a, b) => b.q - a.q);

  for (const { tag } of candidates) {
    const base = tag.split("-")[0];
    if (isAppLocale(base)) return base;
  }

  return null;
}
