import type { MetadataRoute } from "next";
import { createDivisionSitemapEntries } from "@henryco/config";
import { getEmployerProfiles, getJobPosts, getJobsHomeData } from "@/lib/jobs/data";

const staticEntries = [
  { path: "/", changeFrequency: "weekly" as const, priority: 1 },
  { path: "/jobs", changeFrequency: "weekly" as const, priority: 0.95 },
  { path: "/careers", changeFrequency: "weekly" as const, priority: 0.8 },
  { path: "/hire", changeFrequency: "weekly" as const, priority: 0.8 },
  { path: "/talent", changeFrequency: "monthly" as const, priority: 0.7 },
  { path: "/trust", changeFrequency: "monthly" as const, priority: 0.7 },
  { path: "/help", changeFrequency: "monthly" as const, priority: 0.6 },
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const [jobs, employers, home] = await Promise.all([
      getJobPosts(),
      getEmployerProfiles(),
      getJobsHomeData(),
    ]);

    return createDivisionSitemapEntries("jobs", [
      ...staticEntries,
      ...home.categories.map((category) => ({
        path: `/categories/${category.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
      ...employers.map((employer) => ({
        path: `/employers/${employer.slug}`,
        lastModified: employer.updatedAt || undefined,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
      ...jobs.map((job) => ({
        path: `/jobs/${job.slug}`,
        lastModified: job.postedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ]);
  } catch {
    return createDivisionSitemapEntries("jobs", [...staticEntries]);
  }
}
