import { NextResponse } from "next/server";

import { getRequiredEnv } from "@/lib/env";
import {
  verifyAgencySignature,
  isMonotonicSeq,
  AGENCY_SIGNATURE_TTL_SECONDS,
} from "@/lib/agency/hmac";
import { getBuildJob, appendBuildEvent, transitionJob } from "@/lib/agency/store";
import { recordBuildUsage } from "@/lib/agency/metering";
import { storeBundle } from "@/lib/agency/bundle-store";
import { accrueCost } from "@/lib/agency/envelope";
import { createAdminSupabase, hasAdminSupabaseEnv } from "@/lib/supabase";
import type { BuildHeartbeat, BuildJobReport } from "@/lib/agency/contracts";

/**
 * POST /api/agency/executor-callback — the ONLY inbound door from the external
 * sandboxed executor. HMAC-verified (${timestamp}.${body}, 5-min window,
 * timing-safe), monotonic-sequence replay-guarded, and idempotent by
 * (jobId, attempt). It writes STATE ONLY — the tick does the thinking.
 *
 * Two payload kinds:
 *   - heartbeat: {kind:'heartbeat', ...BuildHeartbeat} — progress + cost + seq.
 *   - report:    {kind:'report',    ...BuildJobReport} — the final artifact.
 *
 * Security posture (SAFETY-MODEL §2.4): the executor holds only the HMAC
 * secret; it authenticates to nothing else. A forged/replayed/stale payload is
 * rejected before any state changes. The callback can move a job to qa / a
 * failure stage — it can NEVER reach deploying (that door is human-only).
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AGENCY_CALLBACK_SECRET_ENV = "STUDIO_AGENCY_CALLBACK_SECRET";

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

export async function POST(request: Request): Promise<Response> {
  let secret: string;
  try {
    secret = getRequiredEnv(
      AGENCY_CALLBACK_SECRET_ENV,
      `${AGENCY_CALLBACK_SECRET_ENV} is required to verify executor callbacks. Refusing to accept unsigned build reports.`,
    );
  } catch {
    // Fail closed — no secret configured means no trusted executor exists yet.
    return NextResponse.json({ error: "callback not configured" }, { status: 503 });
  }

  if (!hasAdminSupabaseEnv()) {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }

  // DoS guard before buffering.
  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (Number.isFinite(declaredLength) && declaredLength > 4_000_000) {
    return NextResponse.json({ error: "payload too large" }, { status: 413 });
  }

  const timestamp = clean(request.headers.get("x-henry-timestamp"));
  const signature = clean(request.headers.get("x-henry-signature"));
  const rawBody = await request.text();

  const verify = verifyAgencySignature({
    secret,
    timestamp,
    signature,
    rawBody,
    toleranceSeconds: AGENCY_SIGNATURE_TTL_SECONDS,
  });
  if (!verify.ok) {
    // Never reveal which check failed beyond a coarse reason.
    return NextResponse.json({ error: "unauthorized", reason: verify.reason }, { status: 401 });
  }

  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  if (!json || typeof json !== "object") {
    return NextResponse.json({ error: "invalid payload" }, { status: 422 });
  }
  const body = json as Record<string, unknown>;
  const kind = clean(body.kind);
  const jobId = clean(body.jobId);
  const attempt = Number(body.attempt);
  if (!jobId || !Number.isFinite(attempt)) {
    return NextResponse.json({ error: "missing jobId/attempt" }, { status: 422 });
  }

  const job = await getBuildJob(jobId);
  if (!job) {
    // Signed but unknown — acknowledge without leaking existence detail.
    return NextResponse.json({ ok: true, status: "ignored" });
  }
  // Reject a report for a stale attempt (a late callback from a superseded run).
  if (attempt !== job.attempt) {
    await appendBuildEvent(jobId, "callback_stale_attempt", { got: attempt, expected: job.attempt, kind });
    return NextResponse.json({ ok: true, status: "stale_attempt" });
  }

  if (kind === "heartbeat") {
    return handleHeartbeat(job.id, job.stage, job.heartbeatSeq, job.budgetKobo, body as unknown as BuildHeartbeat);
  }
  if (kind === "report") {
    return handleReport(job.id, job.stage, body as unknown as BuildJobReport);
  }
  return NextResponse.json({ error: "unknown kind" }, { status: 422 });
}

async function handleHeartbeat(
  jobId: string,
  stage: string,
  lastSeq: number,
  budgetKobo: number,
  hb: BuildHeartbeat,
): Promise<Response> {
  const seq = Number(hb.seq);
  // Monotonic-sequence replay guard: reject a non-increasing seq (a replayed
  // capture can never keep a dead run looking alive).
  if (!isMonotonicSeq(lastSeq, seq)) {
    await appendBuildEvent(jobId, "heartbeat_replay_rejected", { got: seq, last: lastSeq });
    return NextResponse.json({ error: "non_monotonic_seq" }, { status: 409 });
  }

  const admin = createAdminSupabase();
  const runRef = clean(hb.runRef) || undefined;
  const costSoFar = Number(hb.costSoFarKobo);
  const patch: Record<string, unknown> = {
    heartbeat_seq: seq,
    last_heartbeat_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  // First heartbeat carries the runner run id — bind it once for stall-kill.
  if (runRef) patch.executor_run_ref = runRef;
  // Track the harness-reported accrual (belt-and-braces; the tick also stalls
  // on breach). Never let a corrupt delta reduce accrued cost.
  if (Number.isFinite(costSoFar)) {
    const accrued = accrueCost({ budgetKobo, costKobo: costSoFar }, 0);
    patch.cost_kobo = Math.max(0, accrued.costKobo);
  }

  await admin.from("studio_build_jobs").update(patch as never).eq("id", jobId);
  await appendBuildEvent(jobId, "heartbeat", { seq, stage: clean(hb.stage), costSoFarKobo: costSoFar });

  // A dispatched job's first heartbeat legally advances queued/dispatching →
  // building (state machine choke point rejects anything illegal).
  if (stage === "dispatching" || stage === "queued") {
    await transitionJob({ jobId, to: "building", reason: "first_heartbeat", actor: "executor" });
  }

  return NextResponse.json({ ok: true, status: "heartbeat_recorded" });
}

/** Stages where a build report is still legitimate (the executor is/was running). */
const BUILDABLE_STAGES = ["queued", "dispatching", "building"];

