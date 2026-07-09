import { Wallet } from "lucide-react";
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
  BalanceCard,
  PendingFundingCard,
  RecentTransactionsCard,
  PayoutMethodsCard,
} from "./widgets";
import { loadWalletSnapshot } from "./data";

/**
 * The wallet module — slug `wallet`. Audit anchor §B.account-8.
 *
 * Available to every authenticated viewer using the customer surface
 * (`apps/account`) — including owners and staff who use the customer
 * surface, since every human has a wallet. The module's home view at
 * `/modules/wallet` surfaces a calm 4-widget summary (balance +
 * pending funding + recent transactions + payout methods); deep
 * clicks route to the existing top-level `/wallet`, `/wallet/funding`,
 * `/wallet/withdrawals` surfaces which remain the canonical detail
 * views.
 *
 * MODULES-01 (2026-05-23) widened the gate from `viewer.kind ===
 * "customer"` to `viewerCanUseCustomerSurface(viewer)`. Data-layer
 * gate in `data.ts` remains `kind === "customer"` because the
 * customer_wallet_transactions / customer_wallet_balance tables are
 * user-scoped customer-context tables.
 *
 * The module owns the three scoped wallet notification categories
 * (`wallet.funding`, `wallet.withdrawal`, `wallet.transaction`) — these
 * are distinct slugs from the customer-overview's general `wallet`
 * category and do not collide.
 *
 * Consumes V2-DOCS-01: the RecentTransactionsCard widget surfaces a
 * "Download statement" CTA wired to the unified branded-documents
 * endpoint at `/api/documents/wallet-statement/<userId>?download=1`.
 */
