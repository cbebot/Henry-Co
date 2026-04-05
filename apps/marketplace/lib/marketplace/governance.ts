import type { MarketplaceVendor } from "@/lib/marketplace/types";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export type SellerPlanId = "launch" | "growth" | "scale" | "partner";
export type SellerTrustTier =
  | "unverified"
  | "basic_verified"
  | "trusted_seller"
  | "premium_verified_business"
  | "henryco_verified_partner";
export type BuyerRiskBand = "low" | "moderate" | "elevated" | "high";

export type SellerPlanDefinition = {
  id: SellerPlanId;
  name: string;
  monthlyFee: number | null;
  includedListings: number;
  postingFee: number;
  featuredSlotFee: number;
  commissionRate: number;
  payoutFeeRate: number;
  payoutFeeFlat: number;
  summary: string;
  benefits: string[];
};

export type SellerTrustProfile = {
  tier: SellerTrustTier;
  label: string;
  score: number;
  planId: SellerPlanId;
  plan: SellerPlanDefinition;
  payoutDelayDays: number;
  autoReleaseDays: number;
  listingLimit: number;
  canUseFeaturedPlacement: boolean;
  canAccessHighRiskCategories: boolean;
  moderationIntensity: "strict" | "standard" | "light";
  badge: string;
  coaching: string[];
};

export type BuyerRiskProfile = {
  band: BuyerRiskBand;
  score: number;
  signals: string[];
  payoutFreezeRecommended: boolean;
};

export type ListingAssessment = {
  qualityScore: number;
  riskScore: number;
  postingFee: number;
  featuredFee: number;
  requiresManualReview: boolean;
  blockSubmission: boolean;
  allowFeaturedPlacement: boolean;
  moderationReasons: string[];
  trustBadges: string[];
  filterData: Record<string, string | string[] | boolean | number>;
};

export type OrderSettlementSnapshot = {
  sellerPlanId: SellerPlanId;
  sellerTrustTier: SellerTrustTier;
  commissionRate: number;
  commissionAmount: number;
  payoutFeeRate: number;
  payoutFeeFlat: number;
  payoutFeeAmount: number;
  netVendorAmount: number;
  payoutDelayDays: number;
  autoReleaseDays: number;
  holdReason: string;
  featuredPlacementFee: number;
  postingFee: number;
};

export type PayoutBalanceSummary = {
  awaitingPayment: number;
  held: number;
  awaitingAutoRelease: number;
  releasable: number;
  requested: number;
  approved: number;
  frozen: number;
  released: number;
  totalVendorEarnings: number;
  groupIdsByBucket: Record<string, string[]>;
};

export const sellerPlans: SellerPlanDefinition[] = [
  {
    id: "launch",
    name: "Launch",
    monthlyFee: 0,
    includedListings: 3,
    postingFee: 3500,
    featuredSlotFee: 15000,
    commissionRate: 0.15,
    payoutFeeRate: 0.02,
    payoutFeeFlat: 300,
    summary: "New sellers proving trust and delivery reliability.",
    benefits: ["Low-cost entry", "Tight moderation", "Longest reserve window"],
  },
  {
    id: "growth",
    name: "Growth",
    monthlyFee: 25000,
    includedListings: 20,
    postingFee: 2500,
    featuredSlotFee: 10000,
    commissionRate: 0.12,
    payoutFeeRate: 0.015,
    payoutFeeFlat: 250,
    summary: "Verified stores with cleaner operations and more catalog room.",
    benefits: ["Lower commission", "Featured eligibility", "Faster payout timing"],
  },
  {
    id: "scale",
    name: "Scale",
    monthlyFee: 85000,
    includedListings: 999,
    postingFee: 0,
    featuredSlotFee: 6000,
    commissionRate: 0.09,
    payoutFeeRate: 0.01,
    payoutFeeFlat: 250,
    summary: "High-trust stores running serious volume.",
    benefits: ["No per-listing fee", "Best merchant economics", "Highest limits"],
  },
  {
    id: "partner",
    name: "Partner",
    monthlyFee: null,
    includedListings: 9999,
    postingFee: 0,
    featuredSlotFee: 0,
    commissionRate: 0,
    payoutFeeRate: 0,
    payoutFeeFlat: 0,
    summary: "HenryCo-managed or strategic partner inventory.",
    benefits: ["Custom terms", "Direct placement control", "Lowest reserve pressure"],
  },
];

