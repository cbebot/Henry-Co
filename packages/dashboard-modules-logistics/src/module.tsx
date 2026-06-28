import { Truck } from "lucide-react";
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
  ActiveShipmentsCard,
  OnTimeRateCard,
  LogisticsSpendCard,
  LogisticsEntryCard,
} from "./widgets";
import {
  LOGISTICS_HOME_HREF,
  getLogisticsQuickActions,
  loadLogisticsSnapshot,
} from "./data";
import { toPaletteGroup } from "./format";

/**
 * The logistics module — slug `logistics`. Division "Henry Onyx
 * Logistics".
 *
 * Eligibility mirrors the other customer-surface modules. The real
 * surface is the live top-level `/logistics` route, so `homeHref` sends
 * the rail / mobile drawer / Cmd-jump straight there.
 */
export const logisticsModule: DashboardModule = {
  slug: "logistics",
  title: "Logistics",
  description:
    "Active shipments, deliveries this month, on-time rate, and total spend.",
  icon: () => <Truck size={18} aria-hidden />,
  railSlot: "secondary",
  homeHref: LOGISTICS_HOME_HREF,

  getEligibleViewer(viewer) {
    return viewerCanUseCustomerSurface(viewer) ? "allowed" : "hidden";
  },

  getRoleGate(viewer): RoleDecision | null {
    if (!viewerCanUseCustomerSurface(viewer)) return null;
    return { kind: "allow", role: viewer.role };
  },

  async getHomeWidgets(viewer): Promise<ReadonlyArray<HomeWidget>> {
    const snapshot = await loadLogisticsSnapshot(viewer);
    // Not a customer-context viewer — surface nothing.
    if (!snapshot) return [];

    // No shipments on record yet — one calm, honest entry-point widget
    // (book your first delivery) instead of a wall of zero-value metrics.
    if (!snapshot.hasAnyShipments) {
      return [
        {
          id: "logistics.entry",
          source: "logistics",
          title: "Logistics",
          size: "md",
          weight: 40,
          href: LOGISTICS_HOME_HREF,
          render: async () => <LogisticsEntryCard />,
        },
      ];
    }

    // Real shipment history — surface the live metrics, each deep-linking
    // into `/logistics`.
    return [
      {
        id: "logistics.active-shipments",
        source: "logistics",
        title: "Active shipments",
        size: "lg",
        weight: 80,
        href: LOGISTICS_HOME_HREF,
        render: async () => <ActiveShipmentsCard snapshot={snapshot} />,
      },
      {
        id: "logistics.on-time-rate",
        source: "logistics",
        title: "On-time rate",
        size: "md",
        weight: 60,
        href: LOGISTICS_HOME_HREF,
        render: async () => <OnTimeRateCard snapshot={snapshot} />,
      },
      {
        id: "logistics.total-spend",
        source: "logistics",
        title: "Total spend",
        size: "md",
        weight: 55,
        href: LOGISTICS_HOME_HREF,
        render: async () => <LogisticsSpendCard snapshot={snapshot} />,
      },
    ];
  },

  getRoutes(): ReadonlyArray<RouteEntry> {
    return [
      { path: "", kind: "home", label: "Logistics" },
      { path: "book", kind: "detail", label: "Book a shipment" },
      { path: "track", kind: "detail", label: "Track a shipment" },
      { path: "shipments", kind: "detail", label: "My shipments" },
      {
        path: "shipments/[shipmentId]",
        kind: "detail",
        label: "Shipment detail",
        params: ["shipmentId"],
      },
    ];
  },

  async getCommandPaletteEntries(): Promise<ReadonlyArray<PaletteEntry>> {
    return getLogisticsQuickActions().map((action) => ({
      id: action.id,
      source: "logistics",
      label: action.label,
      kicker: "Logistics",
      groupLabel: toPaletteGroup(action.group),
      href: action.href,
      keywords: action.keywords,
    }));
  },

  getNotificationCategories(): ReadonlyArray<NotificationCategory> {
    return [
      {
        slug: "logistics.shipment",
        label: "Shipments",
        source: "logistics",
        deepLinkTemplate: LOGISTICS_HOME_HREF,
      },
      {
        slug: "logistics.delivery",
        label: "Deliveries",
        source: "logistics",
        deepLinkTemplate: LOGISTICS_HOME_HREF,
      },
    ];
  },

  async getEmptyTeaching(): Promise<EmptyTeaching | null> {
    return {
      kicker: "Henry Onyx Logistics",
      headline: "Send your first parcel",
      body: "Book a shipment in a few taps and follow it from pickup to doorstep in real time.",
      action: { label: "Book a shipment", href: LOGISTICS_HOME_HREF },
    };
  },

  getDeepLinkTemplate(eventType: string): string | null {
    switch (eventType) {
      case "logistics.shipment_created":
      case "logistics.shipment_updated":
      case "logistics.delivery_out":
      case "logistics.delivery_completed":
        return LOGISTICS_HOME_HREF;
      default:
        return null;
    }
  },
};
