import Link from "next/link";
import { requireJobsRoles } from "@/lib/auth";
import { getRecruiterOverviewData } from "@/lib/jobs/data";
import { recruiterNav } from "@/lib/jobs/navigation";
import { SectionCard, WorkspaceShell } from "@/components/workspace-shell";

export const dynamic = "force-dynamic";

export default async function RecruiterJobsPage() {
  await requireJobsRoles(["recruiter", "admin", "owner", "moderator"], "/recruiter/jobs");
  const data = await getRecruiterOverviewData();

  return (
    <WorkspaceShell area="recruiter" title="Jobs Queue" subtitle="Review published, pending, and internal roles." nav={recruiterNav} activeHref="/recruiter/jobs" accent="linear-gradient(135deg,#1d3f6f 0%,#3266b4 55%,#6db7ff 100%)">
      <SectionCard title="Jobs">
        <div className="space-y-3">
          {data.jobs.map((job) => (
            <Link key={job.slug} href={`/jobs/${job.slug}`} className="block rounded-2xl bg-[var(--jobs-paper-soft)] p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="font-semibold">{job.title}</div>
                  <div className="mt-1 text-sm text-[var(--jobs-muted)]">{job.employerName} · {job.location}</div>
                </div>
                <span className="rounded-full bg-[var(--jobs-accent-soft)] px-3 py-1 text-xs font-semibold">{job.moderationStatus}</span>
              </div>
            </Link>
          ))}
        </div>
      </SectionCard>
    </WorkspaceShell>
  );
}
