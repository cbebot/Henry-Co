import { getDivisionConfig, getDivisionUrl } from "@henryco/config";
import type { JsonLdNode } from "./base";

export type CourseOptions = {
  name: string;
  description: string;
  url: string;
  offers?: {
    price: string;
    priceCurrency: string;
    category?: "Free" | "Paid";
  };
  hasCourseInstance?: {
    courseMode: "Online" | "Blended" | "Onsite";
    courseWorkload?: string;
  };
  inLanguage?: string;
  educationalLevel?: string;
};

export function buildCourseLd(opts: CourseOptions): JsonLdNode {
  const learn = getDivisionConfig("learn");
  const learnUrl = getDivisionUrl("learn");
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: opts.name,
    description: opts.description,
    url: opts.url,
    inLanguage: opts.inLanguage ?? "en",
    educationalLevel: opts.educationalLevel,
    provider: {
      "@type": "Organization",
      "@id": `${learnUrl}#organization`,
      name: learn.name,
      sameAs: learnUrl,
    },
    offers: opts.offers
      ? {
          "@type": "Offer",
          price: opts.offers.price,
          priceCurrency: opts.offers.priceCurrency,
          category: opts.offers.category,
        }
      : undefined,
    hasCourseInstance: opts.hasCourseInstance
      ? {
          "@type": "CourseInstance",
          courseMode: opts.hasCourseInstance.courseMode,
          courseWorkload: opts.hasCourseInstance.courseWorkload,
        }
      : undefined,
  };
}
