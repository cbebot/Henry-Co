import { Building2 } from "lucide-react";
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
  PropertyPortfolioCard,
  SavedShortlistCard,
  ViewingRequestsCard,
} from "./widgets";
import {
  PROPERTY_HOME_HREF,
  PROPERTY_SAVED_HREF,
  getPropertyQuickActions,
  loadPropertySnapshot,
} from "./data";
import { toPaletteGroup } from "./format";

/**
 * The property module — slug `property`. Division "Henry Onyx Property".
 *
 * Eligibility mirrors the other customer-surface modules
 * (marketplace/wallet/care): every authenticated viewer of
 * `apps/account` can use it — the `/property` page only calls
 * `requireAccountUser()` and `navigation.ts` lists Property under
 * "Services" with no gating. The module's real surface is the live
 * top-level `/property` route the desktop sidebar links to, so
 * `homeHref` sends the rail / mobile drawer / Cmd-jump straight there in
 * one tap. Data-layer gate in `data.ts` stays `kind === "customer"`
 * because the saved-shortlist + activity reads are customer-scoped.
 *
 * Home widgets render the viewer's REAL aggregate — saved shortlist
 * size, inquiries, viewing requests, and submitted listings — computed
 * from `loadPropertySnapshot` (the read-only port of
 * `getSavedPropertiesForUser` + `getDivisionActivity` aggregated with
 * `propertyStats` / `countByActivity` / `heroState`). Nothing is
 * fabricated; a viewer with no property history sees honest zeros and
 * the empty teaching.
 */
export const propertyModule: DashboardModule = {
  slug: "property",
  title: "Property",
  description: "Saved listings shortlist, inquiries, viewing requests, and your listings.",
  icon: () => <Building2 size={18} aria-hidden />,
  railSlot: "secondary",
  homeHref: PROPERTY_HOME_HREF,

  getEligibleViewer(viewer) {
    return viewerCanUseCustomerSurface(viewer) ? "allowed" : "hidden";
  },

  getRoleGate(viewer): RoleDecision | null {
    if (!viewerCanUseCustomerSurface(viewer)) return null;
    return { kind: "allow", role: viewer.role };
  },

  async getHomeWidgets(viewer): Promise<ReadonlyArray<HomeWidget>> {
    const snapshot = await loadPropertySnapshot(viewer);
    if (!snapshot) return [];

    const widgets: HomeWidget[] = [
      {
        id: "property.portfolio",
        source: "property",
        title: "Property",
        size: "lg",
        weight: 55,
        href: PROPERTY_HOME_HREF,
        render: async () => <PropertyPortfolioCard snapshot={snapshot} />,
      },
      {
        id: "property.saved-shortlist",
        source: "property",
        title: "Saved listings",
        size: "md",
        weight: 45,
        href: PROPERTY_SAVED_HREF,
        render: async () => <SavedShortlistCard snapshot={snapshot} />,
      },
    ];

    // The viewing-request metric only earns a home slot when there is
    // genuine in-progress activity (an inquiry or a viewing), so the feed
    // never carries a hollow "0 viewings" card. When present it ranks
    // high — a requested viewing is the most time-sensitive property
    // signal.
    if (snapshot.stats.viewings > 0 || snapshot.stats.inquiries > 0) {
      widgets.push({
        id: "property.viewing-requests",
        source: "property",
        title: "Viewing requests",
        size: "sm",
        weight: 70,
        href: PROPERTY_HOME_HREF,
        render: async () => <ViewingRequestsCard snapshot={snapshot} />,
      });
    }

    return widgets;
  },

  getRoutes(): ReadonlyArray<RouteEntry> {
    return [
      { path: "", kind: "home", label: "Property" },
      { path: "saved", kind: "detail", label: "Saved properties" },
    ];
  },

  async getCommandPaletteEntries(): Promise<ReadonlyArray<PaletteEntry>> {
    return getPropertyQuickActions().map((action) => ({
      id: action.id,
      source: "property",
      label: action.label,
      kicker: "Property",
      groupLabel: toPaletteGroup(action.group),
      href: action.href,
      keywords: action.keywords,
    }));
  },

  getNotificationCategories(): ReadonlyArray<NotificationCategory> {
    return [
      {
        slug: "property.inquiry",
        label: "Inquiries",
        source: "property",
        deepLinkTemplate: PROPERTY_HOME_HREF,
      },
      {
        slug: "property.viewing",
        label: "Viewings",
        source: "property",
        deepLinkTemplate: PROPERTY_HOME_HREF,
      },
      {
        slug: "property.listing",
        label: "Listing updates",
        source: "property",
        deepLinkTemplate: PROPERTY_HOME_HREF,
      },
    ];
  },

  async getEmptyTeaching(viewer): Promise<EmptyTeaching | null> {
    // Only teach when the viewer genuinely has no property history. Once
    // they have any saved listing or activity, the home widgets carry the
    // surface and this returns null so the empty slot isn't shown over
    // real content.
    const snapshot = await loadPropertySnapshot(viewer);
    if (snapshot && snapshot.stats.total > 0) return null;
    return {
      kicker: "Henry Onyx Property",
      headline: "Find your next space",
      body: "Browse homes and spaces for rent or sale, save a shortlist, and request viewings in a few taps.",
      action: { label: "Open Property", href: PROPERTY_HOME_HREF },
    };
  },

  getDeepLinkTemplate(eventType: string): string | null {
    switch (eventType) {
      case "property.inquiry_received":
      case "property.viewing_requested":
      case "property.viewing_confirmed":
      case "property.listing_submitted":
      case "property.listing_updated":
      case "property.listing_reviewed":
        return PROPERTY_HOME_HREF;
      default:
        return null;
    }
  },
};
