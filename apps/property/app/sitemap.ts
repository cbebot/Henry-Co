import type { MetadataRoute } from "next";
import { createDivisionSitemapEntries } from "@henryco/config";
import { getPropertyHomeData } from "@/lib/property/data";

const staticEntries = [
  { path: "/", changeFrequency: "weekly" as const, priority: 1 },
  { path: "/search", changeFrequency: "weekly" as const, priority: 0.9 },
  { path: "/managed", changeFrequency: "weekly" as const, priority: 0.8 },
  { path: "/trust", changeFrequency: "monthly" as const, priority: 0.7 },
  { path: "/faq", changeFrequency: "monthly" as const, priority: 0.6 },
  { path: "/submit", changeFrequency: "weekly" as const, priority: 0.7 },
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const snapshot = await getPropertyHomeData();

    return createDivisionSitemapEntries("property", [
      ...staticEntries,
      ...snapshot.areas.map((area) => ({
        path: `/area/${area.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
      ...snapshot.listings
        .filter((listing) => ["published", "approved"].includes(listing.status))
        .map((listing) => ({
          path: `/property/${listing.slug}`,
          lastModified: listing.updatedAt,
          changeFrequency: "weekly" as const,
          priority: 0.8,
        })),
    ]);
  } catch {
    return createDivisionSitemapEntries("property", [...staticEntries]);
  }
}
