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
};

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

  return {
    title,
    description,
    metadataBase,
    alternates: canonical
      ? {
          canonical,
        }
      : undefined,
    openGraph: {
      title: openGraphTitle,
      description: openGraphDescription,
      siteName: options.siteName || division.name,
      type: options.type || "website",
      url: canonical,
      images: options.images?.length ? options.images : undefined,
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
      : undefined,
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
