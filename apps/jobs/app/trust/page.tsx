import Link from "next/link";
import { PublicShell } from "@/components/public-shell";
import { getJobsHomeData } from "@/lib/jobs/data";

export const dynamic = "force-dynamic";

export default async function TrustPage() {
  const home = await getJobsHomeData();

  return (
    <PublicShell primaryCta={{ label: "Browse verified employers", href: "/jobs?verified=1" }} secondaryCta={{ label: "For employers", href: "/hire" }}>
      <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
        <div className="jobs-panel rounded-[2.2rem] p-8 sm:p-10">
          <p className="jobs-kicker">Trust & safety</p>
          <h1 className="mt-3 jobs-heading max-w-4xl text-balance">We slow down the bad listings so the good ones shine.</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--jobs-muted)]">
            HenryCo Jobs is meant to feel human: real companies, real candidates, and a hiring process you can follow.
            Verification, moderation, and clear stages are how we keep the marketplace from turning into another
            anonymous job dump.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 text-sm">
            <Link href="/jobs" className="font-semibold text-[var(--jobs-accent)] underline-offset-4 hover:underline">
              Browse all jobs
            </Link>
            <span className="text-[var(--jobs-muted)]">·</span>
            <Link href="/help" className="font-semibold text-[var(--jobs-accent)] underline-offset-4 hover:underline">
              Read the FAQ
            </Link>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="jobs-panel rounded-[2rem] p-6">
            <h2 className="text-lg font-semibold">Employer verification</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--jobs-muted)]">
              Before we call an employer verified, we look at who they are, how they show up publicly, and whether their
              story matches the roles they post. Pending does not always mean “bad”—it can simply mean “still in
              review.”
            </p>
          </div>
          <div className="jobs-panel rounded-[2rem] p-6">
            <h2 className="text-lg font-semibold">Post review</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--jobs-muted)]">
              New and edited job posts can be checked for scams, unclear pay, or misleading titles. If we need changes,
              we explain why. The goal is fewer wasted applications for candidates and fewer unserious posts for
              employers.
            </p>
          </div>
          <div className="jobs-panel rounded-[2rem] p-6">
            <h2 className="text-lg font-semibold">Your account & data</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--jobs-muted)]">
              Saving and applying require a HenryCo account so your shortlist and applications are not floating in a
              cookie somewhere. You control your profile, documents, and what you send with each application.
            </p>
          </div>
        </div>

        <div>
          <h2 className="mb-6 text-center text-xl font-semibold tracking-tight">Platform strengths</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {home.differentiators.map((item) => (
              <div key={item.id} className="jobs-panel rounded-[2rem] p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <span className="rounded-full bg-[var(--jobs-paper-soft)] px-3 py-1 text-xs font-semibold text-[var(--jobs-muted)]">
                    Platform feature
                  </span>
                </div>
                <p className="mt-3 text-sm leading-7 text-[var(--jobs-muted)]">{item.summary}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
