import "server-only";

/**
 * SA-4 — the decisions-inbox read model: pending `origin='operator'` proposals
 * for THIS owner, rendered through the catalog's confirmationCopy so the inbox
 * card shows exactly what the confirm card will say. Display-only — the copy is
 * rendered from the raise-time true_state snapshot; authority lives solely in
 * the confirm route, which re-reads live state via driftKeys.
 */

import { createAdminSupabase } from "@/lib/supabase";
import { getFounderAction } from "./action-catalog";

export type OperatorInboxItem = {
  token: string;
  actionKey: string;
  title: string;
  body: string;
  confirmLabel: string;
  rationale: string | null;
  requiresReauth: boolean;
  reversibility: string;
  createdAt: string;
  expiresAt: string;
};

export async function listOperatorProposals(ownerUserId: string, limit = 30): Promise<OperatorInboxItem[]> {
  try {
    const admin = createAdminSupabase();
    const { data, error } = await admin
      .from("founder_action_proposals")
      .select("token, action_key, params, true_state, rationale, status, origin, created_at, expires_at")
      .eq("user_id", ownerUserId)
      .eq("origin", "operator")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error || !data) return [];

    const items: OperatorInboxItem[] = [];
    const nowMs = Date.now();
    for (const row of data as Array<Record<string, unknown>>) {
      const expiresAt = String(row.expires_at ?? "");
      if (expiresAt && Date.parse(expiresAt) <= nowMs) continue; // swept lazily below
      const entry = getFounderAction(String(row.action_key));
      if (!entry) continue;
      let copy: { title: string; body: string; confirmLabel: string };
      try {
        copy = entry.confirmationCopy(
          (row.true_state as Record<string, unknown>) ?? {},
          (row.params as Record<string, unknown>) ?? {},
        );
      } catch {
        continue;
      }
      items.push({
        token: String(row.token),
        actionKey: entry.key,
        title: copy.title,
        body: copy.body,
        confirmLabel: copy.confirmLabel,
        rationale: (row.rationale as string) ?? null,
        requiresReauth: entry.requiresReauth,
        reversibility: entry.reversibility,
        createdAt: String(row.created_at ?? ""),
        expiresAt,
      });
    }
    return items;
  } catch {
    return [];
  }
}

export async function countOperatorProposals(ownerUserId: string): Promise<number> {
  try {
    const admin = createAdminSupabase();
    const { count, error } = await admin
      .from("founder_action_proposals")
      .select("token", { count: "exact", head: true })
      .eq("user_id", ownerUserId)
      .eq("origin", "operator")
      .eq("status", "pending");
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

/** Lazily expire stale pending operator proposals (best-effort inbox hygiene). */
export async function sweepExpiredOperatorProposals(ownerUserId: string): Promise<void> {
  try {
    const admin = createAdminSupabase();
    await admin
      .from("founder_action_proposals")
      .update({ status: "expired", resolved_at: new Date().toISOString() } as never)
      .eq("user_id", ownerUserId)
      .eq("origin", "operator")
      .eq("status", "pending")
      .lt("expires_at", new Date().toISOString());
  } catch {
    // hygiene only.
  }
}
