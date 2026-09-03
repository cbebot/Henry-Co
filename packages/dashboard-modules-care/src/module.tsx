import { Sparkles } from "lucide-react";
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
  BookingsOverviewCard,
  PaymentsDueCard,
  CompletedServicesCard,
} from "./widgets";
import { CARE_HOME_HREF, getCareQuickActions, loadCareSnapshot } from "./data";
import { toPaletteGroup } from "./format";

/**
 * The care module — slug `care`. Division "Henry Onyx Fabric Care".
 *
 * Eligibility mirrors the other customer-surface modules
 * (marketplace/wallet/play): every authenticated viewer of
 * `apps/account` can use it (the `/care` page only calls
 * `requireAccountUser()` and the sidebar lists Care for every signed-in
 * user with no gating). The module's real surface is the live top-level
 * `/care` route the desktop sidebar links to, so `homeHref` sends the
 * rail / mobile drawer / Cmd-jump straight there in one tap.
 *
 * Home widgets render the viewer's REAL booking aggregate — total /
 * in-flight / scheduled / completed, payments due, and the outstanding
 * balance — computed from `loadCareSnapshot` (the read-only port of
 * `getCareBookings` + `careStats` / `heroState`). Nothing is fabricated;
 * a viewer with no bookings sees honest zeros and the empty teaching.
 */
export const careModule: DashboardModule = {
  slug: "care",
  title: "Fabric Care",
  description: "Booked services in flight — payments due, scheduled visits, and completed jobs.",
  icon: () => <Sparkles size={18} aria-hidden />,
  railSlot: "secondary",
  homeHref: CARE_HOME_HREF,

  getEligibleViewer(viewer) {
    return viewerCanUseCustomerSurface(viewer) ? "allowed" : "hidden";
  },

  getRoleGate(viewer): RoleDecision | null {
    if (!viewerCanUseCustomerSurface(viewer)) return null;
    return { kind: "allow", role: viewer.role };
  },

  async getHomeWidgets(viewer): Promise<ReadonlyArray<HomeWidget>> {
    const snapshot = await loadCareSnapshot(viewer);
    if (!snapshot) return [];

    return [
      {
        id: "care.bookings-overview",
        source: "care",
        title: "Fabric Care",
        size: "lg",
        weight: 55,
        href: CARE_HOME_HREF,
        render: async () => <BookingsOverviewCard snapshot={snapshot} />,
      },
      {
        id: "care.payments-due",
        source: "care",
        title: "Payments due",
        size: "sm",
        // Outstanding money is the most time-sensitive care signal, so it
        // ranks above the routine overview when a balance is owed.
        weight: snapshot.stats.needsPayment > 0 ? 80 : 40,
        href: CARE_HOME_HREF,
        render: async () => <PaymentsDueCard snapshot={snapshot} />,
      },
      {
        id: "care.completed",
        source: "care",
        title: "Completed services",
        size: "sm",
        weight: 35,
        href: CARE_HOME_HREF,
        render: async () => <CompletedServicesCard snapshot={snapshot} />,
      },
    ];
  },

  getRoutes(): ReadonlyArray<RouteEntry> {
    return [
      { path: "", kind: "home", label: "Fabric Care" },
      { path: "book", kind: "detail", label: "Book a service" },
      { path: "track", kind: "detail", label: "Track an order" },
      { path: "bookings", kind: "detail", label: "My bookings" },
      {
        path: "bookings/[bookingId]",
        kind: "detail",
        label: "Booking detail",
        params: ["bookingId"],
      },
    ];
  },

  async getCommandPaletteEntries(): Promise<ReadonlyArray<PaletteEntry>> {
    return getCareQuickActions().map((action) => ({
      id: action.id,
      source: "care",
      label: action.label,
      kicker: "Fabric Care",
      groupLabel: toPaletteGroup(action.group),
      href: action.href,
      keywords: action.keywords,
    }));
  },

  getNotificationCategories(): ReadonlyArray<NotificationCategory> {
    return [
      {
        slug: "care.booking",
        label: "Bookings",
        source: "care",
        deepLinkTemplate: CARE_HOME_HREF,
      },
      {
        slug: "care.pickup",
        label: "Pickups",
        source: "care",
        deepLinkTemplate: CARE_HOME_HREF,
      },
      {
        slug: "care.delivery",
        label: "Deliveries",
        source: "care",
        deepLinkTemplate: CARE_HOME_HREF,
      },
    ];
  },

  async getEmptyTeaching(viewer): Promise<EmptyTeaching | null> {
    // Only teach when the viewer genuinely has no bookings. Once they
    // have any care history, the home widgets carry the surface and this
    // returns null so the empty slot isn't shown over real content.
    const snapshot = await loadCareSnapshot(viewer);
    if (snapshot && snapshot.stats.total > 0) return null;
    return {
      kicker: "Henry Onyx Fabric Care",
      headline: "Book your first care service",
      body: "Garment care, home and office cleaning with dependable pickup and delivery — booked in a few taps.",
      action: { label: "Open Fabric Care", href: CARE_HOME_HREF },
    };
  },

  getDeepLinkTemplate(eventType: string): string | null {
    switch (eventType) {
      case "care.booking_confirmed":
      case "care.booking_updated":
      case "care.pickup_scheduled":
      case "care.pickup_completed":
      case "care.delivery_scheduled":
      case "care.delivery_completed":
        return CARE_HOME_HREF;
      default:
        return null;
    }
  },
};
