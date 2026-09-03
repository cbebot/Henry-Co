import {
  JsonLd,
  buildJobPostingLd,
  type JobEmploymentType,
} from "@henryco/seo";
import { henryDomain, henryWebRoot } from "@henryco/config";

import type { JobPost } from "@/lib/jobs/types";

/**
 * V3 PASS 21 — JobPosting JSON-LD (Google for Jobs requirement, J6).
 *
 * Every /jobs/[slug] surface MUST emit this so Google indexes the role
 * with rich-result salary, location, and date metadata. The lookup
 * domain is the jobs subdomain rendered via COMPANY.divisions.jobs.
 */

const EMPLOYMENT_TYPE_MAP: Record<string, JobEmploymentType> = {
  "full-time": "FULL_TIME",
  "full_time": "FULL_TIME",
  "full time": "FULL_TIME",
  fulltime: "FULL_TIME",
  "part-time": "PART_TIME",
  "part_time": "PART_TIME",
  "part time": "PART_TIME",
  contract: "CONTRACTOR",
  contractor: "CONTRACTOR",
  temporary: "TEMPORARY",
  temp: "TEMPORARY",
  intern: "INTERN",
  internship: "INTERN",
  volunteer: "VOLUNTEER",
};

function mapEmploymentType(value: string): JobEmploymentType {
  const key = value.toLowerCase().trim();
  return EMPLOYMENT_TYPE_MAP[key] ?? "OTHER";
}

function buildJobUrl(slug: string) {
  // V3-07(S2): henryDomain() resolves via COMPANY.group.baseDomain so
  // preview/staging emit their own URLs in the JobPosting JSON-LD.
  return henryDomain("jobs", `/jobs/${slug}`);
}

function buildOrganizationUrl() {
  return henryWebRoot();
}

export type JobPostingJsonLdProps = {
  job: JobPost;
};

export function JobPostingJsonLd({ job }: JobPostingJsonLdProps) {
  // Google for Jobs requires title, description, datePosted, and
  // hiringOrganization at minimum. Salary is strongly recommended for
  // ranking; we render it whenever min OR max is present.
  const employmentType = mapEmploymentType(job.employmentType);

  const baseSalary =
    job.salaryMin || job.salaryMax
      ? {
          currency: job.currency || "NGN",
          value:
            job.salaryMin && job.salaryMax
              ? { minValue: job.salaryMin, maxValue: job.salaryMax }
              : job.salaryMax ?? job.salaryMin ?? 0,
          unitText: "YEAR" as const,
        }
      : undefined;

  const isRemote = job.workMode === "remote";

  const data = buildJobPostingLd({
    title: job.title,
    description:
      job.description ||
      job.summary ||
      // Final fallback — Google rejects JobPosting without a description.
      `${job.title} at ${job.employerName}.`,
    datePosted: job.postedAt,
    validThrough: job.closesAt ?? undefined,
    employmentType,
    hiringOrganization: {
      name: job.employerName,
      sameAs: buildOrganizationUrl(),
    },
    jobLocation: isRemote
      ? undefined
      : {
          addressLocality: job.location || "Lagos",
          addressCountry: "NG",
        },
    jobLocationType: isRemote ? "TELECOMMUTE" : undefined,
    applicantLocationRequirements: isRemote ? ["Nigeria"] : undefined,
    baseSalary,
    url: buildJobUrl(job.slug),
    identifier: { name: job.employerName, value: job.id },
  });

  return <JsonLd id={`jobs-posting-${job.id}`} data={data} />;
}
