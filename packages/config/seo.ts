import {
  COMPANY,
  getDivisionConfig,
  getDivisionUrl,
  type DivisionConfig,
  type DivisionKey,
} from "./company";

export type HenryCoSitemapFrequency =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never";

export type HenryCoSitemapEntry = {
  path: string;
  lastModified?: Date | string;
  changeFrequency?: HenryCoSitemapFrequency;
  priority?: number;
};

type HenryCoSocialImage = {
  url: string;
  alt?: string;
};

type HenryCoDivisionMetadataOptions = {
  title?: string;
  description?: string | null;
  openGraphTitle?: string;
  openGraphDescription?: string | null;
  siteName?: string;
  path?: string;
  type?: "website" | "article";
  images?: HenryCoSocialImage[];
  icon?: string | null;
  noIndex?: boolean;
  /**
   * PASS 18C — active locale for the request. When provided, emits
   * `alternates.languages` (hreflang) for every public-selector locale and
   * `openGraph.locale` / `openGraph.alternateLocale` so crawlers can
   * discover the localized variants of the page. The HenryCo locale router
   * resolves locale via cookie/header, so all language alternates point at
   * the same canonical URL — Google treats this as valid when paired with
   * `Vary: Accept-Language` (Next.js sets this automatically when middleware
   * varies on locale headers).
   */
  locale?: string | null;
};

/**
 * Public-selector locales mirror `@henryco/i18n.PUBLIC_SELECTOR_LOCALES`.
 * Inlined here so packages/config stays free of an i18n dependency.
 */
const SEO_PUBLIC_LOCALES = ["en", "fr", "es", "pt", "ar", "de", "it"] as const;
type SeoPublicLocale = (typeof SEO_PUBLIC_LOCALES)[number];

/** Map locale code → OpenGraph BCP-47 (underscored) per OG spec. */
const SEO_OPEN_GRAPH_LOCALE: Record<string, string> = {
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

function normalizeSeoLocale(value?: string | null): SeoPublicLocale {
  const trimmed = String(value || "").trim().toLowerCase();
  const base = trimmed.split("-")[0];
  return (SEO_PUBLIC_LOCALES as readonly string[]).includes(base)
    ? (base as SeoPublicLocale)
    : "en";
}

function buildLocaleAlternates(canonicalUrl: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const code of SEO_PUBLIC_LOCALES) {
    out[code] = canonicalUrl;
  }
  out["x-default"] = canonicalUrl;
  return out;
}

type DivisionSeoConfig = Pick<DivisionConfig, "name" | "tagline" | "description">;

function normalizePath(path = "/") {
  if (!path) return "/";
  return path.startsWith("/") ? path : `/${path}`;
}

function cleanUrlCandidate(value?: string | URL | null) {
  if (!value) return "";
  if (value instanceof URL) return value.toString();
  return String(value).trim();
}

function trimDescription(value: string, maxLength = 160) {
  if (value.length <= maxLength) return value;
  const truncated = value.slice(0, maxLength - 1);
  const pivot = truncated.lastIndexOf(" ");
  return `${(pivot > 80 ? truncated.slice(0, pivot) : truncated).trimEnd()}...`;
}

export function createMetadataBase(
  value?: string | URL | null,
  fallback?: string | URL | null
): URL | undefined {
  const candidate = cleanUrlCandidate(value);
  if (candidate) {
    try {
      return new URL(candidate);
    } catch {
      const normalized = candidate.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
      if (normalized) {
        try {
          return new URL(`https://${normalized}`);
        } catch {
          /* ignore invalid candidate */
        }
      }
    }
  }

  const fallbackCandidate = cleanUrlCandidate(fallback);
  if (!fallbackCandidate) return undefined;

  try {
    return new URL(fallbackCandidate);
  } catch {
    const normalized = fallbackCandidate.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
    return normalized ? new URL(`https://${normalized}`) : undefined;
  }
}

export function getAbsoluteDivisionUrl(key: DivisionKey, path = "/") {
  return new URL(normalizePath(path), getDivisionUrl(key)).toString();
}

export function getAbsoluteHubUrl(path = "/") {
  return new URL(normalizePath(path), `https://${COMPANY.group.baseDomain}`).toString();
}

