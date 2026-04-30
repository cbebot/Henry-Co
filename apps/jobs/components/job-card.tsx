import Link from "next/link";
import {
  ArrowUpRight,
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
  return new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short" }).format(
    new Date(value),
  );
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

export function JobCard({
  job,
  copy = DEFAULT_COPY,
}: {
  job: JobPost;
  copy?: JobsPublicCopy["card"];
}) {
  return (
    <Link href={`/jobs/${job.slug}`} className="group block">
      <article className="flex h-full flex-col rounded-[1.8rem] border border-[var(--jobs-line)] bg-[rgba(0,0,0,0.02)] p-6 transition duration-300 group-hover:-translate-y-1 group-hover:border-[var(--jobs-accent)]/45 group-hover:bg-[rgba(0,0,0,0.04)]">
        {/* Trust + role chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          {job.internal ? <StatusPill label={copy.internal} tone="good" /> : null}
          {job.employerVerification === "verified" ? (
            <StatusPill label={copy.verifiedEmployer} tone="neutral" />
          ) : null}
          {job.featured ? <StatusPill label={copy.featured} tone="warn" /> : null}
          <span className="rounded-full border border-[var(--jobs-line)] bg-transparent px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--jobs-ink)]">
            {job.categoryName}
          </span>
          {job.employerTrustScore >= 70 ? (
            <span className="rounded-full border border-[var(--jobs-success)]/30 bg-[var(--jobs-success-soft)]/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--jobs-success)]">
              {copy.highTrust}
            </span>
          ) : null}
        </div>

        {/* Title block */}
        <div className="mt-5">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--jobs-muted)]">
            {job.employerName}
            {job.employerResponseSlaHours ? (
              <>
                <span className="mx-1.5 opacity-50">·</span>
                <span className="font-medium tracking-[0.18em]">
                  ~{job.employerResponseSlaHours}h {copy.response}
                </span>
              </>
            ) : null}
          </p>
          <h3 className="mt-2 text-[1.35rem] font-semibold leading-snug tracking-[-0.015em] text-[var(--jobs-ink)] transition group-hover:text-[var(--jobs-accent)] sm:text-[1.5rem]">
            {job.title}
          </h3>
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[var(--jobs-muted)]">
            {job.summary}
          </p>
        </div>

        {/* Role facts */}
        <ul className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-[var(--jobs-line)] py-3 text-[12.5px] text-[var(--jobs-muted)]">
          <li className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-[var(--jobs-accent)]" />
            <span className="capitalize">{job.location}</span>
          </li>
          <li className="capitalize">{job.workMode}</li>
          <li>{job.employmentType}</li>
          <li>{job.seniority}</li>
          {job.team ? <li className="text-[var(--jobs-muted)]">{job.team}</li> : null}
          <li className="ml-auto inline-flex items-center gap-1.5">
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--jobs-muted)]">
              {copy.applicants}
            </span>
            <span className="font-mono text-sm font-semibold text-[var(--jobs-ink)]">
              {job.applicationCount}
            </span>
          </li>
        </ul>

        {/* Trust highlights + skills */}
        {job.trustHighlights.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {job.trustHighlights.slice(0, 3).map((item) => (
              <li
                key={item}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--jobs-line)] px-2.5 py-1 text-[10.5px] font-semibold tracking-tight text-[var(--jobs-ink)]"
              >
                <Sparkles className="h-3 w-3 text-[var(--jobs-brass)]" />
                {item}
              </li>
            ))}
          </ul>
        ) : null}

        {job.skills.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {job.skills.slice(0, 5).map((skill) => (
              <li
                key={skill}
                className="rounded-full border border-[var(--jobs-line)] px-2.5 py-1 text-[10.5px] font-medium tracking-tight text-[var(--jobs-muted)]"
              >
                {skill}
              </li>
            ))}
          </ul>
        ) : null}

        {/* Footer — compensation + posted + CTA */}
        <div className="mt-auto flex flex-col gap-3 border-t border-[var(--jobs-line)] pt-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[1.05rem] font-semibold leading-tight tracking-tight text-[var(--jobs-ink)]">
              {job.salaryLabel || copy.compensation}
            </p>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--jobs-muted)]">
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-[var(--jobs-accent)]" />
                {job.employerVerification === "verified" ? copy.verified : copy.inProgress}
              </span>
              <span className="opacity-50">·</span>
              <span className="inline-flex items-center gap-1">
                <Clock3 className="h-3 w-3" />
                {copy.posted} {postedLabel(job.postedAt)}
              </span>
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 self-start text-sm font-semibold text-[var(--jobs-accent)] underline-offset-4 group-hover:underline sm:self-end">
            {copy.viewRole}
            <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </span>
        </div>
      </article>
    </Link>
  );
}
