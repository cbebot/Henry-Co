/**
 * Customer-overview widgets barrel.
 *
 * Each widget is a presentation-only React component that takes a
 * pre-fetched `CustomerOverviewSnapshot` and renders one MetricCard
 * or Panel from `@henryco/dashboard-shell`. The module manifest
 * (`../module.ts`) wires each widget into a `HomeWidget` entry the
 * shell's home grid renders.
 */

export { WalletBalanceCard } from "./wallet-balance-card";
export { UnreadNotificationsCard } from "./unread-notifications-card";
export { ActiveSubscriptionsCard } from "./active-subscriptions-card";
export { TrustTierCard } from "./trust-tier-card";
export { InvoicesPendingCard } from "./invoices-pending-card";
export { SupportOpenCard } from "./support-open-card";
export { ReferralsCard } from "./referrals-card";
export { LifecycleContinueWidget } from "./lifecycle-continue-widget";
export { WelcomeBackWidget } from "./welcome-back-widget";
