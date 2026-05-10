/**
 * PASS 18C — SEO localization metadata helpers.
 *
 * Builds Next.js `Metadata.alternates.languages`, `openGraph.locale`, and
 * `openGraph.alternateLocale` so every public route announces its locale
 * variants to crawlers correctly.
 *
 * Architecture:
 *   - The HenryCo locale router uses cookie/header detection — there is no
 *     `[locale]` URL segment. So hreflang variants point to the SAME absolute
 *     URL (the locale is selected by cookie/header at render time). This is
 *     a valid SEO pattern when paired with `Vary: Accept-Language` on the
 *     response, which Next.js sets automatically when middleware varies on
 *     locale headers.
 *   - For Bing/Google specifically, we still emit hreflang entries pointing
 *     at the same canonical URL — Google reads our `Vary` + Set-Cookie and
 *     accepts a single URL per language as long as content actually varies.
 *   - `openGraph.locale` follows BCP-47 with underscores (`en_US`, `fr_FR`,
 *     etc.) per OpenGraph spec.
 *
 * Usage in a Next.js metadata function:
 *
 *   import { buildLocaleSeoMetadata } from "@henryco/i18n/server";
 *
 *   export async function generateMetadata(): Promise<Metadata> {
 *     const locale = await getAppLocale();
 *     const seo = buildLocaleSeoMetadata({
 *       locale,
 *       canonicalUrl: "https://hub.henrycogroup.com/",
 *     });
 *     return {
 *       title: ...,
 *       description: ...,
 *       alternates: { canonical: seo.canonical, languages: seo.languages },
 *       openGraph: { locale: seo.openGraphLocale, alternateLocale: seo.openGraphAlternateLocale, ... },
 *     };
 *   }
 */

import { PUBLIC_SELECTOR_LOCALES, type AppLocale } from "./locales";

/** Map AppLocale → OpenGraph BCP-47 locale (underscored). */
const OPEN_GRAPH_LOCALE: Record<AppLocale, string> = {
  en: "en_US",
  fr: "fr_FR",
  es: "es_ES",
  pt: "pt_PT",
  ar: "ar_EG",
  de: "de_DE",
  it: "it_IT",
  zh: "zh_CN",
  hi: "hi_IN",
  ig: "ig_NG",
  yo: "yo_NG",
  ha: "ha_NG",
};

/** Map AppLocale → hreflang code (BCP-47 hyphenated). */
const HREFLANG_CODE: Record<AppLocale, string> = {
  en: "en",
  fr: "fr",
  es: "es",
  pt: "pt",
  ar: "ar",
  de: "de",
  it: "it",
  zh: "zh",
  hi: "hi",
  ig: "ig",
  yo: "yo",
  ha: "ha",
};

export type LocaleSeoInput = {
  /** Active locale resolved for the current request. */
  locale: AppLocale;
  /**
   * Canonical absolute URL for the current page. Hreflang entries all point
   * at this same URL because content is locale-detected at render time, not
   * URL-segmented.
   */
  canonicalUrl: string;
  /**
   * If true, emit hreflang entries for the full PUBLIC_SELECTOR_LOCALES set.
   * Defaults to true. Pass false to limit to just the active locale (used by
   * pages that don't have meaningful localized variants yet).
   */
  emitAlternates?: boolean;
};

export type LocaleSeoMetadata = {
  /** Canonical URL — pass through to `alternates.canonical`. */
  canonical: string;
  /**
   * `alternates.languages` map — Next.js Metadata expects
   * `Record<string, string>` keyed by hreflang code. Always includes
   * `"x-default"` pointing at the same canonical URL.
   */
  languages: Record<string, string>;
  /** OpenGraph `locale` — for the active locale. */
  openGraphLocale: string;
  /** OpenGraph `alternateLocale` — every other public-selector locale. */
  openGraphAlternateLocale: string[];
  /**
   * Raw `<link rel="alternate" hreflang>` entries for callers that want to
   * emit them manually instead of via Next.js Metadata API.
   */
  hreflangLinks: Array<{ hreflang: string; href: string }>;
};

export function buildLocaleSeoMetadata(input: LocaleSeoInput): LocaleSeoMetadata {
  const emit = input.emitAlternates !== false;
  const canonical = input.canonicalUrl;
  const targets: AppLocale[] = emit
    ? Array.from(new Set<AppLocale>([input.locale, ...PUBLIC_SELECTOR_LOCALES]))
    : [input.locale];

  const languages: Record<string, string> = {};
  const hreflangLinks: Array<{ hreflang: string; href: string }> = [];
  for (const loc of targets) {
    const code = HREFLANG_CODE[loc];
    languages[code] = canonical;
    hreflangLinks.push({ hreflang: code, href: canonical });
  }
  // x-default fallback — required by Google for multi-language sites that
  // negotiate locale on the same URL.
  languages["x-default"] = canonical;
  hreflangLinks.push({ hreflang: "x-default", href: canonical });

  const openGraphLocale = OPEN_GRAPH_LOCALE[input.locale] || OPEN_GRAPH_LOCALE.en;
  const openGraphAlternateLocale = (emit ? PUBLIC_SELECTOR_LOCALES : [])
    .filter((l) => l !== input.locale)
    .map((l) => OPEN_GRAPH_LOCALE[l] || OPEN_GRAPH_LOCALE.en);

  return {
    canonical,
    languages,
    openGraphLocale,
    openGraphAlternateLocale,
    hreflangLinks,
  };
}

/**
 * Convenience for routes that build their own metadata but only need the
 * `<html lang>` value. Returns the BCP-47 hyphenated lang (e.g. "fr-FR").
 */
export function getHtmlLangAttribute(locale: AppLocale): string {
  const og = OPEN_GRAPH_LOCALE[locale] || OPEN_GRAPH_LOCALE.en;
  return og.replace("_", "-");
}
