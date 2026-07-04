"use server";

import { runAiTask, createPgBillingPort } from "@henryco/ai-gateway/server";
import { parseVerdict, resolveVerdictDecision, type AiUsageReceipt, type VerdictDecision } from "@henryco/ai-gateway";
import { getPaymentsSqlExecutor } from "@henryco/payments-db";
import { getPropertyViewer } from "@/lib/property/auth";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase";
import { stableListingRowId } from "@/lib/property/listing-mapping";

export interface VerifyListingInput {
  /** The saved listing being reviewed; omit for a pre-save dry run (audited, no badge). */
  listingId?: string;
  title: string;
  summary?: string;
  description?: string;
  /** The property "kind" (rent/sale/commercial/...) — passed as the review's category hint. */
  category?: string;
  images?: string[];
  idempotencyKey: string;
}

export type VerifyListingResult =
  | { ok: true; outcome: VerdictDecision; badge: boolean; trustScore: number; reasons: string[]; receipt: AiUsageReceipt }
  | { ok: false; code: string; message: string };

/**
 * V3 trust layer — "Henry Onyx Verified" for property listings. Runs the deep-tier, METERED,
 * multimodal review through the governed gateway (auth-gated, prepaid, metered, audited,
 * provider-opaque). Returns ONLY the resolved decision + constructive reasons + the redacted
 * receipt — never the provider, model, cost, or margin. The verdict AUGMENTS human moderation:
 * a `verified` decision earns the badge; `review`/`reject` route to a human. It never publishes
 * the listing (go-live still flows through the listing's own submit/approve pipeline).
 *
 * Flag-dark: the gateway's `ai_gateway` kill switch gates every call, so nothing runs until the
 * company enables it. Mirrors apps/marketplace/lib/ai/verify-listing-action.ts.
 */
export async function verifyPropertyListingAction(input: VerifyListingInput): Promise<VerifyListingResult> {
  const viewer = await getPropertyViewer();
  if (!viewer.user) {
    return { ok: false, code: "auth_required", message: "Sign in to request a review." };
  }
  if (!input.title?.trim() && !input.description?.trim()) {
    return { ok: false, code: "rate_limited", message: "Add your listing details first." };
  }

  // Ownership (IDOR guard) — checked BEFORE charging so a user can never spend to attach a
  // verdict/badge to a listing they don't own. The listing's owner OR active property staff
  // (admin / managed-ops), mirroring the SECURITY DEFINER writer's guard exactly so the app
  // never charges for a call the writer would then refuse. (A null listingId is a pre-save
  // dry run — audited, no badge.)
  // The DB row id is the deterministic uuid mapping of the app-level id (legacy Storage-era
  // ids are strings — a raw .eq on the uuid column would 22P02 before the guard even ran).
  const listingRowId = input.listingId ? stableListingRowId(input.listingId) : null;
  if (listingRowId) {
    const admin = createAdminSupabase();
    const { data: listing } = await admin
      .from("property_listings")
      .select("owner_user_id")
      .eq("id", listingRowId)
      .maybeSingle();
    const ownsListing = listing?.owner_user_id != null && listing.owner_user_id === viewer.user.id;
    let isStaff = false;
    if (!ownsListing) {
      const { data: staff } = await admin
        .from("property_role_memberships")
        .select("id")
        .eq("user_id", viewer.user.id)
        .eq("is_active", true)
        .in("role", ["property_admin", "managed_ops"])
        .limit(1)
        .maybeSingle();
      isStaff = Boolean(staff);
    }
    if (!listing || (!ownsListing && !isStaff)) {
      return { ok: false, code: "forbidden", message: "You can only review your own listings." };
    }
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

  // Persist durably (the audit record + the buyer-visible badge) via the service-role-only
  // SECURITY DEFINER writer — the only path that can set the badge, so it can never be
  // client-forged. Best-effort: a persistence hiccup must not lose the result the owner paid for.
  try {
    const admin = createAdminSupabase();
    await admin.rpc("record_property_listing_verification", {
      p_listing_id: listingRowId,
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
