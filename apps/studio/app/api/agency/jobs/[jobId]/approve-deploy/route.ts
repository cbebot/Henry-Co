import { NextResponse, type NextRequest } from "next/server";

import { requireSensitiveAction } from "@henryco/auth/server/sensitive-action-guard";
import { getStudioViewer, viewerHasRole } from "@/lib/studio/auth";
import { getBuildJob, transitionJob, appendBuildEvent } from "@/lib/agency/store";

/**
 * POST /api/agency/jobs/[jobId]/approve-deploy — the HARD human gate
 * (SAFETY-MODEL §6). The ONLY way a job reaches `approved_for_deploy`, and
 * therefore the only way it can EVER reach `deploying`. Order mirrors the
 * shipped founder-confirm spine:
 *
 *   1. owner role (studio_owner) — independent re-authorization.
 *   2. requireSensitiveAction — fresh password step-up (hc_last_reauth, 5-min),
 *      BEFORE the state move so a challenged approval stays re-confirmable.
 *   3. verify the job is actually in owner_review (drift guard).
 *   4. audit-first-abort transition owner_review → approved_for_deploy.
 *
 * No auto-execute tier exists: this route is reachable only by a human tap,
 * and nothing else can produce the approved stage. The deploy RUN (the live
 * flip) is a separate staff-manual step that re-verifies the artifact hash.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, ctx: { params: Promise<{ jobId: string }> }): Promise<Response> {
  const { jobId } = await ctx.params;

  // 1. Owner-only. (SA-D1: deploy stays with the owner — never delegated.)
  const viewer = await getStudioViewer();
  if (!viewer.user || !viewerHasRole(viewer, ["studio_owner"])) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  // 2. Fresh password step-up. Reauth-gated, exactly like owner.social.post /
  //    owner.studio.deploy.approve. Runs before the state move.
  const guard = await requireSensitiveAction(request, {
    action: "studio.build.deploy.approve",
    entityType: "studio_build_job",
    resolveUser: async () => viewer.user,
    userId: (user) => user!.id,
  });
  if (!guard.ok) return guard.response;

  // 3. Drift guard — the job must still be awaiting owner review.
  const job = await getBuildJob(jobId);
  if (!job) return NextResponse.json({ error: "Job not found." }, { status: 404 });
  if (job.stage !== "owner_review") {
    return NextResponse.json({ error: "Job is not awaiting owner approval.", stage: job.stage }, { status: 409 });
  }
  // The artifact must be pinned before approval — you approve a specific hash.
  if (!job.artifactHash) {
    return NextResponse.json({ error: "No pinned artifact to approve." }, { status: 409 });
  }

  await appendBuildEvent(jobId, "deploy_approved", {
    actor: viewer.user.id,
    artifact_hash: job.artifactHash,
    reauth_at: guard.context.reauthAt,
  });

  // 4. audit-first-abort transition (the single choke point). Capture the
  //    approved hash into the WRITE-ONCE approved_artifact_hash column — the
  //    deploy binds to THIS exact hash, so a post-approval swap of the mutable
  //    artifact_hash cannot reach production (adversarial hardening).
  const moved = await transitionJob({
    jobId,
    to: "approved_for_deploy",
    reason: "owner_approved_deploy",
    actor: viewer.user.id,
    patch: { approved_artifact_hash: job.artifactHash },
  });
  if (!moved.ok) {
    return NextResponse.json({ error: "Could not record the approval.", reason: moved.reason }, { status: 409 });
  }

  return NextResponse.json({ ok: true, stage: moved.job.stage, artifactHash: job.artifactHash });
}