const externalPaymentPatterns = [
  "whatsapp",
  "telegram",
  "dm me",
  "pay direct",
  "bank transfer only",
  "contact seller directly",
  "crypto",
  "usdt",
];

const suspiciousListingPatterns = ["mirror quality", "1:1", "copy receipt", "urgent sale only today"];
const highRiskCategoryTokens = ["electronics", "device", "phone", "jewelry", "luxury", "beauty", "health"];

function cleanText(value: string | null | undefined) {
  return String(value || "").trim();
}

function normalizeLower(value: string | null | undefined) {
  return cleanText(value).toLowerCase();
}

function hasAnyPattern(value: string, patterns: string[]) {
  const haystack = normalizeLower(value);
  return patterns.filter((pattern) => haystack.includes(pattern));
}

function planById(planId: SellerPlanId) {
  return sellerPlans.find((item) => item.id === planId) ?? sellerPlans[0];
}

export function categoryIsHighRisk(categorySlug: string | null | undefined) {
  const normalized = normalizeLower(categorySlug);
  return highRiskCategoryTokens.some((token) => normalized.includes(token));
}

export function deriveSellerTrustProfile(input: {
  vendor?: Partial<MarketplaceVendor> | null;
  deliveredOrderCount?: number;
  openDisputeCount?: number;
  productCount?: number;
  moderationIncidents?: number;
}) : SellerTrustProfile {
  const vendor = input.vendor ?? null;
  const verificationLevel = normalizeLower(vendor?.verificationLevel || "bronze");
  const trustScore = Number(vendor?.trustScore || 0);
  const disputeRate = Number(vendor?.disputeRate || 0);
  const fulfillmentRate = Number(vendor?.fulfillmentRate || 0);
  const openDisputeCount = Math.max(0, Number(input.openDisputeCount || 0));
  const productCount = Math.max(0, Number(input.productCount || 0));
  const moderationIncidents = Math.max(0, Number(input.moderationIncidents || 0));
  const ownerType = normalizeLower(vendor?.ownerType || "vendor");

  let tier: SellerTrustTier = "unverified";
  if (ownerType === "company" || verificationLevel === "henryco") tier = "henryco_verified_partner";
  else if (verificationLevel === "gold" && trustScore >= 90 && disputeRate <= 2 && fulfillmentRate >= 96) tier = "premium_verified_business";
  else if (verificationLevel === "gold" || (trustScore >= 78 && disputeRate <= 4 && fulfillmentRate >= 90)) tier = "trusted_seller";
  else if (verificationLevel === "silver" || trustScore >= 58) tier = "basic_verified";

  const planId: SellerPlanId =
    tier === "henryco_verified_partner" ? "partner" : tier === "trusted_seller" || tier === "premium_verified_business" ? "scale" : tier === "basic_verified" ? "growth" : "launch";
  const badge =
    tier === "henryco_verified_partner" ? "HenryCo verified partner" : tier === "premium_verified_business" ? "Premium verified business" : tier === "trusted_seller" ? "Trusted seller" : tier === "basic_verified" ? "Basic verified" : "Verification pending";

  return {
    tier,
    label: badge,
    score: Math.max(0, Math.min(100, Math.round(trustScore))),
    planId,
    plan: planById(planId),
    payoutDelayDays: tier === "henryco_verified_partner" ? 1 : tier === "premium_verified_business" ? 2 : tier === "trusted_seller" ? 4 : tier === "basic_verified" ? 7 : 10,
    autoReleaseDays: tier === "henryco_verified_partner" ? 1 : tier === "premium_verified_business" ? 2 : tier === "trusted_seller" ? 3 : tier === "basic_verified" ? 4 : 5,
    listingLimit: tier === "henryco_verified_partner" ? 9999 : tier === "premium_verified_business" ? 250 : tier === "trusted_seller" ? 90 : tier === "basic_verified" ? 30 : 8,
    canUseFeaturedPlacement: (tier === "trusted_seller" || tier === "premium_verified_business" || tier === "henryco_verified_partner") && openDisputeCount <= 2 && moderationIncidents < 3,
    canAccessHighRiskCategories: tier === "trusted_seller" || tier === "premium_verified_business" || tier === "henryco_verified_partner",
    moderationIntensity: tier === "unverified" ? "strict" : tier === "basic_verified" ? "standard" : moderationIncidents > 2 || disputeRate > 3.5 ? "standard" : "light",
    badge,
    coaching: [
      productCount < 5 ? "Add more complete listings to improve trust leverage." : "Catalog breadth supports better merchandising.",
      disputeRate > 2.5 ? "Reduce dispute triggers before asking for faster payout treatment." : "Dispute posture supports stronger payout confidence.",
      fulfillmentRate < 92 ? "Tighten delivery proof and lead times." : "Fulfillment reliability is helping trust and payout timing.",
    ],
  };
}

