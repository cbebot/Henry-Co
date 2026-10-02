// V3-MKT-TRUST-01 — the payout gate. SERVER ONLY.
//
// Identity used to stand in front of a listing; it now stands in front of the
// money. This is the first wall (the database trigger on
// marketplace_payout_requests is the second). It can only REFUSE: it reads two
// facts and returns a decision. It moves no money, writes no payment object and
// calls none of the money RPCs.

import "server-only";

import { emitGateEvent } from "./events";
import {
  parsePayoutEligibilityFacts,
  payoutEligibility,
  type PayoutBlockReason,
  type PayoutEligibilityFacts,
} from "./payout-eligibility";
import { isMissingRpc, readStaffRiskHold, type GateAdmin } from "./server";

export interface PayoutGateDecision {
  /** False when the trust migration is not applied: the caller behaves as before. */
  available: boolean;
  blocked: boolean;
  reasons: PayoutBlockReason[];
  facts: PayoutEligibilityFacts | null;
}

/** The redirect/error code for the first blocking reason. */
export function payoutBlockCode(reasons: ReadonlyArray<PayoutBlockReason>): string {
  if (reasons.includes("identity_unverified")) return "identity-required";
  if (reasons.includes("risk_hold_active")) return "risk-hold";
  if (reasons.includes("seller_not_active")) return "missing-vendor";
  return "eligibility-unavailable";
}

export async function readPayoutGate(
  admin: GateAdmin,
  input: { vendorId: string; actorId: string | null; stage: "request" | "decision" | "view" },
): Promise<PayoutGateDecision> {
  let payload: unknown = null;
  try {
    const { data, error } = await admin.rpc("marketplace_gate_payout_eligibility", { p_vendor_id: input.vendorId });
    if (error) {
      if (isMissingRpc(error)) return { available: false, blocked: false, reasons: [], facts: null };
      payload = null;
    } else {
      payload = data;
    }
  } catch {
    payload = null;
  }

  const facts = parsePayoutEligibilityFacts(payload);
  const riskGated = facts?.ownerUserId
    ? await readStaffRiskHold(admin, { accountId: facts.ownerUserId, listingId: null })
    : false;
  const decision = payoutEligibility({ facts, riskGated });

  if (input.stage !== "view") {
    await emitGateEvent({
      admin,
      name: "henry.marketplace.payout_gate.decided",
      outcome: decision.eligible ? "approved" : "blocked",
      actorId: input.actorId,
      payload: {
        vendorId: input.vendorId,
        stage: input.stage,
        reasons: decision.reasons,
        instantOnboarded: facts?.instantOnboarded ?? null,
      },
    });
  }

  return { available: true, blocked: !decision.eligible, reasons: decision.reasons, facts };
}
