import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import {
  ArrowRight,
  BadgeCheck,
  ClipboardList,
  DollarSign,
  FolderArchive,
  ShieldAlert,
  ShieldCheck,
  TriangleAlert,
  TrendingUp,
} from "lucide-react";
import { getCareCopy } from "@henryco/i18n/server";
import { requireRoles } from "@/lib/auth/server";
import {
  getAdminBookings,
  getAdminReviews,
  getAdminSettings,
  getExpenses,
  getFinanceSummary,
  getPayments,
  getUrgentBookings,
  monthArchiveNote,
} from "@/lib/admin/care-admin";
import { getCarePublicLocale } from "@/lib/locale-server";
import { logProtectedPageAccess } from "@/lib/security/logger";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getCarePublicLocale();
  const copy = getCareCopy(locale);
  return {
    title: copy.staffOwner.metadata.title,
    description: copy.staffOwner.metadata.description,
  };
}

function formatMoney(value: number) {
  return `₦${Number(value || 0).toLocaleString()}`;
}

function formatDateTime(value: string | null | undefined, dash: string) {
  if (!value) return dash;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPercent(value: number) {
  const safe = Number.isFinite(value) ? value : 0;
  return `${safe >= 0 ? "+" : ""}${safe.toFixed(1)}%`;
}

function startOfToday() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

function isCurrentMonth(value?: string | null) {
  if (!value) return false;
  const d = new Date(value);
  const now = new Date();
  return (
    !Number.isNaN(d.getTime()) &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

function projectMonthEnd(monthToDateTotal: number) {
  const now = new Date();
  const elapsedDays = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  if (elapsedDays <= 0) return monthToDateTotal;
  return (monthToDateTotal / elapsedDays) * daysInMonth;
}

function percentChange(current: number, previous: number) {
  if (!previous) return current ? 100 : 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}

type AlertTone = "red" | "amber" | "blue";

type AlertItem = {
  title: string;
  text: string;
  tone: AlertTone;
};

function toneClasses(tone: AlertTone) {
  if (tone === "red") {
    return "border-red-300/30 bg-red-500/10 text-red-700 dark:text-red-100";
  }
  if (tone === "amber") {
    return "border-amber-300/30 bg-amber-500/10 text-amber-700 dark:text-amber-100";
  }
  return "border-cyan-300/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-100";
}

export default async function OwnerDashboardPage() {
  await requireRoles(["owner"]);
  await logProtectedPageAccess("/owner");

  const locale = await getCarePublicLocale();
  const copy = getCareCopy(locale);
  const so = copy.staffOwner;

  const [
    activeBookings,
    archivedBookings,
    urgentBookings,
    summary,
    recentPayments,
    recentExpenses,
    recordedExpenses,
    recentReviews,
    settings,
  ] = await Promise.all([
    getAdminBookings({ scope: "active", limit: 400 }),
    getAdminBookings({ scope: "archive", limit: 400 }),
    getUrgentBookings(8),
    getFinanceSummary(),
    getPayments({ scope: "active", limit: 24 }),
    getExpenses({ scope: "active", limit: 24 }),
    getExpenses({ scope: "active", status: "recorded", limit: 24 }),
    getAdminReviews(12),
    getAdminSettings(),
  ]);

  const approvedReviews = recentReviews.filter((x) => x.is_approved).length;
  const pendingReviews = recentReviews.filter((x) => !x.is_approved).length;

  const today = startOfToday();

  const overdueBookings = activeBookings.filter((booking) => {
    if (!booking.pickup_date) return false;
    const date = new Date(booking.pickup_date);
    if (Number.isNaN(date.getTime())) return false;
    date.setHours(0, 0, 0, 0);
    const status = String(booking.status || "").toLowerCase();
    return date < today && !["delivered", "cancelled"].includes(status);
  }).length;

  const currentMonthPayments = recentPayments.filter((row) => isCurrentMonth(row.created_at));
  const currentMonthExpenses = recentExpenses.filter((row) => isCurrentMonth(row.created_at));

  const monthInflow = currentMonthPayments.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const monthOutflow = currentMonthExpenses
    .filter((row) => String(row.approval_status || "").toLowerCase() !== "voided")
    .reduce((sum, row) => sum + Number(row.amount || 0), 0);

  const projectedInflow = projectMonthEnd(monthInflow);
  const projectedOutflow = projectMonthEnd(monthOutflow);
  const projectedNet = projectedInflow - projectedOutflow;
  const liveGrowth = percentChange(monthInflow, monthOutflow);

  const refundExpenses = recentExpenses.filter((row) =>
    String(row.category || "").toLowerCase().includes("refund")
  );
  const refundAmount = refundExpenses.reduce((sum, row) => sum + Number(row.amount || 0), 0);

  const highestExpenseCategory =
    recentExpenses.reduce<Record<string, number>>((acc, row) => {
      const key = String(row.category || "other");
      acc[key] = (acc[key] || 0) + Number(row.amount || 0);
      return acc;
    }, {});

  const topExpenseCategory =
    Object.entries(highestExpenseCategory).sort((a, b) => b[1] - a[1])[0] ?? null;

  const alerts: AlertItem[] = [];

  if (Number(summary.total_outflow || 0) > Number(summary.total_inflow || 0)) {
    alerts.push({
      title: so.alertsPanel.expensePressure.title,
      text: so.alertsPanel.expensePressure.text,
      tone: "red",
    });
  }

  if (recordedExpenses.length >= 4) {
    alerts.push({
      title: so.alertsPanel.awaitingDecision.title,
      text: so.alertsPanel.awaitingDecision.textTemplate.replace(
        "{count}",
        String(recordedExpenses.length),
      ),
      tone: "amber",
    });
  }

  if (refundExpenses.length >= 2 || refundAmount >= 50000) {
    alerts.push({
      title: so.alertsPanel.refundActivity.title,
      text: so.alertsPanel.refundActivity.textTemplate
        .replace("{amount}", formatMoney(refundAmount))
        .replace("{count}", String(refundExpenses.length)),
      tone: "red",
    });
  }

  if (overdueBookings >= 3 || urgentBookings.length >= 5) {
    alerts.push({
      title: so.alertsPanel.delayRisk.title,
      text: so.alertsPanel.delayRisk.textTemplate
        .replace("{overdue}", String(overdueBookings))
        .replace("{urgent}", String(urgentBookings.length)),
      tone: "amber",
    });
  }

  if (liveGrowth >= 20 && monthInflow > 0) {
    alerts.push({
      title: so.alertsPanel.strongFlow.title,
      text: so.alertsPanel.strongFlow.textTemplate.replace(
        "{percent}",
        formatPercent(liveGrowth),
      ),
      tone: "blue",
    });
  }

  const forecastText =
    projectedNet >= 0
      ? so.forecastPanel.positiveTemplate.replace("{amount}", formatMoney(projectedNet))
      : so.forecastPanel.negativeTemplate.replace("{amount}", formatMoney(projectedNet));

  const balanceNote = so.metrics.balance.flowTemplate
    .replace("{inflow}", formatMoney(summary.total_inflow))
    .replace("{outflow}", formatMoney(summary.total_outflow));

  const reviewsNote = so.metrics.reviews.pendingTemplate.replace(
    "{count}",
    String(pendingReviews),
  );

  return (
    <div className="space-y-8">
      <section className="rounded-[38px] border border-black/10 bg-white/80 p-8 shadow-[0_22px_80px_rgba(0,0,0,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04]">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
          {so.hero.eyebrow}
        </div>
        <h1 className="mt-2 text-4xl font-semibold tracking-[-0.03em] text-zinc-950 dark:text-white sm:text-5xl">
          {so.hero.title}
        </h1>
        <p className="mt-4 max-w-3xl text-zinc-600 dark:text-white/65">
          {so.hero.body}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <QuickLink href="/owner/bookings">{so.quickLinks.bookings}</QuickLink>
          <QuickLink href="/owner/finance">{so.quickLinks.finance}</QuickLink>
          <QuickLink href="/owner/records">{so.quickLinks.records}</QuickLink>
          <QuickLink href="/owner/security">{so.quickLinks.security}</QuickLink>
          <QuickLink href="/owner/settings">{so.quickLinks.settings}</QuickLink>
          <QuickLink href="/owner/reviews">{so.quickLinks.reviews}</QuickLink>
          <QuickLink href="/owner/staff">{so.quickLinks.staff}</QuickLink>
          <QuickLink href="/staff">{so.quickLinks.fieldStaff}</QuickLink>
          <QuickLink href="/manager/expenses">{so.quickLinks.managerExpenses}</QuickLink>
          <QuickLink href="/rider/expenses">{so.quickLinks.riderExpenses}</QuickLink>
          <QuickLink href="/support/expenses">{so.quickLinks.supportExpenses}</QuickLink>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={ClipboardList}
          label={so.metrics.activeBookings.label}
          value={String(activeBookings.length)}
          note={so.metrics.activeBookings.note}
        />
        <MetricCard
          icon={FolderArchive}
          label={so.metrics.archivedBookings.label}
          value={String(archivedBookings.length)}
          note={so.metrics.archivedBookings.note}
        />
        <MetricCard
          icon={DollarSign}
          label={so.metrics.balance.label}
          value={formatMoney(summary.balance)}
          note={balanceNote}
        />
        <MetricCard
          icon={BadgeCheck}
          label={so.metrics.reviews.label}
          value={String(approvedReviews)}
          note={reviewsNote}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel
          eyebrow={so.alertsPanel.eyebrow}
          title={so.alertsPanel.title}
          subtitle={so.alertsPanel.subtitle}
        >
          <div className="grid gap-4">
            {alerts.length > 0 ? (
              alerts.map((alert) => (
                <article
                  key={alert.title}
                  className={`rounded-3xl border p-5 ${toneClasses(alert.tone)}`}
                >
                  <div className="text-lg font-semibold">{alert.title}</div>
                  <div className="mt-2 text-sm leading-relaxed opacity-90">{alert.text}</div>
                </article>
              ))
            ) : (
              <EmptyState text={so.alertsPanel.empty} />
            )}
          </div>
        </Panel>

        <Panel
          eyebrow={so.forecastPanel.eyebrow}
          title={so.forecastPanel.title}
          subtitle={so.forecastPanel.subtitle}
        >
          <div className="grid gap-4">
            <InfoTile label={so.forecastPanel.monthInflow}>{formatMoney(monthInflow)}</InfoTile>
            <InfoTile label={so.forecastPanel.monthOutflow}>{formatMoney(monthOutflow)}</InfoTile>
            <InfoTile label={so.forecastPanel.projectedNet}>{formatMoney(projectedNet)}</InfoTile>
            <InfoTile label={so.forecastPanel.flowGrowth}>{formatPercent(liveGrowth)}</InfoTile>
            <div className="rounded-2xl border border-black/10 bg-black/[0.03] p-4 text-sm leading-relaxed text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-white/75">
              {forecastText}
            </div>
          </div>
        </Panel>
      </section>

      <section className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel
          eyebrow={so.urgencyPanel.eyebrow}
          title={so.urgencyPanel.title}
          subtitle={so.urgencyPanel.subtitle}
        >
          <div className="grid gap-4">
            {urgentBookings.length > 0 ? (
              urgentBookings.map((booking) => (
                <article
                  key={booking.id}
                  className="relative rounded-3xl border border-black/10 bg-black/[0.03] p-5 dark:border-white/10 dark:bg-white/5"
                >
                  <span className="absolute right-5 top-5 flex h-4 w-4">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                    <span className="relative inline-flex h-4 w-4 rounded-full bg-red-500" />
                  </span>

                  <div className="font-mono text-sm font-semibold text-[color:var(--accent)]">
                    {booking.tracking_code}
                  </div>
                  <div className="mt-2 text-xl font-semibold text-zinc-950 dark:text-white">
                    {booking.customer_name}
                  </div>
                  <div className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-white/65">
                    {booking.service_type} • {booking.status} • {booking.pickup_date || so.urgencyPanel.noPickup}
                  </div>
                  <div className="mt-3 text-sm text-zinc-500 dark:text-white/45">
                    {booking.pickup_address}
                  </div>
                </article>
              ))
            ) : (
              <EmptyState text={so.urgencyPanel.empty} />
            )}
          </div>
        </Panel>

        <Panel
          eyebrow={so.brandPanel.eyebrow}
          title={so.brandPanel.title}
          subtitle={so.brandPanel.subtitle}
        >
          <div className="grid gap-4">
            <InfoTile label={so.brandPanel.heroBadge}>{settings?.hero_badge || so.dash}</InfoTile>
            <InfoTile label={so.brandPanel.supportEmail}>{settings?.support_email || so.dash}</InfoTile>
            <InfoTile label={so.brandPanel.supportPhone}>{settings?.support_phone || so.dash}</InfoTile>
            <InfoTile label={so.brandPanel.pickupHours}>{settings?.pickup_hours || so.dash}</InfoTile>
            <InfoTile label={so.brandPanel.careDomain}>{settings?.care_domain || so.brandPanel.notConfigured}</InfoTile>
            <InfoTile label={so.brandPanel.hubDomain}>{settings?.hub_domain || so.brandPanel.notConfigured}</InfoTile>

            <Link
              href="/owner/settings"
              className="care-button-primary inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold"
            >
              {so.brandPanel.openSettings}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Panel>
      </section>

      <section className="grid gap-8 xl:grid-cols-[1fr_1fr]">
        <Panel
          eyebrow={so.paymentsPanel.eyebrow}
          title={so.paymentsPanel.title}
          subtitle={so.paymentsPanel.subtitle}
        >
          <div className="grid gap-4">
            {recentPayments.length > 0 ? (
              recentPayments.map((payment) => (
                <article
                  key={payment.id}
                  className="rounded-3xl border border-black/10 bg-black/[0.03] p-5 dark:border-white/10 dark:bg-white/5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-zinc-950 dark:text-white">
                        {payment.booking?.customer_name || so.paymentsPanel.generalPayment}
                      </div>
                      <div className="mt-1 text-xs text-zinc-500 dark:text-white/45">
                        {payment.payment_no} • {payment.payment_method}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-[color:var(--accent)]">
                        {formatMoney(payment.amount)}
                      </div>
                      <div className="mt-1 text-xs text-zinc-500 dark:text-white/45">
                        {formatDateTime(payment.created_at, so.dash)}
                      </div>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState text={so.paymentsPanel.empty} />
            )}
          </div>
        </Panel>

        <Panel
          eyebrow={so.expensesPanel.eyebrow}
          title={so.expensesPanel.title}
          subtitle={so.expensesPanel.subtitle}
        >
          <div className="grid gap-4">
            {recentExpenses.length > 0 ? (
              recentExpenses.map((expense) => (
                <article
                  key={expense.id}
                  className="rounded-3xl border border-black/10 bg-black/[0.03] p-5 dark:border-white/10 dark:bg-white/5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-zinc-950 dark:text-white">
                        {expense.category}
                      </div>
                      <div className="mt-1 text-xs text-zinc-500 dark:text-white/45">
                        {expense.expense_no} • {expense.approval_status}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-red-600 dark:text-red-300">
                        {formatMoney(expense.amount)}
                      </div>
                      <div className="mt-1 text-xs text-zinc-500 dark:text-white/45">
                        {formatDateTime(expense.created_at, so.dash)}
                      </div>
                    </div>
                  </div>
                  {expense.receipt_url ? (
                    <a
                      href={expense.receipt_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex text-sm font-semibold text-[color:var(--accent)]"
                    >
                      {so.expensesPanel.viewProof}
                    </a>
                  ) : null}
                </article>
              ))
            ) : (
              <EmptyState text={so.expensesPanel.empty} />
            )}
          </div>
        </Panel>
      </section>

      <section className="grid gap-8 xl:grid-cols-[1fr_1fr]">
        <Panel
          eyebrow={so.reviewsPanel.eyebrow}
          title={so.reviewsPanel.title}
          subtitle={so.reviewsPanel.subtitle}
        >
          <div className="grid gap-4">
            {recentReviews.length > 0 ? (
              recentReviews.map((review) => (
                <article
                  key={review.id}
                  className="rounded-3xl border border-black/10 bg-black/[0.03] p-5 dark:border-white/10 dark:bg-white/5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold text-zinc-950 dark:text-white">
                      {review.customer_name}
                    </div>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${
                        review.is_approved
                          ? "border-emerald-300/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-100"
                          : "border-amber-300/30 bg-amber-500/10 text-amber-700 dark:text-amber-100"
                      }`}
                    >
                      {review.is_approved ? so.reviewsPanel.approved : so.reviewsPanel.pending}
                    </span>
                  </div>
                  <div className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-white/68">
                    {review.review_text}
                  </div>
                  {review.photo_url ? (
                    <div className="mt-4 overflow-hidden rounded-[1.25rem] border border-black/10 bg-white/75 dark:border-white/10 dark:bg-white/[0.05]">
                      <Image
                        src={review.photo_url}
                        alt={so.reviewsPanel.photoAltTemplate.replace("{name}", review.customer_name)}
                        width={960}
                        height={640}
                        unoptimized
                        className="h-40 w-full object-cover"
                      />
                    </div>
                  ) : null}
                </article>
              ))
            ) : (
              <EmptyState text={so.reviewsPanel.empty} />
            )}
          </div>
        </Panel>

        <Panel
          eyebrow={so.intelligencePanel.eyebrow}
          title={so.intelligencePanel.title}
          subtitle={so.intelligencePanel.subtitle}
        >
          <div className="grid gap-4">
            <FeatureCard
              icon={ShieldAlert}
              title={so.intelligencePanel.expenseFlags.title}
              text={
                topExpenseCategory
                  ? so.intelligencePanel.expenseFlags.topTemplate
                      .replace("{category}", topExpenseCategory[0])
                      .replace("{amount}", formatMoney(topExpenseCategory[1]))
                  : so.intelligencePanel.expenseFlags.emptyText
              }
            />
            <FeatureCard
              icon={TriangleAlert}
              title={so.intelligencePanel.delayAlerts.title}
              text={so.intelligencePanel.delayAlerts.textTemplate.replace(
                "{count}",
                String(overdueBookings),
              )}
            />
            <FeatureCard
              icon={TrendingUp}
              title={so.intelligencePanel.forecasting.title}
              text={forecastText}
            />
            <FeatureCard
              icon={ShieldCheck}
              title={so.intelligencePanel.approvalDiscipline.title}
              text={so.intelligencePanel.approvalDiscipline.textTemplate.replace(
                "{count}",
                String(recordedExpenses.length),
              )}
            />
          </div>
        </Panel>
      </section>

      <section className="rounded-[34px] border border-black/10 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
              {so.archivePanel.eyebrow}
            </div>
            <div className="mt-2 text-lg font-semibold text-zinc-950 dark:text-white">
              {monthArchiveNote()}
            </div>
          </div>

          <Link
            href="/owner/records"
            className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 shadow-sm dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
          >
            {so.archivePanel.cta}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function QuickLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 shadow-sm transition hover:border-[color:var(--accent)]/40 dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
    >
      {children}
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-3xl border border-black/10 bg-white/80 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-white/[0.04]">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--accent)]/10">
        <Icon className="h-6 w-6 text-[color:var(--accent)]" />
      </div>
      <div className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-white/45">
        {label}
      </div>
      <div className="mt-2 text-4xl font-black text-zinc-950 dark:text-white">{value}</div>
      <div className="mt-2 text-sm text-zinc-600 dark:text-white/60">{note}</div>
    </div>
  );
}

function Panel({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[34px] border border-black/10 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
        {eyebrow}
      </div>
      <h2 className="mt-2 text-3xl font-semibold text-zinc-950 dark:text-white">{title}</h2>
      <p className="mt-2 text-zinc-600 dark:text-white/65">{subtitle}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function InfoTile({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white/75 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.05]">
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-white/45">
        {label}
      </div>
      <div className="mt-2 text-sm text-zinc-800 dark:text-white/80">{children}</div>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  text,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl border border-black/10 bg-black/[0.03] p-5 dark:border-white/10 dark:bg-white/5">
      <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--accent)]/10">
        <Icon className="h-5 w-5 text-[color:var(--accent)]" />
      </div>
      <div className="mt-4 text-lg font-semibold text-zinc-950 dark:text-white">{title}</div>
      <div className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-white/65">{text}</div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-3xl border border-black/10 bg-black/[0.03] p-10 text-center text-zinc-500 dark:border-white/10 dark:bg-white/5 dark:text-white/55">
      {text}
    </div>
  );
}
