import { requireJobsUser } from "@/lib/auth";
import { getCandidateDashboardData } from "@/lib/jobs/data";
import { candidateNav } from "@/lib/jobs/navigation";
import { SectionCard, WorkspaceShell } from "@/components/workspace-shell";

export const dynamic = "force-dynamic";

export default async function CandidateApplicationsPage() {
  const viewer = await requireJobsUser("/candidate/applications");
  const data = await getCandidateDashboardData(viewer.user!.id);

  return (
    <WorkspaceShell
      area="candidate"
      title="Applications"
      subtitle="Follow every submitted role through the live hiring pipeline."
      nav={candidateNav}
      activeHref="/candidate/applications"
      accent="linear-gradient(135deg,#0d5e66 0%,#0e7c86 55%,#7fd0d4 100%)"
    >
      <SectionCard title="Application history" body="Real records from the HenryCo jobs activity spine.">
        <div className="space-y-3">
          {data.applications.map((application) => (
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
              <p className="mt-3 text-sm leading-7 text-[var(--jobs-muted)]">
                Readiness {application.candidateReadiness}. Recruiter confidence {application.recruiterConfidence}. {application.coverNote || "No cover note added."}
              </p>
            </div>
          ))}
        </div>
      </SectionCard>
    </WorkspaceShell>
  );
}
