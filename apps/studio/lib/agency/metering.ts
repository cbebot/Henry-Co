import "server-only";

/**
 * SA-2 — operational cost metering (MONEY-MODEL §3). Records harness-reported
 * provider cost into studio_build_usage (kobo BIGINT) and keeps the job's
 * running cost_kobo in step. Idempotent by (job_id, attempt, source): a
 * re-delivered executor report can never double-count.
 *
 * This is NOT a ledger post — no money RPC is called, no wallet is touched.
 * It is the internal COGS trail finance reconciles the provider invoice
 * against. Client money flows only through the unchanged card rail.
 */

import { createAdminSupabase, hasAdminSupabaseEnv } from "@/lib/supabase";
import { priceBuildUsageKobo } from "@/lib/agency/rate-card";
import type { BuildUsage } from "@/lib/agency/contracts";

export async function recordBuildUsage(input: {
  jobId: string;
  attempt: number;
  source: "executor" | "gateway";
  usage: BuildUsage;
  usageEventId?: string | null;
}): Promise<{ ok: boolean; costKobo: number }> {
  if (!hasAdminSupabaseEnv()) return { ok: false, costKobo: 0 };
  const admin = createAdminSupabase();

  // Trust the harness-reported provider cost when present; otherwise price the
  // token tuple at the governed build rate (the same linear shape as gateway).
  const costKobo =
    Number.isFinite(input.usage.providerCostKobo) && input.usage.providerCostKobo > 0
      ? Math.max(0, Math.round(input.usage.providerCostKobo))
      : priceBuildUsageKobo({
          calls: input.usage.calls,
          inputTokens: input.usage.inputTokens,
          outputTokens: input.usage.outputTokens,
          cacheReadTokens: input.usage.cacheReadTokens,
          cacheWriteTokens: input.usage.cacheWriteTokens,
        });

  // Idempotent insert: ON CONFLICT (job_id, attempt, source) DO NOTHING. If the
  // row already existed this is a replay — do not re-accrue.
  const { error, data } = await admin
    .from("studio_build_usage")
    .upsert(
      {
        job_id: input.jobId,
        attempt: input.attempt,
        source: input.source,
        usage: input.usage,
        provider_cost_kobo: costKobo,
        usage_event_id: input.usageEventId ?? null,
      } as never,
      { onConflict: "job_id,attempt,source", ignoreDuplicates: true },
    )
    .select("id")
    .maybeSingle();

  // `data` null with no error = duplicate ignored → do not re-accrue cost_kobo.
  if (error) return { ok: false, costKobo: 0 };
  if (!data) return { ok: true, costKobo: 0 };

  // Recompute the job's cost_kobo from the authoritative sum (never a blind +=,
  // which a race could double-apply).
  const { data: sumRows } = await admin
    .from("studio_build_usage")
    .select("provider_cost_kobo")
    .eq("job_id", input.jobId);
  const total = (sumRows as { provider_cost_kobo: number }[] | null ?? []).reduce(
    (acc, r) => acc + Number(r.provider_cost_kobo ?? 0),
    0,
  );
  await admin
    .from("studio_build_jobs")
    .update({ cost_kobo: total, updated_at: new Date().toISOString() } as never)
    .eq("id", input.jobId);

  return { ok: true, costKobo };
}
