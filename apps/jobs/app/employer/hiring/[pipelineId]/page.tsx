import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { requireJobsRoles } from "@/lib/auth";
import { getPipelineById, getApplications } from "@/lib/jobs/hiring";
import { employerNav } from "@/lib/jobs/navigation";
import { SectionCard, StatusPill, WorkspaceShell } from "@/components/workspace-shell";

export const dynamic = "force-dynamic";

export default async function PipelineDetailPage({
  params,
}: {
  params: Promise<{ pipelineId: string }>;
}) {
  const { pipelineId } = await params;
  await requireJobsRoles(["employer", "admin", "owner"], `/employer/hiring/${pipelineId}`);

  const pipeline = await getPipelineById(pipelineId);
  if (!pipeline) return notFound();

  const applications = await getApplications(pipelineId);

  const stageTone = (status: string) => {
    if (status === "active") return "good" as const;
    if (status === "withdrawn") return "warn" as const;
    if (status === "rejected") return "danger" as const;
    if (status === "hired") return "good" as const;
    return "neutral" as const;
  };

  return (
    <WorkspaceShell
      area="employer"
      title={pipeline.jobTitle}
      subtitle={`${applications.length} applicant${applications.length !== 1 ? "s" : ""} in this hiring pipeline. Review candidates, manage stages, and coordinate interviews.`}
      nav={employerNav}
      activeHref="/employer/hiring"
      accent="linear-gradient(135deg,#7c5a28 0%,#b88a47 55%,#f1c88c 100%)"
    >
      <div className="space-y-4">
        {/* Pipeline stages overview */}
        <SectionCard title="Pipeline stages" body="Stages configured for this role.">
          <div className="flex flex-wrap gap-2">
            {pipeline.stages.map((stage, index) => (
              <div
                key={stage}
                className="flex items-center gap-2"
              >
                <span className="rounded-full bg-[var(--jobs-accent-soft)] px-3 py-1 text-xs font-semibold">
                  {stage}
                </span>
                {index < pipeline.stages.length - 1 && (
                  <span className="text-[var(--jobs-muted)]">&rarr;</span>
                )}
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Applicant list */}
        <SectionCard
          title="Applicants"
          body="All candidates who applied to this role."
          actions={
            <Link
              href="/employer/hiring"
              className="text-sm font-semibold text-[var(--jobs-accent)]"
            >
              Back to pipelines
            </Link>
          }
        >
          {applications.length === 0 ? (
            <div className="rounded-2xl bg-[var(--jobs-paper-soft)] p-6 text-center">
              <p className="text-sm text-[var(--jobs-muted)]">
                No applications received yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => (
                <Link
                  key={app.id}
                  href={`/employer/hiring/${pipelineId}/${app.id}`}
                  className="block rounded-2xl bg-[var(--jobs-paper-soft)] p-4 transition-colors hover:bg-[var(--jobs-accent-soft)]"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {app.candidateAvatarUrl ? (
                        <Image
                          src={app.candidateAvatarUrl}
                          alt=""
                          width={40}
                          height={40}
                          unoptimized
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--jobs-accent-soft)] text-sm font-semibold">
                          {app.candidateName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold">{app.candidateName}</div>
                        <div className="text-sm text-[var(--jobs-muted)]">
                          Stage: {app.stage}
                        </div>
                      </div>
                    </div>
                    <StatusPill label={app.status} tone={stageTone(app.status)} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </WorkspaceShell>
  );
}
