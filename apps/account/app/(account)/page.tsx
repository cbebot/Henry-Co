import Link from "next/link";
import {
  Wallet,
  Bell,
  ArrowUpRight,
  ShoppingBag,
  Sparkles,
  Palette,
  LifeBuoy,
  ChevronRight,
  TrendingUp,
  ExternalLink,
  Receipt,
  MessageSquare,
  Gift,
} from "lucide-react";
import { requireAccountUser } from "@/lib/auth";
import { getDashboardSummary } from "@/lib/account-data";
import { divisionLabel, divisionColor, formatNaira, timeAgo } from "@/lib/format";
import { isExternalHref } from "@/lib/account-links";
import PageHeader from "@/components/layout/PageHeader";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const user = await requireAccountUser();
  const data = await getDashboardSummary(user.id);
  const subscriptionHref =
    data.activeSubscriptions.length === 1
      ? `/subscriptions/${data.activeSubscriptions[0]?.id}`
      : "/subscriptions";

  const quickActions = [
    { href: "/wallet", label: "Add money", icon: Wallet, color: "var(--acct-green)" },
    { href: "/support", label: "Get help", icon: LifeBuoy, color: "var(--acct-blue)" },
    { href: "/care", label: "Open care", icon: Sparkles, color: "#6B7CFF" },
    { href: "/marketplace", label: "Shop", icon: ShoppingBag, color: "#B2863B" },
  ];

  return (
    <div className="space-y-6 acct-fade-in">
      <PageHeader
        title={`Welcome back${user.fullName ? `, ${user.fullName.split(" ")[0]}` : ""}`}
        description="Your HenryCo command center — everything across all divisions, one place."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/wallet" className="acct-metric group transition-shadow hover:shadow-lg">
          <div className="flex items-center justify-between">
            <p className="acct-kicker">Wallet Balance</p>
            <Wallet size={18} className="text-[var(--acct-green)]" />
          </div>
          <p className="mt-2 text-2xl font-bold text-[var(--acct-ink)]">{formatNaira(data.wallet.balance_kobo)}</p>
          <p className="mt-1 text-xs text-[var(--acct-muted)]">Ecosystem wallet · Use across all divisions</p>
        </Link>

        <Link href="/notifications" className="acct-metric group transition-shadow hover:shadow-lg">
          <div className="flex items-center justify-between">
            <p className="acct-kicker">Notifications</p>
            <Bell size={18} className="text-[var(--acct-gold)]" />
          </div>
          <p className="mt-2 text-2xl font-bold text-[var(--acct-ink)]">{data.unreadNotificationCount}</p>
          <p className="mt-1 text-xs text-[var(--acct-muted)]">{data.unreadNotificationCount === 0 ? "All caught up" : "Unread messages"}</p>
        </Link>

        <Link href={subscriptionHref} className="acct-metric group transition-shadow hover:shadow-lg">
          <div className="flex items-center justify-between">
            <p className="acct-kicker">Active Subscriptions</p>
            <TrendingUp size={18} className="text-[var(--acct-purple)]" />
          </div>
          <p className="mt-2 text-2xl font-bold text-[var(--acct-ink)]">{data.activeSubscriptions.length}</p>
          <p className="mt-1 text-xs text-[var(--acct-muted)]">
            {data.activeSubscriptions.length === 0
              ? "No synced plans yet"
              : data.activeSubscriptions.length === 1
                ? "Open your live plan"
                : "Open all active plans"}
          </p>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/invoices" className="acct-metric group transition-shadow hover:shadow-lg">
          <div className="flex items-center justify-between">
            <p className="acct-kicker">Invoices</p>
            <Receipt size={18} className="text-[var(--acct-orange)]" />
          </div>
          <p className="mt-2 text-2xl font-bold text-[var(--acct-ink)]">{data.recentInvoices.length}</p>
          <p className="mt-1 text-xs text-[var(--acct-muted)]">
            {data.pendingInvoiceCount > 0 ? `${data.pendingInvoiceCount} pending` : "All settled"}
          </p>
        </Link>

        <Link href="/support" className="acct-metric group transition-shadow hover:shadow-lg">
          <div className="flex items-center justify-between">
            <p className="acct-kicker">Support</p>
            <MessageSquare size={18} className="text-[var(--acct-blue)]" />
          </div>
          <p className="mt-2 text-2xl font-bold text-[var(--acct-ink)]">{data.openSupportCount}</p>
          <p className="mt-1 text-xs text-[var(--acct-muted)]">
            {data.unreadSupportCount > 0
              ? `${data.unreadSupportCount} with new replies`
              : data.openSupportCount > 0
                ? "Open requests"
                : "No open requests"}
          </p>
        </Link>

        <Link href="/referrals" className="acct-metric group transition-shadow hover:shadow-lg">
          <div className="flex items-center justify-between">
            <p className="acct-kicker">Referrals</p>
            <Gift size={18} className="text-[var(--acct-green)]" />
          </div>
          <p className="mt-2 text-lg font-bold text-[var(--acct-ink)]">Invite & earn</p>
          <p className="mt-1 text-xs text-[var(--acct-muted)]">Share HenryCo with others</p>
        </Link>

        <Link href="/wallet" className="acct-metric group transition-shadow hover:shadow-lg">
          <div className="flex items-center justify-between">
            <p className="acct-kicker">Transactions</p>
            <Wallet size={18} className="text-[var(--acct-green)]" />
          </div>
          <p className="mt-2 text-lg font-bold text-[var(--acct-ink)]">View history</p>
          <p className="mt-1 text-xs text-[var(--acct-muted)]">Wallet activity & payments</p>
        </Link>
      </div>

      <section className="acct-card p-5">
        <p className="acct-kicker mb-3">Quick Actions</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href} className="flex flex-col items-center gap-2 rounded-xl bg-[var(--acct-surface)] p-4 text-center transition-all hover:shadow-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${action.color}18`, color: action.color }}>
                <action.icon size={20} />
              </div>
              <span className="text-xs font-semibold text-[var(--acct-ink)]">{action.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="acct-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="acct-kicker">Recent Activity</p>
            <Link href="/activity" className="flex items-center gap-1 text-xs font-medium text-[var(--acct-gold)] hover:underline">View all <ChevronRight size={14} /></Link>
          </div>
          <div className="space-y-3">
            {data.recentActivity.length === 0 ? (
              <p className="py-6 text-center text-sm text-[var(--acct-muted)]">No recent activity yet</p>
            ) : (
                  data.recentActivity.map((item: Record<string, unknown>) => {
                    const href = String(item.action_url || "").trim();
                    const itemKey = String(item.id || `${item.title || "activity"}-${item.created_at || ""}`);
                    const content = (
                  <>
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white" style={{ backgroundColor: divisionColor(String(item.division || "")) }}>
                      {divisionLabel(String(item.division || "general")).charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--acct-ink)]">{String(item.title || "Activity")}</p>
                      <p className="mt-0.5 text-xs text-[var(--acct-muted)]">{divisionLabel(String(item.division || "general"))} · {timeAgo(String(item.created_at || new Date().toISOString()))}</p>
                    </div>
                    {href ? (isExternalHref(href) ? <ExternalLink size={15} className="shrink-0 text-[var(--acct-muted)]" /> : <ArrowUpRight size={15} className="shrink-0 text-[var(--acct-muted)]" />) : null}
                  </>
                );
                    if (!href) return <div key={itemKey} className="flex items-start gap-3 rounded-xl bg-[var(--acct-surface)] p-3">{content}</div>;
                    return isExternalHref(href) ? (
                      <a key={itemKey} href={href} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 rounded-xl bg-[var(--acct-surface)] p-3 transition-colors hover:bg-[var(--acct-line)]">{content}</a>
                    ) : (
                      <Link key={itemKey} href={href} className="flex items-start gap-3 rounded-xl bg-[var(--acct-surface)] p-3 transition-colors hover:bg-[var(--acct-line)]">{content}</Link>
                    );
                  })
            )}
          </div>
        </section>

        <section className="acct-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="acct-kicker">Notifications</p>
            <Link href="/notifications" className="flex items-center gap-1 text-xs font-medium text-[var(--acct-gold)] hover:underline">View all <ChevronRight size={14} /></Link>
          </div>
          <div className="space-y-3">
            {data.recentNotifications.length === 0 ? (
              <p className="py-6 text-center text-sm text-[var(--acct-muted)]">No notifications yet</p>
            ) : (
                  data.recentNotifications.map((notification: Record<string, unknown>) => {
                    const href = String(notification.action_url || "").trim();
                    const itemKey = String(
                      notification.id || `${notification.title || "notification"}-${notification.created_at || ""}`
                    );
                    const content = (
                  <>
                    <p className="text-sm font-medium text-[var(--acct-ink)]">{String(notification.title || "Notification")}</p>
                    <p className="mt-0.5 text-xs text-[var(--acct-muted)] line-clamp-2">{String(notification.body || "")}</p>
                    <p className="mt-1 text-[0.65rem] text-[var(--acct-muted)]">{timeAgo(String(notification.created_at || new Date().toISOString()))}</p>
                  </>
                );
                const classes = `rounded-xl p-3 ${notification.is_read !== true ? "border border-[var(--acct-gold)]/20 bg-[var(--acct-gold-soft)]" : "bg-[var(--acct-surface)]"}`;
                    if (!href) return <div key={itemKey} className={classes}>{content}</div>;
                    return isExternalHref(href) ? (
                      <a key={itemKey} href={href} target="_blank" rel="noopener noreferrer" className={`${classes} block transition-colors hover:bg-[var(--acct-line)]`}>{content}</a>
                    ) : (
                      <Link key={itemKey} href={href} className={`${classes} block transition-colors hover:bg-[var(--acct-line)]`}>{content}</Link>
                    );
                  })
            )}
          </div>
        </section>
      </div>

      <section className="acct-card p-5">
        <p className="acct-kicker mb-3">Your Services</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { key: "care", label: "Care", desc: "Fabric care, cleaning & upkeep", icon: Sparkles, href: "/care" },
            { key: "marketplace", label: "Marketplace", desc: "Shop products & sell online", icon: ShoppingBag, href: "/marketplace" },
            { key: "studio", label: "Studio", desc: "Creative & design services", icon: Palette, href: "/studio" },
          ].map((service) => (
            <Link key={service.key} href={service.href} className="flex items-center gap-4 rounded-2xl border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] p-4 transition-all hover:border-[var(--acct-gold)]/30 hover:shadow-md">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${divisionColor(service.key)}18`, color: divisionColor(service.key) }}>
                <service.icon size={22} />
              </div>
              <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-[var(--acct-ink)]">{service.label}</p><p className="text-xs text-[var(--acct-muted)]">{service.desc}</p></div>
              <ArrowUpRight size={16} className="shrink-0 text-[var(--acct-muted)]" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
