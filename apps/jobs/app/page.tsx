import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Building2, ShieldCheck, Sparkles } from "lucide-react";
import { JobCard } from "@/components/job-card";
import { HeroLink, PublicShell } from "@/components/public-shell";
import { getJobsHomeData } from "@/lib/jobs/data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const home = await getJobsHomeData();

  return (
    <PublicShell
      primaryCta={{ label: "Browse Jobs", href: "/jobs" }}
      secondaryCta={{ label: "For Employers", href: "/employer" }}
    >
      <section className="jobs-grid border-b border-black/5 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="jobs-panel rounded-[2.4rem] p-7 sm:p-10">
            <p className="jobs-kicker">HenryCo Jobs</p>
            <h1 className="mt-4 jobs-display">Hiring, verified talent, and recruitment discipline in one calm operating system.</h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--jobs-muted)]">
              HenryCo Jobs is not a noisy listing wall. It is a premium hiring surface for serious employers, verified talent, recruiters, and internal HenryCo hiring teams.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <HeroLink href="/jobs" label="Explore live roles" />
              <HeroLink href="/talent" label="See talent trust layer" subtle />
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {home.stats.map((stat) => (
                <div key={stat.label} className="jobs-soft-panel rounded-[1.5rem] p-4">
                  <div className="jobs-kicker">{stat.label}</div>
                  <div className="mt-2 text-3xl font-semibold">{stat.value}</div>
                  <p className="mt-2 text-sm leading-6 text-[var(--jobs-muted)]">{stat.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="jobs-panel rounded-[2rem] p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-[var(--jobs-accent-soft)] p-3 text-[var(--jobs-accent)]">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Trust-heavy experience</div>
                  <div className="text-sm text-[var(--jobs-muted)]">Verification, moderation, and quality guidance are first-class product surfaces.</div>
                </div>
              </div>
            </div>
            <div className="jobs-panel rounded-[2rem] p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-[var(--jobs-brass-soft)] p-3 text-[var(--jobs-brass)]">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Employer control without clutter</div>
                  <div className="text-sm text-[var(--jobs-muted)]">Onboarding, verification, roles, applicants, and notes stay structured instead of scattered.</div>
                </div>
              </div>
            </div>
            <div className="jobs-panel rounded-[2rem] p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-[var(--jobs-success-soft)] p-3 text-[var(--jobs-success)]">
                  <BriefcaseBusiness className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Dual-mode hiring</div>
                  <div className="text-sm text-[var(--jobs-muted)]">Public employer hiring and HenryCo internal recruitment share one premium operating spine.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="jobs-kicker">Featured Roles</p>
            <h2 className="mt-3 jobs-heading">Roles that already carry stronger signal.</h2>
          </div>
          <Link href="/jobs" className="text-sm font-semibold text-[var(--jobs-accent)]">
            View all roles <ArrowRight className="ml-1 inline-block h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {home.featuredJobs.map((job) => (
            <JobCard key={job.slug} job={job} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="jobs-kicker">Differentiators</p>
          <h2 className="mt-3 jobs-heading">Product edges that actually change hiring quality.</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {home.differentiators.slice(0, 6).map((item) => (
            <div key={item.id} className="jobs-panel rounded-[2rem] p-6">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <span className="rounded-full bg-[var(--jobs-accent-soft)] px-3 py-1 text-xs font-semibold">
                  Innovation {item.innovationScore}/10
                </span>
              </div>
              <p className="mt-3 text-sm leading-7 text-[var(--jobs-muted)]">{item.summary}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="jobs-panel rounded-[2.2rem] p-8 sm:p-10">
          <div className="flex items-center gap-3 text-[var(--jobs-accent)]">
            <Sparkles className="h-5 w-5" />
            <span className="jobs-kicker">Next Steps</span>
          </div>
          <h2 className="mt-3 jobs-heading">Enter the workspace that fits your side of the market.</h2>
          <div className="mt-6 flex flex-wrap gap-3">
            <HeroLink href="/candidate" label="Candidate workspace" />
            <HeroLink href="/employer" label="Employer workspace" subtle />
            <HeroLink href="/recruiter" label="Recruiter workspace" subtle />
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
