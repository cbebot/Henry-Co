import { MessagesSquare } from "lucide-react";
import type { OwnerDashboardModule } from "@henryco/dashboard-shell/owner-register";
import type {
  PaletteEntry,
  NotificationCategory,
  RouteEntry,
} from "@henryco/dashboard-shell";

/**
 * owner-messaging — Track B messaging center module.
 *
 * Alerts, queues, internal team chat. The team chat surface mounts
 * the existing 1223-line `apps/hub/components/owner/InternalTeamCommsClient.tsx`
 * unchanged — V2-COMPOSER-02 is a separate pass and DASH-8 leaves it
 * untouched (master §9 + DASH-8 prompt explicit forbidding).
 */
export const ownerMessagingModule: OwnerDashboardModule = {
  slug: "owner-messaging",
  title: "Messaging",
  description: "Alerts, outbound queues, internal team chat — operator-grade comms.",
  icon: () => <MessagesSquare size={18} aria-hidden />,

  getEligibleViewer() {
    return "allowed";
  },

  getRoleGate(viewer) {
    return { kind: "allow", role: viewer.role };
  },

  getRoutes(): ReadonlyArray<RouteEntry> {
    return [
      { path: "messaging", kind: "home", label: "Messaging" },
      { path: "messaging/alerts", kind: "detail", label: "Alerts" },
      { path: "messaging/queues", kind: "detail", label: "Queues" },
      { path: "messaging/team", kind: "detail", label: "Team chat" },
    ];
  },

  async getCommandPaletteEntries(): Promise<ReadonlyArray<PaletteEntry>> {
    return [
      {
        id: "owner-messaging.home",
        source: "owner-messaging",
        groupLabel: "Open" as const,
        label: "Open messaging center",
        kicker: "Owner",
        href: "/owner/messaging",
        keywords: ["messaging", "alerts", "queues"],
      },
      {
        id: "owner-messaging.team",
        source: "owner-messaging",
        groupLabel: "Open" as const,
        label: "Team chat",
        kicker: "Owner",
        href: "/owner/messaging/team",
        keywords: ["team", "chat", "internal"],
      },
      {
        id: "owner-messaging.queues",
        source: "owner-messaging",
        groupLabel: "Open" as const,
        label: "Outbound queues",
        kicker: "Owner",
        href: "/owner/messaging/queues",
        keywords: ["queues", "outbound", "delivery"],
      },
    ];
  },

  getNotificationCategories(): ReadonlyArray<NotificationCategory> {
    return [
      { slug: "owner.messaging-alert", label: "Messaging alerts", accent: "#C9A227", source: "owner-messaging" },
    ];
  },
};
