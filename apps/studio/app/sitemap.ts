import type { MetadataRoute } from "next";
import { createDivisionSitemapEntries } from "@henryco/config";
import { getStudioCatalog } from "@/lib/studio/catalog";
import { studioCaseStudySlug } from "@/lib/studio/content";

const staticEntries = [
  { path: "/", changeFrequency: "weekly" as const, priority: 1 },
  { path: "/services", changeFrequency: "weekly" as const, priority: 0.9 },
  { path: "/teams", changeFrequency: "weekly" as const, priority: 0.8 },
  { path: "/work", changeFrequency: "weekly" as const, priority: 0.8 },
  { path: "/pricing", changeFrequency: "weekly" as const, priority: 0.8 },
  { path: "/process", changeFrequency: "monthly" as const, priority: 0.7 },
  { path: "/trust", changeFrequency: "monthly" as const, priority: 0.7 },
  { path: "/faq", changeFrequency: "monthly" as const, priority: 0.6 },
  { path: "/contact", changeFrequency: "monthly" as const, priority: 0.6 },
  { path: "/pick", changeFrequency: "weekly" as const, priority: 0.7 },
  { path: "/request", changeFrequency: "weekly" as const, priority: 0.8 },
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const catalog = await getStudioCatalog();

    return createDivisionSitemapEntries("studio", [
      ...staticEntries,
      ...catalog.services.map((service) => ({
        path: `/services/${service.slug}`,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      })),
      ...catalog.teams.map((team) => ({
        path: `/teams/${team.slug}`,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
      ...catalog.caseStudies.map((caseStudy) => ({
        path: `/work/${studioCaseStudySlug(caseStudy)}`,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
    ]);
  } catch {
    return createDivisionSitemapEntries("studio", [...staticEntries]);
  }
}