export function deriveBuyerRiskProfile(input: {
  accountAgeDays?: number;
  orderCount?: number;
  disputeCount?: number;
  emailVerified?: boolean;
  phoneVerified?: boolean;
}) : BuyerRiskProfile {
  const accountAgeDays = Math.max(0, Number(input.accountAgeDays || 0));
  const orderCount = Math.max(0, Number(input.orderCount || 0));
  const disputeCount = Math.max(0, Number(input.disputeCount || 0));
  const emailVerified = Boolean(input.emailVerified);
  const phoneVerified = Boolean(input.phoneVerified);

  let score = 0;
  if (!emailVerified) score += 35;
  if (!phoneVerified) score += 20;
  if (accountAgeDays < 14) score += 20;
  if (orderCount === 0) score += 10;
  if (disputeCount >= 2) score += 20;
  if (disputeCount >= 4) score += 15;

  const band: BuyerRiskBand = score >= 70 ? "high" : score >= 45 ? "elevated" : score >= 20 ? "moderate" : "low";

  return {
    band,
    score,
    signals: [
      emailVerified ? "Email verified" : "Email verification missing",
      phoneVerified ? "Phone present" : "Phone verification missing",
      accountAgeDays >= 30 ? `Account aged ${accountAgeDays} days` : "Young account",
      disputeCount > 0 ? `${disputeCount} prior dispute${disputeCount === 1 ? "" : "s"}` : "No prior disputes",
    ],
    payoutFreezeRecommended: band === "high" || band === "elevated",
  };
}

