import "server-only";

/**
 * V3-43 — the Owner-AI operator tick registered as a DOMAIN SAGA on the platform
 * durable-job rail (@henryco/workflow). Symmetric with the studio build lifecycle
 * seam: `runOperatorTick` becomes a rail HANDLER; the cron dispatches it through
 * the rail's enqueue → claim → dispose loop instead of forking a second engine.
 *
 * Flag-dark: WORKFLOW_RAIL_LIVE gates ONLY the routing. Either path runs the SAME
 * sweep (holding its own workflow-lock single-flight on key 'hub.operator.tick'),
 * so behavior is identical — the tick still executes NOTHING consequential (every
 * card crosses the reauth-gated confirm route).
 */

import { randomUUID } from "node:crypto";
import {
  dispatchSweepThroughRail,
  LOCK_KEYS,
  workflowJobStore,
  type HandlerResult,
  type WorkflowContext,
} from "@henryco/workflow";
import { createAdminSupabase } from "@/lib/supabase";
import { runOperatorTick, type OperatorTickSummary } from "./operator-tick";

/** The rail routing switch (independent of FOUNDER_ACTIONS_LIVE, which still
 *  gates the operator sweep itself). Default off = today's path. */
export function isWorkflowRailLive(): boolean {
  return process.env.WORKFLOW_RAIL_LIVE === "1";
}

function emptySummary(reason: string): OperatorTickSummary {
  return { ran: false, reason, scanned: 0, raised: 0, deduped: 0, escalated: 0, aiPrepared: 0, aiSkipped: 0 };
}

/** Minute-bucket idempotency: overlapping cron fires within the same minute
 *  dedupe to one live rail job (belt to the sweep's own workflow-lock). */
function tickBucket(now: Date): string {
  return `hub.operator.tick:${now.toISOString().slice(0, 16)}`;
}

/**
 * The cron entry point. Dark default: call the sweep DIRECTLY (today's path).
 * Live: run the SAME sweep as a rail handler, capturing its summary. A peer cron
 * that already claimed this minute's job makes the drain no-op (loser no-ops).
 */
export async function runOperatorTickViaRail(now = new Date()): Promise<OperatorTickSummary> {
  if (!isWorkflowRailLive()) {
    return runOperatorTick(now);
  }

  let captured: OperatorTickSummary | null = null;
  const handler = async (ctx: WorkflowContext): Promise<HandlerResult> => {
    try {
      captured = await runOperatorTick(ctx.now);
      return { ok: true, note: `ran=${captured.ran} raised=${captured.raised}` };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "operator tick failed", retryable: false };
    }
  };

  const store = workflowJobStore(createAdminSupabase() as never);
  await dispatchSweepThroughRail({
    store,
    key: LOCK_KEYS.hubOperatorTick,
    handler,
    worker: `operator-tick:${randomUUID().slice(0, 8)}`,
    now,
    idempotencyKey: tickBucket(now),
    newJobId: randomUUID(),
  });
  return captured ?? emptySummary("rail_deduped");
}
