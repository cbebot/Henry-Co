import "server-only";

import {
  trackEvent,
  noopSink,
  HenryEventNames,
  type HenryEventEnvelope,
} from "@henryco/intelligence";
import { writeAuditLog } from "@henryco/observability/audit-log";
import { createAdminSupabase } from "@/lib/supabase";

/**
 * V3-58 — daily seller-tier reconcile.
 *
 * Recomputes the tier for every marketplace-seller business from verified signals
 * (the SECURITY DEFINER recompute_seller_tier RPC), so a tier reflects new
 * transactions/ratings/completions within 24h without touching the money path.
 * This is the "daily reconcile cron" leg of the spec's recompute triad (the
 * course-completion leg fires live from the learn app; the settlement-time leg is
 * intentionally NOT wired here — that lives on Lane 1's money path, and the daily
 * sweep covers transaction-driven tier moves).
 *
 * On every tier change it emits henry.seller.tier.upgraded (direction read from
 * fromTier vs toTier) and writes an audit log with the input snapshot.
 */

export type SellerTierReconcileSummary = {
  scanned: number;
  changed: number;
  errors: number;
  /** True when no service role is configured — the sweep no-ops rather than throwing. */
  skipped: boolean;
};

function recordEvent(event: Omit<HenryEventEnvelope, "version" | "occurredAt">): void {
  trackEvent(noopSink, { ...event, version: "1", occurredAt: new Date().toISOString() });
}

type TierDelta = { previousTier?: string; tier?: string; changed?: boolean };

export async function runSellerTierReconcile(): Promise<SellerTierReconcileSummary> {
  const summary: SellerTierReconcileSummary = { scanned: 0, changed: 0, errors: 0, skipped: false };

  let admin;
  try {
    admin = createAdminSupabase();
  } catch {
    summary.skipped = true;
    return summary;
  }

  const PAGE = 500;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await admin
      .from("businesses")
      .select("id")
      .eq("primary_partner_type", "marketplace_seller")
      .in("status", ["active", "pending"])
      .range(from, from + PAGE - 1);
    if (error) {
      summary.errors += 1;
      break;
    }
    const rows = (data ?? []) as Array<{ id: string }>;
    if (rows.length === 0) break;

    for (const row of rows) {
      summary.scanned += 1;
      const { data: result, error: rpcError } = await admin.rpc("recompute_seller_tier", {
        p_business_id: row.id,
      });
      if (rpcError) {
        summary.errors += 1;
        continue;
      }
      const delta = (result ?? {}) as TierDelta;
      if (!delta.changed) continue;
      summary.changed += 1;
      const fromTier = delta.previousTier ?? "none";
      const toTier = delta.tier ?? "none";
      recordEvent({
        name: HenryEventNames.SELLER_TIER_UPGRADED,
        division: "marketplace",
        eventId: row.id,
        actor: { kind: "automation", subjectRef: "seller-tier-reconcile" },
        properties: { businessId: row.id, fromTier, toTier },
      });
      await writeAuditLog(admin as unknown as Parameters<typeof writeAuditLog>[0], {
        action: HenryEventNames.SELLER_TIER_UPGRADED,
        entityType: "seller_tier",
        entityId: row.id,
        oldValues: { tier: fromTier },
        newValues: { tier: toTier },
        division: "marketplace",
      });
    }

    if (rows.length < PAGE) break;
  }

  return summary;
}
