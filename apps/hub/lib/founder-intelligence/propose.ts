import "server-only";

import { createHash } from "node:crypto";
import type { FounderProposedAction } from "@henryco/ai-gateway";
import { writeAuditLog } from "@henryco/observability/audit-log";
import { createAdminSupabase } from "@/lib/supabase";
import {
  getFounderAction,
  type FounderActionEntry,
} from "./action-catalog";

/**
 * F3 propose — the read-only post-processing step on a founder chat turn.
 *
 * On a proposeAction from the AI, this: catalog-lookup (unknown → drop),
 * tranche gate, STRICT param parse, founder-only permission (the caller is
 * already requireOwner-gated), server-side true-state read, then persists ONE
 * proposal row and returns the confirmation payload the card renders.
 *
 * It executes NOTHING and moves no state — a compromised or hallucinating model
 * can at most create a pending proposal the owner must still explicitly
 * confirm. Returns null when there is nothing valid to propose, so the chat
 * route simply returns the reply.
 */

export type FounderConfirmationPayload = {
  token: string;
  key: string;
  title: string;
  body: string;
  confirmLabel: string;
  division: string;
  reversibility: FounderActionEntry["reversibility"];
  requiresReauth: boolean;
  rationale: string | null;
  expiresAt: string;
};

function liveTranche(): number {
  const raw = Number(process.env.FOUNDER_ACTIONS_TRANCHE ?? "1");
  return Number.isFinite(raw) && raw >= 1 ? Math.floor(raw) : 1;
}

function fingerprint(key: string, params: Record<string, unknown>): string {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}=${String(params[k])}`)
    .join("&");
  return createHash("md5").update(`${key}::${sorted}`).digest("hex");
}

export async function resolveProposedAction(input: {
  ownerId: string;
  ownerScopedSupabase: Parameters<typeof writeAuditLog>[0];
  proposal: FounderProposedAction | null;
}): Promise<FounderConfirmationPayload | null> {
  if (process.env.FOUNDER_ACTIONS_LIVE !== "1") return null;
  if (!input.proposal) return null;

  const entry = getFounderAction(input.proposal.key);
  if (!entry) return null;
  if (entry.tranche > liveTranche()) return null;

  // STRICT parse — unknown keys rejected, types coerced, enums bounded.
  const parsed = entry.paramsSchema.safeParse(input.proposal.params);
  if (!parsed.success) return null;
  const params = parsed.data as Record<string, unknown>;

  // Founder-only: the caller is already requireOwner-gated upstream, and this
  // catalog only holds founder-only entries by invariant.
  if (entry.ownerPermission !== "founder-only") return null;

  const trueState = await entry.trueStateReader({ params });
  if (!trueState) return null;

  const admin = createAdminSupabase();
  const fp = fingerprint(entry.key, params);

  // Dedupe: reuse a still-pending identical proposal instead of stacking cards.
  const { data: existing } = await admin
    .from("founder_action_proposals")
    .select("token, expires_at")
    .eq("user_id", input.ownerId)
    .eq("params_fingerprint", fp)
    .eq("status", "pending")
    .maybeSingle();

  const copy = entry.confirmationCopy(trueState, params);

  if (existing) {
    const row = existing as { token: string; expires_at: string };
    return {
      token: row.token,
      key: entry.key,
      title: copy.title,
      body: copy.body,
      confirmLabel: copy.confirmLabel,
      division: entry.division,
      reversibility: entry.reversibility,
      requiresReauth: entry.requiresReauth,
      rationale: input.proposal.rationale ?? null,
      expiresAt: row.expires_at,
    };
  }

  const { data: inserted, error } = await admin
    .from("founder_action_proposals")
    .insert({
      user_id: input.ownerId,
      action_key: entry.key,
      params,
      true_state: trueState,
      rationale: input.proposal.rationale ?? null,
      params_fingerprint: fp,
      status: "pending",
    } as never)
    .select("token, expires_at")
    .single();

  if (error || !inserted) {
    console.error("[founder-actions][propose] insert failed", error?.message);
    return null;
  }
  const row = inserted as { token: string; expires_at: string };

  // Propose audit — records that the AI named an action and the owner was shown
  // a card, even if never confirmed. Actor-scoped client so actor_id = founder.
  await writeAuditLog(input.ownerScopedSupabase, {
    action: "founder.action.proposed",
    entityType: "founder_action_proposal",
    entityId: row.token,
    newValues: { key: entry.key, params, trueState },
    division: entry.division,
    reason: "ai_proposed",
  });

  return {
    token: row.token,
    key: entry.key,
    title: copy.title,
    body: copy.body,
    confirmLabel: copy.confirmLabel,
    division: entry.division,
    reversibility: entry.reversibility,
    requiresReauth: entry.requiresReauth,
    rationale: input.proposal.rationale ?? null,
    expiresAt: row.expires_at,
  };
}
