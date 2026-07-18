import Link from "next/link";
import { getJobsCopy, type JobsCopy } from "@henryco/i18n";
import type { JobApplication } from "@/lib/jobs/types";
import { EmptyState } from "@/components/feedback";
import { StatusPill } from "@/components/workspace-shell";

type ApplicantsCopy = JobsCopy["employerApplicants"];

const DEFAULT_COPY: ApplicantsCopy = getJobsCopy("en").employerApplicants;

function toneForStage(stage: string) {
  if (stage === "hired" || stage === "offer") return "good" as const;
  if (stage === "shortlisted" || stage === "interview") return "warn" as const;
  if (stage === "rejected") return "danger" as const;
  return "neutral" as const;
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

export function ApplicationTable({
  applications,
  detailBase,
  copy = DEFAULT_COPY,
}: {
  applications: JobApplication[];
  detailBase: string;
  copy?: ApplicantsCopy;
}) {
  if (applications.length === 0) {
    return (
      <EmptyState
        kicker={copy.emptyKicker}
        title={copy.emptyTitle}
        body={copy.emptyBody}
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="jobs-table min-w-[760px]">
        <thead>
          <tr>
            <th>{copy.tableCandidate}</th>
            <th>{copy.tableRole}</th>
            <th>{copy.tableStage}</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((application) => (
            <tr key={application.applicationId}>
              <td>
                <div className="font-semibold">{application.candidateName}</div>
                <div className="mt-1 text-sm text-[var(--jobs-muted)]">{application.candidateEmail || copy.noEmail}</div>
              </td>
              <td>
                <Link href={`${detailBase}/${application.applicationId}`} className="font-semibold hover:underline">
                  {application.jobTitle}
                </Link>
                <div className="mt-1 text-sm text-[var(--jobs-muted)]">{application.employerName}</div>
              </td>
              <td>
                <StatusPill label={stageLabel(application.stage, copy)} tone={toneForStage(application.stage)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
