export const DEFAULT_LOCALE = "en";

/** Locales with professionally reviewed full UI catalogs for the hub + consent surfaces. */
export const PRIMARY_LOCALES = ["en", "fr"] as const;

/**
 * Extended locales aligned with account profile `language` options.
 * Tier A (production-ready): en, fr, es, ar, pt
 * Tier B (architecture-ready scaffold): de, zh, hi
 * Legacy Nigerian: ig, yo, ha
 */
export const ALL_LOCALES = ["en", "fr", "ig", "yo", "ha", "ar", "es", "pt", "de", "zh", "hi"] as const;

export type AppLocale = (typeof ALL_LOCALES)[number];

export const RTL_LOCALES: readonly AppLocale[] = ["ar"];

export function isAppLocale(value: string | null | undefined): value is AppLocale {
  return Boolean(value && (ALL_LOCALES as readonly string[]).includes(value));
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
  // Tier A — production-ready
  en: { en: "English", native: "English" },
  fr: { en: "French", native: "Français" },
  es: { en: "Spanish", native: "Español" },
  ar: { en: "Arabic", native: "العربية" },
  pt: { en: "Portuguese", native: "Português" },
  // Tier B — architecture-ready scaffold
  de: { en: "German", native: "Deutsch" },
  zh: { en: "Chinese", native: "中文" },
  hi: { en: "Hindi", native: "हिन्दी" },
  // Nigerian regional
  ig: { en: "Igbo", native: "Igbo" },
  yo: { en: "Yoruba", native: "Yorùbá" },
  ha: { en: "Hausa", native: "Hausa" },
};

export function isRtlLocale(locale: AppLocale): boolean {
  return RTL_LOCALES.includes(locale);
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
