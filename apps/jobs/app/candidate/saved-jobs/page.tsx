import Link from "next/link";
import { requireJobsUser } from "@/lib/auth";
import { getCandidateDashboardData } from "@/lib/jobs/data";
import { candidateNav } from "@/lib/jobs/navigation";
import { EmptyState } from "@/components/feedback";
import { SectionCard, WorkspaceShell } from "@/components/workspace-shell";

export const dynamic = "force-dynamic";

export default async function CandidateSavedJobsPage() {
  const viewer = await requireJobsUser("/candidate/saved-jobs");
  const data = await getCandidateDashboardData(viewer.user!.id);

  return (
    <WorkspaceShell
      area="candidate"
      title="Saved Jobs"
      subtitle="Keep a calm shortlist of roles worth revisiting."
      nav={candidateNav}
      activeHref="/candidate/saved-jobs"
      accent="linear-gradient(135deg,#0d5e66 0%,#0e7c86 55%,#7fd0d4 100%)"
    >
      <SectionCard title="Saved roles" body="Roles you've bookmarked for later. Open any role to apply when you're ready.">
        {data.savedJobs.length === 0 ? (
          <EmptyState
            kicker="No saved roles"
            title="Build a shortlist worth revisiting."
            body="Save roles that feel promising so you can compare them later without losing context."
            action={
              <Link href="/jobs" className="jobs-button-primary rounded-full px-5 py-3 text-sm font-semibold">
                Browse roles
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {data.savedJobs.map((saved) => (
              <Link key={saved.id} href={`/jobs/${saved.job.slug}`} className="block rounded-2xl bg-[var(--jobs-paper-soft)] p-4 hover:bg-[var(--jobs-accent-soft)]">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="font-semibold">{saved.job.title}</div>
                    <div className="mt-1 text-sm text-[var(--jobs-muted)]">{saved.job.employerName} · {saved.job.location}</div>
                  </div>
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--jobs-muted)]">
                    Saved {new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(saved.createdAt))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </SectionCard>
    </WorkspaceShell>
  );
}
