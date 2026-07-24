import "server-only";

/**
 * SA-4 — hub-local WRITE cores for the owner.studio.* founder actions.
 *
 * Each core MIRRORS the studio console's guarded write path (the F3 doctrine:
 * `applyKycReview` mirrors the staff KYC route; these mirror
 * apps/studio/lib/agency — transitionJob's audit-first + stage-CAS discipline,
 * approve-deploy's hash pinning, releaseStudioProposal's in_review release).
 * They run ONLY from the founder confirm route, which has already enforced:
 * requireOwner → (requiresReauth ⇒ requireSensitiveAction) → CAS claim →
 * driftKeys re-read. The DB is the second wall: the transition trigger rejects
 * illegal edges, artifact_hash is immutable post-build, approved_artifact_hash
 * is write-once, and every table is deny-RLS.
 *
 * Invariants:
 *  - AUDIT-FIRST-ABORT on every core: no trail, no action.
 *  - Stage moves are CAS on the prior stage (a concurrent tick cannot be
 *    double-moved over).
 *  - NEVER touch artifact_hash. approved_artifact_hash is written exactly at
 *    the approve gate, from the SERVER-READ artifact hash — never from params.
 *  - Money: no ledger/RPC calls anywhere here. budget_kobo moves only by a
 *    server-computed preset step over the server-read envelope.
 *  - Every outcome emits henry.studio.operator.action (ids + outcome only).
 */

import { COMPANY } from "@henryco/config";
import { contactSafety } from "@henryco/contact-safety";
import { writeAuditLog } from "@henryco/observability/audit-log";
import { emitEvent } from "@henryco/observability/events";
import { createAdminSupabase } from "@/lib/supabase";
import {
  computeBudgetIncreaseKobo,
  isAgencyCancellable,
  isAgencyPausable,
  OPERATOR_HOLD_SENTINEL,
} from "@/lib/founder-intelligence/studio-agency-model";
import { getAgencyJob, getStudioProject, isStudioAgencyLiveHub } from "@/lib/studio-agency-read";

type ApplyResult = { ok: true; executionRef: string } | { ok: false; error: string };

const STUDIO_TEAM_SENDER = `${COMPANY.group.name} Studio`;

function operatorActionEvent(action: string, outcome: "completed" | "failed", payload: Record<string, unknown>): void {
  emitEvent({
    name: "henry.studio.operator.action",
    classification: "system_state",
    outcome,
    payload: { action, ...payload },
  });
}

async function appendJobEvent(jobId: string, kind: string, payload: Record<string, unknown>): Promise<void> {
  try {
    const admin = createAdminSupabase();
    await admin.from("studio_build_events").insert({ job_id: jobId, kind, payload } as never);
  } catch {
    // append-only telemetry — a lost event is a nuisance, not a failure path.
  }
}

async function auditFirst(input: {
  action: string;
  entityType: string;
  entityId: string;
  oldValues: Record<string, unknown>;
  newValues: Record<string, unknown>;
  reason: string;
}): Promise<boolean> {
  try {
    const admin = createAdminSupabase();
    await writeAuditLog(admin as never, {
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      oldValues: input.oldValues,
      newValues: input.newValues,
      reason: input.reason,
      division: "studio",
      correlationId: input.entityId,
    });
    return true;
  } catch {
    return false;
  }
}

/** CAS stage move mirroring the studio transitionJob discipline. */
async function casStageMove(input: {
  jobId: string;
  from: string;
  to: string;
  reason: string;
  actorId: string;
  patch?: Record<string, unknown>;
}): Promise<boolean> {
  const admin = createAdminSupabase();
  await appendJobEvent(input.jobId, "transition", {
    from: input.from,
    to: input.to,
    reason: input.reason,
    actor: input.actorId,
    via: "founder_action",
  });
  const audited = await auditFirst({
    action: `studio.build.job.${input.to}`,
    entityType: "studio_build_job",
    entityId: input.jobId,
    oldValues: { stage: input.from },
    newValues: { stage: input.to, ...(input.patch ?? {}) },
    reason: input.reason,
  });
  if (!audited) return false;
  const { data, error } = await admin
    .from("studio_build_jobs")
    .update({
      stage: input.to,
      updated_at: new Date().toISOString(),
      ...(input.patch ?? {}),
    } as never)
    .eq("id", input.jobId)
    .eq("stage", input.from)
    .select("id")
    .maybeSingle();
  return !error && Boolean(data);
}

