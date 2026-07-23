import "server-only";

/**
 * SA-2 — the orchestration tick (ARCHITECTURE §3.1). The cron drains the job
 * table like the search-index outbox: claim due jobs by CAS, advance what can
 * advance, detect stalls, release the claim. The executor callback records
 * state; the TICK does the thinking. Every decision here is enforced OUTSIDE
 * the model — it reads durable job state, it never trusts the agent.
 *
 * Per pass the tick:
 *   - dispatches `queued` jobs (flag-gated) via the executor adapter.
 *   - runs machine QA gates over the stored bundle for `qa` jobs → client_review
 *     or qa_failed.
 *   - stalls a `building` job whose heartbeat gap exceeds the threshold
 *     (best-effort executor cancel) and whose cost breached its envelope.
 *   - re-arms a `build_failed`/`qa_failed` job as a bounded retry (≤2), else
 *     stalls + escalates.
 */

import { randomUUID } from "node:crypto";
import { getRequiredEnv, getOptionalEnv } from "@/lib/env";
import { isStudioAgencyEnabled } from "@/lib/agency/flag";
import { resolveExecutorAdapter } from "@/lib/agency/executor";
import { buildSpecFetchUrl } from "@/lib/agency/spec-url";
import { runBundleQaGates } from "@/lib/agency/qa-gates";
import { readBundle } from "@/lib/agency/bundle-store";
import { isEnvelopeBreached } from "@/lib/agency/envelope";
import {
  listActiveJobs,
  claimJob,
  releaseJobClaim,
  transitionJob,
  appendBuildEvent,
  type BuildJobRow,
} from "@/lib/agency/store";
import { escalateJob } from "@/lib/agency/escalate";

/** Heartbeat gap (ms) after which a building job is treated as stalled. */
export const HEARTBEAT_STALL_MS = 10 * 60 * 1000;
/** Automatic retries before a persistent failure escalates. */
export const MAX_ATTEMPTS = 2;

export type TickSummary = {
  scanned: number;
  dispatched: number;
  advanced: number;
  stalled: number;
  retried: number;
  escalated: number;
};

export async function runAgencyTick(now = new Date()): Promise<TickSummary> {
  const summary: TickSummary = { scanned: 0, dispatched: 0, advanced: 0, stalled: 0, retried: 0, escalated: 0 };
  const worker = `tick:${randomUUID().slice(0, 8)}`;
  const jobs = await listActiveJobs();
  summary.scanned = jobs.length;

  for (const job of jobs) {
    // One worker per job (CAS). A job already claimed this pass is skipped.
    const claimed = await claimJob(job.id, worker);
    if (!claimed) continue;
    try {
      await advanceJob(job, now, summary);
    } finally {
      await releaseJobClaim(job.id);
    }
  }
  return summary;
}

async function advanceJob(job: BuildJobRow, now: Date, summary: TickSummary): Promise<void> {
  // Budget breach is a stall trigger everywhere — belt and braces behind the
  // harness kill. A breached job never silently overspends.
  if (isEnvelopeBreached({ budgetKobo: job.budgetKobo, costKobo: job.costKobo })) {
    await transitionJob({ jobId: job.id, to: "stalled", reason: "budget_breach", actor: "tick" });
    await escalateJob(job, "budget_breach");
    summary.stalled += 1;
    summary.escalated += 1;
    return;
  }

  switch (job.stage) {
    case "queued":
      await dispatchJob(job, summary);
      return;
    case "building":
    case "dispatching":
      await checkStall(job, now, summary);
      return;
    case "qa":
      await runQa(job, summary);
      return;
    case "build_failed":
    case "qa_failed":
      await retryOrEscalate(job, summary);
      return;
    default:
      // client_review / owner_review / approved_for_deploy / deploying / changes_requested
      // are human/deploy-driven — the tick only watches them for stalls above.
      return;
  }
}

async function dispatchJob(job: BuildJobRow, summary: TickSummary): Promise<void> {
  // Flag gate: dispatch of NEW work halts instantly when the kill switch is off.
  if (!isStudioAgencyEnabled()) return;

  const baseUrl = getOptionalEnv("STUDIO_AGENCY_BASE_URL") || getOptionalEnv("NEXT_PUBLIC_STUDIO_BASE_URL") || "";
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
    // Dispatch itself failed — treat as a build failure so the retry/escalate
    // path governs it rather than leaving a job wedged in dispatching.
    await transitionJob({ jobId: job.id, to: "build_failed", reason: `dispatch_${result.reason}`, actor: "tick" });
    return;
  }
  summary.dispatched += 1;
}

async function checkStall(job: BuildJobRow, now: Date, summary: TickSummary): Promise<void> {
  const last = job.lastHeartbeatAt ? Date.parse(job.lastHeartbeatAt) : Date.parse(job.updatedAt);
  const gap = now.getTime() - (Number.isFinite(last) ? last : now.getTime());
  if (gap <= HEARTBEAT_STALL_MS) return;

  // Best-effort kill of the runner via the captured run ref.
  if (job.executorRunRef) {
    const adapter = resolveExecutorAdapter();
    await adapter.cancel(job.executorRunRef).catch(() => ({ ok: false }));
  }
  await transitionJob({ jobId: job.id, to: "stalled", reason: "heartbeat_gap", actor: "tick" });
  await escalateJob(job, "heartbeat_gap");
  summary.stalled += 1;
  summary.escalated += 1;
}

async function runQa(job: BuildJobRow, summary: TickSummary): Promise<void> {
  if (!job.artifactHash) {
    // No stored artifact to check — treat as a QA failure (nothing to review).
    await transitionJob({ jobId: job.id, to: "qa_failed", reason: "no_artifact", actor: "tick" });
    return;
  }
  const bundle = await readBundle(job.artifactHash);
  const report = runBundleQaGates(bundle);
  await appendBuildEvent(job.id, "qa_verdict", { ok: report.ok, gates: report.gates });

  if (report.ok) {
    await transitionJob({
      jobId: job.id,
      to: "client_review",
      reason: "qa_passed",
      actor: "tick",
      patch: { qa: report },
    });
    summary.advanced += 1;
  } else {
    await transitionJob({
      jobId: job.id,
      to: "qa_failed",
      reason: "qa_failed",
      actor: "tick",
      patch: { qa: report },
    });
  }
}

async function retryOrEscalate(job: BuildJobRow, summary: TickSummary): Promise<void> {
  // Bounded retry: re-arm under the REMAINING budget (the envelope is per-job,
  // not per-attempt) up to MAX_ATTEMPTS, else stall + escalate.
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
  summary.stalled += 1;
  summary.escalated += 1;
}
