import { Palette } from "lucide-react";
import type { OwnerDashboardModule } from "@henryco/dashboard-shell/owner-register";
import type {
  PaletteEntry,
  NotificationCategory,
  RouteEntry,
} from "@henryco/dashboard-shell";

/**
 * owner-brand — Track B brand center module.
 *
 * Pages, settings, subdomains. Configure division branding, public-
 * page editorial, subdomain routing.
 */
export const ownerBrandModule: OwnerDashboardModule = {
  slug: "owner-brand",
  title: "Brand",
  description: "Pages, settings, subdomains — division branding + editorial.",
  icon: () => <Palette size={18} aria-hidden />,

  getEligibleViewer() {
    return "allowed";
  },

  getRoleGate(viewer) {
    return { kind: "allow", role: viewer.role };
  },

  getRoutes(): ReadonlyArray<RouteEntry> {
    return [
      { path: "brand", kind: "home", label: "Brand" },
      { path: "brand/pages", kind: "detail", label: "Pages" },
      { path: "brand/settings", kind: "detail", label: "Settings" },
      { path: "brand/subdomains", kind: "detail", label: "Subdomains" },
    ];
  },

  async getCommandPaletteEntries(): Promise<ReadonlyArray<PaletteEntry>> {
    return [
      {
        id: "owner-brand.home",
        source: "owner-brand",
        groupLabel: "Open" as const,
        label: "Open brand center",
        kicker: "Owner",
        href: "/owner/brand",
        keywords: ["brand", "logo", "identity"],
      },
      {
        id: "owner-brand.pages",
        source: "owner-brand",
        groupLabel: "Open" as const,
        label: "Public pages",
        kicker: "Owner",
        href: "/owner/brand/pages",
        keywords: ["pages", "public", "marketing"],
      },
      {
        id: "owner-brand.settings",
        source: "owner-brand",
        groupLabel: "Open" as const,
        label: "Brand settings",
        kicker: "Owner",
        href: "/owner/brand/settings",
        keywords: ["settings", "config"],
      },
    ];
  },

  getNotificationCategories(): ReadonlyArray<NotificationCategory> {
    return [];
  },
};
