import Link from "next/link";
import type { JobApplication } from "@/lib/jobs/types";
import { StatusPill } from "@/components/workspace-shell";

function toneForStage(stage: string) {
  if (stage === "hired" || stage === "offer") return "good" as const;
  if (stage === "shortlisted" || stage === "interview") return "warn" as const;
  if (stage === "rejected") return "danger" as const;
  return "neutral" as const;
}

export function ApplicationTable({
  applications,
  detailBase,
}: {
  applications: JobApplication[];
  detailBase: string;
}) {
  if (applications.length === 0) {
    return <p className="text-sm text-[var(--jobs-muted)]">No applications yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="jobs-table min-w-[760px]">
        <thead>
          <tr>
            <th>Candidate</th>
            <th>Role</th>
            <th>Stage</th>
            <th>Readiness</th>
            <th>Confidence</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((application) => (
            <tr key={application.applicationId}>
              <td>
                <div className="font-semibold">{application.candidateName}</div>
                <div className="mt-1 text-sm text-[var(--jobs-muted)]">{application.candidateEmail || "No email"}</div>
              </td>
              <td>
                <Link href={`${detailBase}/${application.applicationId}`} className="font-semibold hover:underline">
                  {application.jobTitle}
                </Link>
                <div className="mt-1 text-sm text-[var(--jobs-muted)]">{application.employerName}</div>
              </td>
              <td>
                <StatusPill label={application.stage} tone={toneForStage(application.stage)} />
              </td>
              <td>{application.candidateReadiness}</td>
              <td>{application.recruiterConfidence}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
