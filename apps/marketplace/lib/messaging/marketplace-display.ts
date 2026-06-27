import "server-only";

import { createAdminSupabase } from "@/lib/supabase";
import type { MarketplaceConversationAnchorType } from "@/lib/messaging/conversations";

type AdminClient = ReturnType<typeof createAdminSupabase>;

/**
 * The Onyx Line (WS-4) — server-side display resolvers for the marketplace
 * messaging surfaces.
 *
 * The conversation rows only carry stable foreign keys (vendor_id, anchor_id);
 * these helpers resolve the *display* labels a buyer is allowed to see — the
 * vendor's public store name and the anchor's human reference (order number /
 * listing title). They NEVER read buyer email/phone/address, so they cannot
 * leak counterpart PII into a thread or inbox.
 */

/** Batch-resolve vendor store names by id. Returns a Map keyed by vendor id. */
export async function resolveVendorNames(
  admin: AdminClient,
  vendorIds: Array<string | null | undefined>,
): Promise<Map<string, string>> {
  const ids = Array.from(new Set(vendorIds.map((id) => (id ? String(id) : "")).filter(Boolean)));
  const map = new Map<string, string>();
  if (ids.length === 0) return map;

  const { data } = await admin.from("marketplace_vendors").select("id, name").in("id", ids);
  for (const row of (data ?? []) as Array<Record<string, unknown>>) {
    if (row.id) map.set(String(row.id), String(row.name || ""));
  }
  return map;
}

/**
 * Human anchor label for a single conversation anchor:
 *  - `order`   -> `marketplace_orders.order_no`
 *  - `listing` -> `marketplace_products.title`
 */
export async function resolveAnchorLabel(
  admin: AdminClient,
  anchorType: MarketplaceConversationAnchorType,
  anchorId: string,
): Promise<string | null> {
  if (!anchorId) return null;
  if (anchorType === "order") {
    const { data } = await admin
      .from("marketplace_orders")
      .select("order_no")
      .eq("id", anchorId)
      .maybeSingle();
    return data?.order_no ? String(data.order_no) : null;
  }
  const { data } = await admin
    .from("marketplace_products")
    .select("title")
    .eq("id", anchorId)
    .maybeSingle();
  return data?.title ? String(data.title) : null;
}

/**
 * Batched anchor-label resolver for an inbox list. Returns a Map keyed by
 * `${anchorType}:${anchorId}` so callers can look up each row's label after a
 * single round-trip per anchor type.
 */
export async function resolveAnchorLabels(
  admin: AdminClient,
  anchors: Array<{ anchorType: MarketplaceConversationAnchorType; anchorId: string }>,
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const orderIds = new Set<string>();
  const listingIds = new Set<string>();
  for (const anchor of anchors) {
    if (!anchor.anchorId) continue;
    if (anchor.anchorType === "order") orderIds.add(anchor.anchorId);
    else listingIds.add(anchor.anchorId);
  }

  const queries: Array<Promise<void>> = [];

  if (orderIds.size > 0) {
    queries.push(
      (async () => {
        const { data } = await admin
          .from("marketplace_orders")
          .select("id, order_no")
          .in("id", Array.from(orderIds));
        for (const row of (data ?? []) as Array<Record<string, unknown>>) {
          if (row.id && row.order_no) map.set(`order:${String(row.id)}`, String(row.order_no));
        }
      })(),
    );
  }

  if (listingIds.size > 0) {
    queries.push(
      (async () => {
        const { data } = await admin
          .from("marketplace_products")
          .select("id, title")
          .in("id", Array.from(listingIds));
        for (const row of (data ?? []) as Array<Record<string, unknown>>) {
          if (row.id && row.title) map.set(`listing:${String(row.id)}`, String(row.title));
        }
      })(),
    );
  }

  await Promise.all(queries);
  return map;
}
