import { Hotel } from "lucide-react";
import { henryDomain } from "@henryco/config";
import type {
  DashboardModule,
  HomeWidget,
  PaletteEntry,
  NotificationCategory,
  RoleDecision,
  RouteEntry,
  EmptyTeaching,
} from "@henryco/dashboard-shell";

/**
 * Hotel module — slug `hotel`. Audit anchor §A.0.2
 * (`packages/config/company.ts:152-174`).
 *
 * HIDDEN UNTIL V3 LAUNCH. The Hotel division is registered in
 * `COMPANY.divisions` with full nav config but no apps/. This module
 * registers the slot in the shell so when the division ships, flipping
 * `MODULE_ENABLED` to true and adjusting the gate logic exposes the
 * module's empty-state widgets in the rail without further plumbing.
 *
 * Extensibility test: change `MODULE_ENABLED` to true, redeploy a
 * preview branch, and confirm the rail shows the Hotel entry with
 * "Nothing to show yet." inside the catch-all router.
 *
 * If `@henryco/intelligence` later ships a feature-flag API, this
 * constant is the migration target — replace with `flagEnabled(viewer,
 * "hotel.module")`.
 */
const MODULE_ENABLED = false;

export const hotelModule: DashboardModule = {
  slug: "hotel",
  title: "Hotels",
  description: "Premium stays and bookings — coming soon.",
  icon: () => <Hotel size={18} aria-hidden />,
  railSlot: "secondary",

  getEligibleViewer(_viewer) {
    return MODULE_ENABLED ? "allowed" : "hidden";
  },

  getRoleGate(viewer): RoleDecision | null {
    if (!MODULE_ENABLED) return null;
    return { kind: "allow", role: viewer.role };
  },

  async getHomeWidgets(_viewer): Promise<ReadonlyArray<HomeWidget>> {
    return [];
  },

  getRoutes(): ReadonlyArray<RouteEntry> {
    return [{ path: "", kind: "home", label: "Hotels" }];
  },

  async getCommandPaletteEntries(_viewer): Promise<ReadonlyArray<PaletteEntry>> {
    return [];
  },

  getNotificationCategories(): ReadonlyArray<NotificationCategory> {
    return [];
  },

  async getEmptyTeaching(_viewer): Promise<EmptyTeaching | null> {
    return {
      kicker: "Hotels",
      headline: "Premium stays, coming soon.",
      body: "A modern hospitality experience designed with premium service and clean digital flow.",
      action: { label: "Learn more", href: henryDomain("hotel") },
    };
  },

  getDeepLinkTemplate(_eventType: string): string | null {
    return null;
  },
};
