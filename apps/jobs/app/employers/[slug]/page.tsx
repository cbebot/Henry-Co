import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BadgeCheck, Clock4, Globe2 } from "lucide-react";
import { EmptyState } from "@/components/feedback";
import { JobCard } from "@/components/job-card";
import { PublicShell } from "@/components/public-shell";
import { getEmployerProfileBySlug } from "@/lib/jobs/data";

export const dynamic = "force-dynamic";

export default async function EmployerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const record = await getEmployerProfileBySlug(slug);
  if (!record) {
    notFound();
  }

  const { employer, jobs } = record;
  const verified = employer.verificationStatus === "verified";

  return (
    <PublicShell
      primaryCta={{ label: "Browse Jobs", href: "/jobs" }}
      secondaryCta={{ label: "Trust standards", href: "/trust" }}
    >
      <div className="mx-auto max-w-7xl space-y-12 px-4 py-12 sm:px-6 lg:px-8">
        <nav className="text-sm text-[var(--jobs-muted)]">
          <Link
            href="/jobs"
            className="inline-flex items-center gap-1 font-semibold text-[var(--jobs-accent)] underline-offset-4 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            All employers
          </Link>
        </nav>

        <section>
          <div className="grid gap-10 lg:grid-cols-[1.15fr,0.85fr] lg:items-end">
            <div>
              <p className="jobs-kicker">Employer</p>
              <h1 className="mt-4 jobs-display max-w-3xl text-balance">{employer.name}</h1>
              <p className="mt-5 max-w-2xl text-pretty text-base leading-8 text-[var(--jobs-muted)]">
                {employer.description}
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-[var(--jobs-muted)]">
                <span className="text-[var(--jobs-ink)]">{employer.industry}</span>
                <span className="text-[var(--jobs-line)]">·</span>
                <span
                  className={
                    verified
                      ? "font-semibold text-[var(--jobs-accent)]"
                      : "text-[var(--jobs-muted)]"
                  }
                >
                  {verified ? "Verified employer" : "Verification pending"}
                </span>
                <span className="text-[var(--jobs-line)]">·</span>
                <span>
                  {employer.openRoleCount} open role{employer.openRoleCount === 1 ? "" : "s"}
                </span>
                {employer.responseSlaHours ? (
                  <>
                    <span className="text-[var(--jobs-line)]">·</span>
                    <span>~{employer.responseSlaHours}h typical response</span>
                  </>
                ) : null}
              </div>
            </div>
            <ul className="grid gap-3 text-sm">
              <li className="flex items-baseline gap-3 border-b border-[var(--jobs-line)] py-3">
                <BadgeCheck className="h-3.5 w-3.5 text-[var(--jobs-accent)]" aria-hidden />
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--jobs-muted)]">
                  Verification
                </span>
                <span className="ml-auto text-right text-sm font-semibold tracking-tight text-[var(--jobs-ink)]">
                  {verified ? "Verified" : "Pending review"}
                </span>
              </li>
              {employer.responseSlaHours ? (
                <li className="flex items-baseline gap-3 border-b border-[var(--jobs-line)] py-3">
                  <Clock4 className="h-3.5 w-3.5 text-[var(--jobs-accent)]" aria-hidden />
                  <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--jobs-muted)]">
                    Response time
                  </span>
                  <span className="ml-auto text-right text-sm font-semibold tracking-tight text-[var(--jobs-ink)]">
                    ~{employer.responseSlaHours} hours
                  </span>
                </li>
              ) : null}
              {employer.remotePolicy ? (
                <li className="flex items-baseline gap-3 border-b border-[var(--jobs-line)] py-3 last:border-b-0">
                  <Globe2 className="h-3.5 w-3.5 text-[var(--jobs-accent)]" aria-hidden />
                  <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--jobs-muted)]">
                    Remote policy
                  </span>
                  <span className="ml-auto text-right text-sm font-semibold capitalize tracking-tight text-[var(--jobs-ink)]">
                    {employer.remotePolicy}
                  </span>
                </li>
              ) : null}
            </ul>
          </div>
        </section>

        <section className="grid gap-12 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="flex items-baseline gap-4">
              <p className="jobs-kicker">Open roles</p>
              <span className="h-px flex-1 bg-[var(--jobs-line)]" />
            </div>
            {jobs.length > 0 ? (
              <ul className="mt-8 list-none space-y-5 p-0">
                {jobs.map((job) => (
                  <li key={job.slug}>
                    <JobCard job={job} />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-8">
                <EmptyState
                  kicker="No openings"
                  title="This employer has no live roles right now"
                  body="Check back later or browse other open positions on the board."
                  action={
                    <Link
                      href="/jobs"
                      className="jobs-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
                    >
                      Browse all jobs
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  }
                />
              </div>
            )}
          </div>
          <aside className="space-y-12 lg:sticky lg:top-28 lg:self-start">
            <div>
              <p className="jobs-kicker">Trust snapshot</p>
              <p className="mt-3 max-w-xs text-sm leading-7 text-[var(--jobs-muted)]">
                Built from profile completeness, verification status, and hiring activity.
              </p>
              <ul className="mt-5 divide-y divide-[var(--jobs-line)] border-y border-[var(--jobs-line)]">
                <li className="flex items-baseline gap-3 py-3">
                  <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--jobs-muted)]">
                    Verification
                  </span>
                  <span className="ml-auto text-right text-sm font-semibold tracking-tight text-[var(--jobs-ink)]">
                    {verified ? "Verified" : "Pending review"}
                  </span>
                </li>
                {employer.responseSlaHours ? (
                  <li className="flex items-baseline gap-3 py-3">
                    <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--jobs-muted)]">
                      Response time
                    </span>
                    <span className="ml-auto text-right text-sm font-semibold tracking-tight text-[var(--jobs-ink)]">
                      ~{employer.responseSlaHours} hours
                    </span>
                  </li>
                ) : null}
                {employer.remotePolicy ? (
                  <li className="flex items-baseline gap-3 py-3">
                    <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--jobs-muted)]">
                      Remote
                    </span>
                    <span className="ml-auto text-right text-sm font-semibold capitalize tracking-tight text-[var(--jobs-ink)]">
                      {employer.remotePolicy}
                    </span>
                  </li>
                ) : null}
              </ul>
            </div>

            {employer.culturePoints && employer.culturePoints.length > 0 ? (
              <div>
                <p className="jobs-kicker">Culture &amp; values</p>
                <ul className="mt-5 space-y-3 text-sm leading-7 text-[var(--jobs-muted)]">
                  {employer.culturePoints.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--jobs-accent)]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </aside>
        </section>
      </div>
    </PublicShell>
  );
}
