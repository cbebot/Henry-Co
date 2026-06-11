"use server";

import { createDataAdminClient } from "@henryco/data";
import {
  dismissAbandonedTask,
  markAbandonedTaskRecovered,
} from "@henryco/data/abandoned-tasks";

import { requireAccountUser } from "@/lib/auth";

/** Dismiss a recovery task — no more nudges. Owner-scoped by the signed-in user. */
export async function dismissRecoveryTaskAction(id: string): Promise<{ ok: boolean }> {
  const user = await requireAccountUser();
  const admin = createDataAdminClient();
  const ok = await dismissAbandonedTask(admin, id, user.id);
  return { ok };
}

/** Mark a recovery task recovered (the user returned + completed it). */
export async function markRecoveryTaskRecoveredAction(
  id: string,
): Promise<{ ok: boolean }> {
  const user = await requireAccountUser();
  const admin = createDataAdminClient();
  const ok = await markAbandonedTaskRecovered(admin, id, user.id);
  return { ok };
}