/** Supersede/act a pending SA-3 studio decision row (inbox hygiene; CAS on pending). */
async function settleStudioDecision(jobId: string, kind: string, status: "acted" | "superseded", actorId: string): Promise<void> {
  try {
    const admin = createAdminSupabase();
    await admin
      .from("studio_agency_decisions")
      .update({ status, acted_by: actorId, acted_at: new Date().toISOString(), updated_at: new Date().toISOString() } as never)
      .eq("job_id", jobId)
      .eq("kind", kind)
      .eq("status", "pending");
  } catch {
    // hygiene only — never authoritative.
  }
}

// ── owner.studio.proposal.send ───────────────────────────────────────────────

export type ProposalSendState = {
  proposalId: string;
  status: string;
  title: string;
};

export async function readStudioProposalForSend(proposalId: string): Promise<ProposalSendState | null> {
  if (!isStudioAgencyLiveHub()) return null;
  try {
    const admin = createAdminSupabase();
    const { data, error } = await admin
      .from("studio_proposals")
      .select("id, lead_id, status, title")
      .eq("id", proposalId)
      .maybeSingle();
    if (error || !data) return null;
    const row = data as Record<string, unknown>;
    // Only a held (in_review) proposal is releasable — SA-D5's gate.
    if (String(row.status) !== "in_review") return null;
    return {
      proposalId: String(row.id),
      status: String(row.status),
      title: String(row.title ?? "Proposal"),
    };
  } catch {
    return null;
  }
}

/**
 * Release a held proposal to the client (in_review → sent + lead →
 * proposal_sent) — the hub mirror of releaseStudioProposal's status flips.
 * The client sees it in their portal immediately. Note: the studio app's
 * proposal-notification EMAIL rides the studio template registry, which is
 * studio-app-internal — the staff console path still sends it; this core
 * records the release honestly without inventing a second email rail.
 */
export async function applyStudioProposalSend(input: {
  proposalId: string;
  actorId: string;
}): Promise<ApplyResult> {
  if (!isStudioAgencyLiveHub()) return { ok: false, error: "The studio agency is not live." };
  const admin = createAdminSupabase();

  const audited = await auditFirst({
    action: "founder.owner.studio.proposal.send",
    entityType: "studio_proposal",
    entityId: input.proposalId,
    oldValues: { status: "in_review" },
    newValues: { status: "sent", actor: input.actorId },
    reason: "founder_confirmed",
  });
  if (!audited) return { ok: false, error: "Audit logging failed; nothing was sent." };

  // CAS: only an in_review proposal releases; a double-tap is a no-op error.
  const { data: released, error } = await admin
    .from("studio_proposals")
    .update({ status: "sent", updated_at: new Date().toISOString() } as never)
    .eq("id", input.proposalId)
    .eq("status", "in_review")
    .select("id, lead_id")
    .maybeSingle();
  if (error || !released) {
    operatorActionEvent("proposal.send", "failed", { proposal_id: input.proposalId });
    return { ok: false, error: "This proposal is no longer awaiting release." };
  }

  // Lead advances to proposal_sent (best-effort — the proposal flip is the truth).
  const leadId = String((released as Record<string, unknown>).lead_id ?? "");
  if (leadId) {
    await admin
      .from("studio_leads")
      .update({ status: "proposal_sent", updated_at: new Date().toISOString() } as never)
      .eq("id", leadId)
      .then(() => undefined, () => undefined);
  }

  operatorActionEvent("proposal.send", "completed", { proposal_id: input.proposalId, actor_id: input.actorId });
  return { ok: true, executionRef: `studio_proposal:${input.proposalId}:sent` };
}

// ── owner.studio.deploy.approve (THE hard gate) ──────────────────────────────

export type DeployApproveState = {
  jobId: string;
  stage: string;
  artifactHash: string;
  projectTitle: string;
  budgetNaira: string;
  costNaira: string;
};

export async function readStudioJobForDeployApprove(jobId: string): Promise<Record<string, unknown> | null> {
  if (!isStudioAgencyLiveHub()) return null;
  const job = await getAgencyJob(jobId);
  if (!job) return null;
  // The gate opens ONLY from owner_review, and only over a hash-pinned artifact.
  if (job.stage !== "owner_review") return null;
  if (!job.artifactHash) return null;
  // A prior (write-once) approval pin that no longer matches the artifact can
  // never deploy — show no card rather than a card that must fail.
  if (job.approvedArtifactHash && job.approvedArtifactHash !== job.artifactHash) return null;
  const project = await getStudioProject(job.projectId);
  return {
    jobId: job.id,
    stage: job.stage,
    artifactHash: job.artifactHash,
    projectTitle: project?.title ?? "Studio project",
    budgetKobo: job.budgetKobo,
    costKobo: job.costKobo,
  };
}

