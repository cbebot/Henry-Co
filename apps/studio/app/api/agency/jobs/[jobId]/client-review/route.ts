import { NextResponse, type NextRequest } from "next/server";

import { emitEvent } from "@henryco/observability/events";

import { createAdminSupabase, hasAdminSupabaseEnv } from "@/lib/supabase";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getStudioViewer } from "@/lib/studio/auth";
import {
  clientOwnsProject,
  PROJECT_OWNER_COLUMNS,
  type ProjectOwnerRow,
} from "@/lib/studio/project-access";
import { getBuildJob, transitionJob, appendBuildEvent, countBuildEvents } from "@/lib/agency/store";
import { queueDecision } from "@/lib/agency/decisions";
import { revisionRoundsExhausted, MAX_CLIENT_REVISION_ROUNDS } from "@/lib/agency/review-window";
import { postBuildSystemMessage, sendChangesReceived } from "@/lib/studio/email/agency";

/**
 * POST /api/agency/jobs/[jobId]/client-review — the CLIENT-facing preview
 * review action (SA-3). Body: { action: "approve" | "request_changes", notes? }.
 *
 * IDOR-safe by construction (V3-73 clientOwnsProject doctrine): writes go
 * through the service-role admin client only AFTER a server-side ownership
 * re-verify — a client can never act on another client's build job. The state
 * moves go through the SINGLE choke point (transitionJob); the state machine
 * forbids any jump toward deploy.
 *
 *   - approve → client_review → owner_review, and a deploy-approval decision is
 *     queued into the owner's inbox. The client CANNOT deploy; only the
 *     reauth-gated owner tap can. Client silence never reaches here — this is an
 *     explicit approval only.
 *   - request_changes → bounded rounds (SA-D2). Within the included rounds the
 *     job re-queues for another pass; beyond them it becomes an owner decision.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = { action?: "approve" | "request_changes"; notes?: string };

export async function POST(request: NextRequest, ctx: { params: Promise<{ jobId: string }> }): Promise<Response> {
  const { jobId } = await ctx.params;

  const viewer = await getStudioViewer();
  if (!viewer.user) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }
  if (!hasAdminSupabaseEnv()) {
    return NextResponse.json({ ok: false, error: "unavailable" }, { status: 503 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const action = body.action;
  if (action !== "approve" && action !== "request_changes") {
    return NextResponse.json({ ok: false, error: "action_required" }, { status: 400 });
  }

  const admin = createAdminSupabase();

  const job = await getBuildJob(jobId);
  if (!job) return NextResponse.json({ ok: false, error: "job_not_found" }, { status: 404 });

  // Ownership re-verify — the IDOR wall. Resolve the job's project, then confirm
  // THIS viewer owns it (by user id, verified email, or business membership).
  const { data: projectRow } = await admin
    .from("studio_projects")
    .select(PROJECT_OWNER_COLUMNS)
    .eq("id", job.projectId)
    .maybeSingle<ProjectOwnerRow>();
  if (!projectRow) return NextResponse.json({ ok: false, error: "project_not_found" }, { status: 404 });

  const owns = await clientOwnsProject(admin, projectRow, viewer.user.id, viewer.normalizedEmail);
  if (!owns) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

  // The job must actually be awaiting the client's review (drift guard).
  if (job.stage !== "client_review") {
    return NextResponse.json({ ok: false, error: "not_in_client_review", stage: job.stage }, { status: 409 });
  }

  if (action === "approve") {
    await appendBuildEvent(jobId, "client_approved", { by: "client", actor: viewer.user.id });
    const moved = await transitionJob({
      jobId,
      to: "owner_review",
      reason: "client_approved_preview",
      actor: viewer.user.id,
    });
    if (!moved.ok) return NextResponse.json({ ok: false, error: moved.reason }, { status: 409 });

    emitEvent({
      name: "henry.studio.build.client_reviewed",
      classification: "user_action",
      outcome: "approved",
      actorId: viewer.user.id,
      payload: { job_id: jobId, project_id: job.projectId },
    });
    await auditClientReview(jobId, job.projectId, "approved", viewer.user.id);

    // Queue the owner's one-tap deploy approval immediately (idempotent).
    await queueDecision({
      jobId,
      projectId: job.projectId,
      kind: "deploy_approval",
      title: "A site is ready to deploy",
      body: "The client approved their preview. Approve the deploy (one tap + password) and the orchestrator releases the exact reviewed build.",
      actionKey: "studio.build.deploy.approve",
      payload: { artifact_hash: job.artifactHash },
    });
    await postBuildSystemMessage({
      projectId: job.projectId,
      body: "Thank you — your preview is approved. Our team does one final check, then your site goes live.",
      messageType: "system",
    });

    return NextResponse.json({ ok: true, stage: "owner_review" });
  }

  // action === "request_changes"
  const notes = String(body.notes || "").trim();
  if (!notes) return NextResponse.json({ ok: false, error: "notes_required" }, { status: 400 });

  const roundsUsed = await countBuildEvents(jobId, "client_changes_requested");
  if (revisionRoundsExhausted(roundsUsed)) {
    // Beyond the included rounds — the owner decides (a Mode-B add-on, deferred).
    // The job STAYS in client_review; nothing auto-advances or auto-rebuilds.
    await queueDecision({
      jobId,
      projectId: job.projectId,
      kind: "review_stalled",
      title: "A client wants more changes than are included",
      body: `This client has used their ${MAX_CLIENT_REVISION_ROUNDS} included revision rounds and asked for more. Decide how to proceed.`,
      actionKey: "studio.build.job.review",
    });
    return NextResponse.json(
      { ok: false, error: "revision_rounds_exhausted", included: MAX_CLIENT_REVISION_ROUNDS },
      { status: 409 },
    );
  }

  await appendBuildEvent(jobId, "client_changes_requested", {
    round: roundsUsed + 1,
    actor: viewer.user.id,
    notes: notes.slice(0, 4000),
  });
  const toChanges = await transitionJob({
    jobId,
    to: "changes_requested",
    reason: "client_requested_changes",
    actor: viewer.user.id,
  });
  if (!toChanges.ok) return NextResponse.json({ ok: false, error: toChanges.reason }, { status: 409 });

  emitEvent({
    name: "henry.studio.build.client_reviewed",
    classification: "user_action",
    outcome: "blocked",
    actorId: viewer.user.id,
    payload: { job_id: jobId, project_id: job.projectId, round: roundsUsed + 1 },
  });
  await auditClientReview(jobId, job.projectId, "changes_requested", viewer.user.id);

  // Templated ack (no tap) + re-queue for another pass (attempt++ so a stale
  // callback from the superseded run is rejected).
  await sendChangesReceived({
    id: job.projectId,
    title: "your project",
    normalizedEmail: projectRow.normalized_email,
    accessKey: "",
  }).catch(() => undefined);
  await transitionJob({
    jobId,
    to: "queued",
    reason: "revision_requeued",
    actor: viewer.user.id,
    patch: { attempt: job.attempt + 1 },
  });

  return NextResponse.json({ ok: true, stage: "queued", roundsUsed: roundsUsed + 1 });
}

async function auditClientReview(
  jobId: string,
  projectId: string,
  verdict: "approved" | "changes_requested",
  actorUserId: string,
): Promise<void> {
  try {
    // Use the caller's session client so add_audit_log_v2 resolves auth.uid() to
    // the acting client (attribution), like the deliverable-approval route.
    const supabase = await createSupabaseServer();
    await supabase.rpc("add_audit_log_v2", {
      p_action: `studio.build.client_review.${verdict}`,
      p_entity_type: "studio_build_job",
      p_entity_id: jobId,
      p_old_values: null,
      p_new_values: { verdict, project_id: projectId, actor: actorUserId },
      p_reason: null,
      p_division: "studio",
      p_correlation_id: jobId,
    });
  } catch {
    // audit best-effort — transitionJob already wrote the primary audit row.
  }
}
