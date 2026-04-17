// ---------------------------------------------------------------------------
// apps/marketplace/lib/marketplace/trust.ts
// Server-side vendor trust passport, review authenticity, and trust sync.
//
// Design principles:
//  - Vendor trust passport exposes explainable sub-signals to buyers and staff.
//  - Review authenticity blocks duplicates, enforces rate limits, and runs
//    content safety checks via shouldAutoFlag() from @henryco/trust.
//  - Trust sync recalculates vendor scores from real behavioral data
//    (dispute rate, fulfillment rate, review score) on trigger events.
//  - No legally reckless reputation mechanics — all signals are
//    platform-observable, not user-supplied claims.
// ---------------------------------------------------------------------------
import "server-only";

import { randomUUID } from "node:crypto";
import {
  shouldAutoFlag,
  escalateSeverityForRepeatOffender,
  type ModerationSeverity,
} from "@henryco/trust";
import { createAdminSupabase } from "@/lib/supabase";
import type { MarketplaceVendor } from "@/lib/marketplace/types";
import {
  deriveSellerTrustProfile,
  type SellerTrustTier,
} from "@/lib/marketplace/governance";

// ---- Types ---------------------------------------------------------------

export type VendorTrustPassport = {
  tier: SellerTrustTier;
  score: number;
  badge: string;
  verificationLevel: string;
  fulfillmentRate: number;
  disputeRate: number;
  reviewScore: number;
  responseSlaHours: number;
  /** Human-readable trust signals for buyer-facing display. */
  signals: string[];
  /** Internal coaching shown only to seller / staff — not buyers. */
  coaching: string[];
  lastComputedAt: string;
};

export type ReviewAuthenticityCheck = {
  allowed: boolean;
  blockReason: string | null;
  requiresModeration: boolean;
  moderationReason: string | null;
  moderationSeverity: ModerationSeverity | null;
  isVerifiedPurchase: boolean;
};

export type VendorTrustSyncResult = {
  vendorId: string;
  previousScore: number;
  newScore: number;
  fulfillmentRate: number;
  disputeRate: number;
  reviewScore: number;
  triggerReason: string;
  computedAt: string;
};

// ---- Vendor trust passport (synchronous, from already-loaded data) -------

/**
 * Builds a buyer-facing trust passport from an already-loaded vendor record
 * plus optional behavioral counts.  Does NOT hit the database.
 *
 * Expose only signals that strengthen buyer confidence.
 * Do NOT expose internal coaching, moderation details, or risk internals.
 */
export function buildVendorTrustPassport(
  vendor: Partial<MarketplaceVendor>,
  extra: {
    deliveredOrderCount?: number;
    openDisputeCount?: number;
    productCount?: number;
    moderationIncidents?: number;
  } = {}
): VendorTrustPassport {
  const profile = deriveSellerTrustProfile({ vendor, ...extra });

  const fulfillmentRate = Number(vendor.fulfillmentRate ?? 0);
  const disputeRate = Number(vendor.disputeRate ?? 0);
  const reviewScore = Number(vendor.reviewScore ?? 0);
  const responseSlaHours = Number(vendor.responseSlaHours ?? 24);

  const signals: string[] = [];

  // Verification
  if (
    vendor.verificationLevel === "gold" ||
    vendor.verificationLevel === "henryco"
  ) {
    signals.push("Identity verified");
  }

  // Fulfillment reliability
  if (fulfillmentRate >= 97) {
    signals.push("Exceptional delivery reliability");
  } else if (fulfillmentRate >= 93) {
    signals.push(`${fulfillmentRate.toFixed(0)}% delivery rate`);
  }

  // Dispute rate
  if (disputeRate <= 1) {
    signals.push("Very low dispute rate");
  } else if (disputeRate <= 3) {
    signals.push("Low dispute rate");
  }

  // Review score
  if (reviewScore >= 4.7) {
    signals.push(`${reviewScore.toFixed(1)} ★ from verified buyers`);
  } else if (reviewScore >= 4.0) {
    signals.push(`${reviewScore.toFixed(1)} ★ average rating`);
  }

  // Response speed
  if (responseSlaHours <= 4) {
    signals.push("Responds within 4 hours");
  } else if (responseSlaHours <= 24) {
    signals.push("Responds within 24 hours");
  }

  // HenryCo partner / company seller note
  if (vendor.ownerType === "company") {
    signals.push("HenryCo inventory");
  }

  const coaching: string[] = [...profile.coaching];

  return {
    tier: profile.tier,
    score: profile.score,
    badge: profile.badge,
    verificationLevel: String(vendor.verificationLevel ?? "bronze"),
    fulfillmentRate,
    disputeRate,
    reviewScore,
    responseSlaHours,
    signals,
    coaching,
    lastComputedAt: new Date().toISOString(),
  };
}

// ---- Review authenticity check -------------------------------------------

