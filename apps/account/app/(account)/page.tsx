import Link from "next/link";
import {
  Wallet,
  Activity,
  Bell,
  ArrowUpRight,
  CreditCard,
  ShoppingBag,
  Sparkles,
  Palette,
  LifeBuoy,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { requireAccountUser } from "@/lib/auth";
import { getDashboardSummary } from "@/lib/account-data";
import { formatNaira, timeAgo, divisionLabel, divisionColor } from "@/lib/format";
import PageHeader from "@/components/layout/PageHeader";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const user = await requireAccountUser();
  const data = await getDashboardSummary(user.id);

  const quickActions = [
    { href: "/wallet", label: "Add money", icon: Wallet, color: "var(--acct-green)" },
    { href: "/support", label: "Get help", icon: LifeBuoy, color: "var(--acct-blue)" },
    { href: "/care", label: "Book care", icon: Sparkles, color: "#6B7CFF" },
    { href: "/marketplace", label: "Shop", icon: ShoppingBag, color: "#B2863B" },
  ];

  return (
    <div className="space-y-6 acct-fade-in">
      {/* Welcome */}
      <PageHeader
        title={`Welcome back${user.fullName ? `, ${user.fullName.split(" ")[0]}` : ""}`}
        description="Your HenryCo command center — everything across all divisions, one place."
      />

      {/* Metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Wallet */}
        <Link href="/wallet" className="acct-metric group transition-shadow hover:shadow-lg">
          <div className="flex items-center justify-between">
            <p className="acct-kicker">Wallet Balance</p>
            <Wallet size={18} className="text-[var(--acct-green)]" />
          </div>
          <p className="mt-2 text-2xl font-bold text-[var(--acct-ink)]">
            {formatNaira(data.wallet.balance_kobo)}
          </p>
          <p className="mt-1 text-xs text-[var(--acct-muted)]">
            Ecosystem wallet &middot; Use across all divisions
          </p>
        </Link>

        {/* Notifications */}
        <Link href="/notifications" className="acct-metric group transition-shadow hover:shadow-lg">
          <div className="flex items-center justify-between">
            <p className="acct-kicker">Notifications</p>
            <Bell size={18} className="text-[var(--acct-gold)]" />
          </div>
          <p className="mt-2 text-2xl font-bold text-[var(--acct-ink)]">
            {data.unreadNotificationCount}
          </p>
          <p className="mt-1 text-xs text-[var(--acct-muted)]">
            {data.unreadNotificationCount === 0 ? "All caught up" : "Unread messages"}
          </p>
        </Link>

        {/* Subscriptions */}
        <Link href="/subscriptions" className="acct-metric group transition-shadow hover:shadow-lg">
          <div className="flex items-center justify-between">
            <p className="acct-kicker">Active Subscriptions</p>
            <TrendingUp size={18} className="text-[var(--acct-purple)]" />
          </div>
          <p className="mt-2 text-2xl font-bold text-[var(--acct-ink)]">
            {data.activeSubscriptions.length}
          </p>
          <p className="mt-1 text-xs text-[var(--acct-muted)]">
            {data.activeSubscriptions.length === 0 ? "No active plans" : "Active plans"}
          </p>
        </Link>
      </div>

      {/* Quick actions */}
      <section className="acct-card p-5">
        <p className="acct-kicker mb-3">Quick Actions</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex flex-col items-center gap-2 rounded-xl bg-[var(--acct-surface)] p-4 text-center transition-all hover:shadow-md"
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: action.color + "18", color: action.color }}
              >
                <action.icon size={20} />
              </div>
              <span className="text-xs font-semibold text-[var(--acct-ink)]">{action.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Two column layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <section className="acct-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="acct-kicker">Recent Activity</p>
            <Link
              href="/activity"
              className="flex items-center gap-1 text-xs font-medium text-[var(--acct-gold)] hover:underline"
            >
              View all <ChevronRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {data.recentActivity.length === 0 ? (
              <p className="py-6 text-center text-sm text-[var(--acct-muted)]">
                No recent activity yet
              </p>
            ) : (
              data.recentActivity.map((item: Record<string, string>) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 rounded-xl bg-[var(--acct-surface)] p-3"
                >
                  <div
                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                    style={{ backgroundColor: divisionColor(item.division) }}
                  >
                    {divisionLabel(item.division).charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--acct-ink)]">{item.title}</p>
                    <p className="mt-0.5 text-xs text-[var(--acct-muted)]">
                      {divisionLabel(item.division)} &middot; {timeAgo(item.created_at)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Recent Notifications */}
        <section className="acct-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="acct-kicker">Notifications</p>
            <Link
              href="/notifications"
              className="flex items-center gap-1 text-xs font-medium text-[var(--acct-gold)] hover:underline"
            >
              View all <ChevronRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {data.recentNotifications.length === 0 ? (
              <p className="py-6 text-center text-sm text-[var(--acct-muted)]">
                No notifications yet
              </p>
            ) : (
              data.recentNotifications.map((n: Record<string, string>) => (
                <div
                  key={n.id}
                  className={`rounded-xl p-3 ${
                    n.is_read === "false" || !n.is_read
                      ? "border border-[var(--acct-gold)]/20 bg-[var(--acct-gold-soft)]"
                      : "bg-[var(--acct-surface)]"
                  }`}
                >
                  <p className="text-sm font-medium text-[var(--acct-ink)]">{n.title}</p>
                  <p className="mt-0.5 text-xs text-[var(--acct-muted)] line-clamp-2">{n.body}</p>
                  <p className="mt-1 text-[0.65rem] text-[var(--acct-muted)]">
                    {timeAgo(n.created_at)}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Division services */}
      <section className="acct-card p-5">
        <p className="acct-kicker mb-3">Your Services</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { key: "care", label: "Care", desc: "Fabric care, cleaning & upkeep", icon: Sparkles, href: "/care" },
            { key: "marketplace", label: "Marketplace", desc: "Shop products & sell online", icon: ShoppingBag, href: "/marketplace" },
            { key: "studio", label: "Studio", desc: "Creative & design services", icon: Palette, href: "/studio" },
          ].map((svc) => (
            <Link
              key={svc.key}
              href={svc.href}
              className="flex items-center gap-4 rounded-2xl border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] p-4 transition-all hover:border-[var(--acct-gold)]/30 hover:shadow-md"
            >
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: divisionColor(svc.key) + "18",
                  color: divisionColor(svc.key),
                }}
              >
                <svc.icon size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--acct-ink)]">{svc.label}</p>
                <p className="text-xs text-[var(--acct-muted)]">{svc.desc}</p>
              </div>
              <ArrowUpRight size={16} className="shrink-0 text-[var(--acct-muted)]" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
