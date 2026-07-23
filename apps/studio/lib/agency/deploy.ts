import "server-only";

/**
 * SA-2 — the deploy runner (staff-manual in SA-2; orchestrator-automated in
 * SA-3). It is reachable ONLY for a job already in `approved_for_deploy`, a
 * stage produced solely by the reauth-gated owner approval — so no code path
 * flips a site live without the human one-tap+reauth.
 *
 * The keystone (SAFETY-MODEL §5): `goLive` re-reads the STORED bundle and
 * re-verifies its sha256 against the approved `artifact_hash` before the
 * pointer flip. A post-approval swap is therefore impossible — what was
 * reviewed is exactly what deploys.
 */

import { createAdminSupabase, hasAdminSupabaseEnv } from "@/lib/supabase";
import { canBeginDeploy } from "@/lib/agency/state-machine";
import { getBuildJob, transitionJob, appendBuildEvent } from "@/lib/agency/store";
import { goLive } from "@/lib/agency/bundle-store";
import { sendSiteLive } from "@/lib/studio/email/agency";

/** Deterministic per-project host for the studio-sites renderer (SA-2). */
export function siteHostForProject(projectId: string, baseDomain: string): string {
  const slug = projectId.replace(/[^a-z0-9]/gi, "").slice(0, 12).toLowerCase();
  return `${slug}.${baseDomain}`;
}

export type DeployResult =
  | { ok: true; host: string }
  | { ok: false; reason: string };

/**
 * Run the deploy for an approved job. Every guard is enforced here, on top of
 * the console's role gate:
 *   - the job must be in approved_for_deploy (reauth already happened to reach it).
 *   - the stored bundle must re-hash to the approved artifact_hash (goLive).
 * On success: flip the host to live, advance approved_for_deploy → deploying →
 * live, and send the templated site_live notification (no tap — service contract).
 */
export async function runDeploy(input: {
  jobId: string;
  actor: string;
  sitesBaseDomain: string;
}): Promise<DeployResult> {
  if (!hasAdminSupabaseEnv()) return { ok: false, reason: "no_admin_env" };

  const job = await getBuildJob(input.jobId);
  if (!job) return { ok: false, reason: "job_not_found" };
  if (!canBeginDeploy(job.stage)) return { ok: false, reason: `not_approved_stage:${job.stage}` };
  if (!job.artifactHash) return { ok: false, reason: "no_pinned_artifact" };

  const host = siteHostForProject(job.projectId, input.sitesBaseDomain);

  // approved_for_deploy → deploying (audit-first).
  const deploying = await transitionJob({
    jobId: input.jobId,
    to: "deploying",
    reason: "deploy_started",
    actor: input.actor,
  });
  if (!deploying.ok) return { ok: false, reason: `transition_${deploying.reason}` };

  // The hash-pinned flip — re-verifies stored bundle == approved hash.
  const live = await goLive({
    host,
    jobId: input.jobId,
    projectId: job.projectId,
    approvedHash: job.artifactHash,
  });
  if (!live.ok) {
    // Post-check failure → stalled + escalate (never leave a half-deployed job).
    await appendBuildEvent(input.jobId, "deploy_failed", { reason: live.reason });
    await transitionJob({ jobId: input.jobId, to: "stalled", reason: `deploy_${live.reason}`, actor: input.actor });
    return { ok: false, reason: live.reason ?? "go_live_failed" };
  }

  // deploying → live.
  await transitionJob({
    jobId: input.jobId,
    to: "live",
    reason: "deploy_complete",
    actor: input.actor,
    patch: { preview_ref: host },
  });
  await appendBuildEvent(input.jobId, "deployed", { host, artifact_hash: job.artifactHash, actor: input.actor });

  // Templated site_live — no tap (ratified SA-D1 carve-out).
  try {
    const admin = createAdminSupabase();
    const { data: projectRow } = await admin
      .from("studio_projects")
      .select("id, title, normalized_email, access_token_hint")
      .eq("id", job.projectId)
      .maybeSingle();
    const project = projectRow as Record<string, unknown> | null;
    if (project) {
      await sendSiteLive(
        {
          id: String(project.id),
          title: String(project.title ?? "your site"),
          normalizedEmail: (project.normalized_email as string) ?? null,
          accessKey: "", // client reaches the workspace via their existing session/link
        },
        `https://${host}`,
      );
    }
  } catch {
    // notification best-effort — the site is live; the audit trail is complete.
  }

  return { ok: true, host };
}
