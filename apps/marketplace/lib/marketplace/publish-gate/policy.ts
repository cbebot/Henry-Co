// V3-MKT-TRUST-01 — the listing policy. PURE: no I/O, no clock, no randomness.
//
// This is not a second engine. It composes the ones that exist:
//   * content      — @henryco/moderation, ruleset "listing_v2" (which uses
//                    @henryco/trust for contact detection);
//   * economics    — ../governance (quality score, high-risk categories);
//   * store facts  — the seller state the database reports (probation, plan cap,
//                    open hides);
//   * risk         — a STAFF-applied V3-40 hold/freeze, read by the caller.
// and turns their findings into one outcome and a list of reason codes.
//
// The optional AI result is consulted only when everything deterministic says
// "publish", and can only add hold-class codes (see applyAiSignal).

import { runDeterministic, type AiScanResult } from "@henryco/moderation";
import { categoryIsHighRisk, evaluateListingSubmission } from "../governance";
import type { MarketplaceVendor } from "../types";
import {
  composeOutcome,
  isGateReasonCode,
  normalizeReasons,
  type GateOutcome,
  type GateReasonCode,
  type HoldReason,
} from "./reasons";
import type { SellerGateState } from "./seller-state";

export interface ListingGateInput {
  listing: {
    title: string;
    summary: string;
    description: string;
    sku: string;
    categorySlug: string;
    basePrice: number;
    compareAtPrice: number | null;
    deliveryNote: string;
    leadTime: string;
    /** Free-text specification values (material, warranty, …). */
    specificationValues: ReadonlyArray<string>;
  };
  images: {
    /** Canonical refs the listing will carry, cover first. */
    refs: ReadonlyArray<string>;
    /** Posted values that are not first-party uploads. */
    notFirstParty: ReadonlyArray<string>;
    /** First-party objects uploaded by someone outside this store. */
    foreignRefs: ReadonlyArray<string>;
    /** Fingerprint matches reported by the database. */
    matches: ReadonlyArray<{ ref: string; relation: "other_seller" | "same_seller" }>;
    /** Perceptual hashes of the images, for the known-bad list. */
    hashes?: ReadonlyArray<string>;
    knownBadHashes?: ReadonlySet<string>;
  };
  /** Null when the database could not report the store's state. */
  seller: SellerGateState | null;
  /** The vendor record governance scores quality against (may be null). */
  vendor: Partial<MarketplaceVendor> | null;
  /** A STAFF-applied V3-40 hold/freeze on the seller's account or on this listing. */
  riskGated: boolean;
  /** The listing exists and is live right now (an edit, not a first publish). */
  isLiveEdit: boolean;
  /** The listing does not exist yet. */
  isNew: boolean;
  locale: string;
}

export interface GateVerdict {
  outcome: GateOutcome;
  reasons: GateReasonCode[];
  /** Small, PII-free facts stored with the verdict. */
  signals: {
    qualityScore: number;
    moderationDetail: string[];
    probationActive: boolean;
    aiConsulted: boolean;
  };
}

const MIN_TITLE_LENGTH = 4;
const MIN_BODY_LENGTH = 20;
const MAX_PRICE = 1_000_000_000;

/** Map the moderation ruleset's machine tokens to gate reason codes. */
export function codesFromModerationDetail(detail: ReadonlyArray<string>): GateReasonCode[] {
  const codes: GateReasonCode[] = [];
  for (const token of detail) {
    if (token.startsWith("banned:")) codes.push("prohibited_goods");
    else if (token === "counterfeit:explicit") codes.push("counterfeit_claim");
    else if (token.startsWith("ambiguous:")) codes.push("restricted_item_review");
    else if (token.startsWith("hate:")) codes.push("hate_speech");
    else if (token === "profanity") codes.push("profanity");
    else if (token === "image:known_bad") codes.push("known_bad_image");
    else if (token === "scam:payment_diversion") codes.push("off_platform_payment");
    else if (token.startsWith("scam:")) codes.push("scam_language");
    else if (token === "signal:urgency") codes.push("urgency_language");
    else if (token === "signal:address") codes.push("pickup_address");
    else if (token.startsWith("contact:")) {
      if (token.endsWith(":high")) codes.push("contact_details");
      else if (token.endsWith(":medium")) codes.push("contact_suspected");
    }
  }
  return codes;
}