export function evaluateListingSubmission(input: {
  vendor: Partial<MarketplaceVendor> | null;
  title: string;
  summary: string;
  description: string;
  categorySlug: string;
  imageUrl?: string | null;
  sku?: string | null;
  leadTime?: string | null;
  deliveryNote?: string | null;
  requestFeaturedPlacement?: boolean;
  currentProductCount?: number;
  recentSubmissionCount?: number;
  duplicateImageDetected?: boolean;
}) : ListingAssessment {
  const trust = deriveSellerTrustProfile({ vendor: input.vendor, productCount: input.currentProductCount });
  const qualityReasons: string[] = [];
  let qualityScore = 0;
  if (cleanText(input.title).length >= 16) qualityScore += 16; else qualityReasons.push("Title is too thin for premium discovery.");
  if (cleanText(input.summary).length >= 72) qualityScore += 18; else qualityReasons.push("Summary needs more conversion detail.");
  if (cleanText(input.description).length >= 220) qualityScore += 22; else qualityReasons.push("Description is too short for trust and moderation.");
  if (cleanText(input.imageUrl).length > 12) qualityScore += 16; else qualityReasons.push("Primary image is missing.");
  if (cleanText(input.sku).length >= 4) qualityScore += 10; else qualityReasons.push("SKU is missing or weak.");
  if (cleanText(input.deliveryNote).length >= 18) qualityScore += 10; else qualityReasons.push("Delivery note is too vague.");
  if (cleanText(input.leadTime).length >= 4) qualityScore += 8; else qualityReasons.push("Lead time is missing.");

  const moderationReasons: string[] = [];
  let riskScore = 0;
  if (hasAnyPattern([input.title, input.summary, input.description, input.deliveryNote].join(" "), externalPaymentPatterns).length) {
    riskScore += 60;
    moderationReasons.push("Listing contains external payment or off-platform steering language.");
  }
  if (hasAnyPattern([input.title, input.summary, input.description].join(" "), suspiciousListingPatterns).length) {
    riskScore += 20;
    moderationReasons.push("Listing copy contains suspicious sales language.");
  }
  if (input.duplicateImageDetected) {
    riskScore += 20;
    moderationReasons.push("Primary media appears reused across multiple listings.");
  }
  if (categoryIsHighRisk(input.categorySlug) && !trust.canAccessHighRiskCategories) {
    riskScore += 30;
    moderationReasons.push("Seller trust tier is too low for this risk-sensitive category.");
  }
  if (Number(input.recentSubmissionCount || 0) > Math.max(3, Math.floor(trust.listingLimit / 10))) {
    riskScore += 18;
    moderationReasons.push("Listing velocity is unusually high for this seller trust tier.");
  }
  if (Number(input.currentProductCount || 0) >= trust.listingLimit) {
    riskScore += 40;
    moderationReasons.push("Seller has reached the active listing limit for the current trust tier.");
  }

  const blockSubmission = moderationReasons.some((reason) => reason.includes("active listing limit") || reason.includes("off-platform"));
  const allowFeaturedPlacement = Boolean(input.requestFeaturedPlacement) && trust.canUseFeaturedPlacement;
  const postingFee = planById(trust.planId).postingFee > 0 && Number(input.currentProductCount || 0) >= planById(trust.planId).includedListings ? planById(trust.planId).postingFee : 0;

  return {
    qualityScore,
    riskScore,
    postingFee,
    featuredFee: allowFeaturedPlacement ? planById(trust.planId).featuredSlotFee : 0,
    requiresManualReview: blockSubmission || riskScore >= 35 || qualityScore < 68 || trust.moderationIntensity === "strict",
    blockSubmission,
    allowFeaturedPlacement,
    moderationReasons: [...qualityReasons, ...moderationReasons],
    trustBadges: [trust.badge, qualityScore >= 80 ? "High quality listing" : "Listing review required", allowFeaturedPlacement ? "Featured placement requested" : null, riskScore >= 35 ? "Risk review" : null].filter(Boolean) as string[],
    filterData: {
      qualityScore,
      riskScore,
      externalPaymentRisk: riskScore >= 60,
      duplicateImageRisk: Boolean(input.duplicateImageDetected),
      featuredPlacementRequested: Boolean(input.requestFeaturedPlacement),
      featuredPlacementAllowed: allowFeaturedPlacement,
      sellerPlan: trust.planId,
      sellerTrustTier: trust.tier,
    },
  };
}

