import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, MapPin, ShieldCheck } from "lucide-react";
import type { JobPost } from "@/lib/jobs/types";
import { StatusPill } from "@/components/workspace-shell";

export function JobCard({ job }: { job: JobPost }) {
  return (
    <article className="jobs-panel rounded-[2rem] p-5 transition hover:-translate-y-0.5">
      <div className="flex flex-wrap items-center gap-2">
        {job.internal ? <StatusPill label="Internal" tone="good" /> : null}
        {job.employerVerification === "verified" ? <StatusPill label="Verified Employer" tone="neutral" /> : null}
        {job.featured ? <StatusPill label="Featured" tone="warn" /> : null}
      </div>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold tracking-tight">{job.title}</h3>
          <p className="mt-1 text-sm text-[var(--jobs-muted)]">{job.employerName}</p>
        </div>
        <div className="rounded-2xl bg-[var(--jobs-accent-soft)] p-3 text-[var(--jobs-accent)]">
          <BriefcaseBusiness className="h-5 w-5" />
        </div>
      </div>

      <p className="mt-4 text-sm leading-7 text-[var(--jobs-muted)]">{job.summary}</p>

      <div className="mt-4 flex flex-wrap gap-3 text-sm text-[var(--jobs-muted)]">
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="h-4 w-4" />
          {job.location}
        </span>
        <span>{job.workMode}</span>
        <span>{job.employmentType}</span>
        <span>{job.seniority}</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {job.skills.slice(0, 5).map((skill) => (
          <span key={skill} className="rounded-full bg-[var(--jobs-paper-soft)] px-3 py-1 text-xs font-semibold">
            {skill}
          </span>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold">{job.salaryLabel || "Compensation discussed in process"}</p>
          <p className="mt-1 text-xs text-[var(--jobs-muted)]">
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              {job.applicationCount} application{job.applicationCount === 1 ? "" : "s"}
            </span>
          </p>
        </div>
        <Link href={`/jobs/${job.slug}`} className="jobs-button-secondary rounded-full px-4 py-2.5 text-sm font-semibold">
          View role <ArrowRight className="ml-1 inline-block h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
