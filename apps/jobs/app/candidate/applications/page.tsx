import Link from "next/link";
import { requireJobsUser } from "@/lib/auth";
import { getCandidateDashboardData } from "@/lib/jobs/data";
import { candidateNav } from "@/lib/jobs/navigation";
import { EmptyState, InlineNotice } from "@/components/feedback";
import { SectionCard, StatusPill, WorkspaceShell } from "@/components/workspace-shell";

export const dynamic = "force-dynamic";

function toneForStage(stage: string) {
  if (stage === "hired" || stage === "offer") return "good" as const;
  if (stage === "shortlisted" || stage === "interview") return "warn" as const;
  if (stage === "rejected") return "danger" as const;
  return "neutral" as const;
}

export default async function CandidateApplicationsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewer = await requireJobsUser("/candidate/applications");
  const [data, params] = await Promise.all([
    getCandidateDashboardData(viewer.user!.id),
    searchParams ?? Promise.resolve({}),
  ]);
  const submittedId = typeof params.submitted === "string" ? params.submitted : null;

  return (
    <WorkspaceShell
      area="candidate"
      title="Applications"
      subtitle="Follow every submitted role through the live hiring pipeline."
      nav={candidateNav}
      activeHref="/candidate/applications"
      accent="linear-gradient(135deg,#0d5e66 0%,#0e7c86 55%,#7fd0d4 100%)"
    >
      <div className="space-y-4">
        {submittedId ? (
          <InlineNotice
            tone="success"
            title="Application submitted"
            body="Your application was written to the live Jobs pipeline and is now visible to the employer and recruiter teams."
          />
        ) : null}

        <SectionCard title="Application history" body="Real records from the HenryCo jobs activity spine.">
          {data.applications.length === 0 ? (
            <EmptyState
              kicker="Start your search"
              title="You have not applied to any roles yet."
              body="Browse live openings, compare employers, and move on the roles that match your strengths."
              action={
                <Link href="/jobs" className="jobs-button-primary rounded-full px-5 py-3 text-sm font-semibold">
                  Browse jobs
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {data.applications.map((application) => {
                const isFresh = submittedId === application.applicationId;
                return (
                  <div
                    key={application.applicationId}
                    className={`rounded-2xl p-4 ${isFresh ? "border border-[var(--jobs-success)] bg-[var(--jobs-success-soft)]" : "bg-[var(--jobs-paper-soft)]"}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="font-semibold">{application.jobTitle}</div>
                        <div className="mt-1 text-sm text-[var(--jobs-muted)]">{application.employerName}</div>
                        <div className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--jobs-muted)]">
                          Applied {new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(application.createdAt))}
                        </div>
                      </div>
                      <StatusPill label={application.stage} tone={toneForStage(application.stage)} />
                    </div>
                    <p className="mt-3 text-sm leading-7 text-[var(--jobs-muted)]">
                      Readiness {application.candidateReadiness}. Recruiter confidence {application.recruiterConfidence}.{" "}
                      {application.coverNote || "No cover note added."}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>
    </WorkspaceShell>
  );
}
