import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getJobsCopy } from "@henryco/i18n";
import { requireJobsRoles } from "@/lib/auth";
import { getPipelineById, getApplications } from "@/lib/jobs/hiring";
import { getJobsPublicLocale } from "@/lib/locale-server";
import { employerNav } from "@/lib/jobs/navigation";
import { SectionCard, StatusPill, WorkspaceShell } from "@/components/workspace-shell";
import { PipelineKanban } from "@/components/hiring/PipelineKanban";
import { BulkStageMover } from "@/components/hiring/BulkStageMover";
import { resolveHiringActingContext } from "@/lib/jobs/hiring-guard";
import { getPipelineBusinessId } from "@/lib/jobs/hiring-suite";

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

  const [applications, locale, actingContext, pipelineBusinessId] = await Promise.all([
    getApplications(pipelineId),
    getJobsPublicLocale(),
    resolveHiringActingContext(),
    getPipelineBusinessId(pipelineId),
  ]);
  const copy = getJobsCopy(locale).employerHiringPipeline;
  const suiteCopy = getJobsCopy(locale).employerHiringSuite;

  // The enterprise suite (bulk move) is available only when the viewer is acting
  // as the business that owns this pipeline (V3-70 S1 business scoping).
  const canManageAsBusiness =
    actingContext.kind === "business" &&
    pipelineBusinessId != null &&
    actingContext.businessId === pipelineBusinessId;

  const stageTone = (status: string) => {
    if (status === "active") return "good" as const;
    if (status === "withdrawn") return "warn" as const;
    if (status === "rejected") return "danger" as const;
    if (status === "hired") return "good" as const;
    return "neutral" as const;
  };

  const statusLabel = (status: string) => {
    if (status === "active") return copy.statusActive;
    if (status === "withdrawn") return copy.statusWithdrawn;
    if (status === "rejected") return copy.statusRejected;
    if (status === "hired") return copy.statusHired;
    return status;
  };

  const subtitleTemplate =
    applications.length === 1 ? copy.subtitleSingular : copy.subtitlePlural;
  const subtitle = subtitleTemplate.replace(
    "{count}",
    String(applications.length),
  );

  return (
    <WorkspaceShell
      area="employer"
      title={pipeline.jobTitle}
      subtitle={subtitle}
      nav={employerNav}
      activeHref="/employer/hiring"
      accent="linear-gradient(135deg,#7c5a28 0%,#b88a47 55%,#f1c88c 100%)"
    >
      <div className="space-y-4">
        {/* Pipeline stages overview */}
        <SectionCard title={copy.stagesOverviewTitle} body={copy.stagesOverviewBody}>
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

        {/* J4 — Pipeline kanban with drag-to-move + optimistic UI rollback */}
        <SectionCard
          title={copy.kanbanTitle}
          body={copy.kanbanBody}
          actions={
            <Link
              href="/employer/hiring"
              className="text-sm font-semibold text-[var(--jobs-accent)]"
            >
              {copy.backToPipelines}
            </Link>
          }
        >
          {applications.length === 0 ? (
            <div className="rounded-2xl bg-[var(--jobs-paper-soft)] p-6 text-center">
              <p className="text-sm text-[var(--jobs-muted)]">
                {copy.emptyApplications}
              </p>
            </div>
          ) : (
            <PipelineKanban
              pipelineId={pipelineId}
              stages={pipeline.stages}
              applicants={applications.map((app) => ({
                applicationId: app.id,
                candidateName: app.candidateName,
                candidateAvatarUrl: app.candidateAvatarUrl,
                stage: app.stage,
                jobTitle: app.jobTitle,
                status: app.status,
                createdAt: app.createdAt,
              }))}
            />
          )}
        </SectionCard>

        {/* V3-70 S2 — enterprise bulk stage move (business-scoped) */}
        {canManageAsBusiness && applications.length > 0 && (
          <SectionCard title={suiteCopy.bulkMoveLabel}>
            <BulkStageMover
              applicants={applications.map((app) => ({
                applicationId: app.id,
                candidateName: app.candidateName,
                currentStage: app.stage,
              }))}
              stages={pipeline.stages}
              copy={suiteCopy}
            />
          </SectionCard>
        )}

        {/* Applicant list — legacy linkable detail entry */}
        <SectionCard
          title={copy.applicantIndexTitle}
          body={copy.applicantIndexBody}
        >
          {applications.length === 0 ? null : (
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
                          {copy.stageLabel}: {app.stage}
                        </div>
                      </div>
                    </div>
                    <StatusPill label={statusLabel(app.status)} tone={stageTone(app.status)} />
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
