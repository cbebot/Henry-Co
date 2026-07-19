import "server-only";

/**
 * SA-2/SA-3 — the orchestration tick (ARCHITECTURE §3). The cron drains the job
 * table like the search-index outbox: claim due jobs by CAS, advance what can
 * advance, detect stalls, release the claim. The executor callback records
 * state; the TICK does the thinking. Every decision here is enforced OUTSIDE the
 * model — it reads durable job state, it never trusts the agent.
 *
 * SA-3 makes the machine run the machine end to end:
 *   - dispatches `queued` jobs (flag-gated, DAILY-ceiling-gated) via the executor.
 *   - runs machine QA gates over the STORED bundle for `qa` jobs → client_review
 *     (+ preview materialized, preview_ready sent) or qa_failed.
 *   - handles client_review SILENCE: reminders then a 7-day owner escalation —
 *     NEVER auto-advances (the only client→owner edge is the client's approval).
 *   - ensures an owner deploy-approval sits in the decisions inbox for
 *     owner_review jobs (idempotent).
 *   - performs the ORCHESTRATOR-AUTOMATED, hash-pinned, resumable deploy for
 *     approved_for_deploy / deploying (the SA-D3 unlock) — automation replaces
 *     the manual step, the reauth-gated approval is unchanged.
 *   - schedules aftercare (day-3 check-in) and closes the warranty window.
 *   - stalls a heartbeat-gap / budget-breached build and escalates.
 */

import { randomUUID } from "node:crypto";
import { getRequiredEnv, getOptionalEnv } from "@/lib/env";
import { createAdminSupabase, hasAdminSupabaseEnv } from "@/lib/supabase";
import { emitEvent } from "@henryco/observability/events";
import { isStudioAgencyEnabled } from "@/lib/agency/flag";
import { resolveExecutorAdapter } from "@/lib/agency/executor";
import { buildSpecFetchUrl } from "@/lib/agency/spec-url";
import { runBundleQaGates } from "@/lib/agency/qa-gates";
import { readBundle, upsertPreviewPointer, verifyStoredBundleHash } from "@/lib/agency/bundle-store";
import { isEnvelopeBreached } from "@/lib/agency/envelope";
import { executeOrchestratedDeploy, siteHostForProject } from "@/lib/agency/deploy";
import { resolveDailyCeilingKobo, isDailyCeilingReached } from "@/lib/agency/daily-budget";
import { decideReviewWindowAction, daysWaiting } from "@/lib/agency/review-window";
import { decideAftercareAction } from "@/lib/agency/aftercare";
import { queueDecision } from "@/lib/agency/decisions";
import {
  listActiveJobs,
  listJobsInStages,
  claimJob,
  releaseJobClaim,
  transitionJob,
  appendBuildEvent,
  getStageEnteredAtMs,
  countBuildEvents,
  dailyAgencySpendKobo,
  type BuildJobRow,
} from "@/lib/agency/store";
import { escalateJob } from "@/lib/agency/escalate";
import {
  sendBuildStarted,
  sendPreviewReady,
  sendReviewReminder,
  sendAftercareCheckin,
} from "@/lib/studio/email/agency";

/** Heartbeat gap (ms) after which a building job is treated as stalled. */
export const HEARTBEAT_STALL_MS = 10 * 60 * 1000;
/** Automatic retries before a persistent failure escalates. */
export const MAX_ATTEMPTS = 2;
/** Stages whose executor could be actively spending — the breach check scopes here. */
const SPENDING_STAGES: readonly BuildJobRow["stage"][] = ["queued", "dispatching", "building"];

export type TickSummary = {
  scanned: number;
  dispatched: number;
  advanced: number;
  deployed: number;
  reminded: number;
  stalled: number;
  retried: number;
  escalated: number;
};

function newSummary(): TickSummary {
  return { scanned: 0, dispatched: 0, advanced: 0, deployed: 0, reminded: 0, stalled: 0, retried: 0, escalated: 0 };
}

/**
 * Per-tick daily-ceiling reservation. `spentKobo` is today's ALREADY-ACCRUED
 * provider cost; `committedKobo` accumulates the WORST-CASE envelope of every
 * job this tick dispatches. Dispatch commits spend the accrued figure cannot see
 * until later heartbeats, so the gate must reserve against committed+accrued —
 * else one tick could spawn N executors before any of them accrues, blowing past
 * the company-day line (adversarial finding). Reserving full budget is
 * deliberately conservative: it aborts the arc early, never late.
 */