export async function applyStudioDeployApprove(input: {
  jobId: string;
  artifactHash: string;
  actorId: string;
}): Promise<ApplyResult> {
  if (!isStudioAgencyLiveHub()) return { ok: false, error: "The studio agency is not live." };
  const job = await getAgencyJob(input.jobId);
  if (!job) return { ok: false, error: "This build job no longer exists." };
  if (job.stage !== "owner_review") return { ok: false, error: "This job is no longer awaiting your approval." };
  // Pin to the hash the owner SAW (drift-checked upstream; re-checked here).
  if (!job.artifactHash || job.artifactHash !== input.artifactHash) {
    return { ok: false, error: "The build changed since you reviewed it. A fresh review card is needed." };
  }

  const moved = await casStageMove({
    jobId: input.jobId,
    from: "owner_review",
    to: "approved_for_deploy",
    reason: "owner_approved_deploy_founder",
    actorId: input.actorId,
    // Write-once capture of the approved hash — the deploy binds to THIS. The
    // DB trigger rejects any later change, and rejects this write too if a
    // different pin already exists (surfaced as an honest failure).
    patch: { approved_artifact_hash: job.artifactHash },
  });
  if (!moved) {
    operatorActionEvent("deploy.approve", "failed", { job_id: input.jobId });
    return { ok: false, error: "The approval could not be recorded — the job moved or the pin was refused." };
  }

  await settleStudioDecision(input.jobId, "deploy_approval", "acted", input.actorId);
  operatorActionEvent("deploy.approve", "completed", { job_id: input.jobId, actor_id: input.actorId });
  return { ok: true, executionRef: `studio_build_job:${input.jobId}:approved_for_deploy` };
}

// ── owner.studio.job.cancel ──────────────────────────────────────────────────

export async function readStudioJobForCancel(jobId: string): Promise<Record<string, unknown> | null> {
  if (!isStudioAgencyLiveHub()) return null;
  const job = await getAgencyJob(jobId);
  if (!job) return null;
  if (!isAgencyCancellable(job.stage)) return null;
  const project = await getStudioProject(job.projectId);
  return {
    jobId: job.id,
    stage: job.stage,
    projectTitle: project?.title ?? "Studio project",
    costKobo: job.costKobo,
  };
}

export async function applyStudioJobCancel(input: { jobId: string; actorId: string }): Promise<ApplyResult> {
  if (!isStudioAgencyLiveHub()) return { ok: false, error: "The studio agency is not live." };
  const job = await getAgencyJob(input.jobId);
  if (!job) return { ok: false, error: "This build job no longer exists." };
  if (!isAgencyCancellable(job.stage)) {
    return { ok: false, error: "This job can no longer be cancelled from its current stage." };
  }

  const moved = await casStageMove({
    jobId: input.jobId,
    from: job.stage,
    to: "cancelled",
    reason: "owner_cancelled_founder",
    actorId: input.actorId,
    // Clear any claim/hold so a terminal row is never left "held".
    patch: { claimed_by: null, claimed_at: null },
  });
  if (!moved) {
    operatorActionEvent("job.cancel", "failed", { job_id: input.jobId });
    return { ok: false, error: "The job moved before the cancel landed. Review it again." };
  }

  await settleStudioDecision(input.jobId, "deploy_approval", "superseded", input.actorId);
  await settleStudioDecision(input.jobId, "budget_increase", "superseded", input.actorId);
  operatorActionEvent("job.cancel", "completed", { job_id: input.jobId, actor_id: input.actorId });
  return { ok: true, executionRef: `studio_build_job:${input.jobId}:cancelled` };
}

// ── owner.studio.job.budget_increase ─────────────────────────────────────────

export async function readStudioJobForBudgetIncrease(
  jobId: string,
  step: "10" | "25" | "50",
): Promise<Record<string, unknown> | null> {
  if (!isStudioAgencyLiveHub()) return null;
  const job = await getAgencyJob(jobId);
  if (!job) return null;
  // Only an active or stalled job has an envelope worth raising.
  if (!isAgencyCancellable(job.stage)) return null;
  if (job.budgetKobo <= 0) return null;
  const newBudgetKobo = computeBudgetIncreaseKobo(job.budgetKobo, step);
  if (newBudgetKobo <= job.budgetKobo) return null;
  const project = await getStudioProject(job.projectId);
  return {
    jobId: job.id,
    stage: job.stage,
    projectTitle: project?.title ?? "Studio project",
    budgetKobo: job.budgetKobo,
    costKobo: job.costKobo,
    step,
    newBudgetKobo, // SERVER-computed — the model only named the preset step.
  };
}

