import {
  deriveSellerTrustProfile,
  type SellerTrustProfile,
} from "@/lib/marketplace/governance";
import type {
  MarketplaceProduct,
  MarketplaceReview,
  MarketplaceVendor,
  TrustPassport,
  TrustRiskBand,
  TrustSignal,
} from "@/lib/marketplace/types";

function asPercent(value: number) {
  return `${Math.max(0, Math.round(value))}%`;
}

function buildRiskBand(score: number): TrustRiskBand {
  if (score >= 85) return "low";
  if (score >= 70) return "guarded";
  if (score >= 55) return "elevated";
  return "high";
}

function buildLabel(score: number) {
  if (score >= 90) return "Exceptional trust posture";
  if (score >= 80) return "Strong trust posture";
  if (score >= 68) return "Protected with active review";
  if (score >= 52) return "Needs closer operator review";
  return "High-friction trust posture";
}

function buildVendorSignals(
  vendor: MarketplaceVendor,
  sellerProfile: SellerTrustProfile,
  publishedReviews: MarketplaceReview[]
): TrustSignal[] {
  const verifiedReviews = publishedReviews.filter((review) => review.verifiedPurchase);
  const verifiedRate = publishedReviews.length
    ? Math.round((verifiedReviews.length / publishedReviews.length) * 100)
    : 0;

  return [
    {
      id: "verification",
      label: "Verification",
      value: sellerProfile.badge,
      tone:
        vendor.verificationLevel === "henryco" || vendor.verificationLevel === "gold"
          ? "positive"
          : vendor.verificationLevel === "silver"
            ? "neutral"
            : "warning",
      detail: "Verification level changes payout delay, listing access, and moderation intensity.",
    },
    {
      id: "fulfillment",
      label: "Fulfillment reliability",
      value: asPercent(vendor.fulfillmentRate),
      tone: vendor.fulfillmentRate >= 95 ? "positive" : vendor.fulfillmentRate >= 88 ? "neutral" : "warning",
      detail: "Fulfillment reliability is one of the clearest signals of whether sellers actually close the loop after payment.",
    },
    {
      id: "disputes",
      label: "Dispute posture",
      value: `${vendor.disputeRate.toFixed(1)}%`,
      tone: vendor.disputeRate <= 2 ? "positive" : vendor.disputeRate <= 4 ? "neutral" : "critical",
      detail: "Dispute rate directly affects moderation intensity and payout confidence.",
    },
    {
      id: "response",
      label: "Response discipline",
      value: `${vendor.responseSlaHours}h`,
      tone: vendor.responseSlaHours <= 6 ? "positive" : vendor.responseSlaHours <= 24 ? "neutral" : "warning",
      detail: "Slow seller response creates support load and weakens buyer confidence before disputes even start.",
    },
    {
      id: "review_authenticity",
      label: "Review authenticity",
      value: publishedReviews.length ? `${verifiedRate}% verified` : "No review history yet",
      tone:
        publishedReviews.length === 0
          ? "neutral"
          : verifiedRate >= 80
            ? "positive"
            : verifiedRate >= 50
              ? "warning"
              : "critical",
      detail: "Only published, legitimate buyer feedback should lift store trust in a meaningful way.",
    },
  ];
}

export function buildMarketplaceVendorTrustPassport(input: {
  vendor: MarketplaceVendor;
  publishedReviews: MarketplaceReview[];
  productCount: number;
  moderationIncidents?: number;
}) {
  const sellerProfile = deriveSellerTrustProfile({
    vendor: input.vendor,
    productCount: input.productCount,
    moderationIncidents: input.moderationIncidents,
  });
  const signals = buildVendorSignals(input.vendor, sellerProfile, input.publishedReviews);
  const scoreAdjustments =
    (input.publishedReviews.length >= 3 ? 4 : 0) +
    (input.vendor.responseSlaHours <= 6 ? 3 : 0) -
    (input.vendor.disputeRate > 4 ? 8 : 0) -
    (input.vendor.fulfillmentRate < 88 ? 10 : 0);
  const score = Math.max(0, Math.min(100, sellerProfile.score + scoreAdjustments));
  const riskBand = buildRiskBand(score);
  const suspiciousFlags = [
    ...(input.vendor.disputeRate > 4 ? ["Dispute posture is materially above the safer seller band."] : []),
    ...(input.vendor.responseSlaHours > 24 ? ["Response delay is long enough to create buyer-risk pressure."] : []),
    ...(input.publishedReviews.length > 0 &&
    input.publishedReviews.filter((review) => review.verifiedPurchase).length === 0
      ? ["Published review history exists without verified-purchase support."] : []),
  ];

  return {
    score,
    label: buildLabel(score),
    riskBand,
    summary:
      riskBand === "low"
        ? "This store combines stronger verification, cleaner fulfillment, and a lower-friction dispute posture."
        : riskBand === "guarded"
          ? "This store has meaningful trust signals, but buyers should still read delivery and support cues carefully."
          : riskBand === "elevated"
            ? "This store can still operate, but moderation and support should watch reliability more closely."
            : "This store needs active caution, tighter moderation, and explicit buyer protection cues.",
    strengths: [
      ...(input.vendor.fulfillmentRate >= 95 ? ["Fulfillment reliability is in a strong band."] : []),
      ...(input.vendor.responseSlaHours <= 6 ? ["Response discipline is fast enough to support buyer confidence."] : []),
      ...(sellerProfile.tier === "trusted_seller" ||
      sellerProfile.tier === "premium_verified_business" ||
      sellerProfile.tier === "henryco_verified_partner"
        ? ["Seller tier unlocks stronger payout and merchandising confidence."] : []),
    ],
    warnings: [
      ...(input.vendor.disputeRate > 3 ? ["Dispute rate is high enough to matter operationally."] : []),
      ...(input.vendor.fulfillmentRate < 90 ? ["Fulfillment posture is weaker than a premium-trust seller should target."] : []),
      ...(input.publishedReviews.length < 2 ? ["Review history is still thin, so trust depends more on verification and operations than review volume."] : []),
    ],
    nextSteps: [
      ...sellerProfile.coaching,
      "Keep support responsiveness tight so delays do not spill into disputes and payout friction.",
    ],
    suspiciousFlags,
    signals,
  } satisfies TrustPassport;
}

