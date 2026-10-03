// V3-MKT-TRUST-01 — the row a verdict is bound to. PURE.
//
// The database hashes a fixed set of listing columns (marketplace_listing_content_hash)
// when it mints a verdict and again when the row is written, and refuses a live
// write whose hash has no verdict. So the gate must hand the SAME values to both
// calls. This module builds that one object; the caller passes it verbatim to
// the verdict RPC and to the insert/update, and never re-derives a field between
// the two.
//
// `filter_data.gate.media` is a digest of the ordered gallery. Images live in
// their own table, outside the hashed columns; stamping the digest here means a
// gallery change IS a content change, so it needs — and consumes — a verdict of
// its own instead of riding on the previous one.

import { createHash } from "node:crypto";
import { deriveSellerTrustProfile, evaluateListingSubmission } from "../governance";
import type { MarketplaceVendor } from "../types";
import { GATE_ENGINE_VERSION, blockingReasons, type GateOutcome, type GateReasonCode } from "./reasons";

/** What the seller posted, already trimmed and typed. */
export interface ListingDraft {
  slug: string;
  categoryId: string;
  categorySlug: string;
  brandId: string | null;
  title: string;
  summary: string;
  description: string;
  basePrice: number;
  compareAtPrice: number | null;
  sku: string;
  deliveryNote: string;
  leadTime: string;
  codEligible: boolean;
  material: string;
  warranty: string;
  requestFeaturedPlacement: boolean;
}

/** Exactly the columns the database hashes. */
export interface HashedListingRow {
  slug: string;
  vendor_id: string;
  category_id: string;
  brand_id: string | null;
  title: string;
  summary: string;
  description: string;
  inventory_owner_type: "vendor";
  base_price: number;
  compare_at_price: number | null;
  sku: string;
  trust_badges: string[];
  filter_data: Record<string, unknown>;
  specifications: Record<string, string>;
  delivery_note: string;
  lead_time: string;
  cod_eligible: boolean;
  /** Present only when the listing already exists with a currency of its own. */
  currency?: string;
}

/** Badges the legacy assessment adds for its review queue; they are not buyer-facing facts. */
const REVIEW_QUEUE_BADGES = new Set(["Listing review required", "Risk review"]);

/** Stable digest of an ordered gallery. */
export function mediaDigest(refs: ReadonlyArray<string>): string {
  return createHash("sha256").update(JSON.stringify([...refs])).digest("hex").slice(0, 24);
}

export function buildListingRow(input: {
  draft: ListingDraft;
  vendorId: string;
  /** The store record quality is scored against; null when the catalogue snapshot has not seen it yet. */
  vendor: Partial<MarketplaceVendor> | null;
  /** Canonical media refs, cover first. */
  refs: ReadonlyArray<string>;
  listingRows: number;
  openDisputeCount: number;
  duplicateImage: boolean;
  outcome: GateOutcome;
  reasons: ReadonlyArray<GateReasonCode>;
  /** The existing row's currency, so an edit hashes the value it keeps. */
  currency?: string | null;
}): HashedListingRow {
  const { draft } = input;
  const sellerProfile = deriveSellerTrustProfile({
    vendor: input.vendor,
    productCount: input.listingRows,
    openDisputeCount: input.openDisputeCount,
  });
  const assessment = evaluateListingSubmission({
    vendor: input.vendor,
    title: draft.title,
    summary: draft.summary,
    description: draft.description,
    categorySlug: draft.categorySlug,
    imageUrl: input.refs[0] ?? "",
    sku: draft.sku,
    leadTime: draft.leadTime,
    deliveryNote: draft.deliveryNote,
    requestFeaturedPlacement: draft.requestFeaturedPlacement,
    currentProductCount: input.listingRows,
    duplicateImageDetected: input.duplicateImage,
  });

  const row: HashedListingRow = {
    slug: draft.slug,
    vendor_id: input.vendorId,
    category_id: draft.categoryId,
    brand_id: draft.brandId,
    title: draft.title,
    summary: draft.summary,
    description: draft.description,
    inventory_owner_type: "vendor",
    base_price: draft.basePrice,
    compare_at_price: draft.compareAtPrice,
    sku: draft.sku,
    trust_badges: assessment.trustBadges.filter((badge) => !REVIEW_QUEUE_BADGES.has(badge)),
    filter_data: {
      verifiedSeller: sellerProfile.tier !== "unverified",
      codEligible: draft.codEligible,
      qualityScore: assessment.qualityScore,
      riskScore: assessment.riskScore,
      postingFee: assessment.postingFee,
      featuredFee: assessment.featuredFee,
      // The legacy queue's free-text notes. Under the gate the reasons are codes.
      reviewReasons: [],
      requestFeaturedPlacement: draft.requestFeaturedPlacement,
      duplicateAssetDetected: input.duplicateImage,
      hasPrimaryImage: input.refs.length > 0,
      sellerPlanId: sellerProfile.planId,
      sellerTrustTier: sellerProfile.tier,
      gate: {
        engine: GATE_ENGINE_VERSION,
        outcome: input.outcome,
        reasons: blockingReasons(input.reasons),
        media: mediaDigest(input.refs),
      },
    },
    specifications: {
      Material: draft.material,
      Warranty: draft.warranty,
    },
    delivery_note: draft.deliveryNote,
    lead_time: draft.leadTime,
    cod_eligible: draft.codEligible,
  };

  const currency = typeof input.currency === "string" ? input.currency.trim() : "";
  if (currency) row.currency = currency;
  return row;
}

/** The same `filter_data` with the gate block restated for a different outcome. */
export function withGateBlock(
  filterData: Record<string, unknown>,
  outcome: GateOutcome,
  reasons: ReadonlyArray<GateReasonCode>,
): Record<string, unknown> {
  const gate =
    filterData.gate && typeof filterData.gate === "object" && !Array.isArray(filterData.gate)
      ? (filterData.gate as Record<string, unknown>)
      : {};
  return { ...filterData, gate: { ...gate, outcome, reasons: blockingReasons(reasons) } };
}

/** The gate block a listing row carries, as the seller surfaces read it back. */
export interface StoredGateBlock {
  outcome: GateOutcome | null;
  reasons: string[];
}

export function readStoredGate(filterData: unknown): StoredGateBlock {
  const gate =
    filterData && typeof filterData === "object" && !Array.isArray(filterData)
      ? (filterData as Record<string, unknown>).gate
      : null;
  if (!gate || typeof gate !== "object" || Array.isArray(gate)) return { outcome: null, reasons: [] };
  const block = gate as Record<string, unknown>;
  const outcome =
    block.outcome === "publish" || block.outcome === "hold" || block.outcome === "reject" ? block.outcome : null;
  const reasons = Array.isArray(block.reasons)
    ? block.reasons.filter((reason): reason is string => typeof reason === "string")
    : [];
  return { outcome, reasons };
}