/** Everything a buyer can read, as one text for the content ruleset. */
export function listingText(listing: ListingGateInput["listing"]): string {
  return [
    listing.title,
    listing.summary,
    listing.description,
    listing.deliveryNote,
    listing.leadTime,
    listing.sku,
    ...listing.specificationValues,
  ]
    .map((part) => String(part ?? "").trim())
    .filter(Boolean)
    .join("\n");
}

/**
 * The deterministic floor. Complete on its own: with no AI and no network it
 * returns the verdict the listing is held to.
 */
export function evaluateListingPolicy(input: ListingGateInput): GateVerdict {
  const codes: GateReasonCode[] = [];
  const { listing, images, seller } = input;

  // ---- essentials -----------------------------------------------------------
  const title = listing.title.trim();
  const body = `${listing.summary} ${listing.description}`.trim();
  if (title.length < MIN_TITLE_LENGTH || body.length < MIN_BODY_LENGTH || images.refs.length === 0) {
    codes.push("incomplete_listing");
  }
  const price = Number(listing.basePrice);
  const compareAt = listing.compareAtPrice === null ? null : Number(listing.compareAtPrice);
  if (
    !Number.isFinite(price) ||
    !Number.isInteger(price) ||
    price <= 0 ||
    price > MAX_PRICE ||
    (compareAt !== null && (!Number.isFinite(compareAt) || compareAt <= price))
  ) {
    // A "was" price at or below the selling price is a discount that is not one.
    codes.push("price_invalid");
  }

  // ---- the store ------------------------------------------------------------
  if (seller === null) {
    // The database could not tell us the store's standing: nothing publishes on a guess.
    codes.push("gate_unavailable");
  } else {
    if (seller.vendor.status !== "approved") codes.push("seller_not_active");

    if (input.isNew && seller.plan.listingRows >= seller.plan.listingCap) {
      codes.push("plan_listing_limit");
    }

    if (seller.probation.active) {
      const caps = seller.probation.caps;
      if (price > caps.maxPrice) codes.push("probation_price_cap");
      if (!input.isLiveEdit) {
        if (seller.probation.liveListings >= caps.maxLiveListings) codes.push("probation_listing_cap");
        else if (seller.probation.newListings24h >= caps.maxNewListingsPerDay) codes.push("probation_daily_cap");
      }
      if (categoryIsHighRisk(listing.categorySlug)) codes.push("high_risk_category_probation");
    }

    // A hide that needs a person stays until a person lifts it.
    if (seller.activeHide && seller.activeHide.kind !== "policy") codes.push("enforcement_hold_active");
  }

  if (input.riskGated) codes.push("risk_hold_active");

  // ---- images ---------------------------------------------------------------
  if (images.notFirstParty.length > 0) codes.push("image_not_first_party");
  if (images.foreignRefs.length > 0 || images.matches.some((match) => match.relation === "other_seller")) {
    codes.push("duplicate_image_other_seller");
  } else if (images.matches.some((match) => match.relation === "same_seller")) {
    codes.push("duplicate_image_same_seller");
  }

  // ---- content --------------------------------------------------------------
  const content = runDeterministic(
    {
      contentType: "marketplace_listing",
      contentId: "gate",
      text: listingText(listing),
      locale: input.locale || "en",
    },
    {
      ruleset: "listing_v2",
      imageHashes: images.hashes,
      knownBadImageHashes: images.knownBadHashes,
    },
  );
  const moderationDetail = content.detail ?? [];
  codes.push(...codesFromModerationDetail(moderationDetail));

  // ---- quality (advice, never a queue) ----------------------------------------
  const assessment = evaluateListingSubmission({
    vendor: input.vendor,
    title: listing.title,
    summary: listing.summary,
    description: listing.description,
    categorySlug: listing.categorySlug,
    imageUrl: images.refs[0] ?? "",
    sku: listing.sku,
    leadTime: listing.leadTime,
    deliveryNote: listing.deliveryNote,
  });
  if (assessment.qualityScore < 68) codes.push("thin_listing");

  const reasons = normalizeReasons(codes);
  return {
    outcome: composeOutcome(reasons),
    reasons,
    signals: {
      qualityScore: assessment.qualityScore,
      moderationDetail: [...moderationDetail],
      probationActive: Boolean(seller?.probation.active),
      aiConsulted: false,
    },
  };
}

