import type { MetadataRoute } from "next";
import { createDivisionSitemapEntries } from "@henryco/config";

export default function sitemap(): MetadataRoute.Sitemap {
  return createDivisionSitemapEntries("hub", [
    { path: "/", changeFrequency: "weekly", priority: 1 },
    { path: "/about", changeFrequency: "monthly", priority: 0.8 },
    { path: "/contact", changeFrequency: "monthly", priority: 0.7 },
    { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
    { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
  ]);
}
