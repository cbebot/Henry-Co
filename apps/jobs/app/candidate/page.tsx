import Link from "next/link";
import { requireJobsUser } from "@/lib/auth";
import { getCandidateDashboardData } from "@/lib/jobs/data";
import { candidateNav } from "@/lib/jobs/navigation";
import { SectionCard, StatTile, WorkspaceShell } from "@/components/workspace-shell";

export const dynamic = "force-dynamic";

export default async function CandidateOverviewPage() {
  const viewer = await requireJobsUser("/candidate");
  const data = await getCandidateDashboardData(viewer.user!.id);

  return (
    <WorkspaceShell
      area="candidate"
      title="Candidate Hub"
      subtitle="Track profile strength, applications, saved roles, files, and recruiter movement without noise."
      nav={candidateNav}
      activeHref="/candidate"
      accent="linear-gradient(135deg,#0d5e66 0%,#0e7c86 55%,#7fd0d4 100%)"
      rightRail={
        <>
          <SectionCard title="Notifications" body="Recent jobs updates written into your shared HenryCo inbox.">
            <div className="space-y-3">
              {data.notifications.slice(0, 4).map((notification) => (
                <div key={notification.id} className="rounded-2xl bg-[var(--jobs-paper-soft)] p-4">
                  <div className="font-semibold">{notification.title}</div>
                  <div className="mt-1 text-sm text-[var(--jobs-muted)]">{notification.body}</div>
                </div>
              ))}
            </div>
          </SectionCard>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatTile label="Profile readiness" value={data.profile?.trustScore ?? 0} detail={data.profile?.readinessLabel || "Set up your profile"} />
          <StatTile label="Applications" value={data.applications.length} detail="Live applications in the pipeline." />
          <StatTile label="Saved roles" value={data.savedJobs.length} detail="Roles you want to revisit." />
          <StatTile label="Files" value={data.documents.length} detail="Resume, certifications, and proof documents." />
        </div>

        <SectionCard title="Pipeline summary" body="Recent application movement.">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {Object.entries(data.pipelineSummary).map(([stage, count]) => (
              <div key={stage} className="rounded-2xl bg-[var(--jobs-paper-soft)] p-4">
                <div className="jobs-kicker">{stage}</div>
                <div className="mt-2 text-2xl font-semibold">{count}</div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Recent applications" body="The latest roles you moved on." actions={<Link href="/candidate/applications" className="text-sm font-semibold text-[var(--jobs-accent)]">View all</Link>}>
          <div className="space-y-3">
            {data.applications.slice(0, 5).map((application) => (
              <div key={application.applicationId} className="rounded-2xl bg-[var(--jobs-paper-soft)] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-semibold">{application.jobTitle}</div>
                    <div className="mt-1 text-sm text-[var(--jobs-muted)]">{application.employerName}</div>
                  </div>
                  <div className="rounded-full bg-[var(--jobs-accent-soft)] px-3 py-1 text-xs font-semibold">
                    {application.stage}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </WorkspaceShell>
  );
}
