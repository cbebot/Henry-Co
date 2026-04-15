import type { MetadataRoute } from "next";
import { createDivisionSitemapEntries } from "@henryco/config";

export default function sitemap(): MetadataRoute.Sitemap {
  return createDivisionSitemapEntries("logistics", [
    { path: "/", changeFrequency: "weekly", priority: 1 },
    { path: "/services", changeFrequency: "weekly", priority: 0.9 },
    { path: "/pricing", changeFrequency: "weekly", priority: 0.8 },
    { path: "/business", changeFrequency: "weekly", priority: 0.8 },
    { path: "/support", changeFrequency: "monthly", priority: 0.6 },
    { path: "/book", changeFrequency: "weekly", priority: 0.8 },
    { path: "/quote", changeFrequency: "weekly", priority: 0.8 },
  ]);
}
