import Link from "next/link";
import { ArrowRight, BadgeCheck, FileText, ShieldCheck, Sparkles } from "lucide-react";
import { PublicShell } from "@/components/public-shell";
import { getSharedAccountSignupUrl } from "@/lib/account";
import { getJobsViewer } from "@/lib/auth";
import { getJobsHomeData } from "@/lib/jobs/data";

export const dynamic = "force-dynamic";

export default async function TalentPage() {
  const [home, viewer] = await Promise.all([getJobsHomeData(), getJobsViewer()]);
  const profileUrl = viewer.user ? "/candidate/profile" : getSharedAccountSignupUrl("/candidate/profile");

  const traits = home.differentiators.slice(0, 5);

  return (
    <PublicShell
      primaryCta={{ label: viewer.user ? "Open candidate hub" : "Build candidate profile", href: profileUrl }}
      secondaryCta={{ label: "Browse jobs", href: "/jobs" }}
    >
      <div className="mx-auto max-w-7xl space-y-16 px-4 py-12 sm:px-6 lg:px-8">
        <section>
          <div className="grid gap-10 lg:grid-cols-[1.15fr,0.85fr] lg:items-end">
            <div>
              <p className="jobs-kicker">For candidates</p>
              <h1 className="mt-4 jobs-display max-w-3xl text-balance">
                Build a profile that employers actually trust.
              </h1>
              <p className="mt-5 max-w-2xl text-pretty text-base leading-8 text-[var(--jobs-muted)]">
                HenryCo Jobs uses your profile completeness, uploaded documents, verified skills,
                and work history to help employers see the real you — not just a name and a CV
                attachment.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={profileUrl}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--jobs-brass)] px-6 py-3 text-sm font-semibold text-[var(--jobs-paper)] transition hover:-translate-y-0.5"
                >
                  {viewer.user ? "Update profile" : "Start your profile"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/jobs"
                  className="inline-flex items-center gap-2 rounded-full border border-black/10 px-6 py-3 text-sm font-semibold text-zinc-900 transition hover:border-[var(--jobs-accent)]/40 dark:border-white/15 dark:text-white"
                >
                  Browse open roles
                </Link>
                <Link
                  href="/trust"
                  className="inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-[var(--jobs-accent)] underline-offset-4 hover:underline"
                >
                  How we protect candidates
                </Link>
              </div>
            </div>
            <ul className="grid gap-3 text-sm">
              {[
                {
                  icon: FileText,
                  label: "Profile",
                  value: "Documents, skills, history",
                },
                {
                  icon: BadgeCheck,
                  label: "Verification",
                  value: "Identity, references, certifications",
                },
                {
                  icon: ShieldCheck,
                  label: "Privacy",
                  value: "You choose what each application sends",
                },
              ].map(({ icon: Icon, label, value }) => (
                <li
                  key={label}
                  className="flex items-baseline gap-3 border-b border-black/10 py-3 last:border-b-0 dark:border-white/10"
                >
                  <Icon className="h-3.5 w-3.5 text-[var(--jobs-accent)]" aria-hidden />
                  <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--jobs-muted)]">
                    {label}
                  </span>
                  <span className="ml-auto text-right text-sm font-semibold tracking-tight text-zinc-950 dark:text-white">
                    {value}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section>
          <div className="flex items-baseline gap-4">
            <p className="jobs-kicker">Why candidates trust the board</p>
            <span className="h-px flex-1 bg-black/10 dark:bg-white/10" />
          </div>
          <ul className="mt-8 grid gap-10 lg:grid-cols-2 lg:divide-x lg:divide-black/10 dark:lg:divide-white/10">
            {traits.map((item, i) => (
              <li
                key={item.id}
                className={`relative ${i % 2 === 1 ? "lg:pl-12" : ""}`}
              >
                <Sparkles className="h-4 w-4 text-[var(--jobs-accent)]" aria-hidden />
                <h2 className="mt-3 text-lg font-semibold tracking-tight text-zinc-950 dark:text-white">
                  {item.title}
                </h2>
                <p className="mt-2 text-sm leading-7 text-[var(--jobs-muted)]">{item.summary}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="border-t border-black/10 pt-10 dark:border-white/10">
          <div className="grid gap-6 lg:grid-cols-[1.05fr,0.95fr] lg:items-end">
            <div>
              <p className="jobs-kicker">Move forward</p>
              <h2 className="mt-3 jobs-heading max-w-2xl text-balance">
                Start your profile, then apply when you’re ready.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--jobs-muted)]">
                Browsing is free. Saving and applying require one HenryCo account so your shortlist
                and applications stay attached to the right person.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Link
                href={profileUrl}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--jobs-brass)] px-6 py-3 text-sm font-semibold text-[var(--jobs-paper)] transition hover:-translate-y-0.5"
              >
                {viewer.user ? "Open candidate hub" : "Create candidate profile"}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/jobs"
                className="inline-flex items-center gap-2 rounded-full border border-black/10 px-6 py-3 text-sm font-semibold text-zinc-900 transition hover:border-[var(--jobs-accent)]/40 dark:border-white/15 dark:text-white"
              >
                Browse jobs
              </Link>
            </div>
          </div>
        </section>
      </div>
    </PublicShell>
  );
}
