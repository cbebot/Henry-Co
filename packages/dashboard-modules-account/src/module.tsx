import { LayoutDashboard } from "lucide-react";
import type { UnifiedViewer } from "@henryco/auth";
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
  WalletBalanceCard,
  UnreadNotificationsCard,
  ActiveSubscriptionsCard,
  TrustTierCard,
  InvoicesPendingCard,
  SupportOpenCard,
  ReferralsCard,
  LifecycleContinueWidget,
  WelcomeBackWidget,
} from "./widgets";
import { loadCustomerOverviewSnapshot } from "./data";

/**
 * The customer-overview module — slug `customer-overview`.
 *
 * The first reference module DASH-2 ships. Validates the module
 * registry contract end-to-end on the audit's strongest existing
 * surface (§B.account-1 through §B.account-12). The module owns the
 * five customer-side notification categories: account, wallet,
 * security, identity, referral.
 *
 * Eligibility: every `viewer.kind === "customer"` is allowed; staff
 * and owner viewers see the customer-overview only when the
 * preference cookie places them in the customer lane (handled
 * upstream by `@henryco/auth`'s `loadDashboardOptions`). At the
 * module gate, we accept any role — the upstream resolver is the
 * security boundary, not the module.
 */
export const customerOverviewModule: DashboardModule = {
  slug: "customer-overview",
  title: "Overview",
  description: "Wallet, notifications, subscriptions, trust, support — the calm summary of your account.",
  icon: () => <LayoutDashboard size={18} aria-hidden />,
  railSlot: "primary",

  getEligibleViewer(viewer) {
    return viewer.kind === "customer" ? "allowed" : "hidden";
  },

  getRoleGate(viewer): RoleDecision | null {
    if (viewer.kind !== "customer") return null;
    return { kind: "allow", role: viewer.role };
  },

  async getHomeWidgets(viewer): Promise<ReadonlyArray<HomeWidget>> {
    const snapshot = await loadCustomerOverviewSnapshot(viewer);
    if (!snapshot) return [];

    const firstName = viewer.user.fullName?.split(" ")[0] ?? null;

    const cards: HomeWidget[] = [
      {
        id: "wallet-balance",
        source: "customer-overview",
        title: "Wallet balance",
        size: "sm",
        weight: 80,
        href: "/wallet",
        render: async () => <WalletBalanceCard snapshot={snapshot} />,
      },
      {
        id: "unread-notifications",
        source: "customer-overview",
        title: "Notifications",
        size: "sm",
        weight: 75,
        href: "/notifications",
        render: async () => <UnreadNotificationsCard snapshot={snapshot} />,
      },
      {
        id: "active-subscriptions",
        source: "customer-overview",
        title: "Active subscriptions",
        size: "sm",
        weight: 60,
        href: "/subscriptions",
        render: async () => <ActiveSubscriptionsCard snapshot={snapshot} />,
      },
      {
        id: "trust-tier",
        source: "customer-overview",
        title: "Trust tier",
        size: "sm",
        weight: 65,
        href: "/security",
        render: async () => <TrustTierCard snapshot={snapshot} />,
      },
      {
        id: "invoices-pending",
        source: "customer-overview",
        title: "Invoices",
        size: "sm",
        weight: 55,
        href: "/invoices",
        render: async () => <InvoicesPendingCard snapshot={snapshot} />,
      },
      {
        id: "support-open",
        source: "customer-overview",
        title: "Support",
        size: "sm",
        weight: 70,
        href: "/support",
        render: async () => <SupportOpenCard snapshot={snapshot} />,
      },
      {
        id: "referrals",
        source: "customer-overview",
        title: "Referrals",
        size: "sm",
        weight: 30,
        href: "/referrals",
        render: async () => <ReferralsCard />,
      },
      {
        id: "lifecycle-continue",
        source: "customer-overview",
        title: "Pick up",
        size: "md",
        weight: 50,
        href: "/activity",
        render: async () => (
          <LifecycleContinueWidget headline={null} href={null} />
        ),
      },
      {
        id: "welcome-back",
        source: "customer-overview",
        title: "Welcome back",
        size: "lg",
        weight: 85,
        // PASS 22 issue #1 — `/saved` was a dead route; the canonical
        // saved-items surface in apps/account is `/saved-items`.
        href: "/saved-items",
        render: async () => (
          <WelcomeBackWidget
            snapshot={snapshot}
            hasCartRecovery={false}
            firstName={firstName}
          />
        ),
      },
    ];

    return cards;
  },

  getRoutes(): ReadonlyArray<RouteEntry> {
    return [
      { path: "", kind: "home", label: "Overview" },
      { path: "wallet", kind: "detail", label: "Wallet" },
      { path: "notifications", kind: "detail", label: "Notifications" },
      { path: "subscriptions", kind: "detail", label: "Subscriptions" },
      { path: "invoices", kind: "detail", label: "Invoices" },
      { path: "support", kind: "detail", label: "Support" },
      { path: "referrals", kind: "detail", label: "Referrals" },
      { path: "settings", kind: "detail", label: "Settings" },
      {
        path: "notifications/recently-deleted",
        kind: "detail",
        label: "Recently deleted",
      },
    ];
  },

  async getCommandPaletteEntries(_viewer): Promise<ReadonlyArray<PaletteEntry>> {
    return [
      {
        id: "co.add-money",
        source: "customer-overview",
        label: "Add money",
        kicker: "Wallet",
        groupLabel: "Create",
        href: "/wallet/add",
        keywords: ["add money", "fund wallet", "top up"],
      },
      {
        id: "co.get-help",
        source: "customer-overview",
        label: "Get help",
        kicker: "Support",
        groupLabel: "Open",
        href: "/support/new",
        keywords: ["get help", "support", "contact", "ticket"],
      },
      {
        id: "co.view-invoices",
        source: "customer-overview",
        label: "View invoices",
        kicker: "Documents",
        groupLabel: "Open",
        href: "/invoices",
        keywords: ["invoices", "receipts", "billing"],
      },
      {
        id: "co.update-profile",
        source: "customer-overview",
        label: "Update profile",
        kicker: "Settings",
        groupLabel: "Settings",
        href: "/settings",
        keywords: ["profile", "settings", "account preferences"],
      },
      {
        id: "co.recently-deleted",
        source: "customer-overview",
        label: "Open recently deleted",
        kicker: "Notifications",
        groupLabel: "Open",
        href: "/notifications/recently-deleted",
        keywords: ["recently deleted", "trash", "restore notifications"],
      },
    ];
  },

  getNotificationCategories(): ReadonlyArray<NotificationCategory> {
    return [
      {
        slug: "account",
        label: "Account",
        source: "customer-overview",
        deepLinkTemplate: "/messages/notification/{{notification_id}}",
      },
      {
        slug: "wallet",
        label: "Wallet",
        source: "customer-overview",
        deepLinkTemplate: "/wallet",
      },
      {
        slug: "security",
        label: "Security",
        source: "customer-overview",
        deepLinkTemplate: "/security",
        urgentAccent: "#B91C1C",
      },
      {
        slug: "identity",
        label: "Identity",
        source: "customer-overview",
        deepLinkTemplate: "/verification",
      },
      {
        slug: "referral",
        label: "Referrals",
        source: "customer-overview",
        deepLinkTemplate: "/referrals",
      },
    ];
  },

  async getEmptyTeaching(viewer): Promise<EmptyTeaching | null> {
    const snapshot = await loadCustomerOverviewSnapshot(viewer);
    if (!snapshot) {
      return {
        kicker: "Your overview",
        headline: "Welcome — your activity will surface here.",
        body: "Add a wallet balance or open your first booking to start the live summary.",
        action: { label: "Add money", href: "/wallet/add" },
      };
    }
    if (snapshot.summary.unreadNotificationCount === 0 && snapshot.summary.openSupportCount === 0) {
      return {
        kicker: "Your overview",
        headline: "All caught up.",
        body: "When new activity lands, it appears here automatically.",
        action: { label: "Browse marketplace", href: "/marketplace" },
      };
    }
    return null;
  },

  getDeepLinkTemplate(eventType: string): string | null {
    switch (eventType) {
      case "account.profile_updated":
      case "account.preference_changed":
        return "/settings";
      case "wallet.funding_received":
      case "wallet.withdrawal_completed":
        return "/wallet";
      case "security.sign_in":
      case "security.session_revoked":
        return "/security";
      case "identity.verification_approved":
      case "identity.verification_rejected":
        return "/verification";
      case "referral.invite_redeemed":
        return "/referrals";
      default:
        return null;
    }
  },
};
