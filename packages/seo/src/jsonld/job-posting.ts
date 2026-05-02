import type { JsonLdNode } from "./base";

export type JobEmploymentType =
  | "FULL_TIME"
  | "PART_TIME"
  | "CONTRACTOR"
  | "TEMPORARY"
  | "INTERN"
  | "VOLUNTEER"
  | "PER_DIEM"
  | "OTHER";

export type JobPostingOptions = {
  title: string;
  description: string;
  datePosted: string;
  validThrough?: string;
  employmentType: JobEmploymentType | JobEmploymentType[];
  hiringOrganization: {
    name: string;
    sameAs: string;
    logo?: string;
  };
  jobLocation?: {
    addressLocality: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry: string;
  };
  jobLocationType?: "TELECOMMUTE";
  applicantLocationRequirements?: string[];
  baseSalary?: {
    currency: string;
    value: number | { minValue: number; maxValue: number };
    unitText: "HOUR" | "DAY" | "WEEK" | "MONTH" | "YEAR";
  };
  url: string;
  identifier?: { name: string; value: string };
};

export function buildJobPostingLd(opts: JobPostingOptions): JsonLdNode {
  const baseSalary = opts.baseSalary
    ? {
        "@type": "MonetaryAmount",
        currency: opts.baseSalary.currency,
        value:
          typeof opts.baseSalary.value === "number"
            ? {
                "@type": "QuantitativeValue",
                value: opts.baseSalary.value,
                unitText: opts.baseSalary.unitText,
              }
            : {
                "@type": "QuantitativeValue",
                minValue: opts.baseSalary.value.minValue,
                maxValue: opts.baseSalary.value.maxValue,
                unitText: opts.baseSalary.unitText,
              },
      }
    : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: opts.title,
    description: opts.description,
    datePosted: opts.datePosted,
    validThrough: opts.validThrough,
    employmentType: opts.employmentType,
    hiringOrganization: {
      "@type": "Organization",
      name: opts.hiringOrganization.name,
      sameAs: opts.hiringOrganization.sameAs,
      logo: opts.hiringOrganization.logo,
    },
    jobLocation: opts.jobLocation
      ? {
          "@type": "Place",
          address: {
            "@type": "PostalAddress",
            ...opts.jobLocation,
          },
        }
      : undefined,
    jobLocationType: opts.jobLocationType,
    applicantLocationRequirements: opts.applicantLocationRequirements?.map((country) => ({
      "@type": "Country",
      name: country,
    })),
    baseSalary,
    url: opts.url,
    identifier: opts.identifier
      ? {
          "@type": "PropertyValue",
          name: opts.identifier.name,
          value: opts.identifier.value,
        }
      : undefined,
  };
}
