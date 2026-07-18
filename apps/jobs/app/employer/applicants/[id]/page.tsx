import { getJobsCopy, type JobsCopy } from "@henryco/i18n";
import { addApplicationNoteAction, advanceApplicationStageAction } from "@/app/actions";
import { notFound } from "next/navigation";
import { requireJobsRoles } from "@/lib/auth";
import { getApplicationById, getApplicationTimeline } from "@/lib/jobs/data";
import { getJobsPublicLocale } from "@/lib/locale-server";
import { employerNav } from "@/lib/jobs/navigation";
import { EmptyState, InlineNotice } from "@/components/feedback";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { SectionCard, StatusPill, WorkspaceShell } from "@/components/workspace-shell";

export const dynamic = "force-dynamic";

type ApplicantsCopy = JobsCopy["employerApplicants"];

function toneForStage(stage: string) {
  if (stage === "hired" || stage === "offer") return "good" as const;
  if (stage === "shortlisted" || stage === "interview") return "warn" as const;
  if (stage === "rejected") return "danger" as const;
  return "neutral" as const;
}

// Audit actions are internal enum strings (e.g. "hiring.application.stage_moved").
// Map them to human labels — the raw taxonomy and payload never render.
function timelineActionLabel(action: string): string {
  if (action.includes("stage")) return "Stage updated";
  if (action.includes("score")) return "Candidate scored";
  if (action.includes("comment") || action.includes("note")) return "Note added";
  if (action.includes("offer")) return "Offer recorded";
  if (action.includes("hire")) return "Hire recorded";
  if (action.includes("reject")) return "Decision recorded";
  if (action.includes("interview")) return "Interview scheduled";
  if (action.includes("submitted") || action.includes("applied") || action.includes("created")) {
    return "Application received";
  }
  return "Application updated";
}

function stageLabel(stage: string, copy: ApplicantsCopy): string {
  switch (stage) {
    case "reviewing":
      return copy.stageReviewing;
    case "shortlisted":
      return copy.stageShortlisted;
    case "interview":
      return copy.stageInterview;
    case "offer":
      return copy.stageOffer;
    case "hired":
      return copy.stageHired;
    case "rejected":
      return copy.stageRejected;
    default:
      return stage.replace(/[_-]+/g, " ");
  }
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
  const locale = await getJobsPublicLocale();
  const [application, timeline, query] = await Promise.all([
    getApplicationById(id, locale),
    getApplicationTimeline(id),
    searchParams ?? Promise.resolve({} as Record<string, string | string[] | undefined>),
  ]);
  if (!application) {
    notFound();
  }
  const copy = getJobsCopy(locale).employerApplicants;
  const stageUpdated = query.stageUpdated === "1";
  const noteAdded = query.noteAdded === "1";
  const returnTo = `/employer/applicants/${application.applicationId}`;

  const stageOptions: Array<{ value: string; label: string }> = [
    { value: "reviewing", label: copy.stageReviewing },
    { value: "shortlisted", label: copy.stageShortlisted },
    { value: "interview", label: copy.stageInterview },
    { value: "offer", label: copy.stageOffer },
    { value: "hired", label: copy.stageHired },
    { value: "rejected", label: copy.stageRejected },
  ];

  return (
    <WorkspaceShell
      area="employer"
      title={copy.detailTitle}
      subtitle={copy.detailSubtitle}
      nav={employerNav}
      activeHref="/employer/applicants"
      accent="linear-gradient(135deg,#7c5a28 0%,#b88a47 55%,#f1c88c 100%)"
    >
      <div className="space-y-4">
        {stageUpdated ? (
          <InlineNotice tone="success" title={copy.noticeStageUpdatedTitle} body={copy.noticeStageUpdatedBody} />
        ) : null}
        {noteAdded ? (
          <InlineNotice tone="success" title={copy.noticeNoteAddedTitle} body={copy.noticeNoteAddedBody} />
        ) : null}

        <SectionCard
          title={application.candidateName}
          body={copy.detailJobTemplate
            .replace("{jobTitle}", application.jobTitle)
            .replace("{employerName}", application.employerName)}
        >
          <div className="flex flex-wrap items-center gap-3">
            <StatusPill label={stageLabel(application.stage, copy)} tone={toneForStage(application.stage)} />
          </div>
          <p className="mt-4 text-sm leading-7 text-[var(--jobs-muted)]">{application.coverNote || copy.noCoverNote}</p>
        </SectionCard>

        <SectionCard title={copy.stageSectionTitle}>
          <form action={advanceApplicationStageAction} className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
            <input type="hidden" name="applicationId" value={application.applicationId} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <select name="stage" className="jobs-select" defaultValue={application.stage}>
              {stageOptions.map((stage) => (
                <option key={stage.value} value={stage.value}>{stage.label}</option>
              ))}
            </select>
            <input name="note" className="jobs-input" placeholder={copy.stageNotePlaceholder} />
            <PendingSubmitButton pendingLabel={copy.stagePending} className="w-full md:w-auto">
              {copy.stageSubmit}
            </PendingSubmitButton>
          </form>
        </SectionCard>

        <SectionCard title={copy.noteSectionTitle}>
          <form action={addApplicationNoteAction} className="grid gap-4 md:grid-cols-[1fr_auto]">
            <input type="hidden" name="applicationId" value={application.applicationId} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <input name="note" className="jobs-input" placeholder={copy.notePlaceholder} />
            <PendingSubmitButton tone="secondary" pendingLabel={copy.notePending} className="w-full md:w-auto">
              {copy.noteSubmit}
            </PendingSubmitButton>
          </form>
        </SectionCard>

        <SectionCard title={copy.activitySectionTitle}>
          {timeline.length === 0 ? (
            <EmptyState
              kicker={copy.activityEmptyKicker}
              title={copy.activityEmptyTitle}
              body={copy.activityEmptyBody}
            />
          ) : (
            <div className="space-y-3">
              {timeline.map((event) => (
                <div key={event.id} className="rounded-2xl bg-[var(--jobs-paper-soft)] p-4">
                  <div className="font-semibold">{timelineActionLabel(event.action)}</div>
                  {event.reason ? (
                    <div className="mt-1 text-sm text-[var(--jobs-muted)]">{event.reason}</div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </WorkspaceShell>
  );
}
