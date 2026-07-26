import { translateSurfaceLabel } from "@henryco/i18n";
import { requireStudioRoles } from "@/lib/studio/auth";
import { getStudioPublicLocale } from "@/lib/locale-server";
import { StudioWorkspaceShell } from "@/components/studio/workspace/shell";
import { ownerNav } from "@/lib/studio/navigation";
import { SensitiveActionProviderBridge } from "@/components/auth/SensitiveActionProviderBridge";
import { AgencyConsole, type ConsoleJob } from "@/components/studio/agency/agency-console";
import { DecisionsInbox, type InboxDecision } from "@/components/studio/agency/decisions-inbox";
import { listBuildJobs } from "@/lib/agency/store";
import { listPendingDecisions } from "@/lib/agency/decisions";
import { isStudioAgencyEnabled } from "@/lib/agency/flag";
import { createAdminSupabase, hasAdminSupabaseEnv } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * /owner/agency — the SA-2 build agency console (Register-D). Owner-gated. The
 * deploy approval it exposes is reauth-gated at the API; the reauth modal is
 * mounted here via SensitiveActionProviderBridge so the password step-up works
 * on the studio origin.
 */
export default async function AgencyConsolePage() {
  const viewer = await requireStudioRoles(["studio_owner"], "/owner/agency");
  const locale = await getStudioPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);

  const [jobs, decisions] = await Promise.all([
    listBuildJobs({ limit: 100 }),
    listPendingDecisions(50),
  ]);

  // Resolve project titles for the listed jobs + decisions (one batched read).
  const projectTitles = new Map<string, string>();
  const projectIds = [...new Set([...jobs.map((j) => j.projectId), ...decisions.map((d) => d.projectId)])];
  if (hasAdminSupabaseEnv() && projectIds.length > 0) {
    const admin = createAdminSupabase();
    const { data } = await admin.from("studio_projects").select("id, title").in("id", projectIds);
    for (const row of (data as { id: string; title: string }[] | null) ?? []) {
      projectTitles.set(row.id, row.title);
    }
  }

  const inboxDecisions: InboxDecision[] = decisions.map((d) => ({
    id: d.id,
    jobId: d.jobId,
    kind: d.kind,
    title: d.title,
    body: d.body,
    projectTitle: projectTitles.get(d.projectId) ?? t("Untitled project"),
  }));

  // Server component — Date.now() is request-deterministic for this render.
  // Captured once so the row map stays pure (react-hooks/purity).
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const consoleJobs: ConsoleJob[] = jobs.map((job) => ({
    id: job.id,
    projectTitle: projectTitles.get(job.projectId) ?? t("Untitled project"),
    stage: job.stage,
    attempt: job.attempt,
    budgetKobo: job.budgetKobo,
    costKobo: job.costKobo,
    heartbeatAgeMs: job.lastHeartbeatAt ? now - Date.parse(job.lastHeartbeatAt) : null,
    qaOk: job.qa?.ok ?? null,
    artifactHash: job.artifactHash,
    isInternal: job.isInternal,
  }));

  return (
    <StudioWorkspaceShell
      kicker={t("Build agency")}
      title={t("Autonomous build jobs")}
      description={t("Every build job, its cost against budget, and the human gates. Deploy needs your one-tap and password.")}
      nav={ownerNav("/owner")}
    >
      {!isStudioAgencyEnabled() ? (
        <p className="studio-panel rounded-[1.6rem] p-6 text-sm leading-7 text-[var(--studio-ink-soft)]">
          {t("The build agency is turned off for this environment. Turn it on to dispatch new jobs.")}
        </p>
      ) : null}
      <SensitiveActionProviderBridge email={viewer.user?.email ?? null}>
        <div className="space-y-4">
          <DecisionsInbox decisions={inboxDecisions} />
          <AgencyConsole jobs={consoleJobs} />
        </div>
      </SensitiveActionProviderBridge>
    </StudioWorkspaceShell>
  );
}
