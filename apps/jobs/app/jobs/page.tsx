import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, ShieldCheck, Sparkles, Timer } from "lucide-react";
import { EmptyState } from "@/components/feedback";
import { JobCard } from "@/components/job-card";
import { JobsBrowsePanel } from "@/components/jobs-browse-panel";
import { PublicShell } from "@/components/public-shell";
import { getSharedAccountSignupUrl } from "@/lib/account";
import { getJobsViewer } from "@/lib/auth";
import { getEmployerProfiles, getJobsHomeData, searchJobs } from "@/lib/jobs/data";

export const dynamic = "force-dynamic";

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

  const heroFacts = [
    {
      icon: BriefcaseBusiness,
      label: "Matching now",
      value: jobs.length,
      detail: hasQuery
        ? "Roles that fit the filters above."
        : "Everything live on the board right now.",
    },
    {
      icon: ShieldCheck,
      label: "Verified employers",
      value: verifiedEmployers,
      detail: "Teams that have passed our employer review.",
    },
    {
      icon: Sparkles,
      label: "Internal HenryCo",
      value: internalRoles,
      detail: "Openings inside HenryCo, same process as external roles.",
    },
    {
      icon: Timer,
      label: "With response time",
      value: responsiveRoles,
      detail: "Posts where the employer shared an expected reply window.",
    },
  ];

  return (
    <PublicShell primaryCta={primaryCta} secondaryCta={secondaryCta}>
      <div className="mx-auto max-w-7xl space-y-12 px-4 py-12 sm:px-6 lg:px-8">
        <section>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)] lg:items-end">
            <div>
              <p className="jobs-kicker">Find your next role</p>
              <h1 className="mt-4 jobs-display max-w-3xl text-balance">
                A calmer place to discover work that respects your time.
              </h1>
              <p className="mt-5 max-w-2xl text-pretty text-base leading-8 text-[var(--jobs-muted)]">
                Search by what you actually care about — where you work, how you work, and whether
                the employer has earned a little trust on the platform. Save roles while you think;
                apply when you are ready with one HenryCo profile.
              </p>

              <div className="mt-8">
                <JobsBrowsePanel params={params} categories={home.categories} />
              </div>

              <p className="mt-6 max-w-2xl text-sm leading-7 text-[var(--jobs-muted)]">
                Browsing is always free. We only ask you to sign in when you save a role or apply,
                so your shortlist and applications stay private and attached to the right person.
              </p>
            </div>

            <ul className="grid gap-3 text-sm">
              {heroFacts.map((card) => {
                const Icon = card.icon;
                return (
                  <li
                    key={card.label}
                    className="grid gap-2 border-b border-[var(--jobs-line)] py-4 last:border-b-0 sm:grid-cols-[auto,1fr,auto] sm:items-baseline sm:gap-4"
                  >
                    <Icon
                      className="h-3.5 w-3.5 text-[var(--jobs-accent)]"
                      aria-hidden
                    />
                    <div>
                      <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--jobs-muted)]">
                        {card.label}
                      </p>
                      <p className="mt-1 text-xs leading-6 text-[var(--jobs-muted)]">
                        {card.detail}
                      </p>
                    </div>
                    <span className="text-xl font-semibold tracking-tight text-[var(--jobs-ink)] sm:text-2xl">
                      {card.value}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,280px)_1fr] lg:gap-12">
          <aside className="space-y-12 lg:sticky lg:top-28 lg:self-start">
            <div>
              <p className="jobs-kicker text-[10.5px] uppercase tracking-[0.22em]">
                Browse by category
              </p>
              <ul className="mt-4 divide-y divide-[var(--jobs-line)] border-y border-[var(--jobs-line)]">
                {home.categories.map((cat) => (
                  <li key={cat.slug}>
                    <Link
                      href={`/categories/${cat.slug}`}
                      className="group flex items-baseline justify-between gap-3 py-3 text-sm font-medium text-[var(--jobs-ink)] transition hover:text-[var(--jobs-accent)]"
                    >
                      <span>{cat.name}</span>
                      <span className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--jobs-muted)] transition group-hover:text-[var(--jobs-accent)]">
                        {cat.count}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href="/jobs"
                className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--jobs-accent)] underline-offset-4 hover:underline"
              >
                Clear filters · all jobs
              </Link>
            </div>

            <div>
              <p className="jobs-kicker text-[10.5px] uppercase tracking-[0.22em]">Hiring now</p>
              <ul className="mt-4 divide-y divide-[var(--jobs-line)] border-y border-[var(--jobs-line)]">
                {employers
                  .filter((employer) => employer.openRoleCount > 0)
                  .slice(0, 8)
                  .map((employer) => (
                    <li key={employer.slug}>
                      <Link
                        href={`/employers/${employer.slug}`}
                        className="group flex items-baseline justify-between gap-3 py-3 text-sm font-medium text-[var(--jobs-ink)] transition hover:text-[var(--jobs-accent)]"
                      >
                        <span className="min-w-0 truncate">{employer.name}</span>
                        <span className="shrink-0 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--jobs-muted)] transition group-hover:text-[var(--jobs-accent)]">
                          {employer.openRoleCount} open
                        </span>
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          </aside>

          <section className="space-y-6">
            <div className="flex flex-col gap-3 border-b border-[var(--jobs-line)] pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="jobs-kicker text-[10.5px] uppercase tracking-[0.22em]">Results</p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight text-[var(--jobs-ink)] sm:text-2xl">
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
                  className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--jobs-accent)] underline-offset-4 hover:underline"
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
                  <Link
                    href="/jobs"
                    className="jobs-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
                  >
                    Show all open roles
                    <ArrowRight className="h-4 w-4" />
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
