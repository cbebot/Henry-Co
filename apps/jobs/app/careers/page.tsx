import { PublicShell } from "@/components/public-shell";
import { getJobPosts } from "@/lib/jobs/data";
import { JobCard } from "@/components/job-card";

export const dynamic = "force-dynamic";

export default async function CareersPage() {
  const jobs = await getJobPosts({ internalOnly: true });

  return (
    <PublicShell primaryCta={{ label: "Open HenryCo Roles", href: "/careers" }}>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
        <div className="jobs-panel rounded-[2.2rem] p-8 sm:p-10">
          <p className="jobs-kicker">Internal Careers</p>
          <h1 className="mt-3 jobs-heading">HenryCo internal hiring runs inside the same operating system.</h1>
          <p className="mt-4 max-w-3xl text-sm leading-8 text-[var(--jobs-muted)]">
            Internal staffing, approvals, notes, decision history, and recruiter discipline share the same premium hiring spine instead of living in a disconnected back office.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {jobs.map((job) => (
            <JobCard key={job.slug} job={job} />
          ))}
        </div>
      </div>
    </PublicShell>
  );
}
