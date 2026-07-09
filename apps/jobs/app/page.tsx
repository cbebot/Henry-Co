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
  const home = await getJobsHomeData(locale);

  return (
    // AWARE-SP1: no hardcoded chrome CTAs — the shell resolves them from the
    // viewer's standing (employer → workspace, candidate → hub, visitor →
    // browse). Overriding here would pin every role to the visitor chrome.
    <PublicShell>
      {/* Hero — an editorial search INSTRUMENT. Capability evidence over
          headline size: the live search field + real platform signals sit
          above the fold, wrapped in atmosphere on the theme-aware --home-*
          canvas with the jobs teal soul. One orchestrated staggered reveal. */}
      <section className="relative overflow-hidden border-b border-[color:var(--home-line)]">
        {/* Atmosphere — a theme-aware hairline grid fading upward + a soft
            teal aurora. Decorative only. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "linear-gradient(to right, var(--home-line-08) 1px, transparent 1px), linear-gradient(to bottom, var(--home-line-08) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black, transparent 78%)",
            WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black, transparent 78%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[-20rem] h-[34rem] w-[54rem] -translate-x-1/2 blur-3xl"
          style={{
            background:
              "radial-gradient(ellipse at center, color-mix(in srgb, var(--home-accent) 22%, transparent), transparent 70%)",
          }}
        />

        <div className="relative mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-24 lg:py-28">
          <p className="jobs-reveal jobs-kicker">{copy.home.kicker}</p>
          <h1
            className="jobs-reveal mt-5 jobs-display text-balance"
            style={{ animationDelay: "0.06s" }}
          >
            {copy.home.title}
          </h1>
          <p
            className="jobs-reveal mx-auto mt-5 max-w-2xl text-pretty text-[15px] leading-7 text-[color:var(--home-ink-70)] sm:text-base sm:leading-8"
            style={{ animationDelay: "0.12s" }}
          >
            {copy.home.subtitle}
          </p>

          {/* Search instrument — one polished bar, teal action. */}
          <form
            action="/jobs"
            method="GET"
            className="jobs-reveal mx-auto mt-9 flex w-full max-w-2xl items-stretch gap-2 rounded-[1.5rem] border border-[color:var(--home-line-12)] bg-[color:var(--home-sheet)] p-2 shadow-[0_36px_100px_-55px_rgb(var(--home-ink-rgb)/0.4)] sm:rounded-full"
            style={{ animationDelay: "0.18s" }}
          >
            <label className="sr-only" htmlFor="home-q">
              {copy.home.searchButton}
            </label>
            <span className="hidden items-center pl-3 text-[color:var(--home-ink-50)] sm:flex">
              <Search className="h-5 w-5" aria-hidden />
            </span>
            <input
              id="home-q"
              name="q"
              className="min-w-0 flex-1 bg-transparent px-3 py-3 text-base text-[color:var(--home-ink)] outline-none placeholder:text-[color:var(--home-ink-50)]"
              placeholder={copy.home.searchPlaceholder}
              autoComplete="off"
            />
            <button
              type="submit"
              className="shrink-0 rounded-[1.05rem] bg-[color:var(--home-accent)] px-6 py-3 text-sm font-semibold text-[color:var(--home-accent-ink)] outline-none transition hover:bg-[color:var(--home-accent-strong)] focus-visible:ring-2 focus-visible:ring-[color:var(--home-accent)]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--home-canvas)] active:translate-y-[0.5px] sm:rounded-full"
            >
              {copy.home.searchButton}
            </button>
          </form>

          <div
            className="jobs-reveal mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm"
            style={{ animationDelay: "0.24s" }}
          >
            <span className="text-[color:var(--home-ink-60)]">{copy.home.tryLabel}</span>
            {[
              { label: copy.browse.suggestions.remote, href: "/jobs?mode=remote" },
              { label: copy.browse.suggestions.verifiedOnly, href: "/jobs?verified=1" },
              { label: copy.browse.suggestions.fullTime, href: "/jobs?type=full-time" },
              { label: copy.browse.suggestions.lagos, href: "/jobs?loc=Lagos" },
            ].map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="rounded-full border border-[color:var(--home-line-12)] bg-[color:var(--home-surface-04)] px-3.5 py-1.5 font-semibold text-[color:var(--home-ink-70)] transition hover:border-[color:var(--home-accent)] hover:bg-[color:var(--home-surface-07)] hover:text-[color:var(--home-ink)]"
              >
                {label}
              </Link>
            ))}
          </div>

          <div
            className="jobs-reveal mt-9 flex flex-wrap justify-center gap-3"
            style={{ animationDelay: "0.3s" }}
          >
            <HeroLink href="/jobs" label={copy.home.browseAllJobs} />
            <HeroLink href="/hire" label={copy.home.hiringHowItWorks} subtle />
          </div>

          {/* Live platform signals — capability evidence, not vanity metrics. */}
          {home.stats.length > 0 ? (
            <dl
              className="jobs-reveal mx-auto mt-14 grid w-full max-w-3xl grid-cols-3 divide-x divide-[color:var(--home-line)] overflow-hidden rounded-[1.75rem] border border-[color:var(--home-line)] bg-[color:var(--home-sheet)]/70 backdrop-blur"
              style={{ animationDelay: "0.36s" }}
            >
              {home.stats.map((stat) => (
                <div key={stat.label} className="px-3 py-5 text-center sm:px-6 sm:py-7">
                  <dd className="jobs-display text-3xl leading-none text-[color:var(--home-ink)] sm:text-[2.6rem]">
                    {stat.value}
                  </dd>
                  <dt className="mt-2 text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[color:var(--home-ink-60)] sm:text-[11px]">
                    {stat.label}
                  </dt>
                </div>
              ))}
            </dl>
          ) : null}
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
              body: copy.landingWhy.browseBody,
              accent: "text-[var(--jobs-accent)]",
            },
            {
              icon: ShieldCheck,
              title: copy.home.safetyTrust,
              body: copy.landingWhy.safetyBody,
              accent: "text-[var(--jobs-accent)]",
            },
            {
              icon: Building2,
              title: copy.shell.hiring,
              body: copy.landingWhy.hiringBody,
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
            {copy.landingHow.sectionLink} <ArrowRight className="ml-1 inline-block h-4 w-4" />
          </Link>
        </div>
        <ol className="grid gap-8 md:grid-cols-3">
          {[
            {
              step: 1,
              title: copy.landingHow.lookAroundTitle,
              body: copy.landingHow.lookAroundBody,
              icon: Compass,
            },
            {
              step: 2,
              title: copy.landingHow.signInTitle,
              body: copy.landingHow.signInBody,
              icon: CircleCheck,
            },
            {
              step: 3,
              title: copy.landingHow.followTitle,
              body: copy.landingHow.followBody,
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
                  {copy.landingHow.stepLabel} {String(step).padStart(2, "0")}
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
            <p className="jobs-kicker">{copy.landingFeatured.kicker}</p>
            <h2 className="mt-3 jobs-heading max-w-xl">{copy.landingFeatured.heading}</h2>
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
              {copy.landingFeatured.differentiatorsBody}
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
          title={copy.landingClosing.title}
          body={copy.landingClosing.body}
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
