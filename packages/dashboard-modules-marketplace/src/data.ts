import "server-only";

import type { UnifiedViewer } from "@henryco/auth";
import { createDataAdminClient, loadOperatorMembership } from "@henryco/data";
import { getDivisionUrl } from "@henryco/config";
import { listSavedItems } from "@henryco/cart-saved-items/server";
import type { SavedItemRecord } from "@henryco/cart-saved-items";

/** The REAL vendor workspace — lives on the marketplace subdomain, not the
 *  account shell (dashboard-vs-workspaces decision, 2026-07-09: the module is
 *  a window; the workspace is the room). */
export const MARKETPLACE_VENDOR_WORKSPACE_HREF = `${getDivisionUrl("marketplace").replace(/\/$/, "")}/vendor`;

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

  const vendorStatus = await readVendorStatus(client, viewer).catch(() => null);

  return {
    ordersInFlight,
    ordersInFlightCount: ordersInFlight.length,
    savedItems: marketplaceSavedItems,
    savedItemsCount: marketplaceSavedItems.length,
    curatedDeals,
    vendorStatus,
  };
}

/**
 * Vendor standing, resolvable INDEPENDENTLY of the customer snapshot — a
 * membership vendor is viewer.kind="staff", which nulls the snapshot, so the
 * seller window must never depend on it.
 */
export async function loadVendorStatus(
  viewer: UnifiedViewer,
): Promise<MarketplaceVendorStatus | null> {
  if (!viewer.user?.id) return null;
  const client = createDataAdminClient();
  return readVendorStatus(client, viewer).catch(() => null);
}

async function readVendorStatus(
  client: ReturnType<typeof createDataAdminClient>,
  viewer: UnifiedViewer,
): Promise<MarketplaceVendorStatus | null> {
  const userId = viewer.user.id;

  // AWARE-FIX (owner report 2026-07-10): vendor TRUTH is the granted
  // `marketplace_role_memberships` row — the SAME shared predicate the
  // marketplace app and the aware chrome use. The previous check looked only
  // at `marketplace_vendors.owner_user_id`, so a REAL vendor whose seat is a
  // membership (team member / email-claimed) was shown "Become a seller".
  const [membership, applicationRes, ownedStoreRes] = await Promise.all([
    loadOperatorMembership(viewer, {
      table: "marketplace_role_memberships",
      division: "marketplace",
      workspacePath: "/vendor",
    }).catch(() => null),
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

  const vendorMembership = membership?.roles.includes("vendor") ? membership : null;

  // Enrich with the store the membership actually scopes to (scope_id = the
  // vendor id) — falls back to the legacy owner_user_id lookup.
  let store = ownedStoreRes.data as { slug: string; name: string; status: string } | null;
  if (!store && vendorMembership && vendorMembership.scopeIds.length > 0) {
    const scoped = await client
      .from("marketplace_vendors")
      .select("slug, name, status")
      .in("id", vendorMembership.scopeIds)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    store = (scoped.data as { slug: string; name: string; status: string } | null) ?? null;
  }

  const hasApplication = Boolean(applicationRes.data);

  if (!vendorMembership && !hasApplication && !store) {
    return null;
  }

  return {
    hasApplication: hasApplication || Boolean(vendorMembership),
    applicationStatus: applicationRes.data?.status ?? (vendorMembership ? "approved" : null),
    storeSlug: store?.slug ?? null,
    storeName: store?.name ?? null,
    // A granted, active vendor membership IS active standing — even when the
    // store row is keyed to a different owner (team seats, email claims).
    storeIsActive: store?.status === "active" || Boolean(vendorMembership),
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
