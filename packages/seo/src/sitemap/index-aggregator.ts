import {
  COMPANY,
  getDivisionConfig,
  getDivisionUrl,
  type DivisionKey,
} from "@henryco/config";

const DEFAULT_INCLUDED: DivisionKey[] = [
  "care",
  "marketplace",
  "property",
  "logistics",
  "studio",
  "jobs",
  "learn",
];

export type SitemapIndexEntry = {
  loc: string;
  lastmod?: string;
};

export type CreateMasterSitemapIndexOptions = {
  includeKeys?: DivisionKey[];
  includeHubAlias?: boolean;
  lastmod?: Date;
};

export function createMasterSitemapIndex(
  options: CreateMasterSitemapIndexOptions = {}
): SitemapIndexEntry[] {
  const include = options.includeKeys ?? DEFAULT_INCLUDED;
  const lastmod = (options.lastmod ?? new Date()).toISOString();
  const entries: SitemapIndexEntry[] = [];

  if (options.includeHubAlias !== false) {
    entries.push({
      loc: `https://${COMPANY.group.baseDomain}/sitemap-hub.xml`,
      lastmod,
    });
  }

  for (const key of include) {
    const division = getDivisionConfig(key);
    if (!division.subdomain) continue;
    entries.push({
      loc: `${getDivisionUrl(key)}/sitemap.xml`,
      lastmod,
    });
  }

  return entries;
}

export function renderSitemapIndexXml(entries: SitemapIndexEntry[]): string {
  const body = entries
    .map((entry) => {
      const lastmod = entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : "";
      return `  <sitemap><loc>${entry.loc}</loc>${lastmod}</sitemap>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>\n`;
}
