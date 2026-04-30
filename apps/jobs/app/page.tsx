import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CircleCheck,
  Compass,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import { PublicSpotlight } from "@henryco/ui/public-shell";
import { JobCard } from "@/components/job-card";
import { HeroLink, PublicShell } from "@/components/public-shell";
import { getSharedAccountJobsUrl } from "@/lib/account";
import { getJobsHomeData } from "@/lib/jobs/data";
import { getJobsPublicCopy } from "@/lib/public-copy";
import { getJobsPublicLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";
const accountJobsUrl = getSharedAccountJobsUrl();

export default async function HomePage() {
  const locale = await getJobsPublicLocale();
  const copy = getJobsPublicCopy(locale);
  const home = await getJobsHomeData();

  return (
    <PublicShell
      primaryCta={{ label: copy.shell.browseOpenJobs, href: "/jobs" }}
      secondaryCta={{ label: copy.shell.hiring, href: "/hire" }}
    >
      {/* Hero — centered editorial. Search line + quick filters + CTA row.
          No inner card tiles, no right-stack of trust panels. */}
      <section className="jobs-grid border-b border-black/5 px-4 py-10 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <p className="jobs-kicker">{copy.home.kicker}</p>
          <h1 className="mt-4 jobs-display text-balance">{copy.home.title}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-[15px] leading-7 text-[var(--jobs-muted)] sm:mt-6 sm:text-base sm:leading-8">
            {copy.home.subtitle}
          </p>

          <form
            action="/jobs"
            method="GET"
            className="mx-auto mt-7 flex max-w-xl flex-col gap-3 sm:mt-10 sm:flex-row sm:items-stretch"
          >
            <label className="sr-only" htmlFor="home-q">
              {copy.home.searchButton}
            </label>
            <input
              id="home-q"
              name="q"
              className="jobs-input min-h-[3.25rem] flex-1 text-base"
              placeholder={copy.home.searchPlaceholder}
              autoComplete="off"
            />
            <button
              type="submit"
              className="jobs-button-primary shrink-0 rounded-[1.15rem] px-8 py-3.5 text-sm font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-[var(--jobs-accent)]/55 focus-visible:ring-offset-2 active:translate-y-[0.5px] sm:rounded-full"
            >
              {copy.home.searchButton}
            </button>
          </form>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm">
            <span className="text-[var(--jobs-muted)]">{copy.home.tryLabel}</span>
            {[
              { label: copy.browse.suggestions.remote, href: "/jobs?mode=remote" },
              { label: copy.browse.suggestions.verifiedOnly, href: "/jobs?verified=1" },
              { label: copy.browse.suggestions.fullTime, href: "/jobs?type=full-time" },
              { label: copy.browse.suggestions.lagos, href: "/jobs?loc=Lagos" },
            ].map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="font-semibold text-[var(--jobs-accent)] underline-offset-4 hover:underline"
              >
                {label}
              </Link>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <HeroLink href="/jobs" label={copy.home.browseAllJobs} />
            <HeroLink href="/hire" label={copy.home.hiringHowItWorks} subtle />
          </div>
        </div>
      </section>

      {/* Why Jobs — editorial 3-col with hairline dividers, no panel-on-panel */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex items-baseline gap-4">
          <p className="jobs-kicker">{copy.shell.forTeams}</p>
          <span className="h-px flex-1 bg-black/10 dark:bg-white/10" />
        </div>
        <ul className="mt-6 grid gap-8 lg:grid-cols-3 lg:divide-x lg:divide-black/10 dark:lg:divide-white/10">
          {[
            {
              icon: Search,
              title: copy.home.browseJobs,
              body: "Search and save roles with no pressure. Apply when it feels right — we show what you have already sent.",
              accent: "text-[var(--jobs-accent)]",
            },
            {
              icon: ShieldCheck,
              title: copy.home.safetyTrust,
              body: "Employer verification and post review cut down scam listings before they waste anyone's week.",
              accent: "text-[var(--jobs-accent)]",
            },
            {
              icon: Building2,
              title: copy.shell.hiring,
              body: "Post with context, pass review, and run shortlist + interviews in one workspace tied to your HenryCo account.",
              accent: "text-[var(--jobs-brass)]",
            },
          ].map(({ icon: Icon, title, body, accent }, i) => (
            <li key={title} className={`${i > 0 ? "lg:pl-8" : ""}`}>
              <Icon className={`h-5 w-5 ${accent}`} aria-hidden />
              <h3 className="mt-4 text-base font-semibold tracking-tight">{title}</h3>
              <p className="mt-2 text-sm leading-7 text-[var(--jobs-muted)]">{body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* How it works — single horizontal numbered timeline, no card tiles */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="jobs-kicker">{copy.home.hiringHowItWorks}</p>
            <h2 className="mt-3 jobs-heading max-w-2xl text-balance">{copy.home.pathsTitle}</h2>
          </div>
          <Link
            href="/hire"
            className="text-sm font-semibold text-[var(--jobs-accent)] underline-offset-4 hover:underline"
          >
            How hiring works <ArrowRight className="ml-1 inline-block h-4 w-4" />
          </Link>
        </div>
        <ol className="grid gap-8 md:grid-cols-3">
          {[
            {
              step: 1,
              title: "Look around",
              body: "Search by title, category, place, and how you want to work. Save anything interesting — there is no clock.",
              icon: Compass,
            },
            {
              step: 2,
              title: "Sign in when you apply",
              body: "We ask for your HenryCo account so applications and saves stay private and tied to you — not a throwaway email.",
              icon: CircleCheck,
            },
            {
              step: 3,
              title: "Follow what happens next",
              body: "Shortlisted, interview, offer — stages show up in your candidate area with guidance on what to do next.",
              icon: BriefcaseBusiness,
            },
          ].map(({ step, title, body, icon: Icon }, i) => (
            <li
              key={step}
              className={`border-t border-black/10 pt-6 dark:border-white/10 ${
                i > 0 ? "md:border-l md:border-t-0 md:pl-6 md:pt-0" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--jobs-accent)]">
                  Step {String(step).padStart(2, "0")}
                </span>
                <Icon className="h-4 w-4 text-[var(--jobs-muted)]" aria-hidden />
              </div>
              <h3 className="mt-3 text-lg font-semibold tracking-tight">{title}</h3>
              <p className="mt-2 text-sm leading-7 text-[var(--jobs-muted)]">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Featured roles — real product cards, kept */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="jobs-kicker">Featured roles</p>
            <h2 className="mt-3 jobs-heading max-w-xl">Roles we are highlighting right now</h2>
          </div>
          <Link
            href="/jobs"
            className="text-sm font-semibold text-[var(--jobs-accent)] underline-offset-4 hover:underline"
          >
            {copy.home.featuredRolesLink} <ArrowRight className="ml-1 inline-block h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {home.featuredJobs.map((job) => (
            <JobCard key={job.slug} job={job} copy={copy.card} />
          ))}
        </div>
      </section>

      {/* Differentiators — divided list, no 2-up panel grid */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.85fr,1.15fr]">
          <div>
            <p className="jobs-kicker">{copy.home.differentiators}</p>
            <h2 className="mt-3 jobs-heading max-w-sm text-balance">{copy.home.ready}</h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-[var(--jobs-muted)]">
              No throwaway emails, no hidden fees, no black-hole applications — the differences add up.
            </p>
          </div>
          <ul className="divide-y divide-black/10 border-y border-black/10 dark:divide-white/10 dark:border-white/10">
            {home.differentiators.slice(0, 6).map((item) => (
              <li key={item.id} className="py-5">
                <h3 className="text-base font-semibold tracking-tight">{item.title}</h3>
                <p className="mt-1.5 max-w-2xl text-sm leading-7 text-[var(--jobs-muted)]">
                  {item.summary}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Closing band — Spotlight contrast with action links as aside */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <PublicSpotlight
          tone="contrast"
          eyebrow={copy.home.ready}
          title="Browse for free. Sign in when you want to save or apply."
          body="Employers start with a short walkthrough so expectations stay clear. Candidates keep saves, applications, and stages in one HenryCo profile."
          aside={
            <ul className="space-y-3">
              {[
                { href: "/jobs", label: copy.home.browseJobs, icon: Search },
                { href: accountJobsUrl, label: copy.home.myAccount, icon: Users },
                { href: "/candidate", label: copy.home.candidateHub, icon: BriefcaseBusiness },
                { href: "/hire", label: copy.home.hireWithHenryCo, icon: Building2 },
                { href: "/trust", label: copy.home.safetyTrust, icon: ShieldCheck },
              ].map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="group flex items-center gap-3 border-b border-white/15 pb-3 text-sm font-semibold text-white transition hover:text-white/85"
                  >
                    <Icon className="h-4 w-4 text-white/55" aria-hidden />
                    <span className="flex-1">{label}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-white/55 transition group-hover:translate-x-0.5 group-hover:text-white" />
                  </Link>
                </li>
              ))}
            </ul>
          }
        />
      </section>
    </PublicShell>
  );
}
