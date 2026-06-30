"use server";

import { runAiTask, createPgBillingPort } from "@henryco/ai-gateway/server";
import { parseVerdict, resolveVerdictDecision, type AiUsageReceipt, type VerdictDecision } from "@henryco/ai-gateway";
import { getPaymentsSqlExecutor } from "@henryco/payments-db";
import { getPropertyViewer } from "@/lib/property/auth";
import { createSupabaseServer } from "@/lib/supabase/server";

export type VerifyListingResult =
  | { ok: true; outcome: VerdictDecision; badge: boolean; trustScore: number; reasons: string[]; receipt: AiUsageReceipt }
  | { ok: false; code: string; message: string };

/**
 * property.listing.verify — METERED, deep tier. A trust review the owner/agent runs on their
 * OWN listing draft before submission: honest, real photos (not AI-generated), on-standard,
 * safe. Advisory — it returns the verdict and AUGMENTS property's trust review; it never
 * auto-publishes and persists no badge (no IDOR surface). Provider/model never reach the client.
 */
export async function verifyListingAction(input: {
  title: string;
  summary?: string;
  description?: string;
  images?: string[];
  idempotencyKey: string;
}): Promise<VerifyListingResult> {
  const viewer = await getPropertyViewer();
  if (!viewer.user) {
    return { ok: false, code: "auth_required", message: "Sign in to request a review." };
  }
  if (!input.title?.trim() && !input.description?.trim()) {
    return { ok: false, code: "rate_limited", message: "Add your listing details first." };
  }

  const supabase = await createSupabaseServer();
  const result = await runAiTask(
    {
      surface: "property.listing.verify",
      actorId: viewer.user.id,
      input: {
        title: input.title ?? "",
        summary: input.summary ?? "",
        description: input.description ?? "",
        images: Array.isArray(input.images) ? input.images.slice(0, 8) : [],
      },
      idempotencyKey: input.idempotencyKey,
    },
    { billing: createPgBillingPort(getPaymentsSqlExecutor()), audit: { supabase: supabase as never } },
  );

  if (!result.ok) return { ok: false, code: result.error.code, message: result.error.message };

  const verdict = parseVerdict(result.value.output);
  if (!verdict) {
    return { ok: false, code: "schema_validation_failed", message: "Henry Onyx Intelligence couldn’t complete the review. Please try again." };
  }
  const decision = resolveVerdictDecision(verdict);
  return {
    ok: true,
    outcome: decision.outcome,
    badge: decision.badge,
    trustScore: verdict.trustScore,
    reasons: decision.reasons,
    receipt: result.value.receipt,
  };
}
