import {
  Building2,
  ClipboardCheck,
  MessageCircle,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import { HeroLink, PublicShell } from "@/components/public-shell";
import { getSharedAccountLoginUrl, getSharedAccountSignupUrl } from "@/lib/account";
import { getJobsViewer } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HirePage() {
  const viewer = await getJobsViewer();
  const startUrl = viewer.user
    ? "/employer/company"
    : getSharedAccountSignupUrl("/employer/company");
  const loginUrl = getSharedAccountLoginUrl("/employer/company");

  return (
    <PublicShell
      primaryCta={{ label: viewer.user ? "Open employer workspace" : "Create employer account", href: startUrl }}
      secondaryCta={{ label: "Browse candidates", href: "/talent" }}
    >
      <div className="mx-auto max-w-7xl space-y-16 px-4 py-12 sm:px-6 lg:px-8">
        <section className="jobs-grid border-b border-black/5 pb-14">
          <div className="mx-auto max-w-3xl text-center">
            <p className="jobs-kicker">For employers</p>
            <h1 className="mt-4 jobs-display text-balance">
              Hire with clarity, not chaos.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-8 text-[var(--jobs-muted)]">
              Post real roles, read applications in one place, move people through shortlist and interviews on visible stages. Employers and posts are reviewed to protect quality on both sides.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <HeroLink href={startUrl} label={viewer.user ? "Go to company setup" : "Start hiring — sign up free"} />
              {!viewer.user ? (
                <HeroLink href={loginUrl} label="I already have a HenryCo account" subtle />
              ) : null}
            </div>
          </div>
        </section>

        <section>
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <p className="jobs-kicker">How it works</p>
            <h2 className="mt-3 jobs-heading text-balance">From first post to first hire</h2>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {[
              {
                step: "1",
                title: "Tell us who you are",
                body: "Create your company profile with honest basics—what you do, where you hire, and how candidates should expect to hear from you. We use this for verification, not vanity.",
                icon: Building2,
              },
              {
                step: "2",
                title: "Submit your role for review",
                body: "Write the job like you mean it: outcomes, requirements, pay band if you can share it, and how you work (remote, hybrid, on-site). New posts may sit in review briefly while we check for scams and quality.",
                icon: ClipboardCheck,
              },
              {
                step: "3",
                title: "Run the pipeline in the open",
                body: "Applications land in your employer workspace. Shortlist, interview, and decide with stages candidates can see in their own hub—fewer ghosted threads, more trust.",
                icon: Users,
              },
            ].map((item) => (
              <div key={item.step} className="jobs-soft-panel rounded-[1.8rem] p-7">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--jobs-brass-soft)] text-sm font-bold text-[var(--jobs-brass)]">
                    {item.step}
                  </span>
                  <item.icon className="h-5 w-5 text-[var(--jobs-muted)]" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[var(--jobs-muted)]">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="jobs-panel rounded-[2.2rem] p-8">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[var(--jobs-accent-soft)] p-3 text-[var(--jobs-accent)]">
                <Shield className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold">Why verification exists</h2>
            </div>
            <p className="mt-4 text-sm leading-7 text-[var(--jobs-muted)]">
              Candidates deserve to know they are not replying to a fake brand. Verification means a human review of
              employer intent and profile quality—not a pay-to-play badge. While you are pending, you can still prepare
              your company record; some posting options unlock once you are verified.
            </p>
          </div>
          <div className="jobs-panel rounded-[2.2rem] p-8">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[var(--jobs-brass-soft)] p-3 text-[var(--jobs-brass)]">
                <MessageCircle className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold">After you submit a post</h2>
            </div>
            <p className="mt-4 text-sm leading-7 text-[var(--jobs-muted)]">
              Moderation checks for clarity, fairness, and fraud patterns. If something needs a fix, we will tell you
              why. When the role is live, candidates apply with one HenryCo profile; you review them in your applicant
              list and move stages when you are ready.
            </p>
          </div>
        </section>

        <section className="jobs-panel rounded-[2.2rem] p-8 sm:p-10">
          <div className="flex flex-wrap items-start gap-4">
            <div className="rounded-2xl bg-[var(--jobs-success-soft)] p-3 text-[var(--jobs-success)]">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="jobs-kicker">Quality over volume</p>
              <h2 className="mt-2 jobs-heading max-w-3xl">We protect the board so serious employers stand out.</h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--jobs-muted)]">
                Shared sign-in, saved roles, and application history mean candidates can hold you accountable to the
                process you publish. That is good for hiring: fewer wasted interviews, more people who actually want the
                job.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <HeroLink href={startUrl} label={viewer.user ? "Open workspace" : "Get started"} />
                <HeroLink href="/trust" label="How we protect people" subtle />
                <HeroLink href="/help" label="Employer FAQ" subtle />
              </div>
            </div>
          </div>
        </section>

        <section className="pb-8 text-center">
          <p className="text-sm text-[var(--jobs-muted)]">
            Questions?{" "}
            <a href="mailto:jobs@henrycogroup.com" className="font-semibold text-[var(--jobs-accent)] underline">
              jobs@henrycogroup.com
            </a>
          </p>
        </section>
      </div>
    </PublicShell>
  );
}
