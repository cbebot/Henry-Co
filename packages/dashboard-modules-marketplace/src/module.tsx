import { ShoppingBag } from "lucide-react";
import {
  viewerCanUseCustomerSurface,
  type DashboardModule,
  type HomeWidget,
  type PaletteEntry,
  type NotificationCategory,
  type RoleDecision,
  type RouteEntry,
  type EmptyTeaching,
} from "@henryco/dashboard-shell";

import {
  OrdersInFlightCard,
  WishlistShortcut,
  SellerStatusCard,
  DealsOfTheMomentCard,
} from "./widgets";
import {
  loadMarketplaceSnapshot,
  loadVendorStatus,
  MARKETPLACE_VENDOR_WORKSPACE_HREF,
} from "./data";

/**
 * The marketplace module — slug `marketplace`.
 *
 * The second reference module DASH-2 ships. Validates the registry
 * contract on the audit's strongest concrete-debt surface
 * (§B.marketplace-7). The module owns five marketplace notification
 * categories: marketplace.{order,dispute,payout,application,moderation}.
 *
 * Eligibility: every authenticated viewer in the customer surface
 * (`apps/account`) can use the marketplace module — including owners
 * and staff browsing apps/account, because every human has a
 * customer-shaped buying surface. The `getRoleGate` returns
 * `restrictions: ["vendor"]` (TODO) when the viewer has no vendor
 * application/store; the SellerStatusCard widget surfaces only when
 * the viewer is a vendor (via `isVendor()` from the snapshot).
 *
 * MODULES-01 (2026-05-23) widened the gate from `viewer.kind ===
 * "customer"` to `viewerCanUseCustomerSurface(viewer)` after the owner
 * reported `/modules/marketplace` returning "not exists" on mobile —
 * the old gate denied owners (kind: "owner") and staff (kind:
 * "staff") who legitimately use the customer surface. Data-layer
 * gates in `data.ts` remain `kind === "customer"` because those load
 * customer-context rows only.
 */
