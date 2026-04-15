import type { MetadataRoute } from "next";
import { createDivisionSitemapEntries } from "@henryco/config";
import { getMarketplaceHomeData } from "@/lib/marketplace/data";

const staticEntries = [
  { path: "/", changeFrequency: "weekly" as const, priority: 1 },
  { path: "/search", changeFrequency: "weekly" as const, priority: 0.9 },
  { path: "/deals", changeFrequency: "weekly" as const, priority: 0.8 },
  { path: "/sell", changeFrequency: "weekly" as const, priority: 0.8 },
  { path: "/sell/pricing", changeFrequency: "weekly" as const, priority: 0.7 },
  { path: "/trust", changeFrequency: "monthly" as const, priority: 0.7 },
  { path: "/help", changeFrequency: "monthly" as const, priority: 0.6 },
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const snapshot = await getMarketplaceHomeData();

    return createDivisionSitemapEntries("marketplace", [
      ...staticEntries,
      ...snapshot.categories.map((category) => ({
        path: `/category/${category.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
      ...snapshot.brands.map((brand) => ({
        path: `/brand/${brand.slug}`,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
      ...snapshot.collections.map((collection) => ({
        path: `/collections/${collection.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
      ...snapshot.vendors.map((vendor) => ({
        path: `/store/${vendor.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
      ...snapshot.products.map((product) => ({
        path: `/product/${product.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ]);
  } catch {
    return createDivisionSitemapEntries("marketplace", [...staticEntries]);
  }
}