type CeilingCtx = { spentKobo: number; ceilingKobo: number; committedKobo: number };

export async function runAgencyTick(now = new Date()): Promise<TickSummary> {
  const summary = newSummary();
  const worker = `tick:${randomUUID().slice(0, 8)}`;

  // The company-day ceiling context — computed ONCE per tick; committedKobo
  // accrues as this tick dispatches, so N jobs cannot each read spent≈0.
  const ceiling: CeilingCtx = {
    spentKobo: await dailyAgencySpendKobo(now),
    ceilingKobo: resolveDailyCeilingKobo(),
    committedKobo: 0,
  };

  // 1. Active jobs — advance / stall / deploy / review-sweep under a CAS claim.
  const jobs = await listActiveJobs();
  summary.scanned = jobs.length;
  for (const job of jobs) {
    const claimed = await claimJob(job.id, worker);
    if (!claimed) continue;
    try {
      await advanceJob(job, now, summary, ceiling);
    } finally {
      await releaseJobClaim(job.id);
    }
  }

  // 2. Aftercare sweep — live/aftercare are NOT active stages, so they get their
  //    own claimed pass (day-3 check-in + warranty-window close).
  const aftercareJobs = await listJobsInStages(["live", "aftercare"]);
  for (const job of aftercareJobs) {
    const claimed = await claimJob(job.id, worker);
    if (!claimed) continue;
    try {
      await aftercareSweep(job, now, summary);
    } finally {
      await releaseJobClaim(job.id);
    }
  }

  return summary;
}

async function advanceJob(job: BuildJobRow, now: Date, summary: TickSummary, ceiling: CeilingCtx): Promise<void> {
  // Budget breach is a stall trigger for a job that could still be SPENDING —
  // belt and braces behind the harness kill. Post-build stages (qa, review,
  // deploy) don't spend, so a fully-used build budget must NOT block a deploy.
  if (
    SPENDING_STAGES.includes(job.stage) &&
    isEnvelopeBreached({ budgetKobo: job.budgetKobo, costKobo: job.costKobo })
  ) {
    await transitionJob({ jobId: job.id, to: "stalled", reason: "budget_breach", actor: "tick" });
    await escalateJob(job, "budget_breach");
    await queueDecision({
      jobId: job.id,
      projectId: job.projectId,
      kind: "budget_increase",
      title: "A build job hit its cost ceiling",
      body: "The build reached its budget envelope and stopped before any overspend. Raise the budget or cancel.",
      actionKey: "studio.build.job.budget_increase",
    });
    summary.stalled += 1;
    summary.escalated += 1;
    return;
  }

  switch (job.stage) {
    case "queued":
      await dispatchJob(job, summary, ceiling);
      return;
    case "building":
    case "dispatching":
      await checkStall(job, now, summary);
      return;
    case "qa":
      await runQa(job, summary);
      return;
    case "client_review":
      await clientReviewSweep(job, now, summary);
      return;
    case "owner_review":
      await ensureDeployDecision(job);
      return;
    case "approved_for_deploy":
    case "deploying":
      await autoDeploy(job, summary);
      return;
    case "build_failed":
    case "qa_failed":
      await retryOrEscalate(job, summary);
      return;
    default:
      // changes_requested is re-queued by the client-review route; nothing here.
      return;
  }
}

function studioBaseUrl(): string {
  return getOptionalEnv("STUDIO_AGENCY_BASE_URL") || getOptionalEnv("NEXT_PUBLIC_STUDIO_BASE_URL") || "";
}

function sitesBaseDomain(): string {
  return getOptionalEnv("STUDIO_SITES_BASE_DOMAIN") || "sites.henryonyx.com";
}

