import type { MetadataRoute } from "next";
import { createDivisionSitemapEntries } from "@henryco/config";
import { getPublicAcademyData } from "@/lib/learn/data";

const staticEntries = [
  { path: "/", changeFrequency: "weekly" as const, priority: 1 },
  { path: "/courses", changeFrequency: "weekly" as const, priority: 0.95 },
  { path: "/paths", changeFrequency: "weekly" as const, priority: 0.85 },
  { path: "/academy", changeFrequency: "monthly" as const, priority: 0.7 },
  { path: "/certifications", changeFrequency: "monthly" as const, priority: 0.7 },
  { path: "/help", changeFrequency: "monthly" as const, priority: 0.6 },
  { path: "/instructors", changeFrequency: "monthly" as const, priority: 0.7 },
  { path: "/teach", changeFrequency: "weekly" as const, priority: 0.7 },
  { path: "/trust", changeFrequency: "monthly" as const, priority: 0.6 },
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const academy = await getPublicAcademyData();

    return createDivisionSitemapEntries("learn", [
      ...staticEntries,
      ...academy.categories.map((category) => ({
        path: `/categories/${category.slug}`,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
      ...academy.instructors.map((instructor) => ({
        path: `/instructors/${instructor.slug}`,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
      ...academy.paths.map((path) => ({
        path: `/paths/${path.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.75,
      })),
      ...academy.courses.map((course) => ({
        path: `/courses/${course.slug}`,
        lastModified: course.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ]);
  } catch {
    return createDivisionSitemapEntries("learn", [...staticEntries]);
  }
}
