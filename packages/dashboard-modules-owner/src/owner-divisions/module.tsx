import { Building2 } from "lucide-react";
import type { OwnerDashboardModule } from "@henryco/dashboard-shell/owner-register";
import type {
  PaletteEntry,
  NotificationCategory,
  RouteEntry,
} from "@henryco/dashboard-shell";

/**
 * owner-divisions — Track B division control center module.
 *
 * Cross-division metric + alert grid. The list view at /owner/divisions
 * shows each division's health card; /owner/divisions/performance is
 * the cross-division performance comparator; /owner/divisions/[slug]
 * is the per-division deep-dive.
 */
export const ownerDivisionsModule: OwnerDashboardModule = {
  slug: "owner-divisions",
  title: "Divisions",
  description: "Cross-division control center — health, alerts, performance comparators, deep-dive.",
  icon: () => <Building2 size={18} aria-hidden />,

  getEligibleViewer() {
    return "allowed";
  },

  getRoleGate(viewer) {
    return { kind: "allow", role: viewer.role };
  },

  getRoutes(): ReadonlyArray<RouteEntry> {
    return [
      { path: "divisions", kind: "home", label: "Divisions" },
      { path: "divisions/performance", kind: "detail", label: "Performance" },
      { path: "divisions/:slug", kind: "detail", label: "Division", params: ["slug"] },
    ];
  },

  async getCommandPaletteEntries(): Promise<ReadonlyArray<PaletteEntry>> {
    return [
      {
        id: "owner-divisions.home",
        source: "owner-divisions",
        groupLabel: "Open" as const,
        label: "Open division control center",
        kicker: "Owner",
        href: "/owner/divisions",
        keywords: ["divisions", "control", "health"],
      },
      {
        id: "owner-divisions.performance",
        source: "owner-divisions",
        groupLabel: "Open" as const,
        label: "Cross-division performance",
        kicker: "Owner",
        href: "/owner/divisions/performance",
        keywords: ["performance", "comparator", "kpi"],
      },
    ];
  },

  getNotificationCategories(): ReadonlyArray<NotificationCategory> {
    return [
      { slug: "owner.division-alert", label: "Division alerts", accent: "#B91C1C", source: "owner-divisions" },
    ];
  },
};