export async function applyStudioJobBudgetIncrease(input: {
  jobId: string;
  step: "10" | "25" | "50";
  actorId: string;
}): Promise<ApplyResult> {
  if (!isStudioAgencyLiveHub()) return { ok: false, error: "The studio agency is not live." };
  const admin = createAdminSupabase();
  const job = await getAgencyJob(input.jobId);
  if (!job) return { ok: false, error: "This build job no longer exists." };
  if (!isAgencyCancellable(job.stage)) {
    return { ok: false, error: "This job's envelope can no longer be raised." };
  }
  const newBudgetKobo = computeBudgetIncreaseKobo(job.budgetKobo, input.step);
  if (newBudgetKobo <= job.budgetKobo) return { ok: false, error: "The increase computed to nothing." };

  const audited = await auditFirst({
    action: "founder.owner.studio.job.budget_increase",
    entityType: "studio_build_job",
    entityId: input.jobId,
    oldValues: { budget_kobo: job.budgetKobo, stage: job.stage },
    newValues: { budget_kobo: newBudgetKobo, step: input.step, actor: input.actorId },
    reason: "founder_confirmed",
  });
  if (!audited) return { ok: false, error: "Audit logging failed; the envelope was not changed." };

  // Same-stage patch (the trigger's same-stage path allows it — no immutable
  // column is touched), CAS on BOTH stage and the prior budget so a concurrent
  // increase or accrual race cannot compound silently.
  const { data, error } = await admin
    .from("studio_build_jobs")
    .update({ budget_kobo: newBudgetKobo, updated_at: new Date().toISOString() } as never)
    .eq("id", input.jobId)
    .eq("stage", job.stage)
    .eq("budget_kobo", job.budgetKobo)
    .select("id")
    .maybeSingle();
  if (error || !data) {
    operatorActionEvent("job.budget_increase", "failed", { job_id: input.jobId });
    return { ok: false, error: "The job changed before the increase landed. Review it again." };
  }
  await appendJobEvent(input.jobId, "budget_increased", {
    from_kobo: job.budgetKobo,
    to_kobo: newBudgetKobo,
    step: input.step,
    actor: input.actorId,
    via: "founder_action",
  });

  // A stalled job re-arms so the raised envelope actually resumes work.
  if (job.stage === "stalled") {
    await casStageMove({
      jobId: input.jobId,
      from: "stalled",
      to: "queued",
      reason: "budget_increase_rearm",
      actorId: input.actorId,
    });
  }

  await settleStudioDecision(input.jobId, "budget_increase", "acted", input.actorId);
  operatorActionEvent("job.budget_increase", "completed", { job_id: input.jobId, actor_id: input.actorId, step: input.step });
  return { ok: true, executionRef: `studio_build_job:${input.jobId}:budget:${newBudgetKobo}` };
}

// ── owner.studio.job.pause / resume (claim-hold, NOT a stage) ────────────────

export async function readStudioJobForHold(
  jobId: string,
  intent: "pause" | "resume",
): Promise<Record<string, unknown> | null> {
  if (!isStudioAgencyLiveHub()) return null;
  const job = await getAgencyJob(jobId);
  if (!job) return null;
  const held = job.claimedBy === OPERATOR_HOLD_SENTINEL;
  if (intent === "pause") {
    if (!isAgencyPausable(job.stage)) return null;
    if (held) return null; // no-op guard at propose — already paused.
    // The tick currently holds the claim — pausing now would fight it; no card.
    if (job.claimedBy) return null;
  } else {
    if (!held) return null; // only an operator-held job can resume.
  }
  const project = await getStudioProject(job.projectId);
  return {
    jobId: job.id,
    stage: job.stage,
    holdState: held ? "held" : "free",
    projectTitle: project?.title ?? "Studio project",
    intent,
  };
}