async function dispatchJob(job: BuildJobRow, summary: TickSummary, ceiling: CeilingCtx): Promise<void> {
  // Flag gate: dispatch of NEW work halts instantly when the kill switch is off.
  if (!isStudioAgencyEnabled()) return;

  // DAILY CEILING (SAFETY-MODEL §4.3): a runaway ARC of many jobs aborts before
  // it compounds past the company-day line. Reserve this job's WORST-CASE
  // envelope against accrued + already-committed-this-tick spend BEFORE
  // dispatching — so N queued jobs cannot each read spent≈0 and all spawn in one
  // tick. Enforced at dispatch, outside the model; the job stays queued and
  // resumes when the day rolls over or spend clears.
  if (isDailyCeilingReached(ceiling.spentKobo + ceiling.committedKobo + job.budgetKobo, ceiling.ceilingKobo)) {
    await appendBuildEvent(job.id, "daily_ceiling_hold", {
      spentKobo: ceiling.spentKobo,
      committedKobo: ceiling.committedKobo,
      jobBudgetKobo: job.budgetKobo,
      ceilingKobo: ceiling.ceilingKobo,
    });
    return;
  }

  const baseUrl = studioBaseUrl();
  let secret: string;
  try {
    secret = getRequiredEnv("STUDIO_AGENCY_CALLBACK_SECRET", "callback secret required to dispatch");
  } catch {
    return;
  }
  if (!baseUrl) return;

  const adapter = resolveExecutorAdapter();
  if (adapter.kind === "null") return; // no executor configured → stay queued

  // queued → dispatching FIRST (so a signed spec-fetch resolves for this stage).
  const moved = await transitionJob({ jobId: job.id, to: "dispatching", reason: "tick_dispatch", actor: "tick" });
  if (!moved.ok) return;

  const specFetchUrl = buildSpecFetchUrl({ baseUrl, secret, jobId: job.id, attempt: job.attempt });
  const result = await adapter.dispatch({ jobId: job.id, attempt: job.attempt, specFetchUrl });
  await appendBuildEvent(job.id, "dispatch", { adapter: adapter.kind, ok: result.ok, reason: result.ok ? null : result.reason });

  if (!result.ok) {
    await transitionJob({ jobId: job.id, to: "build_failed", reason: `dispatch_${result.reason}`, actor: "tick" });
    return;
  }
  summary.dispatched += 1;
  // Reserve this job's worst-case envelope against the company-day ceiling so a
  // later dispatch THIS tick sees the commitment even before it accrues.
  ceiling.committedKobo += job.budgetKobo;

  // build_started — templated, no tap. Once per job (attempt 0 only; a retry is
  // not a fresh "we've started" moment).
  if (job.attempt === 0) {
    await notifyProject(job.projectId, (recipient) => sendBuildStarted(recipient));
  }
}

async function checkStall(job: BuildJobRow, now: Date, summary: TickSummary): Promise<void> {
  const last = job.lastHeartbeatAt ? Date.parse(job.lastHeartbeatAt) : Date.parse(job.updatedAt);
  const gap = now.getTime() - (Number.isFinite(last) ? last : now.getTime());
  if (gap <= HEARTBEAT_STALL_MS) return;

  if (job.executorRunRef) {
    const adapter = resolveExecutorAdapter();
    await adapter.cancel(job.executorRunRef).catch(() => ({ ok: false }));
  }
  await transitionJob({ jobId: job.id, to: "stalled", reason: "heartbeat_gap", actor: "tick" });
  await escalateJob(job, "heartbeat_gap");
  await queueDecision({
    jobId: job.id,
    projectId: job.projectId,
    kind: "job_stalled",
    title: "A build job went quiet",
    body: "The build stopped sending progress and was stalled. Review, then retry or cancel.",
    actionKey: "studio.build.job.review",
  });
  summary.stalled += 1;
  summary.escalated += 1;
}

async function runQa(job: BuildJobRow, summary: TickSummary): Promise<void> {
  if (!job.artifactHash) {
    await transitionJob({ jobId: job.id, to: "qa_failed", reason: "no_artifact", actor: "tick" });
    return;
  }

  // QUALITY REVIEW (SA-3): re-verify the stored bundle re-hashes to the pinned
  // artifact BEFORE the content gates — a stage never advances on a self-report,
  // only on the verified prior-stage artifact.
  const hashOk = await verifyStoredBundleHash(job.artifactHash);
  const bundle = await readBundle(job.artifactHash);
  const report = runBundleQaGates(bundle);
  if (!hashOk) {
    report.ok = false;
    report.gates.push({ key: "artifact_integrity", severity: "fail", detail: "stored bundle does not re-hash to the pinned artifact" });
  } else {
    report.gates.push({ key: "artifact_integrity", severity: "pass", detail: "stored bundle re-hashes to the pinned artifact" });
  }
  await appendBuildEvent(job.id, "qa_verdict", { ok: report.ok, gates: report.gates });

  if (report.ok) {
    const moved = await transitionJob({
      jobId: job.id,
      to: "client_review",
      reason: "qa_passed",
      actor: "tick",
      patch: { qa: report },
    });
    if (moved.ok) {
      summary.advanced += 1;
      await materializePreviewAndNotify(job);
    }
  } else {
    await transitionJob({
      jobId: job.id,
      to: "qa_failed",
      reason: "qa_failed",
      actor: "tick",
      patch: { qa: report },
    });
    await queueDecision({
      jobId: job.id,
      projectId: job.projectId,
      kind: "qa_failed",
      title: "A build failed quality review",
      body: "The generated site did not pass the automated quality gates. It will retry; a persistent failure needs a look.",
      actionKey: "studio.build.job.review",
      payload: { gates: report.gates.filter((g) => g.severity === "fail").map((g) => g.key) },
    });
  }
}