export function toSeoPlainText(value?: string | null) {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export function toSeoDescription(
  primary?: string | null,
  fallback?: string | null,
  maxLength = 160
) {
  const source = toSeoPlainText(primary) || toSeoPlainText(fallback);
  return source ? trimDescription(source, maxLength) : undefined;
}

export function createDivisionMetadata(
  key: DivisionKey,
  options: HenryCoDivisionMetadataOptions = {}
) {
  const division = getDivisionConfig(key) as unknown as DivisionSeoConfig;
  const description = toSeoDescription(options.description, division.description);
  const openGraphDescription = toSeoDescription(
    options.openGraphDescription,
    options.description || division.tagline || division.description
  );
  const title = options.title || division.name;
  const openGraphTitle = options.openGraphTitle || title;
  const metadataBase = createMetadataBase(getDivisionUrl(key));
  const canonical = options.path ? getAbsoluteDivisionUrl(key, options.path) : undefined;
  const icon = options.icon?.trim() || undefined;

  // PASS 18C — locale SEO. If a locale is supplied AND we have a canonical
  // URL, emit hreflang `alternates.languages` for every public-selector
  // locale plus `x-default`, and the OpenGraph locale + alternateLocale set.
  const activeLocale = normalizeSeoLocale(options.locale);
  const includeLocaleAlternates = Boolean(options.locale && canonical);
  const languagesMap = includeLocaleAlternates
    ? buildLocaleAlternates(canonical!)
    : undefined;
  const openGraphLocaleValue = options.locale
    ? SEO_OPEN_GRAPH_LOCALE[activeLocale] || SEO_OPEN_GRAPH_LOCALE.en
    : undefined;
  const openGraphAlternateLocaleValue = includeLocaleAlternates
    ? SEO_PUBLIC_LOCALES
        .filter((l) => l !== activeLocale)
        .map((l) => SEO_OPEN_GRAPH_LOCALE[l] || SEO_OPEN_GRAPH_LOCALE.en)
    : undefined;

  return {
    title,
    description,
    metadataBase,
    alternates: canonical
      ? {
          canonical,
          ...(languagesMap ? { languages: languagesMap } : {}),
        }
      : undefined,
    openGraph: {
      title: openGraphTitle,
      description: openGraphDescription,
      siteName: options.siteName || division.name,
      type: options.type || "website",
      url: canonical,
      images: options.images?.length ? options.images : undefined,
      ...(openGraphLocaleValue ? { locale: openGraphLocaleValue } : {}),
      ...(openGraphAlternateLocaleValue ? { alternateLocale: openGraphAlternateLocaleValue } : {}),
    },
    twitter: {
      card: options.images?.length ? "summary_large_image" : "summary",
      title: openGraphTitle,
      description: openGraphDescription,
      images: options.images?.map((image) => image.url),
    },
    icons: icon
      ? {
          icon: [{ url: icon }],
          shortcut: [{ url: icon }],
          apple: [{ url: icon }],
        }
      : {
          // iOS Safari Add-to-Home-Screen does not read PNG entries from the
          // web app manifest, so the apple-touch-icon link must be present in
          // the document head. Each app serves a 180x180 PNG generated from
          // the canonical monogram via `pnpm brand:icons` into its own
          // public/brand/ directory.
          apple: [
            {
              url: "/brand/apple-touch-icon.png",
              sizes: "180x180",
              type: "image/png",
            },
          ],
        },
    robots: options.noIndex
      ? {
          index: false,
          follow: false,
        }
      : undefined,
  };
}

export function createPublicRobots(key: DivisionKey, disallow: string[] = []) {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: Array.from(new Set(disallow.map((item) => normalizePath(item)))),
      },
    ],
    sitemap: getAbsoluteDivisionUrl(key, "/sitemap.xml"),
    host: createMetadataBase(getDivisionUrl(key))?.origin,
  };
}

export function createDivisionSitemapEntries(
  key: DivisionKey,
  entries: Array<string | HenryCoSitemapEntry>
) {
  return entries.map((entry) => {
    const normalized =
      typeof entry === "string"
        ? ({ path: entry } satisfies HenryCoSitemapEntry)
        : entry;

    return {
      url: getAbsoluteDivisionUrl(key, normalized.path),
      lastModified: normalized.lastModified,
      changeFrequency: normalized.changeFrequency,
      priority: normalized.priority,
    };
  });
}
