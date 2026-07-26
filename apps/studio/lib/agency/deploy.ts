import "server-only";

/**
 * SA-2/SA-3 — the deploy runner. In SA-2 the live flip was a staff-manual step;
 * in SA-3 the ORCHESTRATOR performs it automatically after the owner's one
 * reauth-gated approval (SA-D3 unlock) — automation replaces the manual step,
 * NEVER the approval. The core is reachable ONLY for a job already in
 * `approved_for_deploy` (produced solely by the reauth-gated owner confirm) or
 * `deploying` (a crash-resume of the same). No code path flips a site live
 * without that human one-tap+reauth.
 *
 * Two keystones (SAFETY-MODEL §5), preserved when automated:
 *   1. HASH PIN — `goLive` re-reads the STORED bundle and re-verifies its sha256
 *      against the approved `artifact_hash` before the pointer flip. A
 *      post-approval swap is impossible; what was reviewed is exactly what deploys.
 *   2. IDEMPOTENT + RESUMABLE — a re-run is safe: the CAS transition only one
 *      worker wins `approved_for_deploy → deploying`; a crashed deploy left in
 *      `deploying` is resumed (goLive is an idempotent upsert to the same hash);
 *      a `live` job is not re-deployable. No double-deploy, no double-charge.
 */

import { createAdminSupabase, hasAdminSupabaseEnv } from "@/lib/supabase";
import { emitEvent } from "@henryco/observability/events";
import { canBeginDeploy, type BuildStage } from "@/lib/agency/state-machine";
import { getBuildJob, transitionJob, appendBuildEvent, type BuildJobRow } from "@/lib/agency/store";
import { goLive, verifyStoredBundleHash, disableSite } from "@/lib/agency/bundle-store";
import { escalateJob } from "@/lib/agency/escalate";
import { queueDecision, supersedeDecisions } from "@/lib/agency/decisions";
import { sendSiteLive } from "@/lib/studio/email/agency";

/** Deterministic per-project host for the studio-sites renderer (SA-2). */
export function siteHostForProject(projectId: string, baseDomain: string): string {
  const slug = projectId.replace(/[^a-z0-9]/gi, "").slice(0, 12).toLowerCase();
  return `${slug}.${baseDomain}`;
}

export type DeployResult =
  | { ok: true; host: string }
  | { ok: false; reason: string };

/** Stages from which the orchestrator may (re-)enter the deploy. */
function isDeployable(stage: BuildStage): boolean {
  return canBeginDeploy(stage) || stage === "deploying";
}

/**
 * Post-deploy verification before the job flips to `live`. What is verifiable in
 * this environment: the host pointer is `live` AND points at the approved hash,
 * and the stored bundle still re-hashes to it. A live HTTP 200 / headers / TLS
 * walk (ARCHITECTURE §5) requires a real deployment target and is a prod-config
 * addition — it is honestly out of scope here rather than faked green.
 */
async function runPostDeployChecks(host: string, approvedHash: string): Promise<{ ok: boolean; reason?: string }> {
  if (!hasAdminSupabaseEnv()) return { ok: false, reason: "no_admin_env" };
  // Re-verify the stored bundle still hashes to the approved artifact.
  if (!(await verifyStoredBundleHash(approvedHash))) return { ok: false, reason: "artifact_hash_mismatch" };
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("studio_sites")
    .select("status, bundle_hash")
    .eq("host", host)
    .maybeSingle();
  const row = data as { status?: string; bundle_hash?: string } | null;
  if (!row) return { ok: false, reason: "pointer_missing" };
  if (row.status !== "live") return { ok: false, reason: `pointer_not_live:${row.status}` };
  if (String(row.bundle_hash ?? "").toLowerCase() !== approvedHash.toLowerCase()) {
    return { ok: false, reason: "pointer_hash_mismatch" };
  }
  return { ok: true };
}

/** Escalate + stall a job whose deploy failed post-check (never leave it half-live). */
async function failDeploy(job: BuildJobRow, host: string, reason: string): Promise<DeployResult> {
  await appendBuildEvent(job.id, "deploy_failed", { reason, host });
  // Stop serving a failed/mismatched deploy immediately (instant, reversible).
  await disableSite(host).catch(() => undefined);
  // deploying → stalled (legal); a job that cannot deploy stops and escalates.
  await transitionJob({ jobId: job.id, to: "stalled", reason: `deploy_${reason}`, actor: "orchestrator" });
  await escalateJob(job, "deploy_check_failed");
  await queueDecision({
    jobId: job.id,
    projectId: job.projectId,
    kind: "deploy_check_failed",
    title: "A deploy check failed",
    body: `The site could not be safely released (${reason.replaceAll("_", " ")}). It was rolled back and needs a look.`,
    actionKey: "studio.build.job.review",
    payload: { reason },
  });
  return { ok: false, reason };
}

