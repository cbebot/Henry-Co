"use server";

import { runAiTask, createPgBillingPort } from "@henryco/ai-gateway/server";
import { parseVerdict, resolveVerdictDecision, type AiUsageReceipt, type VerdictDecision } from "@henryco/ai-gateway";
import { getPaymentsSqlExecutor } from "@henryco/payments-db";
import { getJobsViewer, viewerHasRole } from "@/lib/auth";
import { createSupabaseServer } from "@/lib/supabase/server";

export type VerifyPostingResult =
  | { ok: true; outcome: VerdictDecision; badge: boolean; trustScore: number; reasons: string[]; receipt: AiUsageReceipt }
  | { ok: false; code: string; message: string };

/**
 * jobs.posting.verify — METERED, deep tier. An anti-scam / fake-job trust review the employer
 * runs on their OWN draft before it goes live (directly answers the FIRE JOB-1 phishing
 * finding). Advisory: it returns the verdict for the employer to act on and AUGMENTS human
 * moderation — it never auto-publishes and persists no badge (no entity exists yet, so no IDOR
 * surface). Provider/model never reach the client; the return carries only the decision +
 * reasons + the redacted receipt.
 */
export async function verifyPostingAction(input: {
  title: string;
  summary?: string;
  description?: string;
  images?: string[];
  idempotencyKey: string;
}): Promise<VerifyPostingResult> {
  const viewer = await getJobsViewer();
  if (!viewer.user || !viewerHasRole(viewer, ["employer", "admin", "owner"])) {
    return { ok: false, code: "auth_required", message: "Sign in as an employer to request a review." };
  }
  if (!input.title?.trim() && !input.description?.trim()) {
    return { ok: false, code: "rate_limited", message: "Add your posting details first." };
  }

  const supabase = await createSupabaseServer();
  const result = await runAiTask(
    {
      surface: "jobs.posting.verify",
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
