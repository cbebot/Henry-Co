import { translateSurfaceLabel } from "@henryco/i18n";
import { requireStudioRoles } from "@/lib/studio/auth";
import { getStudioPublicLocale } from "@/lib/locale-server";
import { StudioWorkspaceShell } from "@/components/studio/workspace/shell";
import { ownerNav } from "@/lib/studio/navigation";
import { SensitiveActionProviderBridge } from "@/components/auth/SensitiveActionProviderBridge";
import { AgencyConsole, type ConsoleJob } from "@/components/studio/agency/agency-console";
import { listBuildJobs } from "@/lib/agency/store";
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

  const jobs = await listBuildJobs({ limit: 100 });

  // Resolve project titles for the listed jobs (one batched read).
  const projectTitles = new Map<string, string>();
  if (hasAdminSupabaseEnv() && jobs.length > 0) {
    const admin = createAdminSupabase();
    const ids = [...new Set(jobs.map((j) => j.projectId))];
    const { data } = await admin.from("studio_projects").select("id, title").in("id", ids);
    for (const row of (data as { id: string; title: string }[] | null) ?? []) {
      projectTitles.set(row.id, row.title);
    }
  }

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
        <AgencyConsole jobs={consoleJobs} />
      </SensitiveActionProviderBridge>
    </StudioWorkspaceShell>
  );
}
