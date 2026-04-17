import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  Clock3,
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { JobPost } from "@/lib/jobs/types";
import type { JobsPublicCopy } from "@/lib/public-copy";
import { StatusPill } from "@/components/workspace-shell";

function postedLabel(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 24) return `${Math.max(hours, 1)}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short" }).format(new Date(value));
}

const DEFAULT_COPY: JobsPublicCopy["card"] = {
  internal: "Internal",
  verifiedEmployer: "Verified employer",
  featured: "Featured",
  highTrust: "High trust",
  response: "response",
  applicants: "Applicants",
  soFar: "so far",
  compensation: "Compensation discussed in process",
  verified: "Verified employer",
  inProgress: "Verification in progress",
  posted: "Posted",
  viewRole: "View role",
};

export function JobCard({ job, copy = DEFAULT_COPY }: { job: JobPost; copy?: JobsPublicCopy["card"] }) {
  return (
    <article className="jobs-panel rounded-[2rem] p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_26px_60px_rgba(10,31,34,0.08)]">
      <div className="flex flex-wrap items-center gap-2">
        {job.internal ? <StatusPill label={copy.internal} tone="good" /> : null}
        {job.employerVerification === "verified" ? <StatusPill label={copy.verifiedEmployer} tone="neutral" /> : null}
        {job.featured ? <StatusPill label={copy.featured} tone="warn" /> : null}
        <span className="rounded-full border border-[var(--jobs-line)] bg-[var(--jobs-paper-soft)] px-3 py-1 text-xs font-semibold text-[var(--jobs-ink)]">
          {job.categoryName}
        </span>
        {job.employerTrustScore >= 70 ? (
          <span className="rounded-full bg-[var(--jobs-success-soft)] px-3 py-1 text-xs font-semibold text-[var(--jobs-success)]">
            {copy.highTrust}
          </span>
        ) : null}
        {job.employerResponseSlaHours ? (
          <span className="rounded-full bg-[var(--jobs-paper-soft)] px-3 py-1 text-xs font-semibold text-[var(--jobs-muted)]">
            ~{job.employerResponseSlaHours}h {copy.response}
          </span>
        ) : null}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_120px]">
        <div>
          <h3 className="text-[1.35rem] font-semibold tracking-[-0.03em]">{job.title}</h3>
          <p className="mt-1 text-sm text-[var(--jobs-muted)]">{job.employerName}</p>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--jobs-muted)]">{job.summary}</p>
        </div>
        <div className="flex h-full flex-col justify-between rounded-[1.5rem] bg-[var(--jobs-paper-soft)] p-4">
          <div className="rounded-2xl bg-[var(--jobs-accent-soft)] p-3 text-[var(--jobs-accent)]">
            <BriefcaseBusiness className="h-5 w-5" />
          </div>
          <div className="mt-6 text-right">
            <div className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[var(--jobs-muted)]">
              {copy.applicants}
            </div>
            <div className="mt-2 text-2xl font-semibold">{job.applicationCount}</div>
            <div className="text-xs text-[var(--jobs-muted)]">{copy.soFar}</div>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3 text-sm text-[var(--jobs-muted)]">
        <span className="inline-flex items-center gap-1.5 capitalize">
          <MapPin className="h-4 w-4 shrink-0" />
          {job.location}
        </span>
        <span className="capitalize">{job.workMode}</span>
        <span>{job.employmentType}</span>
        <span>{job.seniority}</span>
        <span>{job.team}</span>
      </div>

      {job.trustHighlights.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {job.trustHighlights.slice(0, 3).map((item) => (
            <span key={item} className="rounded-full bg-[var(--jobs-paper-soft)] px-3 py-1 text-xs font-semibold">
              <Sparkles className="mr-1 inline-block h-3.5 w-3.5" />
              {item}
            </span>
          ))}
        </div>
      ) : null}

      {job.skills.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {job.skills.slice(0, 5).map((skill) => (
            <span key={skill} className="rounded-full border border-[var(--jobs-line)] px-3 py-1 text-xs font-semibold text-[var(--jobs-muted)]">
              {skill}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-6 flex flex-col gap-4 border-t border-[var(--jobs-line)] pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold">{job.salaryLabel || copy.compensation}</p>
          <p className="text-xs text-[var(--jobs-muted)]">
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              {job.employerVerification === "verified" ? copy.verified : copy.inProgress}
            </span>
          </p>
          <p className="text-xs text-[var(--jobs-muted)]">
            <Clock3 className="mr-1 inline-block h-3.5 w-3.5" />
            {copy.posted} {postedLabel(job.postedAt)}
          </p>
        </div>
        <Link href={`/jobs/${job.slug}`} className="jobs-button-secondary inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold">
          {copy.viewRole} <ArrowRight className="ml-1 inline-block h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
