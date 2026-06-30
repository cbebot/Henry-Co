"use server";

import { runAiTask, createPgBillingPort } from "@henryco/ai-gateway/server";
import { parseVerdict, resolveVerdictDecision, type AiUsageReceipt, type VerdictDecision } from "@henryco/ai-gateway";
import { getMarketplaceViewer, viewerHasRole } from "@/lib/marketplace/auth";
import { getPaymentsSqlExecutor } from "@/lib/payments/db";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase";

export interface VerifyInput {
  /** The saved product being reviewed; omit for a pre-save dry run (audited, no badge). */
  productId?: string;
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

  // Ownership (IDOR guard) — checked BEFORE charging so a vendor can never spend to attach a
  // verdict/badge to a product they don't own. A vendor must be an active member of the
  // product's vendor; platform staff may review any. The SECURITY DEFINER writer enforces
  // the same rule unbypassably as a backstop. (A null productId is a pre-save dry run.)
  if (input.productId) {
    const admin = createAdminSupabase();
    const { data: product } = await admin
      .from("marketplace_products")
      .select("vendor_id")
      .eq("id", input.productId)
      .maybeSingle();
    const isStaff = viewerHasRole(viewer, ["marketplace_owner", "marketplace_admin"]);
    const ownsVendor =
      product?.vendor_id != null &&
      viewer.memberships.some((m) => m.scopeType === "vendor" && m.scopeId === product.vendor_id);
    if (!product || (!isStaff && !ownsVendor)) {
      return { ok: false, code: "forbidden", message: "You can only review your own listings." };
    }
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

  // Persist the verdict durably (the audit record + the buyer-visible badge) via the
  // service-role-only SECURITY DEFINER writer — the only path that can set the badge, so it
  // can never be client-forged. Best-effort: a persistence hiccup must not lose the result
  // the seller already paid for.
  try {
    const admin = createAdminSupabase();
    await admin.rpc("record_listing_verification", {
      p_product_id: input.productId ?? null,
      p_user_id: viewer.user.id,
      p_outcome: decision.outcome,
      p_trust_score: verdict.trustScore,
      p_honest: verdict.honest,
      p_ai_generated_media: verdict.aiGeneratedMedia,
      p_matches_standards: verdict.matchesStandards,
      p_safe_to_post: verdict.safeToPost,
      p_reasons: decision.reasons,
      p_ai_usage_event_id: result.value.receipt.usageEventId,
    });
  } catch {
    /* the verdict still returns; persistence is best-effort */
  }

  return {
    ok: true,
    outcome: decision.outcome,
    badge: decision.badge,
    trustScore: verdict.trustScore,
    reasons: decision.reasons,
    receipt: result.value.receipt,
  };
}
