import { notFound } from "next/navigation";
import { EmptyState } from "@/components/feedback";
import { JobCard } from "@/components/job-card";
import { PublicShell } from "@/components/public-shell";
import { getEmployerProfileBySlug } from "@/lib/jobs/data";

export const dynamic = "force-dynamic";

export default async function EmployerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const record = await getEmployerProfileBySlug(slug);
  if (!record) {
    notFound();
  }

  const { employer, jobs } = record;

  return (
    <PublicShell primaryCta={{ label: "Browse Jobs", href: "/jobs" }}>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
        <div className="jobs-panel rounded-[2.3rem] p-8 sm:p-10">
          <p className="jobs-kicker">Employer</p>
          <h1 className="mt-3 jobs-heading">{employer.name}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-8 text-[var(--jobs-muted)]">{employer.description}</p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm text-[var(--jobs-muted)]">
            <span>{employer.industry}</span>
            <span>{employer.verificationStatus === "verified" ? "Verified employer" : "Verification pending"}</span>
            <span>{employer.openRoleCount} open role{employer.openRoleCount === 1 ? "" : "s"}</span>
            {employer.responseSlaHours ? <span>~{employer.responseSlaHours}h typical response</span> : null}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <section className="space-y-5">
            {jobs.length > 0 ? (
              jobs.map((job) => (
                <JobCard key={job.slug} job={job} />
              ))
            ) : (
              <EmptyState
                kicker="No openings"
                title="This employer has no live roles right now"
                body="Check back later or browse other open positions on the board."
              />
            )}
          </section>
          <aside className="space-y-4">
            <div className="jobs-panel rounded-[2rem] p-6">
              <h2 className="jobs-section-title">Trust snapshot</h2>
              <div className="mt-4 space-y-3">
                <div className="rounded-[1.4rem] bg-[var(--jobs-paper-soft)] p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--jobs-muted)]">Verification</div>
                  <div className="mt-2 text-lg font-semibold">
                    {employer.verificationStatus === "verified" ? "Verified" : "Pending review"}
                  </div>
                </div>
                {employer.responseSlaHours ? (
                  <div className="rounded-[1.4rem] bg-[var(--jobs-paper-soft)] p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--jobs-muted)]">Response time</div>
                    <div className="mt-2 text-lg font-semibold">~{employer.responseSlaHours} hours</div>
                  </div>
                ) : null}
                {employer.remotePolicy ? (
                  <div className="rounded-[1.4rem] bg-[var(--jobs-paper-soft)] p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--jobs-muted)]">Remote policy</div>
                    <div className="mt-2 text-lg font-semibold capitalize">{employer.remotePolicy}</div>
                  </div>
                ) : null}
              </div>
              <p className="mt-4 text-sm leading-7 text-[var(--jobs-muted)]">
                Trust indicators are based on profile completeness, verification status, and hiring activity.
              </p>
            </div>
            <div className="jobs-panel rounded-[2rem] p-6">
              <h2 className="jobs-section-title">Culture &amp; values</h2>
              <ul className="mt-3 space-y-3 text-sm leading-7 text-[var(--jobs-muted)]">
                {employer.culturePoints.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </PublicShell>
  );
}