/**
 * After QA passes, materialize a TOKEN-GATED preview pointer (never public) and
 * send the templated preview_ready notice. The client reviews inside their
 * authenticated portal (IDOR-safe); the tokenized URL is the rendered preview.
 */
async function materializePreviewAndNotify(job: BuildJobRow): Promise<void> {
  if (!job.artifactHash) return;
  const host = siteHostForProject(job.projectId, sitesBaseDomain());
  const previewToken = randomUUID();
  await upsertPreviewPointer({
    host,
    jobId: job.id,
    projectId: job.projectId,
    bundleHash: job.artifactHash,
    previewToken,
  });
  const previewUrl = `https://${host}/?preview=${previewToken}`;
  await appendBuildEvent(job.id, "preview_ready", { host });
  await notifyProject(job.projectId, (recipient) => sendPreviewReady(recipient, previewUrl));
}

/**
 * Client-review silence handling. Reminders on a bounded cadence, then a 7-day
 * OWNER escalation — never an auto-advance. The only client→owner_review edge is
 * the client's explicit approval (the client-review route).
 */
async function clientReviewSweep(job: BuildJobRow, now: Date, summary: TickSummary): Promise<void> {
  const enteredAtMs = (await getStageEnteredAtMs(job.id, "client_review")) ?? Date.parse(job.updatedAt);
  const remindersSent = await countBuildEvents(job.id, "review_reminder");
  const escalated = (await countBuildEvents(job.id, "review_escalated")) > 0;

  const action = decideReviewWindowAction({
    enteredAtMs: enteredAtMs ?? 0,
    now: now.getTime(),
    remindersSent,
    escalated,
  });

  if (action.kind === "remind") {
    await appendBuildEvent(job.id, "review_reminder", { index: action.reminderIndex, day: action.dayThreshold });
    await notifyProject(job.projectId, (recipient) => sendReviewReminder(recipient));
    summary.reminded += 1;
    return;
  }

  if (action.kind === "escalate") {
    // Escalate to the OWNER — the owner decides on a site the client has seen but
    // not acted on. The job STAYS in client_review; nothing auto-advances.
    await appendBuildEvent(job.id, "review_escalated", { daysWaiting: daysWaiting(enteredAtMs ?? 0, now.getTime()) });
    await escalateJob(job, "review_stalled");
    await queueDecision({
      jobId: job.id,
      projectId: job.projectId,
      kind: "review_stalled",
      title: "A client hasn't reviewed their preview",
      body: `The preview has waited ${daysWaiting(enteredAtMs ?? 0, now.getTime())} days with no client response. Decide how to proceed — the job will not advance on its own.`,
      actionKey: "studio.build.job.review",
    });
    summary.escalated += 1;
  }
}

/** Ensure a pending deploy-approval decision exists for an owner_review job. */
async function ensureDeployDecision(job: BuildJobRow): Promise<void> {
  await queueDecision({
    jobId: job.id,
    projectId: job.projectId,
    kind: "deploy_approval",
    title: "A site is ready to deploy",
    body: "The client approved their preview. Approve the deploy (one tap + password) and the orchestrator releases the exact reviewed build.",
    actionKey: "studio.build.deploy.approve",
    payload: { artifact_hash: job.artifactHash },
  });
}

/**
 * ORCHESTRATOR-AUTOMATED DEPLOY (SA-D3 unlock). Reachable only for
 * approved_for_deploy (produced solely by the reauth-gated owner approval) or a
 * crashed deploying (resume). Flag-gated (a killed agency pauses deploys too;
 * the manual owner route remains an override). Hash-pinned + idempotent.
 */