/**
 * Validates a review submission before writing it to the database.
 *
 * Guards applied (in order):
 *  1. Duplicate review — one user may review each product only once.
 *  2. Rate limiting   — max 5 reviews per user per 24-hour window.
 *  3. Content safety  — high/critical auto-flag blocks submission entirely.
 *                       Medium auto-flag allows submission but queues for moderation.
 *
 * Returns { allowed, blockReason, requiresModeration, ... }.
 * The caller is responsible for creating the moderation case when
 * requiresModeration is true.
 */
export async function checkReviewAuthenticity(input: {
  userId: string;
  productId: string;
  title: string;
  body: string;
  isVerifiedPurchase: boolean;
}): Promise<ReviewAuthenticityCheck> {
  const admin = createAdminSupabase();

  // 1. Duplicate review guard — one review per (user, product)
  const { data: existingReview } = await admin
    .from("marketplace_reviews")
    .select("id")
    .eq("user_id", input.userId)
    .eq("product_id", input.productId)
    .maybeSingle();

  if (existingReview?.id) {
    return {
      allowed: false,
      blockReason: "You have already submitted a review for this product.",
      requiresModeration: false,
      moderationReason: null,
      moderationSeverity: null,
      isVerifiedPurchase: input.isVerifiedPurchase,
    };
  }

  // 2. Rate limiting — max 5 reviews in any 24-hour window per user
  const windowStart = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: recentCount } = await admin
    .from("marketplace_reviews")
    .select("id", { count: "exact", head: true })
    .eq("user_id", input.userId)
    .gte("created_at", windowStart);

  if ((recentCount ?? 0) >= 5) {
    return {
      allowed: false,
      blockReason:
        "You have submitted too many reviews recently. Please try again tomorrow.",
      requiresModeration: false,
      moderationReason: null,
      moderationSeverity: null,
      isVerifiedPurchase: input.isVerifiedPurchase,
    };
  }

  // 3. Content safety via shared trust detection
  const contentToCheck = [input.title, input.body].filter(Boolean).join(" ");
  const autoFlag = shouldAutoFlag(contentToCheck);

  // Repeat-offender escalation: look up unresolved trust flags for this
  // reviewer over the past 30 days and bump severity before the block decision.
  let effectiveSeverity = autoFlag.severity;
  if (autoFlag.flag) {
    const flagWindow = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { count: priorFlagCount } = await admin
      .from("trust_flags")
      .select("id", { count: "exact", head: true })
      .eq("user_id", input.userId)
      .is("resolved_at", null)
      .gte("created_at", flagWindow);
    effectiveSeverity = escalateSeverityForRepeatOffender(
      autoFlag.severity,
      priorFlagCount ?? 0
    );
  }

  if (
    autoFlag.flag &&
    (effectiveSeverity === "high" || effectiveSeverity === "critical")
  ) {
    // Write a trust_flags record before returning — best-effort, never let a
    // failed write prevent the block from being returned to the caller.
    try {
      await admin.from("trust_flags").insert({
        id: randomUUID(),
        user_id: input.userId,
        flag_type: "off_platform_contact",
        reason: autoFlag.reason,
        severity: effectiveSeverity,
        source: "system",
        entity_type: "review",
        entity_id: null, // review was not persisted
        metadata: { product_id: input.productId },
        created_at: new Date().toISOString(),
        resolved_at: null,
      });
    } catch {
      // Tolerate — block is unconditional
    }
    // Block entirely — do not create a draft review
    return {
      allowed: false,
      blockReason:
        "This review contains content that cannot be accepted. " +
        "Please rewrite it without suspicious or off-platform language.",
      requiresModeration: false,
      moderationReason: autoFlag.reason,
      moderationSeverity: effectiveSeverity,
      isVerifiedPurchase: input.isVerifiedPurchase,
    };
  }

  // Medium severity (after repeat-offender escalation): allow but hold for moderation
  const requiresModeration =
    autoFlag.flag && effectiveSeverity === "medium";

  return {
    allowed: true,
    blockReason: null,
    requiresModeration,
    moderationReason: requiresModeration ? autoFlag.reason : null,
    moderationSeverity: requiresModeration ? (effectiveSeverity as ModerationSeverity) : null,
    isVerifiedPurchase: input.isVerifiedPurchase,
  };
}

// ---- Vendor trust score sync ----------------------------------------------

/**
 * Reads real behavioral signals from the database, derives an updated trust
 * score, and writes it back to the marketplace_vendors row.
 *
 * Also appends an audit snapshot to marketplace_vendor_trust_snapshots.
 *
 * Call after:
 *  - dispute resolved (dispute_update → status "resolved")
 *  - delivery milestone (vendor_order_update → fulfillmentStatus "delivered")
 *  - review published (review_submit with is_verified_purchase)
 *  - vendor application approved
 *
 * Returns a summary of the changes made, or null if the vendor was not found.
 */
