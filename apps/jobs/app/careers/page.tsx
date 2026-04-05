import Link from "next/link";
import { EmptyState } from "@/components/feedback";
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
          <p className="jobs-kicker">Careers at HenryCo</p>
          <h1 className="mt-3 jobs-heading">Join the team building HenryCo.</h1>
          <p className="mt-4 max-w-3xl text-sm leading-8 text-[var(--jobs-muted)]">
            Internal openings go through the same clear, structured hiring process as every role on the platform.
            Apply with your HenryCo account and track progress in your candidate hub.
          </p>
        </div>

        {jobs.length > 0 ? (
          <div className="grid gap-5 lg:grid-cols-3">
            {jobs.map((job) => (
              <JobCard key={job.slug} job={job} />
            ))}
          </div>
        ) : (
          <EmptyState
            kicker="No openings right now"
            title="We don't have any internal roles open at the moment"
            body="Check back soon or browse external roles from verified employers on the main board."
            action={
              <Link href="/jobs" className="jobs-button-primary rounded-full px-5 py-3 text-sm font-semibold">
                Browse all roles
              </Link>
            }
          />
        )}
      </div>
    </PublicShell>
  );
}