export async function applyStudioJobHold(input: {
  jobId: string;
  intent: "pause" | "resume";
  actorId: string;
}): Promise<ApplyResult> {
  if (!isStudioAgencyLiveHub()) return { ok: false, error: "The studio agency is not live." };
  const admin = createAdminSupabase();
  const job = await getAgencyJob(input.jobId);
  if (!job) return { ok: false, error: "This build job no longer exists." };

  const audited = await auditFirst({
    action: `founder.owner.studio.job.${input.intent}`,
    entityType: "studio_build_job",
    entityId: input.jobId,
    oldValues: { claimed_by: job.claimedBy, stage: job.stage },
    newValues: { intent: input.intent, actor: input.actorId },
    reason: "founder_confirmed",
  });
  if (!audited) return { ok: false, error: "Audit logging failed; nothing was changed." };

  if (input.intent === "pause") {
    if (!isAgencyPausable(job.stage)) return { ok: false, error: "This job cannot be paused from its current stage." };
    // CAS: only an unclaimed job can be parked (the tick's claim wins races).
    const { data, error } = await admin
      .from("studio_build_jobs")
      .update({ claimed_by: OPERATOR_HOLD_SENTINEL, claimed_at: new Date().toISOString() } as never)
      .eq("id", input.jobId)
      .is("claimed_by", null)
      .select("id")
      .maybeSingle();
    if (error || !data) {
      operatorActionEvent("job.pause", "failed", { job_id: input.jobId });
      return { ok: false, error: "The orchestrator is working this job right now — try again in a minute." };
    }
    await appendJobEvent(input.jobId, "operator_hold", { intent: "pause", actor: input.actorId });
    operatorActionEvent("job.pause", "completed", { job_id: input.jobId, actor_id: input.actorId });
    return { ok: true, executionRef: `studio_build_job:${input.jobId}:paused` };
  }

  // resume — release ONLY our own hold sentinel (never steal a live tick claim).
  const { data, error } = await admin
    .from("studio_build_jobs")
    .update({ claimed_by: null, claimed_at: null } as never)
    .eq("id", input.jobId)
    .eq("claimed_by", OPERATOR_HOLD_SENTINEL)
    .select("id")
    .maybeSingle();
  if (error || !data) {
    operatorActionEvent("job.resume", "failed", { job_id: input.jobId });
    return { ok: false, error: "This job is not paused." };
  }
  await appendJobEvent(input.jobId, "operator_hold", { intent: "resume", actor: input.actorId });
  operatorActionEvent("job.resume", "completed", { job_id: input.jobId, actor_id: input.actorId });
  return { ok: true, executionRef: `studio_build_job:${input.jobId}:resumed` };
}

// ── owner.studio.client.reply ────────────────────────────────────────────────

export async function readStudioProjectForReply(projectId: string): Promise<Record<string, unknown> | null> {
  if (!isStudioAgencyLiveHub()) return null;
  const project = await getStudioProject(projectId);
  if (!project) return null;
  return {
    projectId: project.id,
    projectTitle: project.title,
    status: project.status,
  };
}

/**
 * Send an owner-confirmed reply into the client's project thread. The body is
 * contact-safety screened BEFORE persist (the WS-3 studio invariant: the raw
 * text of a high/critical contact leak never reaches studio_project_messages;
 * medium risks are masked).
 */
export async function applyStudioClientReply(input: {
  projectId: string;
  body: string;
  actorId: string;
}): Promise<ApplyResult> {
  if (!isStudioAgencyLiveHub()) return { ok: false, error: "The studio agency is not live." };

  const verdict = contactSafety(input.body);
  if (verdict.action === "block") {
    return { ok: false, error: "This message shares off-platform contact details, so it cannot be sent." };
  }
  const body = verdict.action === "mask" ? verdict.maskedText : input.body;

  const audited = await auditFirst({
    action: "founder.owner.studio.client.reply",
    entityType: "studio_project",
    entityId: input.projectId,
    oldValues: {},
    newValues: { chars: body.length, screened: verdict.action, actor: input.actorId },
    reason: "founder_confirmed",
  });
  if (!audited) return { ok: false, error: "Audit logging failed; nothing was sent." };

  try {
    const admin = createAdminSupabase();
    const { error } = await admin.from("studio_project_messages").insert({
      project_id: input.projectId,
      sender: STUDIO_TEAM_SENDER,
      sender_role: "team",
      body,
      is_internal: false,
      message_type: "text",
    } as never);
    if (error) {
      operatorActionEvent("client.reply", "failed", { project_id: input.projectId });
      return { ok: false, error: "The message could not be delivered to the project thread." };
    }
  } catch {
    operatorActionEvent("client.reply", "failed", { project_id: input.projectId });
    return { ok: false, error: "The message could not be delivered to the project thread." };
  }

  operatorActionEvent("client.reply", "completed", { project_id: input.projectId, actor_id: input.actorId });
  return { ok: true, executionRef: `studio_project:${input.projectId}:replied` };
}