export async function syncVendorTrustScore(
  vendorId: string,
  triggerReason: string
): Promise<VendorTrustSyncResult | null> {
  if (!vendorId) return null;

  const admin = createAdminSupabase();

  // 1. Load vendor record and behavioral counts in parallel
  const [
    vendorRes,
    { count: deliveredOrderCount },
    { count: openDisputeCount },
    { count: totalFulfilledCount },
    { count: productCount },
    publishedReviewsRes,
  ] = await Promise.all([
    admin
      .from("marketplace_vendors")
      .select(
        "id, trust_score, verification_level, owner_type, fulfillment_rate, dispute_rate, review_score, response_sla_hours"
      )
      .eq("id", vendorId)
      .maybeSingle(),

    admin
      .from("marketplace_order_groups")
      .select("id", { count: "exact", head: true })
      .eq("vendor_id", vendorId)
      .eq("fulfillment_status", "delivered"),

    admin
      .from("marketplace_disputes")
      .select("id", { count: "exact", head: true })
      .eq("vendor_id", vendorId)
      .in("status", ["open", "investigating"]),

    // Total order groups past "awaiting_acceptance" = meaningful order history
    admin
      .from("marketplace_order_groups")
      .select("id", { count: "exact", head: true })
      .eq("vendor_id", vendorId)
      .not("fulfillment_status", "eq", "awaiting_acceptance"),

    admin
      .from("marketplace_products")
      .select("id", { count: "exact", head: true })
      .eq("vendor_id", vendorId),

    admin
      .from("marketplace_reviews")
      .select("rating")
      .eq("vendor_id", vendorId)
      .eq("status", "published"),
  ]);

  const vendor = vendorRes.data as Record<string, unknown> | null;
  if (!vendor) return null;

  const previousScore = Number(vendor.trust_score ?? 0);
  const totalOrders = totalFulfilledCount ?? 0;

  // 2. Recalculate behavioral metrics
  const fulfillmentRate =
    totalOrders >= 3
      ? Math.round(
          (((deliveredOrderCount ?? 0) / totalOrders) * 100 * 10) / 10
        )
      : // Fewer than 3 orders: use stored value but don't let it drop yet
        Number(vendor.fulfillment_rate ?? 93);

  const disputeRate =
    totalOrders >= 5
      ? Math.round(
          (((openDisputeCount ?? 0) / totalOrders) * 100 * 10) / 10
        )
      : Number(vendor.dispute_rate ?? 2.5);

  const ratings = (publishedReviewsRes.data ?? [])
    .map((r: Record<string, unknown>) => Number(r.rating ?? 0))
    .filter((v) => v > 0);
  const reviewScore =
    ratings.length >= 2
      ? Math.round(
          (ratings.reduce((sum, v) => sum + v, 0) / ratings.length) * 10
        ) / 10
      : Number(vendor.review_score ?? 4.5);

  // 3. Derive trust profile from updated signals using existing governance logic
  const vendorRecord: Partial<MarketplaceVendor> = {
    id: String(vendor.id),
    trustScore: previousScore,
    verificationLevel: String(
      vendor.verification_level ?? "bronze"
    ) as MarketplaceVendor["verificationLevel"],
    ownerType: String(vendor.owner_type ?? "vendor") as MarketplaceVendor["ownerType"],
    fulfillmentRate,
    disputeRate,
    reviewScore,
    responseSlaHours: Number(vendor.response_sla_hours ?? 24),
  };

  const profile = deriveSellerTrustProfile({
    vendor: vendorRecord,
    deliveredOrderCount: deliveredOrderCount ?? 0,
    openDisputeCount: openDisputeCount ?? 0,
    productCount: productCount ?? 0,
  });

  // 4. Add review-quality bonus/penalty on top of tier-based score
  let newScore = profile.score;
  if (reviewScore >= 4.7 && ratings.length >= 5) {
    newScore = Math.min(100, newScore + 5);
  } else if (reviewScore < 3.5 && ratings.length >= 5) {
    newScore = Math.max(0, newScore - 8);
  }
  newScore = Math.max(0, Math.min(100, Math.round(newScore)));

  const computedAt = new Date().toISOString();

  // 5. Update vendor record with recalculated signals
  await admin
    .from("marketplace_vendors")
    .update({
      trust_score: newScore,
      fulfillment_rate: fulfillmentRate,
      dispute_rate: disputeRate,
      review_score: reviewScore,
      trust_last_computed_at: computedAt,
    } as never)
    .eq("id", vendorId);

  // 6. Write audit snapshot (best-effort — schema may lag migrations)
  try {
    await admin.from("marketplace_vendor_trust_snapshots").insert({
      vendor_id: vendorId,
      trust_score: newScore,
      fulfillment_rate: fulfillmentRate,
      dispute_rate: disputeRate,
      review_score: reviewScore,
      tier: profile.tier,
      trigger_reason: triggerReason,
      computed_at: computedAt,
      computed_by: "system",
    } as never);
  } catch {
    // Tolerate schema lag — snapshot is best-effort audit trail
  }

  return {
    vendorId,
    previousScore,
    newScore,
    fulfillmentRate,
    disputeRate,
    reviewScore,
    triggerReason,
    computedAt,
  };
}