/**
 * The resumable, idempotent, hash-pinned deploy core. Called by the tick
 * (orchestrator-automated) and by the owner-gated manual route. Actor is the
 * orchestrator ('orchestrator') or the owner's id — never client-supplied.
 */
export async function executeOrchestratedDeploy(input: {
  jobId: string;
  actor: string;
  sitesBaseDomain: string;
}): Promise<DeployResult> {
  if (!hasAdminSupabaseEnv()) return { ok: false, reason: "no_admin_env" };

  const job = await getBuildJob(input.jobId);
  if (!job) return { ok: false, reason: "job_not_found" };
  // The ONLY entry stages. A `live` (or any other) job is not re-deployable —
  // this is what makes a replayed deploy a no-op, never a double-deploy.
  if (!isDeployable(job.stage)) return { ok: false, reason: `not_deployable:${job.stage}` };

  const host = siteHostForProject(job.projectId, input.sitesBaseDomain);

  // HASH PIN — bind to the WRITE-ONCE hash the owner reauth-approved, never the
  // mutable artifact_hash column. A post-approval job MUST carry an approved
  // hash (approve-deploy sets it write-once); its absence is an anomaly, so fail
  // CLOSED rather than fall back to the mutable hash. If the current
  // artifact_hash has DIVERGED from what was approved (a swap attempt), also fail
  // closed (the DB trigger blocks the swap at the source too — belt and braces).
  const approvedHash = job.approvedArtifactHash;
  if (!approvedHash) {
    return failDeploy(job, host, "no_approved_hash");
  }
  if (job.artifactHash && approvedHash !== job.artifactHash) {
    return failDeploy(job, host, "artifact_hash_diverged");
  }

  // approved_for_deploy → deploying (CAS on the prior stage). Exactly one worker
  // wins; a loser (or a resume where the job is already `deploying`) skips this.
  if (canBeginDeploy(job.stage)) {
    const moved = await transitionJob({ jobId: job.id, to: "deploying", reason: "deploy_started", actor: input.actor });
    if (!moved.ok) return { ok: false, reason: `transition_${moved.reason}` };
  }

  // HASH PIN — refuse to serve anything but the exact approved bundle.
  if (!(await verifyStoredBundleHash(approvedHash))) {
    return failDeploy(job, host, "artifact_hash_mismatch");
  }

  // Flip the host pointer to live (idempotent upsert; re-verifies the hash again).
  const live = await goLive({ host, jobId: job.id, projectId: job.projectId, approvedHash });
  if (!live.ok) return failDeploy(job, host, live.reason ?? "go_live_failed");

  // Post-deploy checks before the job is called live.
  const post = await runPostDeployChecks(host, approvedHash);
  if (!post.ok) return failDeploy(job, host, post.reason ?? "post_deploy_check_failed");

  // Record completion BEFORE flipping the JOB to live (ARCHITECTURE §3.5): a
  // crash after this still resumes cleanly (goLive is idempotent).
  await appendBuildEvent(job.id, "deployed", { host, artifact_hash: approvedHash, actor: input.actor });

  const flipped = await transitionJob({
    jobId: job.id,
    to: "live",
    reason: "deploy_complete",
    actor: input.actor,
    patch: { preview_ref: host },
  });
  if (!flipped.ok) {
    // The site is live; the job row could not advance (a concurrent move). The
    // pointer + the 'deployed' event are the durable truth; a later read reconciles.
    return { ok: false, reason: `flip_${flipped.reason}` };
  }

  emitEvent({
    name: "henry.studio.build.deployed",
    classification: "system_state",
    outcome: "completed",
    actorId: input.actor !== "orchestrator" ? input.actor : undefined,
    payload: { job_id: job.id, project_id: job.projectId, host },
  });

  // Resolve any pending deploy-approval decision — the inbox item is done.
  await supersedeDecisions(job.id, ["deploy_approval"]).catch(() => undefined);

  // Templated site_live — no tap (ratified SA-D1 carve-out). Best-effort; the
  // deploying→live transition happens once, so this sends once.
  try {
    const admin = createAdminSupabase();
    const { data: projectRow } = await admin
      .from("studio_projects")
      .select("id, title, normalized_email")
      .eq("id", job.projectId)
      .maybeSingle();
    const project = projectRow as Record<string, unknown> | null;
    if (project) {
      await sendSiteLive(
        {
          id: String(project.id),
          title: String(project.title ?? "your site"),
          normalizedEmail: (project.normalized_email as string) ?? null,
          accessKey: "",
        },
        `https://${host}`,
      );
    }
  } catch {
    // notification best-effort — the site is live; the audit trail is complete.
  }

  return { ok: true, host };
}

/**
 * SA-2-compatible entry (owner-gated manual route / console override). Delegates
 * to the resumable core so there is ONE deploy path with one set of guarantees.
 */
export async function runDeploy(input: {
  jobId: string;
  actor: string;
  sitesBaseDomain: string;
}): Promise<DeployResult> {
  return executeOrchestratedDeploy(input);
}
