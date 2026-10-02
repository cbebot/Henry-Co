// V3-MKT-TRUST-01 — one event per gate decision. SERVER ONLY.
//
// Every decision the gate takes is emitted with an outcome, so "what did the
// gate do today" is answerable from the event stream without reading the ledger.
// Payloads carry ids, codes and counts — never listing text, never contact data.

import "server-only";

import { emitEvent, persistEvent, type HenryEventName } from "@henryco/observability";
import type { SupabaseClient } from "@supabase/supabase-js";

type GateEventOutcome = "approved" | "pending" | "rejected" | "blocked" | "failed" | "removed" | "resolved";

export function outcomeToEvent(outcome: "publish" | "hold" | "reject"): GateEventOutcome {
  if (outcome === "publish") return "approved";
  if (outcome === "hold") return "pending";
  return "rejected";
}

export async function emitGateEvent(input: {
  admin: SupabaseClient;
  name: Extract<
    HenryEventName,
    | "henry.marketplace.listing_gate.decided"
    | "henry.marketplace.seller_gate.decided"
    | "henry.marketplace.payout_gate.decided"
    | "henry.marketplace.listing_gate.hidden"
    | "henry.marketplace.listing_gate.swept"
  >;
  outcome: GateEventOutcome;
  /** Null for a system decision (the sweep). */
  actorId: string | null;
  payload: Record<string, unknown>;
}): Promise<void> {
  emitEvent({
    name: input.name,
    classification: input.actorId ? "user_action" : "system_state",
    outcome: input.outcome,
    actorId: input.actorId ?? undefined,
    payload: input.payload,
  });
  await persistEvent({
    supabase: input.admin,
    name: input.name,
    actorId: input.actorId,
    payload: { ...input.payload, outcome: input.outcome },
  });
}
