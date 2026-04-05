import { addApplicationNoteAction, advanceApplicationStageAction } from "@/app/actions";
import { notFound } from "next/navigation";
import { requireJobsRoles } from "@/lib/auth";
import { getApplicationById, getApplicationTimeline } from "@/lib/jobs/data";
import { employerNav } from "@/lib/jobs/navigation";
import { EmptyState, InlineNotice } from "@/components/feedback";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { SectionCard, StatusPill, WorkspaceShell } from "@/components/workspace-shell";

export const dynamic = "force-dynamic";

function toneForStage(stage: string) {
  if (stage === "hired" || stage === "offer") return "good" as const;
  if (stage === "shortlisted" || stage === "interview") return "warn" as const;
  if (stage === "rejected") return "danger" as const;
  return "neutral" as const;
}

export default async function EmployerApplicantDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  await requireJobsRoles(["employer", "admin", "owner"], `/employer/applicants/${id}`);
  const [application, timeline, query] = await Promise.all([
    getApplicationById(id),
    getApplicationTimeline(id),
    searchParams ?? Promise.resolve({} as Record<string, string | string[] | undefined>),
  ]);
  if (!application) {
    notFound();
  }
  const stageUpdated = query.stageUpdated === "1";
  const noteAdded = query.noteAdded === "1";
  const returnTo = `/employer/applicants/${application.applicationId}`;

  return (
    <WorkspaceShell
      area="employer"
      title="Applicant Detail"
      subtitle="Review this candidate, move them through stages, and add notes."
      nav={employerNav}
      activeHref="/employer/applicants"
      accent="linear-gradient(135deg,#7c5a28 0%,#b88a47 55%,#f1c88c 100%)"
    >
      <div className="space-y-4">
        {stageUpdated ? (
          <InlineNotice tone="success" title="Stage updated" body="The candidate's stage has been updated. They'll see the change in their candidate hub." />
        ) : null}
        {noteAdded ? (
          <InlineNotice tone="success" title="Note added" body="Your note has been saved to this application." />
        ) : null}

        <SectionCard title={application.candidateName} body={`${application.jobTitle} · ${application.employerName}`}>
          <div className="flex flex-wrap items-center gap-3">
            <StatusPill label={application.stage.replace(/[_-]+/g, " ")} tone={toneForStage(application.stage)} />
            <span className="rounded-full bg-[var(--jobs-paper-soft)] px-3 py-1 text-xs font-semibold">
              Profile strength {application.candidateReadiness}%
            </span>
            <span className="rounded-full bg-[var(--jobs-paper-soft)] px-3 py-1 text-xs font-semibold">
              Match confidence {application.recruiterConfidence}%
            </span>
          </div>
          <p className="mt-4 text-sm leading-7 text-[var(--jobs-muted)]">{application.coverNote || "No cover note provided."}</p>
        </SectionCard>

        <SectionCard title="Update stage">
          <form action={advanceApplicationStageAction} className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
            <input type="hidden" name="applicationId" value={application.applicationId} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <select name="stage" className="jobs-select" defaultValue={application.stage}>
              {[
                { value: "reviewing", label: "Reviewing" },
                { value: "shortlisted", label: "Shortlisted" },
                { value: "interview", label: "Interview" },
                { value: "offer", label: "Offer" },
                { value: "hired", label: "Hired" },
                { value: "rejected", label: "Rejected" },
              ].map((stage) => (
                <option key={stage.value} value={stage.value}>{stage.label}</option>
              ))}
            </select>
            <input name="note" className="jobs-input" placeholder="Context for the move" />
            <PendingSubmitButton pendingLabel="Updating stage..." className="w-full md:w-auto">
              Update stage
            </PendingSubmitButton>
          </form>
        </SectionCard>

        <SectionCard title="Internal note">
          <form action={addApplicationNoteAction} className="grid gap-4 md:grid-cols-[1fr_auto]">
            <input type="hidden" name="applicationId" value={application.applicationId} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <input name="note" className="jobs-input" placeholder="Add a private note about this candidate" />
            <PendingSubmitButton tone="secondary" pendingLabel="Saving note..." className="w-full md:w-auto">
              Add note
            </PendingSubmitButton>
          </form>
        </SectionCard>

        <SectionCard title="Activity history">
          {timeline.length === 0 ? (
            <EmptyState
              kicker="No activity yet"
              title="No events recorded for this application."
              body="Stage changes, notes, and key updates will appear here as you work through the hiring process."
            />
          ) : (
            <div className="space-y-3">
              {timeline.map((event) => (
                <div key={event.id} className="rounded-2xl bg-[var(--jobs-paper-soft)] p-4">
                  <div className="font-semibold">{event.action}</div>
                  <div className="mt-1 text-sm text-[var(--jobs-muted)]">{event.reason || JSON.stringify(event.newValues)}</div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </WorkspaceShell>
  );
}
