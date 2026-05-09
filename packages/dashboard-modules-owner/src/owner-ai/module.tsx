import { Bot } from "lucide-react";
import type { OwnerDashboardModule } from "@henryco/dashboard-shell/owner-register";
import type {
  PaletteEntry,
  NotificationCategory,
  RouteEntry,
} from "@henryco/dashboard-shell";

/**
 * owner-ai — Track B AI insights / signals module.
 *
 * Feature-flagged. The actual insights logic stays in
 * `apps/hub/app/owner/(command)/ai/*` — the module here just registers
 * the surface so the rail + palette + notifications can route to it.
 *
 * AI agents proper are V3 — DASH-8 explicitly forbids building AI
 * agents in Track B. This module is the read-only insights view.
 */
export const ownerAiModule: OwnerDashboardModule = {
  slug: "owner-ai",
  title: "AI insights",
  description: "Owner helper layer — read-only signals + insights. AI agents are V3 (separate pass).",
  icon: () => <Bot size={18} aria-hidden />,

  getEligibleViewer() {
    return "allowed";
  },

  getRoleGate(viewer) {
    return { kind: "allow", role: viewer.role };
  },

  getRoutes(): ReadonlyArray<RouteEntry> {
    return [
      { path: "ai", kind: "home", label: "AI insights" },
      { path: "ai/insights", kind: "detail", label: "Insights" },
      { path: "ai/signals", kind: "detail", label: "Signals" },
    ];
  },

  async getCommandPaletteEntries(): Promise<ReadonlyArray<PaletteEntry>> {
    return [
      {
        id: "owner-ai.home",
        source: "owner-ai",
        groupLabel: "Open" as const,
        label: "Open AI insights",
        kicker: "Owner",
        href: "/owner/ai",
        keywords: ["ai", "insights", "helper"],
      },
      {
        id: "owner-ai.signals",
        source: "owner-ai",
        groupLabel: "Open" as const,
        label: "Owner signals",
        kicker: "Owner",
        href: "/owner/ai/signals",
        keywords: ["signals", "ai"],
      },
    ];
  },

  getNotificationCategories(): ReadonlyArray<NotificationCategory> {
    return [];
  },
};