const AI_REASON_MAP: Record<string, HoldReason> = {
  ai_flagged_scam: "ai_flagged_scam",
  ai_flagged_nsfw: "ai_flagged_nsfw",
  ai_flagged_abuse: "ai_flagged_abuse",
  ai_flagged_other: "ai_flagged_other",
};

/**
 * Fold an AI result into a deterministic verdict.
 *
 * The AI may only ADD. Structurally:
 *   * a verdict that is not `publish` is returned untouched — a reject or a hold
 *     never reaches this function's mutation path, so no AI output can soften it;
 *   * on a `publish` verdict the only codes this function can append are
 *     hold-class codes from a closed vocabulary — nothing the model wrote is
 *     copied into the result.
 * A null result (flag dark, budget spent, provider down, unparseable) changes
 * nothing: the deterministic verdict stands.
 */
export function applyAiSignal(verdict: GateVerdict, ai: AiScanResult | null): GateVerdict {
  if (verdict.outcome !== "publish") return verdict;
  if (ai === null) return verdict;

  const signals = { ...verdict.signals, aiConsulted: true };
  if (ai.recommendation === "approve") return { ...verdict, signals };

  // "hold" — and "reject", which the moderation contract already treats as hold.
  const added: HoldReason[] = [];
  for (const reason of ai.reasons ?? []) {
    const mapped = AI_REASON_MAP[reason];
    if (mapped && !added.includes(mapped)) added.push(mapped);
  }
  if (added.length === 0) added.push("ai_flagged_other");

  const reasons = normalizeReasons([...verdict.reasons, ...added]);
  return { outcome: composeOutcome(reasons), reasons, signals };
}

const OUTCOME_RANK: Record<GateOutcome, number> = { publish: 0, hold: 1, reject: 2 };

/**
 * Fold in what the database said when the verdict was recorded. The recording
 * RPC re-checks the store, the slug, the hides and the caps and may TIGHTEN the
 * outcome; this merge can therefore only tighten too:
 *
 *   merged outcome >= max(TS outcome, DB outcome)      (publish < hold < reject)
 *
 * A reason code the TS vocabulary does not know, or a DB outcome stricter than
 * its codes explain, is treated as "gate unavailable" — a hold, never a publish.
 */
export function mergeDbVerdict(verdict: GateVerdict, db: { outcome: unknown; reasons: unknown }): GateVerdict {
  const codes: GateReasonCode[] = [...verdict.reasons];
  let unknown = false;

  if (Array.isArray(db.reasons)) {
    for (const raw of db.reasons) {
      if (isGateReasonCode(raw)) codes.push(raw);
      else unknown = true;
    }
  } else {
    unknown = true;
  }

  const dbOutcome: GateOutcome | null =
    db.outcome === "publish" || db.outcome === "hold" || db.outcome === "reject" ? db.outcome : null;
  if (dbOutcome === null) unknown = true;

  let reasons = normalizeReasons(codes);
  if (unknown || (dbOutcome !== null && OUTCOME_RANK[dbOutcome] > OUTCOME_RANK[composeOutcome(reasons)])) {
    reasons = normalizeReasons([...reasons, "gate_unavailable"]);
  }

  return { outcome: composeOutcome(reasons), reasons, signals: verdict.signals };
}

/** A verdict for a write the gate could not complete (ledger unreachable, RPC absent). */
export function unavailableVerdict(base?: GateVerdict): GateVerdict {
  const reasons = normalizeReasons([...(base?.reasons ?? []), "gate_unavailable"]);
  return {
    outcome: composeOutcome(reasons),
    reasons,
    signals: base?.signals ?? { qualityScore: 0, moderationDetail: [], probationActive: false, aiConsulted: false },
  };
}
