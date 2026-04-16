import type { MetadataRoute } from "next";
import { createDivisionSitemapEntries } from "@henryco/config";

export default function sitemap(): MetadataRoute.Sitemap {
  return createDivisionSitemapEntries("care", [
    { path: "/", changeFrequency: "weekly", priority: 1 },
    { path: "/services", changeFrequency: "weekly", priority: 0.9 },
    { path: "/pricing", changeFrequency: "weekly", priority: 0.8 },
    { path: "/about", changeFrequency: "monthly", priority: 0.7 },
    { path: "/contact", changeFrequency: "monthly", priority: 0.7 },
    { path: "/review", changeFrequency: "weekly", priority: 0.6 },
    { path: "/book", changeFrequency: "weekly", priority: 0.8 },
  ]);
}