export function buildOrderSettlementSnapshot(input: {
  vendor: Partial<MarketplaceVendor> | null;
  subtotal: number;
  requestFeaturedPlacement?: boolean;
}) : OrderSettlementSnapshot {
  const trust = deriveSellerTrustProfile({ vendor: input.vendor });
  const plan = planById(trust.planId);
  const subtotal = Math.max(0, Math.round(Number(input.subtotal || 0)));
  const commissionAmount = input.vendor?.ownerType === "company" ? 0 : Math.round(subtotal * plan.commissionRate);
  const prePayoutAmount = Math.max(0, subtotal - commissionAmount);
  const payoutFeeAmount = input.vendor?.ownerType === "company" ? 0 : Math.min(prePayoutAmount, Math.round(prePayoutAmount * plan.payoutFeeRate) + plan.payoutFeeFlat);

  return {
    sellerPlanId: trust.planId,
    sellerTrustTier: trust.tier,
    commissionRate: plan.commissionRate,
    commissionAmount,
    payoutFeeRate: plan.payoutFeeRate,
    payoutFeeFlat: plan.payoutFeeFlat,
    payoutFeeAmount,
    netVendorAmount: Math.max(0, prePayoutAmount - payoutFeeAmount),
    payoutDelayDays: trust.payoutDelayDays,
    autoReleaseDays: trust.autoReleaseDays,
    holdReason: trust.tier === "unverified" ? "New or low-trust seller reserve window." : trust.tier === "basic_verified" ? "Standard reserve and buyer confirmation window." : "Accelerated release window because seller trust is stronger.",
    featuredPlacementFee: input.requestFeaturedPlacement && trust.canUseFeaturedPlacement ? plan.featuredSlotFee : 0,
    postingFee: plan.postingFee,
  };
}

export function getAutoReleaseAt(deliveredAt: string | null | undefined, profile: SellerTrustProfile) {
  if (!deliveredAt) return null;
  const deliveredTime = new Date(deliveredAt).getTime();
  if (Number.isNaN(deliveredTime)) return null;
  return new Date(deliveredTime + profile.autoReleaseDays * DAY_IN_MS).toISOString();
}

export function shouldAutoReleasePayout(input: {
  deliveredAt: string | null | undefined;
  profile: SellerTrustProfile;
  now?: Date;
  disputed?: boolean;
  riskHold?: boolean;
}) {
  if (!input.deliveredAt || input.disputed || input.riskHold) return false;
  const readyAt = getAutoReleaseAt(input.deliveredAt, input.profile);
  if (!readyAt) return false;
  return new Date(readyAt).getTime() <= (input.now ?? new Date()).getTime();
}

export function computePayoutBalance(input: {
  groups: Array<{ id: string; payoutStatus?: string | null; netVendorAmount?: number | null }>;
}) : PayoutBalanceSummary {
  const groupIdsByBucket: Record<string, string[]> = { awaitingPayment: [], held: [], awaitingAutoRelease: [], releasable: [], requested: [], approved: [], frozen: [], released: [] };
  const totals = { awaitingPayment: 0, held: 0, awaitingAutoRelease: 0, releasable: 0, requested: 0, approved: 0, frozen: 0, released: 0 };

  for (const group of input.groups) {
    const status = normalizeLower(group.payoutStatus || "awaiting_payment");
    const amount = Math.max(0, Math.round(Number(group.netVendorAmount || 0)));
    const id = String(group.id);
    if (["awaiting_payment", "pending"].includes(status)) { totals.awaitingPayment += amount; groupIdsByBucket.awaitingPayment.push(id); continue; }
    if (["paid_held"].includes(status)) { totals.held += amount; groupIdsByBucket.held.push(id); continue; }
    if (["delivered_pending_confirmation", "awaiting_auto_release"].includes(status)) { totals.awaitingAutoRelease += amount; groupIdsByBucket.awaitingAutoRelease.push(id); continue; }
    if (["payout_releasable", "eligible"].includes(status)) { totals.releasable += amount; groupIdsByBucket.releasable.push(id); continue; }
    if (["requested", "under_review"].includes(status)) { totals.requested += amount; groupIdsByBucket.requested.push(id); continue; }
    if (["approved", "scheduled"].includes(status)) { totals.approved += amount; groupIdsByBucket.approved.push(id); continue; }
    if (["payout_frozen", "disputed", "refunded", "partially_refunded", "frozen"].includes(status)) { totals.frozen += amount; groupIdsByBucket.frozen.push(id); continue; }
    totals.released += amount; groupIdsByBucket.released.push(id);
  }

  return {
    ...totals,
    totalVendorEarnings: totals.awaitingPayment + totals.held + totals.awaitingAutoRelease + totals.releasable + totals.requested + totals.approved + totals.frozen + totals.released,
    groupIdsByBucket,
  };
}

export function titleCaseMarketplaceValue(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (match) => match.toUpperCase());
}
