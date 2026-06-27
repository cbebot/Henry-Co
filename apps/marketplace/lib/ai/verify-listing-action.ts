"use server";

import { runAiTask, createPgBillingPort } from "@henryco/ai-gateway/server";
import { parseVerdict, resolveVerdictDecision, type AiUsageReceipt, type VerdictDecision } from "@henryco/ai-gateway";
import { getMarketplaceViewer, viewerHasRole } from "@/lib/marketplace/auth";
import { getPaymentsSqlExecutor } from "@/lib/payments/db";
import { createSupabaseServer } from "@/lib/supabase/server";

export interface VerifyInput {
  title: string;
  summary?: string;
  description?: string;
  category?: string;
  images?: string[];
  idempotencyKey: string;
}

export type VerifyResult =
  | { ok: true; outcome: VerdictDecision; badge: boolean; trustScore: number; reasons: string[]; receipt: AiUsageReceipt }
  | { ok: false; code: string; message: string };

/**
 * V3 trust layer — "Henry Onyx Verified". Runs the deep-tier, METERED, multimodal review
 * through the gateway (auth-gated, prepaid, metered, audited, provider-opaque). Returns ONLY
 * the resolved decision + constructive reasons + the redacted receipt — never the provider,
 * model, cost, or margin. The verdict AUGMENTS human moderation: a `verified` decision earns
 * the badge; `review`/`reject` route to a human. It never publishes the listing.
 */
export async function verifyListingAction(input: VerifyInput): Promise<VerifyResult> {
  const viewer = await getMarketplaceViewer();
  if (!viewer.user || !viewerHasRole(viewer, ["vendor", "marketplace_owner", "marketplace_admin"])) {
    return { ok: false, code: "auth_required", message: "Sign in as a seller to request a review." };
  }
  if (!input.title?.trim() && !input.description?.trim()) {
    return { ok: false, code: "rate_limited", message: "Add your listing details first." };
  }

  const supabase = await createSupabaseServer();
  const result = await runAiTask(
    {
      surface: "marketplace.listing.verify",
      actorId: viewer.user.id,
      input: {
        title: input.title ?? "",
        summary: input.summary ?? "",
        description: input.description ?? "",
        category: input.category ?? "",
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
