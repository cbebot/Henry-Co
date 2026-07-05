import "server-only";

import { createHash } from "node:crypto";
import {
  evaluateFreeAccess,
  FREE_ABUSE_REFUSAL_THRESHOLD,
  FREE_RESTRICTION_WINDOW_MS,
  type FreeAccessOutcome,
} from "@henryco/ai-gateway";
import { createAdminSupabase } from "@/lib/supabase";

/**
 * The durable half of the AI Abuse Guard (pass 2). Reads/writes the per-actor ledger through the
 * governed RPCs (service role, deny-all table), and applies the gateway's pure policy engine. The
 * abuse thresholds live in the engine and are passed to the record RPC, so there is one source of
 * truth. All of this is best-effort: if the ledger is unreachable (or not migrated yet), free AI
 * degrades OPEN rather than locking everyone out.
 */

export type FreeActor = {
  actorKey: string;
  actorType: "user" | "ip";
  isAnonymous: boolean;
};

/** A signed-in person keys by their user id; an anonymous visitor keys by a hash of their IP. */
export function resolveFreeActor(userId: string | null, ip: string | null): FreeActor {
  if (userId) return { actorKey: `u:${userId}`, actorType: "user", isAnonymous: false };
  const hash = ip ? createHash("sha256").update(ip).digest("hex").slice(0, 40) : "unknown";
  return { actorKey: `ip:${hash}`, actorType: "ip", isAnonymous: true };
}

/** The pre-model access decision for this actor. Degrades to "allow" if the ledger is unavailable. */
export async function checkFreeAiAccess(actor: FreeActor): Promise<FreeAccessOutcome> {
  try {
    const admin = createAdminSupabase();
    const { data, error } = await admin.rpc("ai_free_guard_state", { p_actor_key: actor.actorKey });
    if (error) return { decision: "allow", reason: "ok" };
    const row = (Array.isArray(data) ? data[0] : data) as
      | { turns: number; refused: number; restricted_until: string | null }
      | null
      | undefined;
    return evaluateFreeAccess(
      {
        isAnonymous: actor.isAnonymous,
        turnsInWindow: row?.turns ?? 0,
        refusedInWindow: row?.refused ?? 0,
        restrictedUntilMs: row?.restricted_until ? Date.parse(row.restricted_until) : null,
      },
      Date.now(),
    );
  } catch {
    return { decision: "allow", reason: "ok" };
  }
}

/** Record a completed free turn (refused=true when it was junk or the AI flagged abuse). Best-effort. */
export async function recordFreeAiTurn(actor: FreeActor, refused: boolean): Promise<void> {
  try {
    const admin = createAdminSupabase();
    await admin.rpc("ai_free_guard_record", {
      p_actor_key: actor.actorKey,
      p_actor_type: actor.actorType,
      p_refused: refused,
      p_threshold: FREE_ABUSE_REFUSAL_THRESHOLD,
      p_restrict_seconds: Math.round(FREE_RESTRICTION_WINDOW_MS / 1000),
    });
  } catch {
    /* best-effort */
  }
}