export const marketplaceModule: DashboardModule = {
  slug: "marketplace",
  title: "Marketplace",
  description: "Orders in flight, saved items, curated deals, vendor controls.",
  icon: () => <ShoppingBag size={18} aria-hidden />,
  railSlot: "primary",
  // The REAL surface is the live top-level `/marketplace` route (the same
  // rich page the desktop sidebar opens). Without this, the rail / mobile
  // Modules drawer / Cmd-jump sent marketplace to the sparse
  // `/modules/marketplace` catch-all — the "module not opening" report.
  // Every other division module declares its homeHref; marketplace was the
  // lone omission.
  homeHref: "/marketplace",

  getEligibleViewer(viewer) {
    return viewerCanUseCustomerSurface(viewer) ? "allowed" : "hidden";
  },

  getRoleGate(viewer): RoleDecision | null {
    if (!viewerCanUseCustomerSurface(viewer)) return null;
    return { kind: "allow", role: viewer.role };
  },

  async getHomeWidgets(viewer): Promise<ReadonlyArray<HomeWidget>> {
    // AWARE-FIX (owner report 2026-07-10): the vendor WINDOW loads
    // INDEPENDENTLY of the customer snapshot. A membership vendor resolves as
    // viewer.kind="staff", which nulls the customer snapshot — previously that
    // hid the ENTIRE module (including their seller card) and real vendors saw
    // "apply to sell" surfaces elsewhere. Same person-can-be-both pattern as
    // jobs/learn/property/studio.
    const [snapshot, vendorStatus] = await Promise.all([
      loadMarketplaceSnapshot(viewer),
      loadVendorStatus(viewer),
    ]);

    const widgets: HomeWidget[] = [];

    // Vendor WINDOW (dashboard-vs-workspaces decision, 2026-07-09) — gated on
    // vendor standing via the SHARED grant predicate. Ranks ABOVE the customer
    // widgets (84 > orders' 80): a seller's morning question is "any orders to
    // fulfil?", not "what did I buy?". The card-tap opens the REAL vendor
    // workspace on the marketplace subdomain.
    if (vendorStatus) {
      widgets.push({
        id: "marketplace.seller-status",
        source: "marketplace",
        title: "Seller status",
        size: "md",
        weight: 84,
        href: MARKETPLACE_VENDOR_WORKSPACE_HREF,
        render: async () => <SellerStatusCard vendorStatus={vendorStatus} />,
      });
    }

    if (!snapshot) return widgets;

    widgets.push(
      {
        id: "marketplace.orders-in-flight",
        source: "marketplace",
        title: "Orders in flight",
        size: "lg",
        weight: 80,
        // PASS 22 issue #1 — `/marketplace/orders` etc. were declared in
        // getRoutes() but never wired to actual app pages, so each href
        // 404'd. Until the per-feature pages exist we land users on the
        // marketplace summary surface (`/marketplace`) which already
        // renders their orders, saved items, and seller status from the
        // same snapshot.
        href: "/marketplace",
        render: async () => <OrdersInFlightCard snapshot={snapshot} />,
      },
      {
        id: "marketplace.wishlist",
        source: "marketplace",
        title: "Saved items",
        size: "md",
        weight: 60,
        // `/saved-items` is the canonical cross-division saved-items
        // surface in apps/account; the marketplace-specific subpath was
        // never built.
        href: "/saved-items",
        render: async () => <WishlistShortcut snapshot={snapshot} />,
      },
      {
        id: "marketplace.deals",
        source: "marketplace",
        title: "Deals of the moment",
        size: "md",
        weight: 50,
        href: "/marketplace",
        render: async () => <DealsOfTheMomentCard snapshot={snapshot} />,
      },
    );

    return widgets;
  },

  getRoutes(): ReadonlyArray<RouteEntry> {
    return [
      { path: "", kind: "home", label: "Marketplace" },
      { path: "orders", kind: "detail", label: "Orders" },
      {
        path: "orders/[orderNo]",
        kind: "detail",
        label: "Order detail",
        params: ["orderNo"],
      },
      { path: "saved", kind: "detail", label: "Saved items" },
      { path: "recently-viewed", kind: "detail", label: "Recently viewed" },
      { path: "search", kind: "detail", label: "Search products" },
      { path: "vendor", kind: "detail", label: "Manage store" },
      { path: "disputes", kind: "detail", label: "Disputes" },
      { path: "disputes/new", kind: "detail", label: "Submit dispute" },
    ];
  },

  async getCommandPaletteEntries(viewer): Promise<ReadonlyArray<PaletteEntry>> {
    // AWARE-FIX (2026-07-10): vendor standing resolves via the shared grant
    // predicate, independent of the customer snapshot (staff-kind vendors).
    const vendor = Boolean(await loadVendorStatus(viewer));

    // PASS 22 issue #1 — every `/marketplace/<sub>` palette entry below
    // pointed at routes the account shell never implemented. We collapse
    // them to existing surfaces (`/marketplace`, `/saved-items`,
    // `/support`, `/invoices`) so picking a palette entry never 404s.
    const entries: PaletteEntry[] = [
      {
        id: "marketplace.search",
        source: "marketplace",
        label: "Search products",
        kicker: "Marketplace",
        groupLabel: "Search",
        href: "/search",
        keywords: ["search", "products", "find", "shop"],
      },
      {
        id: "marketplace.orders",
        source: "marketplace",
        label: "View orders",
        kicker: "Marketplace",
        groupLabel: "Open",
        href: "/marketplace",
        keywords: ["orders", "purchases", "history"],
      },
      {
        id: "marketplace.dispute-new",
        source: "marketplace",
        label: "Submit dispute",
        kicker: "Marketplace",
        groupLabel: "Create",
        href: "/support",
        keywords: ["dispute", "complaint", "refund", "issue"],
      },
      {
        id: "marketplace.save-for-later",
        source: "marketplace",
        label: "Save for later",
        kicker: "Marketplace",
        groupLabel: "Create",
        href: "/saved-items",
        keywords: ["save", "bookmark", "wishlist", "later"],
      },
      {
        id: "marketplace.recently-viewed",
        source: "marketplace",
        label: "Open recently viewed",
        kicker: "Marketplace",
        groupLabel: "Open",
        href: "/marketplace",
        keywords: ["recently viewed", "history", "browsing"],
      },
      {
        id: "marketplace.invoice-download",
        source: "marketplace",
        label: "Download invoice",
        kicker: "Marketplace",
        groupLabel: "Open",
        href: "/invoices",
        keywords: ["invoice", "download", "receipt"],
      },
    ];

    if (vendor) {
      entries.push({
        id: "marketplace.manage-store",
        source: "marketplace",
        label: "Manage store",
        kicker: "Vendor",
        groupLabel: "Open",
        // Vendor WINDOW → the REAL workspace on the marketplace subdomain.
        href: MARKETPLACE_VENDOR_WORKSPACE_HREF,
        keywords: ["vendor", "store", "manage", "products"],
      });
    }

    return entries;
  },

  getNotificationCategories(): ReadonlyArray<NotificationCategory> {
    // PASS 22 issue #1 — deep-link templates previously pointed at
    // marketplace subpaths the account shell never implemented (orders,
    // vendor/payouts, account/seller-application, moderation). All five
    // now land on the live `/marketplace` summary so a clicked
    // notification never 404s.
    return [
      {
        slug: "marketplace.order",
        label: "Orders",
        source: "marketplace",
        deepLinkTemplate: "/marketplace",
      },
      {
        slug: "marketplace.dispute",
        label: "Disputes",
        source: "marketplace",
        deepLinkTemplate: "/marketplace",
        urgentAccent: "#C04A1F",
      },
      {
        slug: "marketplace.payout",
        label: "Payouts",
        source: "marketplace",
        deepLinkTemplate: "/marketplace",
      },
      {
        slug: "marketplace.application",
        label: "Vendor applications",
        source: "marketplace",
        deepLinkTemplate: "/marketplace",
      },
      {
        slug: "marketplace.moderation",
        label: "Moderation",
        source: "marketplace",
        deepLinkTemplate: "/marketplace",
        urgentAccent: "#B91C1C",
      },
    ];
  },

  async getEmptyTeaching(_viewer): Promise<EmptyTeaching | null> {
    return {
      kicker: "Discover premium sellers",
      headline: "Curated deals worth your attention",
      body: "When you place an order, save an item, or follow a vendor, it surfaces here.",
      action: { label: "Open marketplace", href: "/marketplace" },
    };
  },

  getDeepLinkTemplate(eventType: string): string | null {
    // PASS 22 issue #1 — same rationale as `getNotificationCategories`
    // above. Every event lands on `/marketplace` instead of a dead
    // `/marketplace/<sub>` path until those surfaces ship.
    switch (eventType) {
      case "marketplace.order_placed":
      case "marketplace.order_shipped":
      case "marketplace.order_delivered":
      case "marketplace.dispute_opened":
      case "marketplace.dispute_resolved":
      case "marketplace.payout_completed":
      case "marketplace.payout_failed":
      case "marketplace.application_submitted":
      case "marketplace.application_approved":
      case "marketplace.application_rejected":
      case "marketplace.moderation_decision":
        return "/marketplace";
      default:
        return null;
    }
  },
};
