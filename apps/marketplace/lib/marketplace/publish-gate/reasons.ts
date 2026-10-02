// V3-MKT-TRUST-01 — the gate's vocabulary. PURE.
//
// One outcome, a list of stable reason codes. A code is an identifier, never
// free text: it is what the ledger stores, what the seller's copy is keyed on and
// what the tests enumerate. Adding a code means adding it here, to the typed copy
// in @henryco/i18n and to the tests — the three are checked against each other.

import { LISTING_RULESET_VERSION } from "@henryco/moderation";

export type GateOutcome = "publish" | "hold" | "reject";

/** The listing is refused. The seller can fix it and publish again, or it is prohibited. */
export const REJECT_REASONS = [
  "prohibited_goods",
  "counterfeit_claim",
  "hate_speech",
  "known_bad_image",
  "contact_details",
  "off_platform_payment",
  "incomplete_listing",
  "price_invalid",
  "image_not_first_party",
  "plan_listing_limit",
  "probation_listing_cap",
  "probation_daily_cap",
  "probation_price_cap",
  "seller_not_active",
  "listing_conflict",
] as const;

/** A person decides. The listing is saved but not live. */
export const HOLD_REASONS = [
  "restricted_item_review",
  "profanity",
  "contact_suspected",
  "scam_language",
  "duplicate_image_other_seller",
  "high_risk_category_probation",
  "risk_hold_active",
  "enforcement_hold_active",
  "ai_flagged_scam",
  "ai_flagged_nsfw",
  "ai_flagged_abuse",
  "ai_flagged_other",
  "gate_unavailable",
] as const;

/** Recorded with the verdict; never blocks. */
export const SIGNAL_REASONS = [
  "shared_image",
  "duplicate_image_same_seller",
  "urgency_language",
  "pickup_address",
  "thin_listing",
] as const;

export type RejectReason = (typeof REJECT_REASONS)[number];
export type HoldReason = (typeof HOLD_REASONS)[number];
export type SignalReason = (typeof SIGNAL_REASONS)[number];
export type GateReasonCode = RejectReason | HoldReason | SignalReason;

export const ALL_GATE_REASONS: readonly GateReasonCode[] = [...REJECT_REASONS, ...HOLD_REASONS, ...SIGNAL_REASONS];

export type GateReasonClass = "reject" | "hold" | "signal";

const CLASS_OF: Record<GateReasonCode, GateReasonClass> = Object.fromEntries([
  ...REJECT_REASONS.map((code) => [code, "reject"] as const),
  ...HOLD_REASONS.map((code) => [code, "hold"] as const),
  ...SIGNAL_REASONS.map((code) => [code, "signal"] as const),
]) as Record<GateReasonCode, GateReasonClass>;

export function reasonClass(code: GateReasonCode): GateReasonClass {
  return CLASS_OF[code];
}

export function isGateReasonCode(value: unknown): value is GateReasonCode {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(CLASS_OF, value);
}

/**
 * The outcome is a function of the reason codes and nothing else: any reject-class
 * code refuses; otherwise any hold-class code holds; otherwise the listing
 * publishes. There is no input that can make a reject or a hold publish.
 */
export function composeOutcome(codes: ReadonlyArray<GateReasonCode>): GateOutcome {
  let outcome: GateOutcome = "publish";
  for (const code of codes) {
    const cls = CLASS_OF[code];
    if (cls === "reject") return "reject";
    if (cls === "hold") outcome = "hold";
  }
  return outcome;
}

/** Stable order (reject → hold → signal, then declaration order), de-duplicated. */
export function normalizeReasons(codes: ReadonlyArray<GateReasonCode>): GateReasonCode[] {
  const seen = new Set(codes);
  return ALL_GATE_REASONS.filter((code) => seen.has(code));
}

/** The codes that explain the outcome to a seller (signals are not shown as problems). */
export function blockingReasons(codes: ReadonlyArray<GateReasonCode>): GateReasonCode[] {
  return normalizeReasons(codes).filter((code) => CLASS_OF[code] !== "signal");
}

/**
 * Refusals that mean "this content breaks policy", as opposed to "this form is
 * incomplete" or "a limit was reached". Only these are worth a person's eyes.
 */
const POLICY_VIOLATIONS: ReadonlySet<GateReasonCode> = new Set<GateReasonCode>([
  "prohibited_goods",
  "counterfeit_claim",
  "hate_speech",
  "known_bad_image",
  "contact_details",
  "off_platform_payment",
]);

export function isPolicyViolation(code: GateReasonCode): boolean {
  return POLICY_VIOLATIONS.has(code);
}

/**
 * Stamped on every verdict. When the content ruleset moves, standing verdicts
 * minted under an older value are picked up by the re-scan sweep.
 */
export const GATE_ENGINE_VERSION = `mkt_gate_1+${LISTING_RULESET_VERSION}`;
