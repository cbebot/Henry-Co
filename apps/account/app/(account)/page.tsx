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
import { formatAccountTemplate, getAccountCopy, translateSurfaceLabel } from "@henryco/i18n/server";
import { RouteLiveRefresh } from "@henryco/ui";
import { requireAccountUser } from "@/lib/auth";
import { getDashboardSummary, getSupportThreads, getWalletFundingContext } from "@/lib/account-data";
import { buildAccountRecommendations, buildAccountTasks } from "@/lib/intelligence-rollout";
import { activityMessageHref } from "@/lib/notification-center";
import { formatNaira, timeAgoLocalized, divisionLabel, divisionColor } from "@/lib/format";
import { getAccountTrustProfile } from "@/lib/trust";
import {
  getLocalizedTrustRequirements,
  getLocalizedTrustTierLabel,
  localizeAccountRecommendation,
  localizeAccountTask,
} from "@/lib/account-localization";
import { getAccountAppLocale } from "@/lib/locale-server";
import PageHeader from "@/components/layout/PageHeader";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const flags = parseHenryFeatureFlags(process.env as Record<string, string | undefined>);
  const [locale, user] = await Promise.all([getAccountAppLocale(), requireAccountUser()]);
  const copy = getAccountCopy(locale);
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
  const trustRequirements = getLocalizedTrustRequirements(copy, trust);

  const attention = [
    funding.pending_kobo > 0
      ? {
          label: copy.overview.pendingWalletVerification,
          detail: copy.overview.pendingWalletVerificationDetail,
          href: "/wallet/funding",
          tone: "var(--acct-blue)",
          icon: ShieldCheck,
        }
      : null,
    data.unreadNotificationCount > 0
      ? {
          label: copy.overview.unreadNotificationsAttention,
          detail: copy.overview.unreadNotificationsAttentionDetail,
          href: "/notifications",
          tone: "var(--acct-gold)",
          icon: Bell,
        }
      : null,
    data.activeSubscriptions.length > 0
      ? {
          label: copy.overview.activePlansInMotion,
          detail: copy.overview.activePlansInMotionDetail,
          href: "/subscriptions",
          tone: "var(--acct-purple)",
          icon: TrendingUp,
        }
      : null,
    trust.nextTier
      ? {
          label: formatAccountTemplate(copy.overview.unlockTier, {
            tier: getLocalizedTrustTierLabel(copy, trust.nextTier),
          }),
          detail: trustRequirements[0] || copy.overview.nextTierFallback,
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
    { href: "/wallet", label: copy.overview.addMoney, icon: Wallet, color: "var(--acct-green)" },
    { href: "/support", label: copy.overview.getHelp, icon: LifeBuoy, color: "var(--acct-blue)" },
    { href: "/care", label: copy.overview.bookCare, icon: Sparkles, color: "#6B7CFF" },
    { href: "/marketplace", label: copy.overview.shop, icon: ShoppingBag, color: "#B2863B" },
  ];

  const tasks = buildAccountTasks({
    userId: user.id,
    unreadNotificationCount: data.unreadNotificationCount,
    pendingFundingKobo: funding.pending_kobo,
    openSupportCount,
    trust,
  }).map((task) => localizeAccountTask(copy, task, trustRequirements));

  const recommendations = buildAccountRecommendations({
    trust,
    savedJobsCount: data.recentActivity.filter(
      (item: Record<string, unknown>) =>
        String(item.division || "") === "jobs" && String(item.activity_type || "").includes("saved")
    ).length,
    activeDivisionHints: data.recentActivity
      .map((item: Record<string, unknown>) => String(item.division || "").toLowerCase())
      .filter(Boolean) as Array<"account" | "care" | "marketplace" | "studio" | "jobs" | "property" | "learn" | "logistics">,
  }).map((item) => localizeAccountRecommendation(copy, item));
  const blockingTasks = tasks.filter((task) => task.blocking);
  const highPriorityTasks = tasks.filter((task) => !task.blocking && task.priority !== "low");

  return (
    <div className="space-y-6 acct-fade-in">
      <RouteLiveRefresh />
      {/* Welcome */}
      <PageHeader
        title={`${copy.overview.welcomeBack}${user.fullName ? `, ${user.fullName.split(" ")[0]}` : ""}`}
        description={copy.overview.description}
      />

      {/* Metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Wallet */}
        <Link href="/wallet" className="acct-metric group transition-shadow hover:shadow-lg">
          <div className="flex items-center justify-between">
            <p className="acct-kicker">{copy.overview.walletBalance}</p>
            <Wallet size={18} className="text-[var(--acct-green)]" />
          </div>
          <p className="mt-2 text-2xl font-bold text-[var(--acct-ink)]">
            {formatNaira(data.wallet.balance_kobo)}
          </p>
          <p className="mt-1 text-xs text-[var(--acct-muted)]">
            {copy.overview.walletHint}
          </p>
        </Link>

        {/* Notifications */}
        <Link href="/notifications" className="acct-metric group transition-shadow hover:shadow-lg">
          <div className="flex items-center justify-between">
            <p className="acct-kicker">{copy.overview.notifications}</p>
            <Bell size={18} className="text-[var(--acct-gold)]" />
          </div>
          <p className="mt-2 text-2xl font-bold text-[var(--acct-ink)]">
            {data.unreadNotificationCount}
          </p>
          <p className="mt-1 text-xs text-[var(--acct-muted)]">
            {data.unreadNotificationCount === 0 ? copy.overview.allCaughtUp : copy.overview.unreadMessages}
          </p>
        </Link>

        {/* Subscriptions */}
        <Link href="/subscriptions" className="acct-metric group transition-shadow hover:shadow-lg">
          <div className="flex items-center justify-between">
            <p className="acct-kicker">{copy.overview.activeSubscriptions}</p>
            <TrendingUp size={18} className="text-[var(--acct-purple)]" />
          </div>
          <p className="mt-2 text-2xl font-bold text-[var(--acct-ink)]">
            {data.activeSubscriptions.length}
          </p>
          <p className="mt-1 text-xs text-[var(--acct-muted)]">
            {data.activeSubscriptions.length === 0 ? copy.overview.noActivePlans : copy.overview.syncedPlans}
          </p>
        </Link>

        <Link href="/security" className="acct-metric group transition-shadow hover:shadow-lg">
          <div className="flex items-center justify-between">
            <p className="acct-kicker">{copy.overview.trustTier}</p>
            <ShieldCheck size={18} className="text-[var(--acct-blue)]" />
          </div>
          <p className="mt-2 text-xl font-bold text-[var(--acct-ink)]">
            {getLocalizedTrustTierLabel(copy, trust.tier)}
          </p>
          <p className="mt-1 text-xs text-[var(--acct-muted)]">
            {copy.overview.scoreLabel} {trust.score} · {trust.flags.jobsPostingEligible ? copy.overview.businessActionsUnlocked : copy.overview.moreVerificationNeeded}
          </p>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/invoices" className="acct-metric group transition-shadow hover:shadow-lg">
          <div className="flex items-center justify-between">
            <p className="acct-kicker">{copy.overview.invoices}</p>
            <Receipt size={18} className="text-[var(--acct-orange)]" />
          </div>
          <p className="mt-2 text-2xl font-bold text-[var(--acct-ink)]">{data.recentInvoices.length}</p>
          <p className="mt-1 text-xs text-[var(--acct-muted)]">
            {data.pendingInvoiceCount > 0 ? `${data.pendingInvoiceCount} ${copy.overview.pending}` : copy.overview.allSettled}
          </p>
        </Link>

        <Link href="/support" className="acct-metric group transition-shadow hover:shadow-lg">
          <div className="flex items-center justify-between">
            <p className="acct-kicker">{copy.overview.support}</p>
            <MessageSquare size={18} className="text-[var(--acct-blue)]" />
          </div>
          <p className="mt-2 text-2xl font-bold text-[var(--acct-ink)]">{data.openSupportCount}</p>
          <p className="mt-1 text-xs text-[var(--acct-muted)]">
            {data.unreadSupportCount > 0
              ? `${data.unreadSupportCount} ${copy.overview.newReplies}`
              : data.openSupportCount > 0
                ? copy.overview.openRequests
                : copy.overview.noOpenRequests}
          </p>
        </Link>

        <Link href="/referrals" className="acct-metric group transition-shadow hover:shadow-lg">
          <div className="flex items-center justify-between">
            <p className="acct-kicker">{copy.overview.referrals}</p>
            <Gift size={18} className="text-[var(--acct-green)]" />
          </div>
          <p className="mt-2 text-lg font-bold text-[var(--acct-ink)]">{copy.overview.inviteAndEarn}</p>
          <p className="mt-1 text-xs text-[var(--acct-muted)]">{copy.overview.shareHenryCo}</p>
        </Link>

        <Link href="/wallet" className="acct-metric group transition-shadow hover:shadow-lg">
          <div className="flex items-center justify-between">
            <p className="acct-kicker">{copy.overview.transactions}</p>
            <Wallet size={18} className="text-[var(--acct-green)]" />
          </div>
          <p className="mt-2 text-lg font-bold text-[var(--acct-ink)]">{copy.overview.viewHistory}</p>
          <p className="mt-1 text-xs text-[var(--acct-muted)]">{copy.overview.walletActivity}</p>
        </Link>
      </div>

      <section className="acct-card p-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="acct-chip acct-chip-blue text-[0.65rem]">
            {blockingTasks.length} {copy.overview.blockingLabel}
          </span>
          <span className="acct-chip acct-chip-gold text-[0.65rem]">
            {highPriorityTasks.length} {copy.overview.highPriorityLabel}
          </span>
          <span className="text-xs text-[var(--acct-muted)]">
            {copy.overview.actionCenterHint}
          </span>
        </div>
      </section>

      {attention.length > 0 ? (
        <section className="acct-card p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="acct-kicker">{copy.overview.attentionKicker}</p>
              <h2 className="mt-2 text-lg font-semibold text-[var(--acct-ink)]">
                {copy.overview.attentionTitle}
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
        <p className="acct-kicker mb-3">{copy.overview.quickActions}</p>
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
            <p className="acct-kicker">{copy.overview.actionCenter}</p>
            <p className="mt-1 text-xs text-[var(--acct-muted)]">
              {copy.overview.actionCenterDescription}
            </p>
          </div>
          <div className="space-y-3">
            {tasks.length === 0 ? (
              <p className="text-sm text-[var(--acct-muted)]">
                {copy.overview.noUrgentTasks}
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
                      <span className="acct-chip acct-chip-red text-[0.65rem]">{copy.tasks.blocking}</span>
                    ) : (
                      <span className="acct-chip acct-chip-blue text-[0.65rem]">{copy.tasks.priorityLabels[task.priority]}</span>
                    )}
                  </div>
                  {task.description ? (
                    <p className="mt-1 text-xs text-[var(--acct-muted)]">{task.description}</p>
                  ) : null}
                  <p className="mt-2 text-[0.65rem] uppercase tracking-[0.14em] text-[var(--acct-muted)]">
                    {copy.common.source}: {translateSurfaceLabel(locale, divisionLabel(task.sourceDivision))}
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
              {copy.overview.viewTaskQueue} <ChevronRight size={14} />
            </Link>
          ) : null}
        </section>

        {flags.intelligence_recommendations ? (
          <section className="acct-card p-5">
            <p className="acct-kicker mb-3">{copy.overview.smartRecommendations}</p>
            <div className="space-y-3">
              {recommendations.length === 0 ? (
                <p className="text-sm text-[var(--acct-muted)]">
                  {copy.overview.smartRecommendationsEmpty}
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
                      {formatAccountTemplate(copy.overview.recommendationReason, {
                        confidence: item.confidence,
                      })}
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
            <p className="acct-kicker">{copy.overview.recentActivity}</p>
            <Link
              href="/activity"
              className="flex items-center gap-1 text-xs font-medium text-[var(--acct-gold)] hover:underline"
            >
              {copy.common.viewAll} <ChevronRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {data.recentActivity.length === 0 ? (
              <p className="py-6 text-center text-sm text-[var(--acct-muted)]">
                {copy.overview.noRecentActivity}
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
                      {translateSurfaceLabel(locale, divisionLabel(item.division))} &middot; {timeAgoLocalized(item.created_at, locale)}
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
            <p className="acct-kicker">{copy.overview.recentNotifications}</p>
            <Link
              href="/notifications"
              className="flex items-center gap-1 text-xs font-medium text-[var(--acct-gold)] hover:underline"
            >
              {copy.common.viewAll} <ChevronRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {data.recentNotifications.length === 0 ? (
              <p className="py-6 text-center text-sm text-[var(--acct-muted)]">
                {copy.overview.noNotifications}
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
                      {translateSurfaceLabel(
                        locale,
                        (n.source as { label?: string })?.label || divisionLabel(String(n.category || "account"))
                      )}
                    </span>
                    {!n.is_read ? (
                      <span className="rounded-full bg-[var(--acct-red-soft)] px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-red)]">
                        {copy.common.unread}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-3 text-sm font-medium text-[var(--acct-ink)]">{String(n.title || "")}</p>
                  <p className="mt-0.5 text-xs text-[var(--acct-muted)] line-clamp-2">{String(n.body || "")}</p>
                  <p className="mt-1 text-[0.65rem] text-[var(--acct-muted)]">
                    {timeAgoLocalized(String(n.created_at || ""), locale)}
                  </p>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Division services */}
      <section className="acct-card p-5">
        <p className="acct-kicker mb-3">{copy.overview.yourServices}</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { key: "care", label: copy.overview.careService, desc: copy.overview.careServiceDescription, icon: Sparkles, href: "/care" },
            { key: "marketplace", label: copy.overview.marketplaceService, desc: copy.overview.marketplaceServiceDescription, icon: ShoppingBag, href: "/marketplace" },
            { key: "jobs", label: copy.overview.jobsService, desc: copy.overview.jobsServiceDescription, icon: BriefcaseBusiness, href: "/jobs" },
            { key: "studio", label: copy.overview.studioService, desc: copy.overview.studioServiceDescription, icon: Palette, href: "/studio" },
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
