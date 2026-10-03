// V3-MKT-TRUST-01 — identity at the payout gate. PURE.
//
// Identity used to stand in front of a listing (documents at application, strict
// review for anyone unverified). It now stands in front of the money: a seller
// can list without it and cannot be paid without it.
//
// The facts come from the SQL function marketplace_gate_payout_eligibility(),
// whose "identity verified" is deliberately stricter than the profile column —
// that column can be written by its own user on production today, so a
// staff-reviewed identity document is required as well.
//
// WHO THE IDENTITY RULE BINDS. Every store, unless its owner's identity is
// verified. Nobody reviews identity documents when a store is opened — not the
// gate, and not the human approval either (the review queue does not show them,
// and any string passes as one) — so "a person approved it" says nothing about who
// is being paid. Two exceptions: the company's own store, and a store that existed
// before the gate was installed, which keeps the payout path it had for as long as
// it keeps the owner it had then (the database records that once, as a waiver).
// This is exactly the rule the database trigger on marketplace_payout_requests
// enforces — the two walls agree by construction.

export type PayoutBlockReason =
  | "identity_unverified"
  | "risk_hold_active"
  | "seller_not_active"
  | "eligibility_unavailable";

export interface PayoutEligibilityFacts {
  vendorFound: boolean;
  vendorStatus: string | null;
  ownerUserId: string | null;
  identityVerified: boolean;
  /** A store from before the gate, still with the owner it had then. */
  identityWaived: boolean;
  /** The company's own store. */
  companyStore: boolean;
  /** The store is on the new-store register (opened instantly or by a person after the gate). */
  instantOnboarded: boolean;
}

export interface PayoutEligibility {
  eligible: boolean;
  reasons: PayoutBlockReason[];
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

/** Parse the RPC payload; null when it is not the expected shape. */
export function parsePayoutEligibilityFacts(payload: unknown): PayoutEligibilityFacts | null {
  const root = asRecord(payload);
  if (!root || typeof root.vendor_found !== "boolean") return null;
  if (!root.vendor_found) {
    return {
      vendorFound: false,
      vendorStatus: null,
      ownerUserId: null,
      identityVerified: false,
      identityWaived: false,
      companyStore: false,
      instantOnboarded: false,
    };
  }
  if (typeof root.identity_verified !== "boolean" || typeof root.instant_onboarded !== "boolean") return null;
  return {
    vendorFound: true,
    vendorStatus: typeof root.vendor_status === "string" ? root.vendor_status : null,
    ownerUserId: typeof root.owner_user_id === "string" ? root.owner_user_id : null,
    identityVerified: root.identity_verified,
    // Absent means "no": a waiver or a company store is never assumed.
    identityWaived: root.identity_waived === true,
    companyStore: root.company_store === true,
    instantOnboarded: root.instant_onboarded,
  };
}

/**
 * May this store be paid?
 *
 * Fails closed: if the facts could not be read, the answer is no. A payout that
 * waits a few minutes for the database is recoverable; one released to an
 * unverified account is not.
 */
export function payoutEligibility(input: {
  facts: PayoutEligibilityFacts | null;
  /** A STAFF-applied V3-40 hold/freeze on the owner's account (live model). */
  riskGated: boolean;
}): PayoutEligibility {
  const reasons: PayoutBlockReason[] = [];

  if (input.facts === null) {
    reasons.push("eligibility_unavailable");
  } else if (!input.facts.vendorFound) {
    reasons.push("seller_not_active");
  } else if (!input.facts.companyStore && !input.facts.identityVerified && !input.facts.identityWaived) {
    reasons.push("identity_unverified");
  }

  if (input.riskGated) reasons.push("risk_hold_active");

  return { eligible: reasons.length === 0, reasons };
}
