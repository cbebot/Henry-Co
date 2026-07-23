"use server";

/**
 * SA-2 — agency console + client-review server actions. Each gates its actor
 * (staff via requireStudioRoles-style role check; client via project-workspace
 * access) and funnels state moves through the single choke point (transitionJob).
 *
 * SA-2 client review is STAFF-MEDIATED (ARCHITECTURE §SA-2 interim): the staff
 * post the preview into the thread and record the client's approval by action;
 * the purpose-built portal review UX is SA-3. So the client-review advance is a
 * staff action here, recorded as client-approved.
 */

import { getOptionalEnv } from "@/lib/env";
import { getStudioViewer, viewerHasRole } from "@/lib/studio/auth";
import { createAdminSupabase, hasAdminSupabaseEnv } from "@/lib/supabase";
import { isStudioAgencyEnabled } from "@/lib/agency/flag";
import { createBuildJobFromProject } from "@/lib/agency/spec";
import { getBuildJob, transitionJob, appendBuildEvent } from "@/lib/agency/store";
import { resolveDecision, supersedeDecisions } from "@/lib/agency/decisions";
import { sendBuildStarted, sendPreviewReady, sendChangesReceived, postBuildSystemMessage } from "@/lib/studio/email/agency";

const AGENCY_CALLBACK_KEY_ID = "studio-agency-v1";

type ActionResult = { ok: true; detail?: string } | { ok: false; error: string };

async function requireOwnerActor() {
  const viewer = await getStudioViewer();
  if (!viewer.user || !viewerHasRole(viewer, ["studio_owner"])) return null;
  return viewer.user;
}

/**
 * Create a build job from a paid, template-class project. Owner-gated;
 * card-rail-only enforcement + agency-class rejection live inside
 * createBuildJobFromProject (defense in depth).
 */
export async function createBuildJobAction(input: { projectId: string; isInternal?: boolean }): Promise<ActionResult> {
  if (!isStudioAgencyEnabled()) return { ok: false, error: "agency_disabled" };
  const owner = await requireOwnerActor();
  if (!owner) return { ok: false, error: "not_authorized" };

  const callbackBaseUrl =
    getOptionalEnv("STUDIO_AGENCY_BASE_URL") || getOptionalEnv("NEXT_PUBLIC_STUDIO_BASE_URL") || "";
  if (!callbackBaseUrl) return { ok: false, error: "base_url_unset" };

  // Card-rail-only: the project must have a card-settled paid payment (the
  // unledgered wallet path is NOT widened for agency revenue, MONEY-MODEL §2).
  if (hasAdminSupabaseEnv() && !input.isInternal) {
    const admin = createAdminSupabase();
    const { data: paid } = await admin
      .from("studio_payments")
      .select("id, method, status")
      .eq("project_id", input.projectId)
      .eq("status", "paid")
      .limit(50);
    const rows = (paid as { method?: string; status?: string }[] | null) ?? [];
    const cardPaid = rows.some((r) => String(r.method ?? "").toLowerCase().includes("card"));
    if (!cardPaid) return { ok: false, error: "no_card_payment" };
  }

  const result = await createBuildJobFromProject({
    projectId: input.projectId,
    callbackBaseUrl,
    callbackKeyId: AGENCY_CALLBACK_KEY_ID,
    isInternal: input.isInternal,
    actor: owner.id,
  });
  if (!result.ok) return { ok: false, error: result.reason };
  return { ok: true, detail: result.jobId };
}

/**
 * Record the client's approval of the preview (SA-2 staff-mediated). Advances
 * client_review → owner_review so the owner's one-tap+reauth deploy gate opens.
 * Staff-only; the client's approval is captured by the staffer who spoke to them.
 */
export async function recordClientApprovalAction(input: { jobId: string }): Promise<ActionResult> {
  const owner = await requireOwnerActor();
  if (!owner) return { ok: false, error: "not_authorized" };
  const job = await getBuildJob(input.jobId);
  if (!job) return { ok: false, error: "job_not_found" };
  if (job.stage !== "client_review") return { ok: false, error: `wrong_stage:${job.stage}` };

  await appendBuildEvent(input.jobId, "client_approved", { by: "staff_mediated", actor: owner.id });
  const moved = await transitionJob({
    jobId: input.jobId,
    to: "owner_review",
    reason: "client_approved_staff_mediated",
    actor: owner.id,
  });
  return moved.ok ? { ok: true } : { ok: false, error: moved.reason };
}

