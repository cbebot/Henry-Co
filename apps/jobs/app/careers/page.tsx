import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { EmptyState } from "@/components/feedback";
import { PublicShell } from "@/components/public-shell";
import { getJobPosts } from "@/lib/jobs/data";
import { JobCard } from "@/components/job-card";

export const dynamic = "force-dynamic";

export default async function CareersPage() {
  const jobs = await getJobPosts({ internalOnly: true });

  return (
    <PublicShell
      primaryCta={{ label: "Open HenryCo Roles", href: "/careers" }}
      secondaryCta={{ label: "All jobs", href: "/jobs" }}
    >
      <div className="mx-auto max-w-7xl space-y-12 px-4 py-12 sm:px-6 lg:px-8">
        <section>
          <div className="grid gap-10 lg:grid-cols-[1.15fr,0.85fr] lg:items-end">
            <div>
              <p className="jobs-kicker">Careers at HenryCo</p>
              <h1 className="mt-4 jobs-display max-w-3xl text-balance">
                Join the team building HenryCo.
              </h1>
              <p className="mt-5 max-w-2xl text-pretty text-base leading-8 text-[var(--jobs-muted)]">
                Internal openings go through the same clear, structured hiring process as every role
                on the platform. Apply with your HenryCo account and track progress in your
                candidate hub.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3 text-sm">
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--jobs-muted)]">
                  {jobs.length} open
                </span>
                <span className="text-[var(--jobs-line)]">·</span>
                <Link
                  href="/trust"
                  className="font-semibold text-[var(--jobs-accent)] underline-offset-4 hover:underline"
                >
                  How HenryCo hires
                </Link>
                <span className="text-[var(--jobs-line)]">·</span>
                <Link
                  href="/help"
                  className="font-semibold text-[var(--jobs-ink)] underline-offset-4 hover:underline"
                >
                  Application FAQ
                </Link>
              </div>
            </div>
            <ul className="grid gap-3 text-sm">
              {[
                { label: "Process", value: "Same stages as external roles" },
                { label: "Communication", value: "Visible stages, no silent dropoffs" },
                { label: "Account", value: "One HenryCo profile across services" },
              ].map((item) => (
                <li
                  key={item.label}
                  className="flex items-baseline gap-3 border-b border-[var(--jobs-line)] py-3 last:border-b-0"
                >
                  <Sparkles className="h-3.5 w-3.5 text-[var(--jobs-accent)]" aria-hidden />
                  <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--jobs-muted)]">
                    {item.label}
                  </span>
                  <span className="ml-auto text-right text-sm font-semibold tracking-tight text-[var(--jobs-ink)]">
                    {item.value}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section>
          <div className="flex items-baseline gap-4">
            <p className="jobs-kicker">Open roles</p>
            <span className="h-px flex-1 bg-[var(--jobs-line)]" />
          </div>
          {jobs.length > 0 ? (
            <ul className="mt-8 grid list-none gap-5 p-0 lg:grid-cols-2 xl:grid-cols-3">
              {jobs.map((job) => (
                <li key={job.slug}>
                  <JobCard job={job} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-8">
              <EmptyState
                kicker="No openings right now"
                title="We don't have any internal roles open at the moment"
                body="Check back soon or browse external roles from verified employers on the main board."
                action={
                  <Link
                    href="/jobs"
                    className="jobs-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
                  >
                    Browse all roles
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                }
              />
            </div>
          )}
        </section>
      </div>
    </PublicShell>
  );
}
