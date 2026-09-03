import "server-only";

import { after } from "next/server";
import type { LifecycleSnapshot } from "@henryco/lifecycle";
import {
  captureAbandonedTask,
  markAbandonedTasksRecoveredByRefs,
} from "@henryco/data/abandoned-tasks";

import {
  deriveRecoveredTaskRefs,
  deriveRecoveryTasksFromSnapshot,
} from "./derive";

/**
 * Upsert the server-recorded recoverable journeys from a lifecycle snapshot into
 * `abandoned_tasks` so the recovery cadence can nudge them. Idempotent: capture
 * only rewinds the reminder clock on genuinely newer progress.
 */
export async function persistRecoveryTasksFromSnapshot(
  snapshot: LifecycleSnapshot,
): Promise<void> {
  // 1) Completed journeys → recovered, so the cadence stops nudging them.
  const recoveredRefs = deriveRecoveredTaskRefs(snapshot);
  if (recoveredRefs.length > 0) {
    await markAbandonedTasksRecoveredByRefs(snapshot.userId, recoveredRefs);
  }

  // 2) Upsert currently-resumable journeys.
  const tasks = deriveRecoveryTasksFromSnapshot(snapshot, { now: Date.now() });
  for (const t of tasks) {
    await captureAbandonedTask({
      userId: snapshot.userId,
      taskType: t.taskType,
      taskRef: t.taskRef,
      division: t.division,
      continueUrl: t.continueUrl,
      state: t.state,
      lastProgressAt: t.lastProgressAt,
    });
  }
}

/** Fire-and-forget after the response so dashboard TTFB is untouched. */
export function scheduleRecoveryTasksFromSnapshot(snapshot: LifecycleSnapshot): void {
  if (!snapshot.userId || snapshot.actionables.length === 0) return;
  after(() => {
    void persistRecoveryTasksFromSnapshot(snapshot).catch((error) => {
      console.error("[recovery] snapshot task persist failed:", error);
    });
  });
}