async function autoDeploy(job: BuildJobRow, summary: TickSummary): Promise<void> {
  if (!isStudioAgencyEnabled()) return;
  const result = await executeOrchestratedDeploy({
    jobId: job.id,
    actor: "orchestrator",
    sitesBaseDomain: sitesBaseDomain(),
  });
  if (result.ok) {
    summary.deployed += 1;
    return;
  }
  // Not ok: either a transient race (a concurrent worker owns it, it already
  // advanced, or the row-flip lost a race — all resume cleanly next tick), or a
  // genuine failure that executeOrchestratedDeploy ALREADY stalled + escalated +
  // queued a decision for. Nothing more to do here.
}

async function retryOrEscalate(job: BuildJobRow, summary: TickSummary): Promise<void> {
  if (job.attempt < MAX_ATTEMPTS && isStudioAgencyEnabled()) {
    await transitionJob({
      jobId: job.id,
      to: "queued",
      reason: "retry",
      actor: "tick",
      patch: { attempt: job.attempt + 1 },
    });
    await appendBuildEvent(job.id, "retry_armed", { attempt: job.attempt + 1 });
    summary.retried += 1;
    return;
  }
  await transitionJob({ jobId: job.id, to: "stalled", reason: "max_attempts", actor: "tick" });
  await escalateJob(job, "max_attempts");
  await queueDecision({
    jobId: job.id,
    projectId: job.projectId,
    kind: "build_failed",
    title: "A build job could not complete",
    body: "The build failed on every attempt and was stopped. It needs a human look before another try.",
    actionKey: "studio.build.job.review",
  });
  summary.stalled += 1;
  summary.escalated += 1;
}

/**
 * Aftercare (ARCHITECTURE §3.2 `live → aftercare`): schedule a day-3 check-in and
 * close the warranty window. A live job is moved into aftercare first; from
 * there, one check-in fires at day 3 and the job closes at day 14. All templated
 * + reversible (Class A) — no tap.
 */
async function aftercareSweep(job: BuildJobRow, now: Date, summary: TickSummary): Promise<void> {
  if (job.stage === "live") {
    const moved = await transitionJob({ jobId: job.id, to: "aftercare", reason: "aftercare_scheduled", actor: "orchestrator" });
    if (moved.ok) {
      await appendBuildEvent(job.id, "aftercare_scheduled", {});
      emitEvent({
        name: "henry.studio.build.aftercare_scheduled",
        classification: "system_state",
        outcome: "completed",
        payload: { job_id: job.id, project_id: job.projectId },
      });
      summary.advanced += 1;
    }
    return;
  }

  // job.stage === 'aftercare' (terminal/closed). Derive go-live time + prior work
  // from the append-only log so this is idempotent across ticks.
  const liveAtMs = (await getStageEnteredAtMs(job.id, "live")) ?? Date.parse(job.updatedAt);
  const checkinsSent = await countBuildEvents(job.id, "aftercare_checkin");
  const closed = (await countBuildEvents(job.id, "aftercare_closed")) > 0;
  if (closed) return;

  const action = decideAftercareAction({ liveAtMs: liveAtMs ?? 0, now: now.getTime(), checkinsSent });
  if (action.kind === "checkin") {
    await appendBuildEvent(job.id, "aftercare_checkin", {});
    const host = job.previewRef || siteHostForProject(job.projectId, sitesBaseDomain());
    await notifyProject(job.projectId, (recipient) => sendAftercareCheckin(recipient, `https://${host}`));
  } else if (action.kind === "close") {
    await appendBuildEvent(job.id, "aftercare_closed", {});
  }
}

/** Resolve a project's email recipient and run a templated send (best-effort). */
async function notifyProject(
  projectId: string,
  send: (recipient: { id: string; title: string; normalizedEmail: string | null; accessKey: string }) => Promise<void>,
): Promise<void> {
  if (!hasAdminSupabaseEnv()) return;
  try {
    const admin = createAdminSupabase();
    const { data } = await admin
      .from("studio_projects")
      .select("id, title, normalized_email")
      .eq("id", projectId)
      .maybeSingle();
    const project = data as Record<string, unknown> | null;
    if (!project) return;
    await send({
      id: String(project.id),
      title: String(project.title ?? "your project"),
      normalizedEmail: (project.normalized_email as string) ?? null,
      accessKey: "",
    });
  } catch {
    // notification best-effort — the event + audit trail carry the signal.
  }
}
