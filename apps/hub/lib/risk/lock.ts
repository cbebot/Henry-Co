// V3-40 — batch single-flight over the workflow_locks CAS (the V3-43 shape).
//
// Win iff the prior lock expired (`locked_until < now`); release is holder-guarded.
// TTL (300s) deliberately exceeds the cron route's maxDuration (60s) so a live run
// can never outlive its own lock (the SA-3 TTL lesson). A broken lock store must
// NOT let a run proceed unguarded — every failure path returns `false`.

import "server-only";

import { createAdminSupabase } from "@/lib/supabase";

export const RISK_BATCH_LOCK_KEY = "hub.risk.score";
export const RISK_BATCH_LOCK_TTL_SECONDS = 300;

export async function acquireRiskBatchLock(worker: string, now: Date): Promise<boolean> {
  try {
    const admin = createAdminSupabase();
    const nowIso = now.toISOString();
    const untilIso = new Date(now.getTime() + RISK_BATCH_LOCK_TTL_SECONDS * 1000).toISOString();
    const { data, error } = await admin
      .from("workflow_locks")
      .update({ locked_until: untilIso, holder: worker, updated_at: nowIso })
      .eq("lock_key", RISK_BATCH_LOCK_KEY)
      .lt("locked_until", nowIso)
      .select("lock_key")
      .maybeSingle();
    if (error) return false;
    return Boolean(data);
  } catch {
    return false;
  }
}

export async function releaseRiskBatchLock(worker: string, now: Date): Promise<void> {
  try {
    const admin = createAdminSupabase();
    const nowIso = now.toISOString();
    await admin
      .from("workflow_locks")
      .update({ locked_until: nowIso, updated_at: nowIso })
      .eq("lock_key", RISK_BATCH_LOCK_KEY)
      .eq("holder", worker)
      .select("lock_key")
      .maybeSingle();
  } catch {
    /* best-effort — an unreleased lock simply expires at TTL */
  }
}
