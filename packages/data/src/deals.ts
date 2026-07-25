import "server-only";

import {
  buildImpressionBatch,
  type DealImpressionEntry,
} from "@henryco/intelligence";
import type { Database } from "./database.types";
import type { TypedSupabaseClient } from "./client";

/**
 * @henryco/data/deals — V3-35 typed reads/writes for the ONE ecosystem deal
 * model (`deals`) + the fairness-impression ledger (`deal_impressions`).
 *
 * Boundary notes (the callers rely on these — do not loosen):
 *
 *   - The admin (service-role) client BYPASSES RLS, so the filters in
 *     `listLiveDeals` ARE the visibility wall for every catalog read: only
 *     `active`, in-window rows ever leave this module, and `targeted`
 *     visibility is admitted ONLY when the caller passed the consent-gated
 *     mode. Tested like a security boundary (PRIVACY-NDPR §5.2).
 *   - PROD-ACTUAL: the V3-35 migration is committed, NOT applied. Every read
 *     here is allowed to THROW on an absent table — callers are best-effort
 *     and degrade to their deterministic floor. `recordDealImpressions`
 *     swallows errors itself (an audit-ledger miss must never break a render).
 *   - Impressions are SERVICE-ROLE, BATCHED: one insert statement per surface
 *     render, deduped + hard-capped by `buildImpressionBatch`
 *     (@henryco/intelligence). The client never drives an impression write.
 *   - A deal is an OFFER ARTIFACT — nothing here touches checkout, wallets,
 *     the locked private-payments schema, or any money RPC.
 */

export type DealRow = Database["public"]["Tables"]["deals"]["Row"];

export type ListLiveDealsOptions = {
  /**
   * Restrict to one division's deals (`scope_division` equality). Omit for
   * the cross-division catalog (all divisions + `scope_division IS NULL`).
   */
  division?: string;
  /**
   * Which visibility classes to admit. The default (`"public"`) is the
   * untargeted floor every viewer may see. `"public_and_targeted"` is for the
   * CONSENT-GATED targeting reader only — callers must have resolved the
   * V3-34 personalization consent to TRUE before requesting it.
   */
  visibility?: "public" | "public_and_targeted";
  limit?: number;
};

/** Live catalog read: active + in-window, visibility-walled. Throws on error. */
export async function listLiveDeals(
  client: TypedSupabaseClient,
  options: ListLiveDealsOptions = {},
): Promise<DealRow[]> {
  const nowIso = new Date().toISOString();
  const visibilities =
    options.visibility === "public_and_targeted"
      ? ["public", "targeted"]
      : ["public"];

  let query = client
    .from("deals")
    .select(
      "id, creator_partner_id, created_by, source, title, description, deal_type, discount_percent, discount_minor, discount_currency, scope_division, scope_categories, target_ref, starts_at, ends_at, status, visibility, audience_signals, approved_by, approved_at, legacy_curation_id, created_at, updated_at",
    )
    .eq("status", "active")
    .lte("starts_at", nowIso)
    .gt("ends_at", nowIso)
    .in("visibility", visibilities)
    .order("ends_at", { ascending: true })
    .limit(Math.min(options.limit ?? 24, 48));

  if (options.division) {
    query = query.eq("scope_division", options.division);
  }

  const { data, error } = await query;
  if (error) throw new Error(`deals read failed: ${error.message}`);
  return (data ?? []) as DealRow[];
}

export type { DealImpressionEntry };

/**
 * Append one BATCH of impression rows for a single surface render.
 * Service-role only; deduped + hard-capped by the shared budget helper; ONE
 * insert statement. Best-effort by design: returns the number of rows written,
 * 0 on any failure (including the table being absent pre-apply) — the render
 * never depends on the audit ledger.
 */
export async function recordDealImpressions(
  client: TypedSupabaseClient,
  entries: ReadonlyArray<DealImpressionEntry>,
): Promise<number> {
  const batch = buildImpressionBatch(entries);
  if (batch.length === 0) return 0;
  try {
    const { error } = await client.from("deal_impressions").insert(
      batch.map((entry) => ({
        deal_id: entry.dealId,
        user_id: entry.userId,
        surface: entry.surface,
      })),
    );
    if (error) return 0;
    return batch.length;
  } catch {
    return 0;
  }
}

export type DealDecisionStatus = "approved" | "pending_review" | "rejected";

/**
 * Apply a submission decision to a deal (V3-25 publish gate outcome →
 * lifecycle status). Guarded compare-and-set: only rows currently in
 * `draft`/`pending_review` transition, so a decision can never overwrite an
 * already-live/paused/expired deal (no post-approval swaps). Records
 * `approved_by`/`approved_at` on approval. Returns the updated row, or null
 * when nothing transitioned (already decided, missing, or table absent).
 */
export async function applyDealDecision(
  client: TypedSupabaseClient,
  args: {
    dealId: string;
    status: DealDecisionStatus;
    /** Staff reviewer for manual decisions; null for the automated gate. */
    reviewerId?: string | null;
  },
): Promise<DealRow | null> {
  try {
    const patch: Database["public"]["Tables"]["deals"]["Update"] =
      args.status === "approved"
        ? {
            status: "approved",
            approved_by: args.reviewerId ?? null,
            approved_at: new Date().toISOString(),
          }
        : { status: args.status };

    const { data, error } = await client
      .from("deals")
      .update(patch)
      .eq("id", args.dealId)
      .in("status", ["draft", "pending_review"])
      .select()
      .maybeSingle();
    if (error || !data) return null;
    return data as DealRow;
  } catch {
    return null;
  }
}
