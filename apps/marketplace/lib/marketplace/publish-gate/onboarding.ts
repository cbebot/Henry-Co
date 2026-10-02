// V3-MKT-TRUST-01 — opening a store without a human approval. SERVER ONLY.
//
// Called by /api/seller-applications after an application is saved as
// "submitted", when MARKETPLACE_INSTANT_PUBLISH is on. Three answers:
//
//   opened  — the store exists, the seller holds the vendor role, and a
//             probation row was written IN THE SAME TRANSACTION (the database
//             function does all of it atomically; no TS branch can open a store
//             that escapes the caps or the payout identity guard).
//   review  — the application stays in the legacy queue and a person decides:
//             the content needs a look, the account is under a staff risk hold,
//             the handle was taken a moment ago, or the gate is not installed.
//   already — this account already owns a store.
//
// Nothing here creates a vendor row, a membership or a verdict directly — the
// service-role key holds no write grant on the ledger. Only the RPC can.

import "server-only";

import { emitGateEvent, outcomeToEvent } from "./events";
import type { GateVerdict } from "./policy";
import { GATE_ENGINE_VERSION, composeOutcome, normalizeReasons, type GateReasonCode } from "./reasons";
import { guardHint, isMissingRpc, readStaffRiskHold, type GateAdmin } from "./server";

export type InstantOnboardResult =
  | { kind: "opened"; vendorId: string; slug: string; identityVerified: boolean }
  | { kind: "already_seller"; vendorId: string | null; vendorStatus: string | null }
  | {
      kind: "review";
      why: "held" | "handle_taken" | "prior_decision" | "gate_not_installed" | "error";
      reasons: GateReasonCode[];
    };

const TRUST_FLAG_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

/** Unresolved trust flags on the account in the last 30 days (the existing repeat-offender signal). */
async function hasOpenTrustFlags(admin: GateAdmin, userId: string): Promise<boolean> {
  try {
    const { count, error } = await admin
      .from("trust_flags")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("resolved_at", null)
      .gte("created_at", new Date(Date.now() - TRUST_FLAG_WINDOW_MS).toISOString());
    if (error) return false;
    return (count ?? 0) > 0;
  } catch {
    return false;
  }
}

export async function instantOnboard(
  admin: GateAdmin,
  input: {
    actorId: string;
    applicationId: string;
    /** The deterministic store-profile verdict (evaluateStorePolicy). */
    verdict: Pick<GateVerdict, "outcome" | "reasons">;
    moderationDetail: ReadonlyArray<string>;
  },
): Promise<InstantOnboardResult> {
  const codes: GateReasonCode[] = [...input.verdict.reasons];

  // A staff-applied V3-40 hold/freeze, or open trust flags, send the application
  // to a person. This gate reads those systems; it never writes to them.
  const [riskGated, flagged] = await Promise.all([
    readStaffRiskHold(admin, { accountId: input.actorId, listingId: null }),
    hasOpenTrustFlags(admin, input.actorId),
  ]);
  if (riskGated || flagged) codes.push("risk_hold_active");

  const reasons = normalizeReasons(codes);
  const outcome = composeOutcome(reasons);

  if (outcome !== "publish") {
    await emitGateEvent({
      admin,
      name: "henry.marketplace.seller_gate.decided",
      outcome: outcomeToEvent(outcome),
      actorId: input.actorId,
      payload: { applicationId: input.applicationId, reasons, path: "legacy_review" },
    });
    return { kind: "review", why: "held", reasons };
  }

  let data: unknown = null;
  let error: { code?: string; message?: string; hint?: string } | null = null;
  try {
    const result = await admin.rpc("marketplace_gate_instant_onboard", {
      p_actor: input.actorId,
      p_application_id: input.applicationId,
      p_reasons: reasons,
      p_signals: { moderationDetail: [...input.moderationDetail] },
      p_engine_version: GATE_ENGINE_VERSION,
    });
    data = result.data;
    error = result.error;
  } catch {
    error = { message: "rpc threw" };
  }

  if (error) {
    const why = isMissingRpc(error)
      ? ("gate_not_installed" as const)
      : guardHint(error) === "store_handle_taken"
        ? ("handle_taken" as const)
        : guardHint(error) === "prior_human_decision"
          ? ("prior_decision" as const)
          : ("error" as const);
    await emitGateEvent({
      admin,
      name: "henry.marketplace.seller_gate.decided",
      outcome: "failed",
      actorId: input.actorId,
      payload: { applicationId: input.applicationId, why, hint: guardHint(error), path: "legacy_review" },
    });
    return { kind: "review", why, reasons: ["gate_unavailable"] };
  }

  const payload = data && typeof data === "object" && !Array.isArray(data) ? (data as Record<string, unknown>) : {};
  if (payload.onboarded === true && typeof payload.vendor_id === "string") {
    await emitGateEvent({
      admin,
      name: "henry.marketplace.seller_gate.decided",
      outcome: "approved",
      actorId: input.actorId,
      payload: {
        applicationId: input.applicationId,
        vendorId: payload.vendor_id,
        identityVerified: payload.identity_verified === true,
        reasons,
      },
    });
    return {
      kind: "opened",
      vendorId: payload.vendor_id,
      slug: typeof payload.slug === "string" ? payload.slug : "",
      identityVerified: payload.identity_verified === true,
    };
  }

  if (payload.why === "already_seller") {
    return {
      kind: "already_seller",
      vendorId: typeof payload.vendor_id === "string" ? payload.vendor_id : null,
      vendorStatus: typeof payload.vendor_status === "string" ? payload.vendor_status : null,
    };
  }

  await emitGateEvent({
    admin,
    name: "henry.marketplace.seller_gate.decided",
    outcome: "failed",
    actorId: input.actorId,
    payload: { applicationId: input.applicationId, why: "unexpected_answer", path: "legacy_review" },
  });
  return { kind: "review", why: "error", reasons: ["gate_unavailable"] };
}
