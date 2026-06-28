import { Store } from "lucide-react";
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

import { BusinessesCard, ActingContextCard } from "./widgets";
import { loadBusinessSnapshot, BUSINESS_HOME_HREF } from "./data";

/**
 * The business module — slug `business`. "Henry Onyx Business" — the
 * cross-division company-identity workspace.
 *
 * Eligibility mirrors the live surface
 * (`apps/account/app/(account)/business/page.tsx`), which is gated only
 * by `requireAccountUser()` — any authenticated viewer. `listMyBusinesses()`
 * is itself RLS-scoped, so the module is visible to all but its content is
 * membership-scoped: a viewer only ever sees businesses they belong to.
 * The gate therefore mirrors the other customer-surface modules
 * (`viewerCanUseCustomerSurface`).
 *
 * The real surface is the live top-level `/business` route, so `homeHref`
 * sends the rail / mobile drawer / Cmd-jump straight there in one tap
 * instead of bouncing through the generic `/modules/business` summary.
 */
export const businessModule: DashboardModule = {
  slug: "business",
  title: "Business",
  description: "Your verified company identities, member roles, and acting context.",
  icon: () => <Store size={18} aria-hidden />,
  railSlot: "secondary",
  homeHref: BUSINESS_HOME_HREF,

  getEligibleViewer(viewer) {
    return viewerCanUseCustomerSurface(viewer) ? "allowed" : "hidden";
  },

  getRoleGate(viewer): RoleDecision | null {
    if (!viewerCanUseCustomerSurface(viewer)) return null;
    return { kind: "allow", role: viewer.role };
  },

  async getHomeWidgets(viewer): Promise<ReadonlyArray<HomeWidget>> {
    const snapshot = await loadBusinessSnapshot(viewer);
    if (!snapshot) return [];

    const widgets: HomeWidget[] = [
      {
        id: "business.portfolio",
        source: "business",
        title: "Your businesses",
        size: "lg",
        weight: 55,
        // The per-business rows in the card deep-link to `/business/<slug>`;
        // the card chrome opens the `/business` landing.
        href: BUSINESS_HOME_HREF,
        render: async () => <BusinessesCard snapshot={snapshot} />,
      },
    ];

    // The acting-context surface only carries meaning once the viewer
    // belongs to at least one business (otherwise it is always
    // "Personal" with nothing to switch to). Gating it on membership
    // keeps the home honest rather than padding it with a fixed card.
    if (snapshot.businessesCount > 0) {
      widgets.push({
        id: "business.acting-context",
        source: "business",
        title: "Acting context",
        size: "sm",
        weight: 45,
        href: BUSINESS_HOME_HREF,
        render: async () => <ActingContextCard snapshot={snapshot} />,
      });
    }

    return widgets;
  },

  getRoutes(): ReadonlyArray<RouteEntry> {
    // Mirrors the live `/business` route tree in apps/account.
    return [
      { path: "", kind: "home", label: "Business" },
      {
        path: "[slug]",
        kind: "detail",
        label: "Business detail",
        params: ["slug"],
      },
      {
        path: "[slug]/team",
        kind: "detail",
        label: "Team",
        params: ["slug"],
      },
      {
        path: "[slug]/insights",
        kind: "detail",
        label: "Insights",
        params: ["slug"],
      },
    ];
  },

  async getCommandPaletteEntries(): Promise<ReadonlyArray<PaletteEntry>> {
    // Every entry lands on the live `/business` surface, which hosts the
    // business list, the acting-context switcher, and the create form —
    // so picking a palette entry never 404s.
    return [
      {
        id: "business.view",
        source: "business",
        label: "View businesses",
        kicker: "Business",
        groupLabel: "Open",
        href: BUSINESS_HOME_HREF,
        keywords: ["business", "businesses", "company", "companies", "workspace"],
      },
      {
        id: "business.switch-context",
        source: "business",
        label: "Switch acting context",
        kicker: "Business",
        groupLabel: "Open",
        href: BUSINESS_HOME_HREF,
        keywords: ["acting", "context", "switch", "act as", "personal", "business"],
      },
      {
        id: "business.create",
        source: "business",
        label: "Create a business",
        kicker: "Business",
        groupLabel: "Create",
        href: BUSINESS_HOME_HREF,
        keywords: ["create", "new business", "register company", "add business"],
      },
    ];
  },

  getNotificationCategories(): ReadonlyArray<NotificationCategory> {
    // The business surface owns no dedicated notification categories yet
    // (no business.* notification events exist in the spine). Returning
    // an empty set is the honest state — categories are added when the
    // events ship, not fabricated ahead of them.
    return [];
  },

  async getEmptyTeaching(): Promise<EmptyTeaching | null> {
    return {
      kicker: "Henry Onyx Business",
      headline: "Create your verified company identity",
      body: "Stand up a business beside your personal account — add members, assign roles, and act on its behalf across Henry Onyx.",
      action: { label: "Open Business", href: BUSINESS_HOME_HREF },
    };
  },
};
