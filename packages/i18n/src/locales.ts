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
 * User-facing selectors must stay narrower until copy coverage survives
 * shared-cookie persistence across public surfaces and account surfaces.
 */
export const ALL_LOCALES = ["en", "fr", "ig", "yo", "ha", "ar", "es", "pt", "de", "it", "zh", "hi"] as const;

export type AppLocale = (typeof ALL_LOCALES)[number];

export const LOCALE_TIERS: Record<AppLocale, LocaleTier> = {
  en: "production-ready",
  fr: "production-ready",
  es: "native-ui-ready",
  pt: "native-ui-ready",
  ar: "native-ui-ready",
  de: "native-ui-ready",
  it: "native-ui-ready",
  ig: "scaffold",
  yo: "scaffold",
  ha: "scaffold",
  zh: "scaffold",
  hi: "scaffold",
};

/** Fully user-visible selector locales. */
export const PUBLIC_SELECTOR_LOCALES: readonly AppLocale[] = ["en", "fr", "es", "pt", "ar", "de", "it"];

/** Internal registry locales that remain detectable/persistable but are not yet public selector options. */
export const INTERNAL_SCAFFOLD_LOCALES: readonly AppLocale[] = ALL_LOCALES.filter(
  (locale) => !PUBLIC_SELECTOR_LOCALES.includes(locale),
);

export const RTL_LOCALES: readonly AppLocale[] = ["ar"];

export function isAppLocale(value: string | null | undefined): value is AppLocale {
  return Boolean(value && (ALL_LOCALES as readonly string[]).includes(value));
}

export function isPublicSelectorLocale(locale: AppLocale): boolean {
  return PUBLIC_SELECTOR_LOCALES.includes(locale);
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
