import { LifeBuoy } from "lucide-react";
import type {
  DashboardModule,
  HomeWidget,
  PaletteEntry,
  NotificationCategory,
  RoleDecision,
  RouteEntry,
  EmptyTeaching,
} from "@henryco/dashboard-shell";

import {
  OpenRequestsPanel,
  AwaitingReplyMetric,
  EscalatedMetric,
} from "./widgets";
import { loadSupportSnapshot } from "./data";

/**
 * The support module — slug `support`. Audit anchor §B.support.
 *
 * Customer-only — the support inbox at `support_threads` is keyed to
 * `user_id`. The module's home view at `/modules/support` surfaces a
 * calm 3-widget summary (open requests panel + awaiting-reply metric +
 * escalated metric); deep clicks route to the existing `/support`
 * surfaces (`/support`, `/support/new`, `/support/[threadId]`) which
 * remain the canonical detail views.
 *
 * The module owns three scoped support notification categories
 * (`support.new_message`, `support.escalated`, `support.resolved`) —
 * distinct slugs from any other module's category.
 *
 * Staff-side support inbox sits on the workspace_support_* schema and
 * is out of scope for DASH-3 (TODO V2-DATA-02 in
 * `packages/data/src/support-summary.ts:13`).
 */
export const supportModule: DashboardModule = {
  slug: "support",
  title: "Support",
  description: "Help requests, replies, and escalations.",
  icon: () => <LifeBuoy size={18} aria-hidden />,
  railSlot: "secondary",

  getEligibleViewer(viewer) {
    return viewer.kind === "customer" ? "allowed" : "hidden";
  },

  getRoleGate(viewer): RoleDecision | null {
    if (viewer.kind !== "customer") return null;
    return { kind: "allow", role: viewer.role };
  },

  async getHomeWidgets(viewer): Promise<ReadonlyArray<HomeWidget>> {
    const snapshot = await loadSupportSnapshot(viewer);
    if (!snapshot) return [];

    return [
      {
        id: "support.open-requests",
        source: "support",
        title: "Open requests",
        size: "lg",
        weight: 88,
        href: "/support",
        render: async () => <OpenRequestsPanel snapshot={snapshot} />,
      },
      {
        id: "support.awaiting-reply",
        source: "support",
        title: "Awaiting your reply",
        size: "sm",
        weight: 80,
        href: "/support",
        render: async () => <AwaitingReplyMetric snapshot={snapshot} />,
      },
      {
        id: "support.escalated",
        source: "support",
        title: "Escalated",
        size: "sm",
        weight: 75,
        href: "/support",
        render: async () => <EscalatedMetric snapshot={snapshot} />,
      },
    ];
  },

  getRoutes(): ReadonlyArray<RouteEntry> {
    return [
      { path: "", kind: "home", label: "Support" },
      { path: "new", kind: "detail", label: "New request" },
      {
        path: "[threadId]",
        kind: "detail",
        label: "Request detail",
        params: ["threadId"],
      },
    ];
  },

  async getCommandPaletteEntries(): Promise<ReadonlyArray<PaletteEntry>> {
    return [
      {
        id: "support.create-request",
        source: "support",
        label: "Create support request",
        kicker: "Support",
        groupLabel: "Create",
        href: "/support/new",
        keywords: ["help", "support", "ticket", "issue", "report"],
      },
      {
        id: "support.view-requests",
        source: "support",
        label: "View support requests",
        kicker: "Support",
        groupLabel: "Open",
        href: "/support",
        keywords: ["support", "requests", "tickets", "history", "inbox"],
      },
      {
        id: "support.help-center",
        source: "support",
        label: "Help Center",
        kicker: "Support",
        groupLabel: "Open",
        href: "/support",
        keywords: ["help", "faq", "guide", "documentation"],
      },
    ];
  },

  getNotificationCategories(): ReadonlyArray<NotificationCategory> {
    return [
      {
        slug: "support.new_message",
        label: "Support replies",
        source: "support",
        deepLinkTemplate: "/support/{{thread_id}}",
      },
      {
        slug: "support.escalated",
        label: "Escalated requests",
        source: "support",
        deepLinkTemplate: "/support/{{thread_id}}",
        urgentAccent: "#C04A1F",
      },
      {
        slug: "support.resolved",
        label: "Resolved requests",
        source: "support",
        deepLinkTemplate: "/support/{{thread_id}}",
      },
    ];
  },

  async getEmptyTeaching(viewer): Promise<EmptyTeaching | null> {
    const snapshot = await loadSupportSnapshot(viewer);
    if (!snapshot) {
      return {
        kicker: "We're here when you need us",
        headline: "Open a request — we reply within working hours.",
        body: "Track every conversation in one place; staff get a prioritized queue automatically.",
        action: { label: "Create request", href: "/support/new" },
      };
    }
    if (!snapshot.hasAnyHistory) {
      return {
        kicker: "We're here when you need us",
        headline: "Open a request — we reply within working hours.",
        body: "Track every conversation in one place; staff get a prioritized queue automatically.",
        action: { label: "Create request", href: "/support/new" },
      };
    }
    if (snapshot.openCount === 0) {
      return {
        kicker: "Inbox clear",
        headline: "No active requests.",
        body: "Open a new request whenever you need help — every message is tracked.",
        action: { label: "Create request", href: "/support/new" },
      };
    }
    return null;
  },

  getDeepLinkTemplate(eventType: string): string | null {
    switch (eventType) {
      case "support.new_message":
      case "support.escalated":
      case "support.resolved":
        return "/support";
      default:
        return null;
    }
  },
};