export const walletModule: DashboardModule = {
  slug: "wallet",
  title: "Wallet",
  description: "Balance, funding, transactions, payout methods.",
  icon: () => <Wallet size={18} aria-hidden />,
  railSlot: "primary",
  // The wallet's real surface is the top-level `/wallet` (the same
  // route the desktop sidebar links to). Sending the rail / mobile
  // Modules drawer / Cmd-jump straight there means tapping "Wallet"
  // opens the wallet in one tap instead of the `/modules/wallet`
  // summary, which fixes the reported "wallet never opens from the
  // mobile Modules navigator" bug.
  homeHref: "/wallet",

  getEligibleViewer(viewer) {
    return viewerCanUseCustomerSurface(viewer) ? "allowed" : "hidden";
  },

  getRoleGate(viewer): RoleDecision | null {
    if (!viewerCanUseCustomerSurface(viewer)) return null;
    return { kind: "allow", role: viewer.role };
  },

  async getHomeWidgets(viewer): Promise<ReadonlyArray<HomeWidget>> {
    const snapshot = await loadWalletSnapshot(viewer);
    if (!snapshot) return [];

    const userId = viewer.user.id;

    return [
      {
        id: "wallet.balance",
        source: "wallet",
        title: "Wallet balance",
        size: "lg",
        weight: 90,
        href: "/wallet",
        render: async () => <BalanceCard snapshot={snapshot} />,
      },
      {
        id: "wallet.pending-funding",
        source: "wallet",
        title: "Pending funding",
        size: "sm",
        weight: 70,
        href: "/wallet/funding",
        render: async () => <PendingFundingCard snapshot={snapshot} />,
      },
      {
        id: "wallet.payout-methods",
        source: "wallet",
        title: "Payout methods",
        size: "sm",
        weight: 50,
        href: "/wallet/withdrawals",
        render: async () => <PayoutMethodsCard snapshot={snapshot} />,
      },
      {
        id: "wallet.recent-transactions",
        source: "wallet",
        title: "Recent transactions",
        size: "lg",
        weight: 75,
        href: "/wallet",
        render: async () => (
          <RecentTransactionsCard snapshot={snapshot} userId={userId} />
        ),
      },
    ];
  },

  getRoutes(): ReadonlyArray<RouteEntry> {
    return [
      { path: "", kind: "home", label: "Wallet" },
      { path: "funding", kind: "detail", label: "Funding" },
      { path: "withdrawals", kind: "detail", label: "Withdrawals" },
      { path: "transactions", kind: "detail", label: "Transactions" },
      {
        path: "transactions/[transactionId]",
        kind: "detail",
        label: "Transaction detail",
        params: ["transactionId"],
      },
      { path: "statement", kind: "detail", label: "Download statement" },
    ];
  },

  async getCommandPaletteEntries(viewer): Promise<ReadonlyArray<PaletteEntry>> {
    const userId = viewer.user.id;

    return [
      {
        id: "wallet.add-money",
        source: "wallet",
        label: "Add money",
        kicker: "Wallet",
        groupLabel: "Create",
        href: "/wallet/funding",
        keywords: ["add money", "fund wallet", "top up", "deposit"],
      },
      {
        id: "wallet.withdraw",
        source: "wallet",
        label: "Withdraw",
        kicker: "Wallet",
        groupLabel: "Create",
        href: "/wallet/withdrawals",
        keywords: ["withdraw", "cash out", "transfer to bank"],
      },
      {
        id: "wallet.view-transactions",
        source: "wallet",
        label: "View transactions",
        kicker: "Wallet",
        groupLabel: "Open",
        href: "/wallet",
        keywords: ["transactions", "history", "wallet activity"],
      },
      {
        id: "wallet.download-statement",
        source: "wallet",
        label: "Download statement",
        kicker: "Wallet",
        groupLabel: "Open",
        href: `/api/documents/wallet-statement/${userId}?download=1`,
        keywords: ["statement", "download", "pdf", "ledger", "export"],
      },
    ];
  },

  getNotificationCategories(): ReadonlyArray<NotificationCategory> {
    return [
      {
        slug: "wallet.funding",
        label: "Funding",
        source: "wallet",
        deepLinkTemplate: "/wallet/funding/{{reference_id}}",
      },
      {
        slug: "wallet.withdrawal",
        label: "Withdrawals",
        source: "wallet",
        // PASS 22 issue #1 — `/wallet/withdrawals/[id]` was never mounted
        // (only the index `/wallet/withdrawals/page.tsx` exists). Land
        // notification clicks on the index until the detail surface ships.
        deepLinkTemplate: "/wallet/withdrawals",
        urgentAccent: "#C04A1F",
      },
      {
        slug: "wallet.transaction",
        label: "Transactions",
        source: "wallet",
        deepLinkTemplate: "/wallet",
      },
    ];
  },

  async getEmptyTeaching(viewer): Promise<EmptyTeaching | null> {
    const snapshot = await loadWalletSnapshot(viewer);
    if (!snapshot) {
      return {
        kicker: "Money that moves with you",
        headline: "Fund your wallet to start.",
        body: "Use one wallet to pay across Care, Marketplace, Studio, and the rest of Henry Onyx.",
        action: { label: "Fund wallet", href: "/wallet/funding" },
      };
    }
    if (
      snapshot.rawBalanceKobo === 0 &&
      snapshot.pendingFundingCount === 0 &&
      snapshot.recentTransactions.length === 0
    ) {
      return {
        kicker: "Money that moves with you",
        headline: "Fund your wallet to start.",
        body: "Add money once and pay everywhere across Henry Onyx without re-entering card details.",
        action: { label: "Fund wallet", href: "/wallet/funding" },
      };
    }
    return null;
  },

  getDeepLinkTemplate(eventType: string): string | null {
    switch (eventType) {
      case "wallet.funding_received":
      case "wallet.funding_verified":
      case "wallet.funding_pending":
        return "/wallet/funding";
      case "wallet.withdrawal_completed":
      case "wallet.withdrawal_failed":
      case "wallet.withdrawal_pending":
        return "/wallet/withdrawals";
      case "wallet.transaction_posted":
      case "wallet.balance_changed":
        return "/wallet";
      default:
        return null;
    }
  },
};