/** Record a client change request → changes_requested (re-arms a retry via the tick). */
export async function recordChangesRequestedAction(input: { jobId: string }): Promise<ActionResult> {
  const owner = await requireOwnerActor();
  if (!owner) return { ok: false, error: "not_authorized" };
  const job = await getBuildJob(input.jobId);
  if (!job) return { ok: false, error: "job_not_found" };
  if (job.stage !== "client_review" && job.stage !== "owner_review") {
    return { ok: false, error: `wrong_stage:${job.stage}` };
  }
  const moved = await transitionJob({
    jobId: input.jobId,
    to: "changes_requested",
    reason: "client_requested_changes",
    actor: owner.id,
  });
  if (!moved.ok) return { ok: false, error: moved.reason };

  // Leaving owner_review invalidates any pending deploy-approval in the inbox.
  await supersedeDecisions(input.jobId, ["deploy_approval"]).catch(() => undefined);

  // Templated ack (no tap) + re-queue for another pass.
  try {
    const admin = createAdminSupabase();
    const { data: projectRow } = await admin
      .from("studio_projects")
      .select("id, title, normalized_email")
      .eq("id", job.projectId)
      .maybeSingle();
    const project = projectRow as Record<string, unknown> | null;
    if (project) {
      await sendChangesReceived({
        id: String(project.id),
        title: String(project.title ?? "your project"),
        normalizedEmail: (project.normalized_email as string) ?? null,
        accessKey: "",
      });
    }
  } catch {
    // best-effort
  }
  // changes_requested → queued (attempt++) for the rebuild.
  await transitionJob({
    jobId: input.jobId,
    to: "queued",
    reason: "revision_requeued",
    actor: owner.id,
    patch: { attempt: job.attempt + 1 },
  });
  return { ok: true };
}

/**
 * Staff posts the QA-passed preview into the project thread (SA-2 interim
 * client review). Templated, no tap.
 */
export async function postPreviewToThreadAction(input: { jobId: string; previewUrl: string }): Promise<ActionResult> {
  const owner = await requireOwnerActor();
  if (!owner) return { ok: false, error: "not_authorized" };
  const job = await getBuildJob(input.jobId);
  if (!job) return { ok: false, error: "job_not_found" };

  if (hasAdminSupabaseEnv()) {
    const admin = createAdminSupabase();
    const { data: projectRow } = await admin
      .from("studio_projects")
      .select("id, title, normalized_email")
      .eq("id", job.projectId)
      .maybeSingle();
    const project = projectRow as Record<string, unknown> | null;
    if (project) {
      await sendPreviewReady(
        {
          id: String(project.id),
          title: String(project.title ?? "your project"),
          normalizedEmail: (project.normalized_email as string) ?? null,
          accessKey: "",
        },
        input.previewUrl,
      );
    }
  }
  await postBuildSystemMessage({
    projectId: job.projectId,
    body: `Preview ready to review: ${input.previewUrl}`,
    messageType: "approval_request",
  });
  return { ok: true };
}

/**
 * Resolve a server-initiated decision from the inbox (owner one-tap: act or
 * dismiss). Owner-gated; CAS on status='pending' inside resolveDecision so a
 * double-tap cannot double-resolve. This NEVER authorizes anything itself —
 * a `deploy_approval` still requires the separate reauth-gated approve-deploy
 * route; this only clears the inbox item.
 */
export async function resolveAgencyDecisionAction(input: {
  decisionId: string;
  status: "acted" | "dismissed";
}): Promise<ActionResult> {
  const owner = await requireOwnerActor();
  if (!owner) return { ok: false, error: "not_authorized" };
  const ok = await resolveDecision({ decisionId: input.decisionId, status: input.status, actor: owner.id });
  return ok ? { ok: true } : { ok: false, error: "already_resolved" };
}

/** Owner dispatches a queued job immediately (in addition to the cron tick). */
export async function dispatchBuildStartedNotice(input: { jobId: string }): Promise<ActionResult> {
  const owner = await requireOwnerActor();
  if (!owner) return { ok: false, error: "not_authorized" };
  const job = await getBuildJob(input.jobId);
  if (!job) return { ok: false, error: "job_not_found" };
  if (hasAdminSupabaseEnv()) {
    const admin = createAdminSupabase();
    const { data: projectRow } = await admin
      .from("studio_projects")
      .select("id, title, normalized_email")
      .eq("id", job.projectId)
      .maybeSingle();
    const project = projectRow as Record<string, unknown> | null;
    if (project) {
      await sendBuildStarted({
        id: String(project.id),
        title: String(project.title ?? "your project"),
        normalizedEmail: (project.normalized_email as string) ?? null,
        accessKey: "",
      });
    }
  }
  return { ok: true };
}
