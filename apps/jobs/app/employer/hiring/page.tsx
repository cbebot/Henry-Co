import Link from "next/link";
import { requireJobsRoles } from "@/lib/auth";
import { getHiringPipelines } from "@/lib/jobs/hiring";
import { employerNav } from "@/lib/jobs/navigation";
import { SectionCard, StatusPill, WorkspaceShell } from "@/components/workspace-shell";

export const dynamic = "force-dynamic";

export default async function EmployerHiringPage() {
  const viewer = await requireJobsRoles(["employer", "admin", "owner"], "/employer/hiring");
  const employerId = viewer.employerMemberships[0]?.activityId ?? viewer.user!.id;
  const pipelines = await getHiringPipelines(employerId);

  const statusTone = (status: string) => {
    if (status === "active") return "good" as const;
    if (status === "paused") return "warn" as const;
    if (status === "closed") return "neutral" as const;
    return "neutral" as const;
  };

  return (
    <WorkspaceShell
      area="employer"
      title="Hiring Pipelines"
      subtitle="Manage your active hiring pipelines, communicate with candidates, and schedule interviews from one workspace."
      nav={employerNav}
      activeHref="/employer/hiring"
      accent="linear-gradient(135deg,#7c5a28 0%,#b88a47 55%,#f1c88c 100%)"
    >
      <SectionCard
        title="All pipelines"
        body="Each pipeline corresponds to a live or past role. Open a pipeline to review applicants, conversations, and interviews."
      >
        {pipelines.length === 0 ? (
          <div className="rounded-2xl bg-[var(--jobs-paper-soft)] p-6 text-center">
            <p className="text-sm text-[var(--jobs-muted)]">
              No hiring pipelines yet. Pipelines are created automatically when you publish a role.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pipelines.map((pipeline) => (
              <Link
                key={pipeline.id}
                href={`/employer/hiring/${pipeline.id}`}
                className="block rounded-2xl bg-[var(--jobs-paper-soft)] p-5 transition-colors hover:bg-[var(--jobs-accent-soft)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{pipeline.jobTitle}</div>
                    <div className="mt-1 text-sm text-[var(--jobs-muted)]">
                      {pipeline.applicantCount} applicant{pipeline.applicantCount !== 1 ? "s" : ""}
                    </div>
                    {pipeline.stages.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {pipeline.stages.map((stage) => (
                          <span
                            key={stage}
                            className="rounded-full bg-[var(--jobs-bg)] px-2.5 py-0.5 text-xs text-[var(--jobs-muted)]"
                          >
                            {stage}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <StatusPill label={pipeline.status} tone={statusTone(pipeline.status)} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </SectionCard>
    </WorkspaceShell>
  );
}
