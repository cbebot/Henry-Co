import "server-only";

import type { UnifiedViewer } from "@henryco/auth";
import { createDataAdminClient } from "@henryco/data";
import { listSavedItems } from "@henryco/cart-saved-items/server";
import type { SavedItemRecord } from "@henryco/cart-saved-items";

/**
 * Module-local data layer for the marketplace home widgets. Every
 * read here uses the typed admin client from @henryco/data; nothing
 * mutates state. Per V2 scope §"NOT permitted in DASH-2: New API
 * surfaces — module home widgets read existing API/DB."
 */

export type MarketplaceOrderInFlight = {
  id: string;
  orderNo: string;
  status: string;
  paymentStatus: string;
  grandTotal: number;
  currency: string;
  placedAt: string;
};

export type MarketplaceCuratedDeal = {
  id: string;
  productSlug: string;
  slot: string;
  sortOrder: number;
  startsAt: string;
  endsAt: string | null;
  note: string | null;
};

export type MarketplaceVendorStatus = {
  hasApplication: boolean;
  applicationStatus: string | null;
  storeSlug: string | null;
  storeName: string | null;
  storeIsActive: boolean;
};

export type MarketplaceSnapshot = {
  ordersInFlight: ReadonlyArray<MarketplaceOrderInFlight>;
  ordersInFlightCount: number;
  savedItems: ReadonlyArray<SavedItemRecord>;
  savedItemsCount: number;
  curatedDeals: ReadonlyArray<MarketplaceCuratedDeal>;
  vendorStatus: MarketplaceVendorStatus | null;
};

const IN_FLIGHT_ORDER_STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "in_transit",
  "out_for_delivery",
  "shipped",
  "processing",
];

/**
 * Build the marketplace snapshot for the current viewer. Returns null
 * when the viewer is not eligible (e.g. owner/staff lanes that don't
 * surface the marketplace module on the consumer rail).
 */
export async function loadMarketplaceSnapshot(
  viewer: UnifiedViewer,
): Promise<MarketplaceSnapshot | null> {
  if (viewer.kind !== "customer") return null;
  const client = createDataAdminClient();
  const userId = viewer.user.id;

  const [ordersRes, savedItems, dealsRes] = await Promise.all([
    client
      .from("marketplace_orders")
      .select("id, order_no, status, payment_status, grand_total, display_currency, placed_at, archived_at")
      .eq("user_id", userId)
      .is("archived_at", null)
      .in("status", IN_FLIGHT_ORDER_STATUSES)
      .order("placed_at", { ascending: false })
      .limit(8),
    listSavedItems(client, userId, {
      includeStatuses: ["active"],
      limit: 6,
    }).catch(() => [] as SavedItemRecord[]),
    client
      .from("marketplace_deals_curation")
      .select("id, product_slug, slot, sort_order, starts_at, ends_at, note")
      .eq("active", true)
      .order("sort_order", { ascending: true })
      .limit(6),
  ]);

  const ordersInFlight: MarketplaceOrderInFlight[] = (ordersRes.data ?? []).map((row) => ({
    id: row.id,
    orderNo: row.order_no,
    status: row.status,
    paymentStatus: row.payment_status,
    grandTotal: Number(row.grand_total) || 0,
    currency: row.display_currency,
    placedAt: row.placed_at,
  }));

  const curatedDeals: MarketplaceCuratedDeal[] = (dealsRes.data ?? []).map((row) => ({
    id: row.id,
    productSlug: row.product_slug,
    slot: row.slot,
    sortOrder: row.sort_order,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    note: row.note,
  }));

  const marketplaceSavedItems = savedItems.filter(
    (item) => item.division === "marketplace",
  );

  const vendorStatus = await readVendorStatus(client, userId).catch(() => null);

  return {
    ordersInFlight,
    ordersInFlightCount: ordersInFlight.length,
    savedItems: marketplaceSavedItems,
    savedItemsCount: marketplaceSavedItems.length,
    curatedDeals,
    vendorStatus,
  };
}

async function readVendorStatus(
  client: ReturnType<typeof createDataAdminClient>,
  userId: string,
): Promise<MarketplaceVendorStatus | null> {
  const [applicationRes, storeRes] = await Promise.all([
    client
      .from("marketplace_vendor_applications")
      .select("status")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    client
      .from("marketplace_vendors")
      .select("slug, name, status")
      .eq("owner_user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const hasApplication = Boolean(applicationRes.data);
  const store = storeRes.data;

  if (!hasApplication && !store) {
    return null;
  }

  return {
    hasApplication,
    applicationStatus: applicationRes.data?.status ?? null,
    storeSlug: store?.slug ?? null,
    storeName: store?.name ?? null,
    storeIsActive: store?.status === "active",
  };
}

/**
 * True when the viewer should see the vendor-only `SellerStatusCard`.
 * The check is cheap and runs on every render to keep the rail accurate
 * without caching staleness.
 */
export function isVendor(snapshot: MarketplaceSnapshot | null): boolean {
  return Boolean(snapshot?.vendorStatus);
}
