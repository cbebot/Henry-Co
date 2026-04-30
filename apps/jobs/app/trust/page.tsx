import Link from "next/link";
import { ArrowRight, BadgeCheck, ShieldCheck, Sparkles, UserCheck } from "lucide-react";
import { PublicShell } from "@/components/public-shell";
import { getJobsHomeData } from "@/lib/jobs/data";

export const dynamic = "force-dynamic";

export default async function TrustPage() {
  const home = await getJobsHomeData();

  const pillars = [
    {
      icon: ShieldCheck,
      title: "Employer verification",
      body: "Before we call an employer verified, we look at who they are, how they show up publicly, and whether their story matches the roles they post. Pending does not always mean “bad” — it can simply mean “still in review.”",
    },
    {
      icon: BadgeCheck,
      title: "Post review",
      body: "New and edited job posts can be checked for scams, unclear pay, or misleading titles. If we need changes, we explain why. The goal is fewer wasted applications for candidates and fewer unserious posts for employers.",
    },
    {
      icon: UserCheck,
      title: "Your account & data",
      body: "Saving and applying require a HenryCo account so your shortlist and applications are not floating in a cookie somewhere. You control your profile, documents, and what you send with each application.",
    },
  ] as const;

  return (
    <PublicShell
      primaryCta={{ label: "Browse verified employers", href: "/jobs?verified=1" }}
      secondaryCta={{ label: "For employers", href: "/hire" }}
    >
      <div className="mx-auto max-w-7xl space-y-16 px-4 py-12 sm:px-6 lg:px-8">
        <section>
          <div className="grid gap-10 lg:grid-cols-[1.15fr,0.85fr] lg:items-end">
            <div>
              <p className="jobs-kicker">Trust &amp; safety</p>
              <h1 className="mt-4 jobs-display max-w-3xl text-balance">
                Slow the bad listings. Let the good ones shine.
              </h1>
              <p className="mt-5 max-w-2xl text-pretty text-base leading-8 text-[var(--jobs-muted)]">
                Real companies, real candidates, and a hiring process you can follow. Verification,
                moderation, and visible stages keep this from turning into an anonymous job dump.
              </p>
              <div className="mt-8 flex flex-wrap gap-3 text-sm">
                <Link
                  href="/jobs"
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--jobs-brass)] px-6 py-3 text-sm font-semibold text-[var(--jobs-paper)] transition hover:-translate-y-0.5"
                >
                  Browse all jobs
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/help"
                  className="inline-flex items-center gap-2 rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-zinc-900 transition hover:border-[var(--jobs-accent)]/40 dark:border-white/15 dark:text-white"
                >
                  Read the FAQ
                </Link>
              </div>
            </div>
            <ul className="grid gap-3 text-sm">
              {[
                { label: "Reviews handled", value: "Every new employer + every new post" },
                { label: "Verification", value: "Manual, not pay-to-play" },
                { label: "Account control", value: "Your data, your application history" },
              ].map((item) => (
                <li
                  key={item.label}
                  className="flex items-baseline gap-3 border-b border-black/10 py-3 last:border-b-0 dark:border-white/10"
                >
                  <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--jobs-muted)]">
                    {item.label}
                  </span>
                  <span className="ml-auto text-right text-sm font-semibold tracking-tight text-zinc-950 dark:text-white">
                    {item.value}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section>
          <p className="jobs-kicker">Three pillars</p>
          <ul className="mt-8 grid gap-10 lg:grid-cols-3 lg:divide-x lg:divide-black/10 dark:lg:divide-white/10">
            {pillars.map((item, i) => {
              const Icon = item.icon;
              return (
                <li key={item.title} className={i > 0 ? "lg:pl-10" : ""}>
                  <Icon className="h-5 w-5 text-[var(--jobs-accent)]" aria-hidden />
                  <h2 className="mt-4 text-lg font-semibold tracking-tight text-zinc-950 dark:text-white">
                    {item.title}
                  </h2>
                  <p className="mt-2 text-sm leading-7 text-[var(--jobs-muted)]">{item.body}</p>
                </li>
              );
            })}
          </ul>
        </section>

        <section>
          <div className="flex items-baseline gap-4">
            <p className="jobs-kicker">Platform strengths</p>
            <span className="h-px flex-1 bg-black/10 dark:bg-white/10" />
          </div>
          <ul className="mt-8 grid gap-10 lg:grid-cols-2 lg:divide-x lg:divide-black/10 dark:lg:divide-white/10">
            {home.differentiators.map((item, i) => (
              <li key={item.id} className={i % 2 === 1 ? "lg:pl-12" : ""}>
                <Sparkles className="h-4 w-4 text-[var(--jobs-accent)]" aria-hidden />
                <div className="mt-3 flex flex-wrap items-baseline justify-between gap-3">
                  <h3 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-white">
                    {item.title}
                  </h3>
                  <span className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--jobs-muted)]">
                    Platform feature
                  </span>
                </div>
                <p className="mt-2 text-sm leading-7 text-[var(--jobs-muted)]">{item.summary}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="border-t border-black/10 pt-10 dark:border-white/10">
          <div className="grid gap-6 lg:grid-cols-[1.05fr,0.95fr] lg:items-end">
            <div>
              <p className="jobs-kicker">Where to from here</p>
              <h2 className="mt-3 jobs-heading max-w-2xl text-balance">
                Browse with the verified filter, or read the FAQ first.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--jobs-muted)]">
                The verified filter on the jobs board narrows to employers who have cleared review.
                If something looks off, the help page tells you exactly how to flag it.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Link
                href="/jobs?verified=1"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--jobs-brass)] px-6 py-3 text-sm font-semibold text-[var(--jobs-paper)] transition hover:-translate-y-0.5"
              >
                Verified employers
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/help"
                className="inline-flex items-center gap-2 rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-zinc-900 transition hover:border-[var(--jobs-accent)]/40 dark:border-white/15 dark:text-white"
              >
                Help center
              </Link>
            </div>
          </div>
        </section>
      </div>
    </PublicShell>
  );
}
