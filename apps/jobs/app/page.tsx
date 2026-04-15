import type { Metadata } from "next";
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
import { JobCard } from "@/components/job-card";
import { HeroLink, PublicShell } from "@/components/public-shell";
import { createDivisionMetadata } from "@henryco/config";
import { getSharedAccountJobsUrl } from "@/lib/account";
import { getJobsHomeData } from "@/lib/jobs/data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = createDivisionMetadata("jobs", {
  path: "/",
});
const accountJobsUrl = getSharedAccountJobsUrl();

export default async function HomePage() {
  const home = await getJobsHomeData();

  return (
    <PublicShell
      primaryCta={{ label: "Browse open jobs", href: "/jobs" }}
      secondaryCta={{ label: "I’m hiring", href: "/hire" }}
    >
      <section className="jobs-grid border-b border-black/5 px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-12">
          <div className="mx-auto max-w-4xl text-center">
            <p className="jobs-kicker">HenryCo Jobs</p>
            <h1 className="mt-4 jobs-display text-balance">
              Hiring, verified talent, without the usual noise.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-[var(--jobs-muted)]">
              Whether you are hiring or looking, you get plain language, obvious next steps, and a team that checks
              employers and posts where it matters—so fewer fake listings and fewer dead-end applications.
            </p>

            <form action="/jobs" method="GET" className="mx-auto mt-10 flex max-w-xl flex-col gap-3 sm:flex-row sm:items-stretch">
              <label className="sr-only" htmlFor="home-q">
                Search jobs
              </label>
              <input
                id="home-q"
                name="q"
                className="jobs-input min-h-[3.25rem] flex-1 text-base"
                placeholder="Role, skill, or company"
                autoComplete="off"
              />
              <button
                type="submit"
                className="jobs-button-primary shrink-0 rounded-[1.15rem] px-8 py-3.5 text-sm font-semibold sm:rounded-full"
              >
                Search jobs
              </button>
            </form>

            <div className="mt-6 flex flex-wrap justify-center gap-2 text-sm">
              <span className="text-[var(--jobs-muted)]">Try:</span>
              {["Remote", "Verified employers", "Full-time", "Lagos"].map((label) => {
                const href =
                  label === "Remote"
                    ? "/jobs?mode=remote"
                    : label === "Verified employers"
                      ? "/jobs?verified=1"
                      : label === "Full-time"
                        ? "/jobs?type=full-time"
                        : "/jobs?loc=Lagos";
                return (
                  <Link
                    key={label}
                    href={href}
                    className="font-semibold text-[var(--jobs-accent)] underline-offset-4 hover:underline"
                  >
                    {label}
                  </Link>
                );
              })}
            </div>

            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <HeroLink href="/jobs" label="Browse all jobs" />
              <HeroLink href="/hire" label="I’m hiring — how it works" subtle />
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <div className="jobs-panel rounded-[2.4rem] p-7 sm:p-10">
              <p className="jobs-kicker">Two paths</p>
              <h2 className="mt-3 jobs-heading max-w-xl text-balance">Pick the one that fits today.</h2>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <Link
                  href="/jobs"
                  className="jobs-soft-panel flex items-start gap-4 rounded-[1.5rem] p-5 transition hover:border-[color-mix(in_srgb,var(--jobs-accent)_35%,transparent)]"
                >
                  <div className="rounded-2xl bg-[var(--jobs-accent-soft)] p-3 text-[var(--jobs-accent)]">
                    <Search className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">I’m looking for work</div>
                    <p className="mt-1 text-sm leading-6 text-[var(--jobs-muted)]">
                      Search and save roles with no pressure. Apply when it feels right—we show what you have already
                      sent.
                    </p>
                    <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[var(--jobs-accent)]">
                      Open job search <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
                <Link
                  href="/hire"
                  className="jobs-soft-panel flex items-start gap-4 rounded-[1.5rem] p-5 transition hover:border-[color-mix(in_srgb,var(--jobs-brass)_35%,transparent)]"
                >
                  <div className="rounded-2xl bg-[var(--jobs-brass-soft)] p-3 text-[var(--jobs-brass)]">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">I’m hiring</div>
                    <p className="mt-1 text-sm leading-6 text-[var(--jobs-muted)]">
                      Post with context, pass review, and run shortlist and interviews in one workspace tied to your
                      HenryCo account.
                    </p>
                    <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[var(--jobs-brass)]">
                      Employer walkthrough <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
              </div>
            </div>

            <div className="space-y-4">
              <div className="jobs-panel rounded-[2rem] p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-[var(--jobs-accent-soft)] p-3 text-[var(--jobs-accent)]">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">You can see who is real</div>
                    <div className="text-sm leading-6 text-[var(--jobs-muted)]">
                      Employer verification and post review cut down scam listings before they waste anyone’s week.
                    </div>
                  </div>
                </div>
              </div>
              <div className="jobs-panel rounded-[2rem] p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-[var(--jobs-brass-soft)] p-3 text-[var(--jobs-brass)]">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">One HenryCo sign-in</div>
                    <div className="text-sm leading-6 text-[var(--jobs-muted)]">
                      Same account you may use for wallet, documents, and other HenryCo services—one identity, less
                      fragmentation.
                    </div>
                  </div>
                </div>
              </div>
              <div className="jobs-panel rounded-[2rem] p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-[var(--jobs-success-soft)] p-3 text-[var(--jobs-success)]">
                    <BriefcaseBusiness className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Shortlist means something here</div>
                    <div className="text-sm leading-6 text-[var(--jobs-muted)]">
                      Saved jobs and application stages live in your candidate hub—so you are not left in a black hole
                      after you apply.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <p className="jobs-kicker">How it works</p>
          <h2 className="mt-3 jobs-heading mx-auto max-w-2xl text-balance">Three calm steps for job seekers</h2>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {[
            {
              step: "1",
              title: "Look around",
              body: "Search by title, category, place, and how you want to work. Save anything interesting—there is no clock.",
              icon: Compass,
            },
            {
              step: "2",
              title: "Sign in when you apply",
              body: "We ask for your HenryCo account so applications and saves stay private and tied to you—not a throwaway email.",
              icon: CircleCheck,
            },
            {
              step: "3",
              title: "Follow what happens next",
              body: "Shortlisted, interview, offer—stages show up in your candidate area with guidance on what to do next.",
              icon: BriefcaseBusiness,
            },
          ].map((item) => (
            <div key={item.step} className="jobs-soft-panel rounded-[1.8rem] p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--jobs-accent-soft)] text-sm font-bold text-[var(--jobs-accent)]">
                  {item.step}
                </span>
                <item.icon className="h-5 w-5 text-[var(--jobs-muted)]" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-7 text-[var(--jobs-muted)]">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="jobs-kicker">Featured roles</p>
            <h2 className="mt-3 jobs-heading max-w-xl">Roles we are highlighting right now</h2>
          </div>
          <Link href="/jobs" className="text-sm font-semibold text-[var(--jobs-accent)]">
            See everything <ArrowRight className="ml-1 inline-block h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {home.featuredJobs.map((job) => (
            <JobCard key={job.slug} job={job} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <p className="jobs-kicker">What makes this board different</p>
          <h2 className="mt-3 jobs-heading mx-auto max-w-2xl text-balance">Built for trust on both sides</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {home.differentiators.slice(0, 6).map((item) => (
            <div key={item.id} className="jobs-panel rounded-[2rem] p-6 text-left">
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--jobs-muted)]">{item.summary}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="jobs-panel rounded-[2.2rem] p-8 sm:p-10">
          <p className="jobs-kicker">Ready?</p>
          <h2 className="mt-3 jobs-heading max-w-2xl text-balance">Choose your next step—there is no wrong door.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--jobs-muted)]">
            Browse for free. Sign in when you want to save or apply. Employers start with a short walkthrough so
            expectations stay clear.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <HeroLink href="/jobs" label="Browse jobs" />
            <HeroLink href={accountJobsUrl} label="My HenryCo account" subtle />
            <HeroLink href="/candidate" label="Candidate hub" subtle />
            <HeroLink href="/hire" label="Hire with HenryCo" subtle />
            <HeroLink href="/trust" label="Safety & trust" subtle />
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
