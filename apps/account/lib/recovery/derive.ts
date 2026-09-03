/**
 * Layer A — derive recoverable tasks from the lifecycle snapshot the dashboard
 * already computes. This reuses ALL the per-division detection in the collector:
 * an "abandoned-but-resumable" journey is just an actionable in a resumable
 * stage, idle past a soft threshold but not yet expired, whose pillar maps to a
 * recovery task_type. Pure + deterministic (inject `now`).
 *
 * Wallet / support / subscriptions are intentionally NOT mapped — they stay in
 * the lifecycle "continue" panel but are never nudged by the recovery cadence
 * (money-sensitive / conversational, not a half-finished task to chase).
 */
import type {
  LifecycleActionable,
  LifecyclePillar,
  LifecycleSnapshot,
} from "@henryco/lifecycle";
import {
  buildDetectedTask,
  isRecoverableByIdle,
  RECOVERY_EXPIRE_IDLE_MS,
  type DetectedTask,
} from "@henryco/lifecycle/recovery";
import type { AbandonedTaskType } from "@henryco/data/abandoned-tasks-core";

/** Server-recorded journeys idle at least this long are worth a recovery nudge. */
export const RECOVERY_SERVER_MIN_IDLE_MS = 6 * 60 * 60 * 1000; // 6h

const RESUMABLE_STAGES: ReadonlySet<string> = new Set([
  "in_progress",
  "started",
  "awaiting_user",
  "evaluating",
  "onboarding",
]);

const PILLAR_TASK_TYPE: Partial<Record<LifecyclePillar, AbandonedTaskType>> = {
  identity: "kyc",
  trust: "kyc",
  care: "booking",
  logistics: "booking",
  property: "booking",
  studio: "proposal",
  marketplace: "cart",
  learn: "cart",
  jobs: "form_draft",
};

function taskRefFor(a: LifecycleActionable): string {
  if (a.referenceId) return `${a.referenceType ?? a.pillar}:${a.referenceId}`;
  return `${a.pillar}:${a.division}`;
}

export function deriveRecoveryTasksFromSnapshot(
  snapshot: LifecycleSnapshot,
  opts: { now: number; minIdleMs?: number; expireIdleMs?: number },
): DetectedTask[] {
  const minIdle = opts.minIdleMs ?? RECOVERY_SERVER_MIN_IDLE_MS;
  const expireIdle = opts.expireIdleMs ?? RECOVERY_EXPIRE_IDLE_MS;
  const out: DetectedTask[] = [];

  for (const a of snapshot.actionables) {
    const taskType = PILLAR_TASK_TYPE[a.pillar];
    if (!taskType) continue;
    if (!RESUMABLE_STAGES.has(a.stage)) continue;
    if (!a.actionUrl) continue;

    const lastMs = a.lastActiveAt ? new Date(a.lastActiveAt).getTime() : NaN;
    if (Number.isNaN(lastMs)) continue;
    if (!isRecoverableByIdle(lastMs, opts.now, minIdle, expireIdle)) continue;

    out.push(
      buildDetectedTask({
        taskType,
        taskRef: taskRefFor(a),
        division: a.division,
        continueUrl: a.actionUrl,
        // secret-free: stage + label + pillar only — no payload, no PII.
        state: { stage: a.stage, title: a.title, pillar: a.pillar },
        lastProgressAt: a.lastActiveAt ?? new Date(opts.now).toISOString(),
      }),
    );
  }

  return out;
}

const TERMINAL_STAGES: ReadonlySet<string> = new Set(["completed", "retained"]);

/**
 * Task refs whose journeys have COMPLETED (terminal lifecycle stage). Used to
 * flip any lingering pending recovery task to `recovered` so the cadence stops
 * nudging finished work. Only precise (referenceId-bearing) refs are returned.
 */
export function deriveRecoveredTaskRefs(snapshot: LifecycleSnapshot): string[] {
  const refs: string[] = [];
  for (const entry of snapshot.entries) {
    if (!PILLAR_TASK_TYPE[entry.pillar]) continue;
    if (!TERMINAL_STAGES.has(entry.stage)) continue;
    if (!entry.referenceId) continue;
    refs.push(`${entry.referenceType ?? entry.pillar}:${entry.referenceId}`);
  }
  return refs;
}
