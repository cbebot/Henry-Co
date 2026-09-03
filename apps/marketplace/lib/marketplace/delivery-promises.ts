import "server-only";

import { createAdminSupabase } from "@/lib/supabase";
import { clampCoveredStatesToTier, type ReachKind } from "@/lib/checkout/delivery-reach";

/**
 * V3-DELIVERY-COMPLETE-01 — seller Delivery Promises, server reads.
 *
 * DORMANCY GATE (mirrors `isMarketplaceCardCheckoutEnabled` in card-rail.ts). The
 * seller card's SAVE and the checkout's honoring are offered only when this flag is
 * set; production leaves it unset → the feature is invisible and the checkout reads
 * no promises. Activation is owner-gated: apply the (committed-NOT-applied) migration
 * first, then set `MARKETPLACE_DELIVERY_PROMISES=1`. The buyer state-picker ships
 * un-gated (a pure UX upgrade that only writes a canonical `shipping_region` code).
 */
export function isDeliveryPromisesEnabled(): boolean {
  return process.env.MARKETPLACE_DELIVERY_PROMISES === "1";
}

/** A vendor's active promise as the public surfaces (badges) see it — tier-clamped. */
export type PublicDeliveryPromise = {
  reachKind: ReachKind;
  /** Re-clamped to the vendor's CURRENT verification_level (never an over-reach). */
  coveredStates: string[];
  originState: string;
  minOrderMinor: number | null;
};

/**
 * Load one vendor's active Delivery Promise for display, RE-CLAMPED to the vendor's
 * current verification_level — so a badge can never advertise wider reach than the
 * checkout would actually honor. Fully DORMANT-SAFE: a missing table / unreadable row
 * resolves to `null` (no badge), never throws.
 */
export async function getVendorDeliveryPromise(vendorId: string): Promise<PublicDeliveryPromise | null> {
  if (!vendorId) return null;
  try {
    const admin = createAdminSupabase();
    const { data, error } = await admin
      .from("marketplace_delivery_promises")
      .select("reach_kind, covered_states, origin_state, min_order_minor, is_active, marketplace_vendors(verification_level)")
      .eq("vendor_id", vendorId)
      .eq("is_active", true)
      .maybeSingle();
    if (error || !data) return null;
    const row = data as Record<string, unknown>;
    const v = row.marketplace_vendors as { verification_level?: string } | Array<{ verification_level?: string }> | null;
    const tier = (Array.isArray(v) ? v[0]?.verification_level : v?.verification_level) ?? null;
    const origin = typeof row.origin_state === "string" ? row.origin_state : "";
    const stored = Array.isArray(row.covered_states) ? (row.covered_states as unknown[]).map(String) : [];
    const coveredStates = clampCoveredStatesToTier(stored, origin, tier);
    if (coveredStates.length === 0) return null; // nothing honorable to advertise
    return {
      reachKind: String(row.reach_kind || "own_state") as ReachKind,
      coveredStates,
      originState: origin,
      minOrderMinor: row.min_order_minor == null ? null : Number(row.min_order_minor),
    };
  } catch {
    return null;
  }
}

/** The seller's own promise for prefilling their settings card — incl. paused rows. */
export type OwnerDeliveryPromise = {
  reachKind: ReachKind;
  originState: string | null;
  minOrderMinor: number | null;
  isActive: boolean;
};

/**
 * Load the vendor's promise (active OR paused) to prefill the seller settings card.
 * DORMANT-SAFE: missing table / no row → `null` (the card renders empty defaults).
 */
export async function getOwnerDeliveryPromise(vendorId: string): Promise<OwnerDeliveryPromise | null> {
  if (!vendorId) return null;
  try {
    const admin = createAdminSupabase();
    const { data, error } = await admin
      .from("marketplace_delivery_promises")
      .select("reach_kind, origin_state, min_order_minor, is_active")
      .eq("vendor_id", vendorId)
      .maybeSingle();
    if (error || !data) return null;
    const row = data as Record<string, unknown>;
    return {
      reachKind: String(row.reach_kind || "own_state") as ReachKind,
      originState: typeof row.origin_state === "string" ? row.origin_state : null,
      minOrderMinor: row.min_order_minor == null ? null : Number(row.min_order_minor),
      isActive: row.is_active !== false,
    };
  } catch {
    return null;
  }
}
