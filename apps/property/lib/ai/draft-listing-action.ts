"use server";

import { runAiTask, createPgBillingPort, parseDraftOutput } from "@henryco/ai-gateway/server";
import type { AiUsageReceipt } from "@henryco/ai-gateway";
import { getPaymentsSqlExecutor } from "@henryco/payments-db";
import { getPropertyViewer } from "@/lib/property/auth";
import { createSupabaseServer } from "@/lib/supabase/server";

export interface DraftListingResult {
  ok: boolean;
  code?: string;
  message?: string;
  draft?: { summary: string; description: string; category: string; specifications: string };
  receipt?: AiUsageReceipt;
}

/**
 * property.listing.draft — METERED. An owner/agent turns a short idea into a clear, honest
 * property listing through the governed gateway: auth-gated, priced + reserved against the
 * shared wallet, metered, settled atomically, audited. Provider/model never reach the client;
 * the return carries only the draft + the redacted receipt. The owner edits everything (and
 * the listing still goes through property's trust review) before it publishes.
 */
export async function draftListingAction(input: { title: string; notes?: string; idempotencyKey: string }): Promise<DraftListingResult> {
  const viewer = await getPropertyViewer();
  if (!viewer.user) {
    return { ok: false, code: "auth_required", message: "Sign in to use Henry Onyx Intelligence." };
  }
  if (!input.title?.trim()) {
    return { ok: false, code: "rate_limited", message: "Add a listing title first." };
  }

  const supabase = await createSupabaseServer();
  const result = await runAiTask(
    {
      surface: "property.listing.draft",
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
