import Link from "next/link";
import {
  Wallet,
  Bell,
  ArrowUpRight,
  BriefcaseBusiness,
  ShoppingBag,
  Sparkles,
  Palette,
  LifeBuoy,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Receipt,
  MessageSquare,
  Gift,
} from "lucide-react";
import { parseHenryFeatureFlags } from "@henryco/intelligence";
import { RouteLiveRefresh } from "@henryco/ui";
import { requireAccountUser } from "@/lib/auth";
import { getDashboardSummary, getSupportThreads, getWalletFundingContext } from "@/lib/account-data";
import { buildAccountRecommendations, buildAccountTasks } from "@/lib/intelligence-rollout";
import { activityMessageHref } from "@/lib/notification-center";
import { formatNaira, timeAgo, divisionLabel, divisionColor } from "@/lib/format";
import { getAccountTrustProfile, getTrustTierLabel } from "@/lib/trust";
import PageHeader from "@/components/layout/PageHeader";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const flags = parseHenryFeatureFlags(process.env as Record<string, string | undefined>);
  const user = await requireAccountUser();
  const [data, funding, trust, supportThreads] = await Promise.all([
    getDashboardSummary(user.id),
    getWalletFundingContext(user.id),
    getAccountTrustProfile(user.id),
    getSupportThreads(user.id),
  ]);
  const openSupportCount = supportThreads.filter((thread: Record<string, unknown>) => {
    const status = String(thread.status || "");
    return status !== "resolved" && status !== "closed";
  }).length;

  const attention = [
    funding.pending_kobo > 0
      ? {
          label: "Pending wallet verification",
          detail: `${formatNaira(funding.pending_kobo)} is still waiting for finance confirmation.`,
          href: "/wallet/funding",
          tone: "var(--acct-blue)",
          icon: ShieldCheck,
        }
      : null,
    data.unreadNotificationCount > 0
      ? {
          label: "Unread notifications",
          detail: `${data.unreadNotificationCount} update${data.unreadNotificationCount === 1 ? "" : "s"} are still waiting for you.`,
          href: "/notifications",
          tone: "var(--acct-gold)",
          icon: Bell,
        }
      : null,
    data.activeSubscriptions.length > 0
      ? {
          label: "Active plans in motion",
          detail: `${data.activeSubscriptions.length} subscription${data.activeSubscriptions.length === 1 ? "" : "s"} are currently running.`,
          href: "/subscriptions",
          tone: "var(--acct-purple)",
          icon: TrendingUp,
        }
      : null,
    trust.nextTier
      ? {
          label: `Unlock ${getTrustTierLabel(trust.nextTier)}`,
          detail:
            trust.requirements[0] ||
            "Your next trust tier needs stronger verification and cleaner account history.",
          href: "/security",
          tone: "var(--acct-red)",
          icon: ShieldCheck,
        }
      : null,
  ].filter(Boolean) as Array<{
    label: string;
    detail: string;
    href: string;
    tone: string;
    icon: typeof Bell;
  }>;

  const quickActions = [
    { href: "/wallet", label: "Add money", icon: Wallet, color: "var(--acct-green)" },
    { href: "/support", label: "Get help", icon: LifeBuoy, color: "var(--acct-blue)" },
    { href: "/care", label: "Book care", icon: Sparkles, color: "#6B7CFF" },
    { href: "/marketplace", label: "Shop", icon: ShoppingBag, color: "#B2863B" },
  ];

  const tasks = buildAccountTasks({
    userId: user.id,
    unreadNotificationCount: data.unreadNotificationCount,
    pendingFundingKobo: funding.pending_kobo,
    openSupportCount,
    trust,
  });

  const recommendations = buildAccountRecommendations({
    trust,
    savedJobsCount: data.recentActivity.filter(
      (item: Record<string, unknown>) =>
        String(item.division || "") === "jobs" && String(item.activity_type || "").includes("saved")
    ).length,
    activeDivisionHints: data.recentActivity
      .map((item: Record<string, unknown>) => String(item.division || "").toLowerCase())
      .filter(Boolean) as Array<"account" | "care" | "marketplace" | "studio" | "jobs" | "property" | "learn" | "logistics">,
  });
  const blockingTasks = tasks.filter((task) => task.blocking);
  const highPriorityTasks = tasks.filter((task) => !task.blocking && task.priority !== "low");

  return (
    <div className="space-y-6 acct-fade-in">
      <RouteLiveRefresh />
      {/* Welcome */}
      <PageHeader
        title={`Welcome back${user.fullName ? `, ${user.fullName.split(" ")[0]}` : ""}`}
        description="Your HenryCo command center — everything across all divisions, one place."
      />

      {/* Metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
            Shared wallet &middot; Use across HenryCo services
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

        <Link href="/security" className="acct-metric group transition-shadow hover:shadow-lg">
          <div className="flex items-center justify-between">
            <p className="acct-kicker">Trust Tier</p>
            <ShieldCheck size={18} className="text-[var(--acct-blue)]" />
          </div>
          <p className="mt-2 text-xl font-bold text-[var(--acct-ink)]">
            {getTrustTierLabel(trust.tier)}
          </p>
          <p className="mt-1 text-xs text-[var(--acct-muted)]">
            Score {trust.score} · {trust.flags.jobsPostingEligible ? "Business actions unlocked" : "More verification needed"}
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
        <div className="flex flex-wrap items-center gap-3">
          <span className="acct-chip acct-chip-blue text-[0.65rem]">
            {blockingTasks.length} blocking
          </span>
          <span className="acct-chip acct-chip-gold text-[0.65rem]">
            {highPriorityTasks.length} high-priority next step{highPriorityTasks.length === 1 ? "" : "s"}
          </span>
          <span className="text-xs text-[var(--acct-muted)]">
            Your Action Center is prioritized from live trust, wallet, support, and notification signals.
          </span>
        </div>
      </section>

      {attention.length > 0 ? (
        <section className="acct-card p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="acct-kicker">What Needs Your Attention</p>
              <h2 className="mt-2 text-lg font-semibold text-[var(--acct-ink)]">
                In progress, waiting on you, or still unresolved
              </h2>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {attention.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-[1.5rem] border border-[var(--acct-line)] bg-[var(--acct-surface)] p-4 transition hover:border-[var(--acct-gold)]/30 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--acct-ink)]">{item.label}</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--acct-muted)]">{item.detail}</p>
                  </div>
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: `${item.tone}18`, color: item.tone }}
                  >
                    <item.icon size={18} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

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

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="acct-card p-5">
          <div className="mb-3">
            <p className="acct-kicker">Action Center</p>
            <p className="mt-1 text-xs text-[var(--acct-muted)]">
              Start with blocking items first, then clear high-priority steps to keep your account fully operational.
            </p>
          </div>
          <div className="space-y-3">
            {tasks.length === 0 ? (
              <p className="text-sm text-[var(--acct-muted)]">
                No urgent account tasks right now. You are in a healthy operating state.
              </p>
            ) : (
              tasks.slice(0, 5).map((task) => (
                <Link
                  key={task.id}
                  href={task.deeplinkTemplate || "/"}
                  className="block rounded-xl border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] p-3 hover:border-[var(--acct-gold)]/35"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[var(--acct-ink)]">{task.title}</p>
                    {task.blocking ? (
                      <span className="acct-chip acct-chip-red text-[0.65rem]">Blocking</span>
                    ) : (
                      <span className="acct-chip acct-chip-blue text-[0.65rem]">{task.priority}</span>
                    )}
                  </div>
                  {task.description ? (
                    <p className="mt-1 text-xs text-[var(--acct-muted)]">{task.description}</p>
                  ) : null}
                  <p className="mt-2 text-[0.65rem] uppercase tracking-[0.14em] text-[var(--acct-muted)]">
                    Source: {task.sourceDivision}
                  </p>
                </Link>
              ))
            )}
          </div>
          {tasks.length > 5 ? (
            <Link
              href="/tasks"
              className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[var(--acct-gold)] hover:underline"
            >
              View full task queue <ChevronRight size={14} />
            </Link>
          ) : null}
        </section>

        {flags.intelligence_recommendations ? (
          <section className="acct-card p-5">
            <p className="acct-kicker mb-3">Smart Recommendations</p>
            <div className="space-y-3">
              {recommendations.length === 0 ? (
                <p className="text-sm text-[var(--acct-muted)]">
                  Keep using HenryCo services and recommendations will adapt to your activity.
                </p>
              ) : (
                recommendations.map((item) => (
                  <Link
                    key={item.id}
                    href={item.ctaHref}
                    className="block rounded-xl border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] p-3 hover:border-[var(--acct-gold)]/35"
                  >
                    <p className="text-sm font-semibold text-[var(--acct-ink)]">{item.title}</p>
                    {item.description ? (
                      <p className="mt-1 text-xs text-[var(--acct-muted)]">{item.description}</p>
                    ) : null}
                    <p className="mt-2 text-[0.65rem] uppercase tracking-[0.14em] text-[var(--acct-muted)]">
                      Suggested from your account activity and trust state ({item.confidence} confidence)
                    </p>
                  </Link>
                ))
              )}
            </div>
          </section>
        ) : null}
      </div>

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
                <Link
                  key={item.id}
                  href={activityMessageHref(String(item.id || ""))}
                  className="flex items-start gap-3 rounded-xl bg-[var(--acct-surface)] p-3 transition hover:bg-[var(--acct-bg-elevated)]"
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
                </Link>
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
              data.recentNotifications.map((n: Record<string, unknown>) => (
                <Link
                  key={String(n.id)}
                  href={String((n as { message_href?: string }).message_href || "/notifications")}
                  className={`block rounded-xl p-3 transition hover:bg-[var(--acct-bg-elevated)] ${
                    !n.is_read
                      ? "border border-[var(--acct-gold)]/20 bg-[var(--acct-gold-soft)]"
                      : "bg-[var(--acct-surface)]"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="rounded-full px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em]"
                      style={{
                        backgroundColor: `${(n.source as { accent?: string })?.accent || "var(--acct-gold)"}18`,
                        color: (n.source as { accent?: string })?.accent || "var(--acct-gold)",
                      }}
                    >
                      {(n.source as { label?: string })?.label || divisionLabel(String(n.category || "account"))}
                    </span>
                    {!n.is_read ? (
                      <span className="rounded-full bg-[var(--acct-red-soft)] px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-red)]">
                        Unread
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-3 text-sm font-medium text-[var(--acct-ink)]">{String(n.title || "")}</p>
                  <p className="mt-0.5 text-xs text-[var(--acct-muted)] line-clamp-2">{String(n.body || "")}</p>
                  <p className="mt-1 text-[0.65rem] text-[var(--acct-muted)]">
                    {timeAgo(String(n.created_at || ""))}
                  </p>
                </Link>
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
            { key: "jobs", label: "Jobs", desc: "Applications, saved roles & recruiter updates", icon: BriefcaseBusiness, href: "/jobs" },
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