async function handleReport(jobId: string, stage: string, report: BuildJobReport): Promise<Response> {
  // A report is only legitimate while the job is in the BUILD phase. A report
  // for ANY post-build stage (qa, client_review, owner_review,
  // approved_for_deploy, deploying, live, aftercare) is a stale/duplicate or a
  // hostile replay — it must NEVER store a bundle or mutate the pinned
  // artifact_hash after QA/approval. Reject it before touching any state; this
  // is the app-layer half of the post-approval swap guard (the DB trigger makes
  // artifact_hash write-once past building as the second wall).
  if (!BUILDABLE_STAGES.includes(stage)) {
    await appendBuildEvent(jobId, "report_stale_stage", { stage, outcome: clean(report.outcome) });
    return NextResponse.json({ ok: true, status: "stale_stage" });
  }

  // Record usage FIRST (idempotent) so the cost trail exists regardless of
  // outcome.
  if (report.usage) {
    await recordBuildUsage({
      jobId,
      attempt: Number(report.attempt),
      source: "executor",
      usage: report.usage,
    });
  }

  const outcome = clean(report.outcome);
  if (outcome === "built") {
    const artifact = report.artifact ?? { kind: "bundle", ref: "" };

    // Store the inline Track-1 bundle content-addressed. This ALSO re-hashes
    // and verifies the executor's claimed contentHash — a body altered in
    // flight (even under a valid HMAC on a compromised secret) fails here and
    // the job goes to build_failed rather than storing a tampered artifact.
    let storedHash: string | null = null;
    if (artifact.bundle !== undefined) {
      const stored = await storeBundle({
        jobId,
        bundle: artifact.bundle,
        claimedHash: artifact.contentHash ?? null,
      });
      if (!stored.ok) {
        await appendBuildEvent(jobId, "report_bundle_rejected", { reason: stored.reason });
        if (stage === "building") {
          await transitionJob({ jobId, to: "build_failed", reason: `bundle_${stored.reason}`, actor: "executor" });
        }
        return NextResponse.json({ ok: true, status: "bundle_rejected" });
      }
      storedHash = stored.contentHash;
    }

    await appendBuildEvent(jobId, "report_built", {
      artifact_ref: artifact.ref,
      content_hash: storedHash ?? artifact.contentHash ?? null,
      qa_ok: report.qa?.ok ?? null,
    });
    // building → qa. The tick runs the authoritative machine QA gates over the
    // STORED bundle and advances further; the callback records the artifact +
    // the verified hash, then moves to qa.
    const patch: Record<string, unknown> = {
      artifact_ref: artifact.ref || storedHash,
      artifact_hash: storedHash ?? (clean(artifact.contentHash) || null),
      qa: report.qa ?? null,
    };
    if (stage === "building") {
      await transitionJob({ jobId, to: "qa", reason: "executor_report_built", actor: "executor", patch });
    } else {
      const admin = createAdminSupabase();
      await admin.from("studio_build_jobs").update({ ...patch, updated_at: new Date().toISOString() } as never).eq("id", jobId);
    }
    return NextResponse.json({ ok: true, status: "report_recorded" });
  }

  // Failure outcomes: failed | killed_budget | killed_timeout → build_failed.
  await appendBuildEvent(jobId, "report_failed", { outcome, log: clean(report.log) });
  if (stage === "building" || stage === "dispatching" || stage === "queued") {
    await transitionJob({
      jobId,
      to: "build_failed",
      reason: `executor_report_${outcome || "failed"}`,
      actor: "executor",
    });
  }
  return NextResponse.json({ ok: true, status: "failure_recorded" });
}
