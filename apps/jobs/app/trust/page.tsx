import { PublicShell } from "@/components/public-shell";
import { getJobsHomeData } from "@/lib/jobs/data";

export const dynamic = "force-dynamic";

export default async function TrustPage() {
  const home = await getJobsHomeData();

  return (
    <PublicShell primaryCta={{ label: "Browse trusted roles", href: "/jobs?verified=1" }}>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
        <div className="jobs-panel rounded-[2.2rem] p-8 sm:p-10">
          <p className="jobs-kicker">Trust and Moderation</p>
          <h1 className="mt-3 jobs-heading">The platform is built to reduce fake-job noise before it reaches candidates.</h1>
          <p className="mt-4 max-w-3xl text-sm leading-8 text-[var(--jobs-muted)]">
            Employer verification, moderation queues, recruiter confidence surfaces, candidate readiness signals, and audit trails keep the jobs marketplace credible as it scales.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {home.differentiators.map((item) => (
            <div key={item.id} className="jobs-panel rounded-[2rem] p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">{item.title}</h2>
                <span className="rounded-full bg-[var(--jobs-accent-soft)] px-3 py-1 text-xs font-semibold">
                  {item.difficulty}
                </span>
              </div>
              <p className="mt-3 text-sm leading-7 text-[var(--jobs-muted)]">{item.summary}</p>
            </div>
          ))}
        </div>
      </div>
    </PublicShell>
  );
}