export function buildMarketplaceProductTrustPassport(input: {
  product: MarketplaceProduct;
  vendor: MarketplaceVendor | null;
  publishedReviews: MarketplaceReview[];
}) {
  const verifiedReviews = input.publishedReviews.filter((review) => review.verifiedPurchase);
  const listingCompletenessScore =
    (input.product.description.length >= 220 ? 30 : 14) +
    (input.product.gallery.length >= 3 ? 24 : 10) +
    (Object.keys(input.product.specifications).length >= 4 ? 20 : 8) +
    (input.product.deliveryNote.length >= 18 ? 16 : 6) +
    (input.product.leadTime.length >= 4 ? 10 : 4);
  const vendorScore = input.vendor?.trustPassport?.score ?? input.vendor?.trustScore ?? 0;
  const score = Math.max(
    0,
    Math.min(
      100,
      Math.round(listingCompletenessScore * 0.4 + vendorScore * 0.45 + Math.min(verifiedReviews.length, 5) * 3)
    )
  );
  const riskBand = buildRiskBand(score);

  const signals: TrustSignal[] = [
    {
      id: "seller",
      label: "Seller posture",
      value: input.vendor?.trustPassport?.label || input.vendor?.name || "Pending seller linkage",
      tone: input.vendor ? (vendorScore >= 80 ? "positive" : vendorScore >= 65 ? "neutral" : "warning") : "warning",
      detail: "Product trust should inherit from the seller operating it, not just from the listing cosmetics.",
    },
    {
      id: "listing_quality",
      label: "Listing quality",
      value: `${listingCompletenessScore}/100`,
      tone: listingCompletenessScore >= 75 ? "positive" : listingCompletenessScore >= 55 ? "neutral" : "warning",
      detail: "Specifications, proof-rich descriptions, and delivery clarity make listings harder to game and easier to trust.",
    },
    {
      id: "review_legitimacy",
      label: "Review legitimacy",
      value: verifiedReviews.length ? `${verifiedReviews.length} verified review${verifiedReviews.length === 1 ? "" : "s"}` : "No verified reviews yet",
      tone: verifiedReviews.length >= 2 ? "positive" : verifiedReviews.length === 1 ? "neutral" : "warning",
      detail: "Only verified-purchase review history should materially improve product confidence.",
    },
    {
      id: "payment_protection",
      label: "Payment protection",
      value: input.product.codEligible ? "COD or verified transfer" : "Verified transfer only",
      tone: "neutral",
      detail: "Marketplace payment protection comes from HenryCo-held payment review and dispute control, not from a seller promise alone.",
    },
  ];

  return {
    score,
    label: buildLabel(score),
    riskBand,
    summary:
      riskBand === "low"
        ? "This listing combines cleaner seller posture, stronger listing completeness, and more legitimate buyer-proof."
        : riskBand === "guarded"
          ? "This listing is usable, but buyers should still read delivery and store-trust cues before paying."
          : riskBand === "elevated"
            ? "This listing needs more trust support or more complete proof before it feels premium."
            : "This listing should be approached cautiously until stronger seller, review, or listing-quality evidence appears.",
    strengths: [
      ...(listingCompletenessScore >= 75 ? ["Listing completeness is above the fragile-trust threshold."] : []),
      ...(input.product.codEligible ? ["Cash-on-delivery eligibility adds a protection cue where supported."] : []),
      ...(verifiedReviews.length >= 2 ? ["Verified review history already supports the listing."] : []),
    ],
    warnings: [
      ...(listingCompletenessScore < 60 ? ["Listing proof is still too thin for a premium-trust experience."] : []),
      ...(verifiedReviews.length === 0 ? ["There is no verified-purchase review history yet."] : []),
      ...(!input.vendor ? ["Store linkage is missing, so the product cannot borrow stronger seller accountability cues."] : []),
    ],
    nextSteps: [
      "Keep descriptions, specifications, and delivery commitments specific enough for moderation and buyers to verify them later.",
      "Earn verified buyer feedback instead of relying on decorative trust copy.",
    ],
    suspiciousFlags: [
      ...(listingCompletenessScore < 50 ? ["Listing completeness is low enough to increase moderation sensitivity."] : []),
    ],
    signals,
  } satisfies TrustPassport;
}
