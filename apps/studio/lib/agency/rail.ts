import "server-only";

/**
 * V3-43 — the studio build lifecycle registered as a DOMAIN SAGA on the platform
 * durable-job rail (@henryco/workflow). This does NOT fork a second engine and it
 * does NOT flatten studio_build_jobs (its 15 domain stages stay put): the sweep
 * `runAgencyTick` becomes a rail HANDLER, and the cron dispatches it through the
 * rail's enqueue → claim → dispose loop.
 *
 * Flag-dark: WORKFLOW_RAIL_LIVE gates ONLY whether the cron runs the sweep
 * through the rail or calls it directly. Either way the SAME sweep executes
 * (holding its OWN single-flight workflow-lock), so behavior is identical; the
 * rail merely adds durable job bookkeeping (idempotency, disposition, audit).
 */

import { randomUUID } from "node:crypto";
import {
  dispatchSweepThroughRail,
  LOCK_KEYS,
  workflowJobStore,
  type HandlerResult,
  type WorkflowContext,
} from "@henryco/workflow";
import { createAdminSupabase, hasAdminSupabaseEnv } from "@/lib/supabase";
import { runAgencyTick, type TickSummary } from "@/lib/agency/tick";

/** The rail routing switch (independent of STUDIO_AGENCY_LIVE, which still gates
 *  every consequential action INSIDE the sweep). Default off = today's path. */
export function isWorkflowRailLive(): boolean {
  return process.env.WORKFLOW_RAIL_LIVE === "1";
}

function emptySummary(): TickSummary {
  return { scanned: 0, dispatched: 0, advanced: 0, deployed: 0, reminded: 0, stalled: 0, retried: 0, escalated: 0 };
}

/** Minute-bucket idempotency: overlapping cron fires within the same minute
 *  dedupe to one live rail job (belt to the sweep's own workflow-lock). */
function tickBucket(now: Date): string {
  return `studio.agency.tick:${now.toISOString().slice(0, 16)}`;
}

/**
 * The cron entry point. Dark default (WORKFLOW_RAIL_LIVE unset): call the sweep
 * DIRECTLY — byte-for-byte today's path. Live: run the SAME sweep as a rail
 * handler, capturing its summary for the route response. If a peer cron already
 * claimed this minute's job, the drain no-ops and we return an empty summary
 * (the loser-no-ops single-flight rule).
 */
export async function runStudioAgencyTick(now = new Date()): Promise<TickSummary> {
  if (!isWorkflowRailLive() || !hasAdminSupabaseEnv()) {
    return runAgencyTick(now);
  }

  let captured: TickSummary | null = null;
  const handler = async (ctx: WorkflowContext): Promise<HandlerResult> => {
    try {
      captured = await runAgencyTick(ctx.now);
      return { ok: true, note: `scanned=${captured.scanned} dispatched=${captured.dispatched}` };
    } catch (error) {
      // A sweep failure dead-letters (maxAttempts:1) for audit; the next cron
      // fire is a fresh bucket — the pre-rail "each cron independent" behavior.
      return { ok: false, error: error instanceof Error ? error.message : "agency tick failed", retryable: false };
    }
  };

  const store = workflowJobStore(createAdminSupabase() as never);
  await dispatchSweepThroughRail({
    store,
    key: LOCK_KEYS.studioAgencyTick,
    handler,
    worker: `studio-tick:${randomUUID().slice(0, 8)}`,
    now,
    idempotencyKey: tickBucket(now),
    newJobId: randomUUID(),
  });
  return captured ?? emptySummary();
}
