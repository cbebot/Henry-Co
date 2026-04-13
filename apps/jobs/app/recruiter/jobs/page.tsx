import Link from "next/link";
import { reviewJobPostAction } from "@/app/actions";
import { requireJobsRoles } from "@/lib/auth";
import { getRecruiterOverviewData } from "@/lib/jobs/data";
import { recruiterNav } from "@/lib/jobs/navigation";
import { PendingSubmitButton } from "@/components/pending-submit-button";
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
            <div key={job.slug} className="rounded-2xl bg-[var(--jobs-paper-soft)] p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Link href={`/jobs/${job.slug}`} className="font-semibold underline-offset-4 hover:underline">
                    {job.title}
                  </Link>
                  <div className="mt-1 text-sm text-[var(--jobs-muted)]">{job.employerName} · {job.location}</div>
                  <div className="mt-2 text-xs leading-6 text-[var(--jobs-muted)]">{job.trustPassport.summary}</div>
                </div>
                <span className="rounded-full bg-[var(--jobs-accent-soft)] px-3 py-1 text-xs font-semibold capitalize">{job.moderationStatus.replace(/[_-]+/g, " ")}</span>
              </div>
              <form action={reviewJobPostAction} className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_repeat(3,auto)]">
                <input type="hidden" name="jobSlug" value={job.slug} />
                <input type="hidden" name="returnTo" value="/recruiter/jobs" />
                <input name="reason" className="jobs-input" placeholder="Moderation reason or escalation note" />
                <PendingSubmitButton name="moderationStatus" value="approved" pendingLabel="Saving..." className="w-full md:w-auto">
                  Approve
                </PendingSubmitButton>
                <PendingSubmitButton name="moderationStatus" value="pending_review" tone="secondary" pendingLabel="Saving..." className="w-full md:w-auto">
                  Hold
                </PendingSubmitButton>
                <PendingSubmitButton name="moderationStatus" value="flagged" tone="secondary" pendingLabel="Saving..." className="w-full md:w-auto">
                  Flag
                </PendingSubmitButton>
              </form>
            </div>
          ))}
        </div>
      </SectionCard>
    </WorkspaceShell>
  );
}
