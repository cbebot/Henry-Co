import { Building2 } from "lucide-react";
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
 * Building module — slug `building`. Audit anchor §A.0.2
 * (`packages/config/company.ts:128-150`).
 *
 * HIDDEN UNTIL V3 LAUNCH. The Building division is registered in
 * `COMPANY.divisions` with full nav config but no apps/. This module
 * registers the slot in the shell so when the division ships, flipping
 * `MODULE_ENABLED` to true and adjusting the gate logic exposes the
 * module's empty-state widgets in the rail without further plumbing.
 *
 * Extensibility test: change `MODULE_ENABLED` to true, redeploy a
 * preview branch, and confirm the rail shows the Building entry with
 * "Nothing to show yet." inside the catch-all router. No real data is
 * surfaced because `getHomeWidgets` returns [] until the division
 * builds out its widget set.
 *
 * If `@henryco/intelligence` later ships a feature-flag API, this
 * constant is the migration target — replace with `flagEnabled(viewer,
 * "building.module")`.
 */
const MODULE_ENABLED = false;

export const buildingModule: DashboardModule = {
  slug: "building",
  title: "Building",
  description: "Construction and project delivery — coming soon.",
  icon: () => <Building2 size={18} aria-hidden />,
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
    return [{ path: "", kind: "home", label: "Building" }];
  },

  async getCommandPaletteEntries(_viewer): Promise<ReadonlyArray<PaletteEntry>> {
    return [];
  },

  getNotificationCategories(): ReadonlyArray<NotificationCategory> {
    return [];
  },

  async getEmptyTeaching(_viewer): Promise<EmptyTeaching | null> {
    return {
      kicker: "Building",
      headline: "Construction and project delivery, coming soon.",
      body: "Modern construction, delivery, and project confidence under the Henry Onyx standard.",
      action: { label: "Learn more", href: henryDomain("building") },
    };
  },

  getDeepLinkTemplate(_eventType: string): string | null {
    return null;
  },
};
