import "server-only";

/**
 * SA-4 — server-initiated proposals (ARCHITECTURE §4.2). The operator tick
 * raises work the owner never asked for as DURABLE one-tap decisions in the
 * founder_action_proposals spine (origin='operator').
 *
 * The proposal is prepared with the SAME governance as a chat-born one:
 * catalog lookup → tranche gate → STRICT param parse → server true-state read
 * (null ⇒ nothing to propose) → pending-dedupe by fingerprint → insert. It
 * EXECUTES NOTHING — the owner's tap still goes through the confirm route,
 * which re-authorizes, re-reads true state via driftKeys, and demands the
 * fresh password step-up for requiresReauth entries. A long-lived operator
 * proposal is safe precisely because nothing trusts its freshness.
 */

import { createHash } from "node:crypto";
import { writeAuditLog } from "@henryco/observability/audit-log";
import { emitEvent } from "@henryco/observability/events";
import { createAdminSupabase } from "@/lib/supabase";
import { getFounderAction } from "./action-catalog";

/** Operator proposals live until acted on or superseded — 30 days, then swept. */
export const OPERATOR_PROPOSAL_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function liveTranche(): number {
  const raw = Number(process.env.FOUNDER_ACTIONS_TRANCHE ?? "1");
  return Number.isFinite(raw) && raw >= 1 ? Math.floor(raw) : 1;
}

function fingerprint(key: string, params: Record<string, unknown>): string {
  const canonical = JSON.stringify(
    Object.keys(params)
      .sort()
      .reduce<Record<string, unknown>>((acc, k) => {
        acc[k] = params[k];
        return acc;
      }, {}),
  );
  return createHash("sha256").update(`${key}::${canonical}`).digest("hex");
}

/** The single active owner the operator works for (env override for ops). */
export async function resolveOperatorOwnerUserId(): Promise<string | null> {
  try {
    const admin = createAdminSupabase();
    const { data } = await admin
      .from("owner_profiles")
      .select("user_id, role, is_active")
      .eq("role", "owner")
      .eq("is_active", true)
      .limit(1);
    const row = (data as Array<{ user_id: string }> | null)?.[0];
    return row?.user_id ?? null;
  } catch {
    return null;
  }
}

export type RaiseOutcome =
  | { raised: true; token: string; deduped: boolean }
  | { raised: false; reason: string };

export async function raiseOperatorProposal(input: {
  key: string;
  params: Record<string, unknown>;
  rationale: string;
  ownerUserId: string;
}): Promise<RaiseOutcome> {
  if (process.env.FOUNDER_ACTIONS_LIVE !== "1") return { raised: false, reason: "actions_dark" };

  const entry = getFounderAction(input.key);
  if (!entry) return { raised: false, reason: "unknown_action" };
  if (entry.tranche > liveTranche()) return { raised: false, reason: "tranche_dark" };

  const parsed = entry.paramsSchema.safeParse(input.params);
  if (!parsed.success) return { raised: false, reason: "invalid_params" };
  const params = parsed.data as Record<string, unknown>;
  if (entry.ownerPermission !== "founder-only") return { raised: false, reason: "not_founder_only" };

  // Server-side true-state read — no record / ineligible ⇒ nothing to propose.
  const trueState = await entry.trueStateReader({ params });
  if (!trueState) return { raised: false, reason: "no_true_state" };

  const admin = createAdminSupabase();
  const fp = fingerprint(entry.key, params);

  // Pending-dedupe: the same condition re-detected by a later tick reuses the
  // pending row rather than flooding the inbox (the founder dedupe discipline).
  const { data: existing } = await admin
    .from("founder_action_proposals")
    .select("token")
    .eq("user_id", input.ownerUserId)
    .eq("params_fingerprint", fp)
    .eq("status", "pending")
    .maybeSingle();
  if (existing) {
    return { raised: true, token: (existing as { token: string }).token, deduped: true };
  }

  const { data: inserted, error } = await admin
    .from("founder_action_proposals")
    .insert({
      user_id: input.ownerUserId,
      action_key: entry.key,
      params,
      true_state: trueState,
      rationale: input.rationale.slice(0, 800) || null,
      params_fingerprint: fp,
      status: "pending",
      origin: "operator",
      expires_at: new Date(Date.now() + OPERATOR_PROPOSAL_TTL_MS).toISOString(),
    } as never)
    .select("token")
    .single();
  if (error || !inserted) return { raised: false, reason: "insert_failed" };
  const token = (inserted as { token: string }).token;

  // Propose audit — the operator raised a card the owner will see. Service-role
  // client (no session in a cron); actor attribution rides `reason`.
  await writeAuditLog(admin as never, {
    action: "founder.action.proposed",
    entityType: "founder_action_proposal",
    entityId: token,
    newValues: { key: entry.key, params, origin: "operator" },
    division: entry.division,
    reason: "operator_raised",
  }).catch(() => undefined);

  emitEvent({
    name: "henry.studio.operator.proposal_raised",
    classification: "system_state",
    outcome: "completed",
    payload: { action_key: entry.key, token },
  });

  return { raised: true, token, deduped: false };
}
