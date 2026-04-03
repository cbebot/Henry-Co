import { notFound } from "next/navigation";
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
            <span>{employer.verificationStatus}</span>
            <span>{employer.openRoleCount} live roles</span>
            <span>{employer.responseSlaHours}h response target</span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <section className="space-y-5">
            {jobs.map((job) => (
              <JobCard key={job.slug} job={job} />
            ))}
          </section>
          <aside className="space-y-4">
            <div className="jobs-panel rounded-[2rem] p-6">
              <h2 className="jobs-section-title">Trust snapshot</h2>
              <p className="mt-2 text-sm leading-7 text-[var(--jobs-muted)]">
                Trust score {employer.trustScore}. Verification status {employer.verificationStatus}. Remote policy {employer.remotePolicy || "Not specified"}.
              </p>
            </div>
            <div className="jobs-panel rounded-[2rem] p-6">
              <h2 className="jobs-section-title">Culture cues</h2>
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
