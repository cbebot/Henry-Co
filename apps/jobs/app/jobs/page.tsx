import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, ShieldCheck, Sparkles } from "lucide-react";
import { EmptyState } from "@/components/feedback";
import { JobCard } from "@/components/job-card";
import { JobsBrowsePanel } from "@/components/jobs-browse-panel";
import { PublicShell } from "@/components/public-shell";
import { createDivisionMetadata } from "@henryco/config";
import { getSharedAccountSignupUrl } from "@/lib/account";
import { getJobsViewer } from "@/lib/auth";
import { getEmployerProfiles, getJobsHomeData, searchJobs } from "@/lib/jobs/data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = createDivisionMetadata("jobs", {
  title: "Browse jobs | HenryCo Jobs",
  description:
    "Search open roles by category, location, work mode, trust level, and hiring context on HenryCo Jobs.",
  path: "/jobs",
});

export default async function JobsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const viewer = await getJobsViewer();
  const [jobs, employers, home] = await Promise.all([
    searchJobs(params),
    getEmployerProfiles(),
    getJobsHomeData(),
  ]);
  const verifiedEmployers = employers.filter((e) => e.verificationStatus === "verified").length;
  const internalRoles = jobs.filter((job) => job.internal).length;
  const responsiveRoles = jobs.filter((job) => job.employerResponseSlaHours != null).length;
  const verifiedOnly = typeof params.verified === "string" && params.verified === "1";
  const internalOnly = typeof params.internal === "string" && params.internal === "1";
  const hasQuery =
    Boolean(typeof params.q === "string" && params.q.trim()) ||
    Boolean(typeof params.category === "string" && params.category) ||
    Boolean(typeof params.loc === "string" && params.loc.trim()) ||
    Boolean(typeof params.mode === "string" && params.mode) ||
    Boolean(typeof params.type === "string" && params.type) ||
    verifiedOnly ||
    internalOnly;

  const primaryCta = viewer.user
    ? { label: "My applications", href: "/candidate/applications" }
    : { label: "Join free to apply", href: getSharedAccountSignupUrl("/candidate/profile") };

  const secondaryCta = { label: "How hiring works", href: "/help" };

  return (
    <PublicShell primaryCta={primaryCta} secondaryCta={secondaryCta}>
      <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
        <section className="jobs-panel overflow-hidden rounded-[2.6rem]">
          <div className="grid gap-10 px-7 py-8 sm:px-9 sm:py-10 lg:grid-cols-[minmax(0,1.12fr)_minmax(280px,1fr)] lg:gap-12">
            <div>
              <p className="jobs-kicker">Find your next role</p>
              <h1 className="mt-4 jobs-heading max-w-3xl">
                A calmer place to discover work that respects your time.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--jobs-muted)]">
                Search by what you actually care about—where you work, how you work, and whether the employer has earned a
                little trust on the platform. Save roles while you think; apply when you are ready with one HenryCo
                profile.
              </p>

              <div className="mt-8">
                <JobsBrowsePanel params={params} categories={home.categories} />
              </div>

              <p className="mt-6 text-sm leading-7 text-[var(--jobs-muted)]">
                Browsing is always free. We only ask you to sign in when you save a role or apply, so your shortlist and
                applications stay private and attached to the right person.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {[
                {
                  label: "Matching now",
                  value: jobs.length,
                  detail: hasQuery
                    ? "Roles that fit the filters above."
                    : "Everything live on the board right now.",
                  icon: BriefcaseBusiness,
                },
                {
                  label: "Verified employers",
                  value: verifiedEmployers,
                  detail: "Teams that have passed our employer review.",
                  icon: ShieldCheck,
                },
                {
                  label: "Internal HenryCo",
                  value: internalRoles,
                  detail: "Openings inside HenryCo, same process as external roles.",
                  icon: Sparkles,
                },
                {
                  label: "Roles with response times",
                  value: responsiveRoles,
                  detail: "Posts where the employer shared an expected reply window.",
                  icon: ArrowRight,
                },
              ].map((card) => (
                <div key={card.label} className="rounded-[1.8rem] border border-[var(--jobs-line)] bg-[var(--jobs-paper-soft)] p-5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="jobs-kicker">{card.label}</p>
                    <card.icon className="h-4 w-4 shrink-0 text-[var(--jobs-accent)]" />
                  </div>
                  <div className="mt-3 text-3xl font-semibold tracking-tight">{card.value}</div>
                  <p className="mt-2 text-sm leading-7 text-[var(--jobs-muted)]">{card.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,280px)_1fr]">
          <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
            <div className="jobs-panel rounded-[2rem] p-5">
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--jobs-muted)]">
                Browse by category
              </h2>
              <div className="mt-4 space-y-2">
                {home.categories.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/categories/${cat.slug}`}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--jobs-paper-soft)] px-4 py-3 text-sm font-medium transition hover:bg-[var(--jobs-accent-soft)]"
                  >
                    <span>{cat.name}</span>
                    <span className="text-xs text-[var(--jobs-muted)]">{cat.count}</span>
                  </Link>
                ))}
              </div>
              <Link href="/jobs" className="mt-4 inline-flex text-xs font-semibold text-[var(--jobs-accent)]">
                Clear filters · all jobs
              </Link>
            </div>

            <div className="jobs-panel rounded-[2rem] p-5">
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--jobs-muted)]">
                Hiring now
              </h2>
              <div className="mt-4 space-y-2">
                {employers
                  .filter((employer) => employer.openRoleCount > 0)
                  .slice(0, 8)
                  .map((employer) => (
                    <Link
                      key={employer.slug}
                      href={`/employers/${employer.slug}`}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--jobs-paper-soft)] px-4 py-3 text-sm font-medium transition hover:bg-[var(--jobs-accent-soft)]"
                    >
                      <span className="min-w-0 truncate">{employer.name}</span>
                      <span className="shrink-0 text-xs text-[var(--jobs-muted)]">{employer.openRoleCount} open</span>
                    </Link>
                  ))}
              </div>
            </div>
          </aside>

          <section className="space-y-5">
            <div className="flex flex-col gap-3 rounded-[1.8rem] border border-[var(--jobs-line)] bg-[var(--jobs-paper-soft)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="jobs-kicker">Results</p>
                <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em]">
                  {jobs.length === 0
                    ? "Nothing matched yet"
                    : `${jobs.length} role${jobs.length === 1 ? "" : "s"} ${hasQuery ? "match your search" : "are live"}`}
                </h2>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[var(--jobs-muted)]">
                  <span>{verifiedOnly ? "Verified employers only" : "All employers"}</span>
                  <span className="text-[var(--jobs-line)]">·</span>
                  <span>{internalOnly ? "Internal roles only" : "Internal and external"}</span>
                </p>
              </div>
              {jobs.length > 0 ? (
                <Link
                  href="/trust"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--jobs-accent)]"
                >
                  Why trust matters <ArrowRight className="h-4 w-4" />
                </Link>
              ) : null}
            </div>

            {jobs.length === 0 ? (
              <EmptyState
                kicker="Try a small change"
                title="We couldn’t find roles with that exact mix."
                body="Widen your search, remove one filter, or try a category from the left. Verified-only and internal-only toggles are the most common reason lists go quiet."
                action={
                  <Link href="/jobs" className="jobs-button-primary rounded-full px-5 py-3 text-sm font-semibold">
                    Show all open roles
                  </Link>
                }
              />
            ) : (
              <ul className="space-y-5">
                {jobs.map((job) => (
                  <li key={job.slug}>
                    <JobCard job={job} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </PublicShell>
  );
}
