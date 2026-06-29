"use server";

import { runAiTask, createPgBillingPort, parseDraftOutput } from "@henryco/ai-gateway/server";
import type { AiUsageReceipt } from "@henryco/ai-gateway";
import { getPaymentsSqlExecutor } from "@henryco/payments-db";
import { getJobsViewer, viewerHasRole } from "@/lib/auth";
import { createSupabaseServer } from "@/lib/supabase/server";

export interface DraftPostingResult {
  ok: boolean;
  code?: string;
  message?: string;
  draft?: { summary: string; description: string; category: string; specifications: string };
  receipt?: AiUsageReceipt;
}

/**
 * jobs.posting.draft — METERED. An employer turns a short idea into a clear, honest job
 * posting through the governed gateway: auth-gated (employer only), priced + reserved
 * against the shared wallet, metered, settled atomically, audited. Provider/model never
 * reach the client; the return carries only the draft + the redacted receipt.
 */
export async function draftPostingAction(input: { title: string; notes?: string; idempotencyKey: string }): Promise<DraftPostingResult> {
  const viewer = await getJobsViewer();
  if (!viewer.user || !viewerHasRole(viewer, ["employer", "admin", "owner"])) {
    return { ok: false, code: "auth_required", message: "Sign in as an employer to use Henry Onyx Intelligence." };
  }
  if (!input.title?.trim()) {
    return { ok: false, code: "rate_limited", message: "Add a role title first." };
  }

  const supabase = await createSupabaseServer();
  const result = await runAiTask(
    {
      surface: "jobs.posting.draft",
      actorId: viewer.user.id,
      input: { title: input.title, notes: input.notes ?? "" },
      idempotencyKey: input.idempotencyKey,
    },
    { billing: createPgBillingPort(getPaymentsSqlExecutor()), audit: { supabase: supabase as never } },
  );

  if (!result.ok) return { ok: false, code: result.error.code, message: result.error.message };

  const draft = parseDraftOutput(result.value.output);
  if (!draft) {
    return { ok: false, code: "schema_validation_failed", message: "Henry Onyx Intelligence couldn’t complete the draft. Please try again." };
  }
  return { ok: true, draft, receipt: result.value.receipt };
}
