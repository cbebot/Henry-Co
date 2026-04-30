import Link from "next/link";
import {
  ArrowRight,
  Building2,
  ClipboardCheck,
  MessageCircle,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import { PublicShell } from "@/components/public-shell";
import { getSharedAccountLoginUrl, getSharedAccountSignupUrl } from "@/lib/account";
import { getJobsViewer } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HirePage() {
  const viewer = await getJobsViewer();
  const startUrl = viewer.user
    ? "/employer/company"
    : getSharedAccountSignupUrl("/employer/company");
  const loginUrl = getSharedAccountLoginUrl("/employer/company");

  const flow = [
    {
      step: "01",
      title: "Tell us who you are",
      body: "Create your company profile with honest basics—what you do, where you hire, and how candidates should expect to hear from you. We use this for verification, not vanity.",
      icon: Building2,
    },
    {
      step: "02",
      title: "Submit your role for review",
      body: "Write the job like you mean it: outcomes, requirements, pay band if you can share it, and how you work (remote, hybrid, on-site). New posts may sit in review briefly while we check for scams and quality.",
      icon: ClipboardCheck,
    },
    {
      step: "03",
      title: "Run the pipeline in the open",
      body: "Applications land in your employer workspace. Shortlist, interview, and decide with stages candidates can see in their own hub—fewer ghosted threads, more trust.",
      icon: Users,
    },
  ] as const;

  return (
    <PublicShell
      primaryCta={{
        label: viewer.user ? "Open employer workspace" : "Create employer account",
        href: startUrl,
      }}
      secondaryCta={{ label: "Browse candidates", href: "/talent" }}
    >
      <div className="mx-auto max-w-7xl space-y-16 px-4 py-12 sm:px-6 lg:px-8">
        <section>
          <div className="grid gap-10 lg:grid-cols-[1.15fr,0.85fr] lg:items-end">
            <div>
              <p className="jobs-kicker">For employers</p>
              <h1 className="mt-4 jobs-display max-w-3xl text-balance">
                Hire with clarity, not chaos.
              </h1>
              <p className="mt-5 max-w-2xl text-pretty text-base leading-8 text-[var(--jobs-muted)]">
                Post real roles, read applications in one place, move people through shortlist and
                interviews on visible stages. Employers and posts are reviewed to protect quality on
                both sides.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={startUrl}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--jobs-brass)] px-6 py-3 text-sm font-semibold text-[var(--jobs-paper)] transition hover:-translate-y-0.5"
                >
                  {viewer.user ? "Go to company setup" : "Start hiring — sign up free"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                {!viewer.user ? (
                  <Link
                    href={loginUrl}
                    className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-semibold text-zinc-900 transition hover:border-[var(--jobs-accent)]/40 dark:border-white/15 dark:bg-white/[0.04] dark:text-white"
                  >
                    I already have a HenryCo account
                  </Link>
                ) : null}
              </div>
            </div>
            <ul className="grid gap-3 text-sm">
              {[
                {
                  icon: Shield,
                  label: "Verification",
                  value: "Manual review — no pay-to-play",
                },
                {
                  icon: MessageCircle,
                  label: "Post review",
                  value: "Clarity, fairness, fraud checks",
                },
                {
                  icon: Sparkles,
                  label: "Pipeline",
                  value: "Visible stages for every applicant",
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
          <p className="jobs-kicker">From first post to first hire</p>
          <ol className="mt-6 divide-y divide-black/10 border-y border-black/10 dark:divide-white/10 dark:border-white/10">
            {flow.map((item) => {
              const Icon = item.icon;
              return (
                <li
                  key={item.step}
                  className="grid gap-3 py-6 sm:grid-cols-[auto,1fr,auto] sm:items-start sm:gap-8"
                >
                  <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--jobs-accent)]">
                    Step {item.step}
                  </span>
                  <div>
                    <h3 className="text-base font-semibold tracking-tight text-zinc-950 dark:text-white">
                      {item.title}
                    </h3>
                    <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--jobs-muted)]">
                      {item.body}
                    </p>
                  </div>
                  <Icon className="hidden h-5 w-5 text-[var(--jobs-muted)] sm:block" aria-hidden />
                </li>
              );
            })}
          </ol>
        </section>

        <section className="grid gap-12 lg:grid-cols-2 lg:divide-x lg:divide-black/10 dark:lg:divide-white/10">
          <div>
            <p className="jobs-kicker">Why verification exists</p>
            <h2 className="mt-3 jobs-heading max-w-xl text-balance">
              Real brands. Reviewed posts. No badges for sale.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--jobs-muted)]">
              Candidates deserve to know they are not replying to a fake brand. Verification means a
              human review of employer intent and profile quality — not a pay-to-play badge. While
              you are pending, you can still prepare your company record; some posting options
              unlock once you are verified.
            </p>
          </div>
          <div className="lg:pl-12">
            <p className="jobs-kicker">After you submit a post</p>
            <h2 className="mt-3 jobs-heading max-w-xl text-balance">
              Moderation explains itself, then gets out of the way.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--jobs-muted)]">
              Moderation checks for clarity, fairness, and fraud patterns. If something needs a fix,
              we will tell you why. When the role is live, candidates apply with one HenryCo
              profile; you review them in your applicant list and move stages when you are ready.
            </p>
          </div>
        </section>

        <section className="border-t border-black/10 pt-10 dark:border-white/10">
          <div className="grid gap-8 lg:grid-cols-[1.05fr,0.95fr] lg:items-end">
            <div>
              <p className="jobs-kicker">Quality over volume</p>
              <h2 className="mt-3 jobs-heading max-w-2xl text-balance">
                We protect the board so serious employers stand out.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--jobs-muted)]">
                Shared sign-in, saved roles, and application history mean candidates can hold you
                accountable to the process you publish. That is good for hiring: fewer wasted
                interviews, more people who actually want the job.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Link
                href={startUrl}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--jobs-brass)] px-6 py-3 text-sm font-semibold text-[var(--jobs-paper)] transition hover:-translate-y-0.5"
              >
                {viewer.user ? "Open workspace" : "Get started"}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/trust"
                className="inline-flex items-center gap-2 rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-zinc-900 transition hover:border-[var(--jobs-accent)]/40 dark:border-white/15 dark:text-white"
              >
                How we protect people
              </Link>
              <Link
                href="/help"
                className="inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-[var(--jobs-accent)] underline-offset-4 hover:underline"
              >
                Employer FAQ
              </Link>
            </div>
          </div>
          <p className="mt-8 text-sm text-[var(--jobs-muted)]">
            Questions?{" "}
            <a
              href="mailto:jobs@henrycogroup.com"
              className="font-semibold text-[var(--jobs-accent)] underline-offset-4 hover:underline"
            >
              jobs@henrycogroup.com
            </a>
          </p>
        </section>
      </div>
    </PublicShell>
  );
}
