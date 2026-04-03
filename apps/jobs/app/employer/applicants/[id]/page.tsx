import { addApplicationNoteAction, advanceApplicationStageAction } from "@/app/actions";
import { notFound } from "next/navigation";
import { requireJobsRoles } from "@/lib/auth";
import { getApplicationById, getApplicationTimeline } from "@/lib/jobs/data";
import { employerNav } from "@/lib/jobs/navigation";
import { SectionCard, WorkspaceShell } from "@/components/workspace-shell";

export const dynamic = "force-dynamic";

export default async function EmployerApplicantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireJobsRoles(["employer", "admin", "owner"], `/employer/applicants/${id}`);
  const [application, timeline] = await Promise.all([getApplicationById(id), getApplicationTimeline(id)]);
  if (!application) {
    notFound();
  }

  return (
    <WorkspaceShell
      area="employer"
      title="Applicant Detail"
      subtitle="Move stage, add collaboration notes, and review the full audit trail."
      nav={employerNav}
      activeHref="/employer/applicants"
      accent="linear-gradient(135deg,#7c5a28 0%,#b88a47 55%,#f1c88c 100%)"
    >
      <div className="space-y-4">
        <SectionCard title={application.candidateName} body={`${application.jobTitle} · ${application.employerName}`}>
          <p className="text-sm leading-7 text-[var(--jobs-muted)]">{application.coverNote || "No cover note provided."}</p>
        </SectionCard>

        <SectionCard title="Move pipeline stage">
          <form action={advanceApplicationStageAction} className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
            <input type="hidden" name="applicationId" value={application.applicationId} />
            <select name="stage" className="jobs-select" defaultValue={application.stage}>
              {["reviewing", "shortlisted", "interview", "offer", "hired", "rejected"].map((stage) => (
                <option key={stage} value={stage}>{stage}</option>
              ))}
            </select>
            <input name="note" className="jobs-input" placeholder="Context for the move" />
            <button className="jobs-button-primary rounded-full px-5 py-3 text-sm font-semibold">Update stage</button>
          </form>
        </SectionCard>

        <SectionCard title="Internal note">
          <form action={addApplicationNoteAction} className="grid gap-4 md:grid-cols-[1fr_auto]">
            <input type="hidden" name="applicationId" value={application.applicationId} />
            <input name="note" className="jobs-input" placeholder="Add recruiter or hiring manager context" />
            <button className="jobs-button-secondary rounded-full px-5 py-3 text-sm font-semibold">Add note</button>
          </form>
        </SectionCard>

        <SectionCard title="Audit timeline">
          <div className="space-y-3">
            {timeline.map((event) => (
              <div key={event.id} className="rounded-2xl bg-[var(--jobs-paper-soft)] p-4">
                <div className="font-semibold">{event.action}</div>
                <div className="mt-1 text-sm text-[var(--jobs-muted)]">{event.reason || JSON.stringify(event.newValues)}</div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </WorkspaceShell>
  );
}
