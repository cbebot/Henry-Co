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
import { logProtectedPageAccess } from "@/lib/security/logger";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Owner Dashboard | Henry & Co. Fabric Care",
  description:
    "Owner control room for bookings, finance, security, reviews, and company-wide operations.",
};

import { formatMoney } from "@/lib/format";

function formatDateTime(value?: string | null) {
  if (!value) return "—";
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
      title: "Expense pressure is above inflow",
      text: "Total outflow is already higher than inflow. The owner should check approvals, high-cost activity, and recoverable revenue immediately.",
      tone: "red",
    });
  }

  if (recordedExpenses.length >= 4) {
    alerts.push({
      title: "Expenses awaiting owner decision",
      text: `${recordedExpenses.length} expense entries are still recorded and waiting for approval or voiding.`,
      tone: "amber",
    });
  }

  if (refundExpenses.length >= 2 || refundAmount >= 50000) {
    alerts.push({
      title: "Unusual refund activity detected",
      text: `Recent refund-linked expenses are visible in the system. Refund pressure is currently ${formatMoney(refundAmount)} from ${refundExpenses.length} item(s).`,
      tone: "red",
    });
  }

  if (overdueBookings >= 3 || urgentBookings.length >= 5) {
    alerts.push({
      title: "Booking delay risk is rising",
            text: `${overdueBookings} overdue booking(s) and ${urgentBookings.length} urgent booking(s) are currently visible. This can damage service trust if not handled fast.`,
      tone: "amber",
    });
  }

  if (liveGrowth >= 20 && monthInflow > 0) {
    alerts.push({
      title: "Recent flow looks strong",
      text: `Live current-month inflow is outpacing outflow by ${formatPercent(liveGrowth)} on recent tracked activity. Keep the system disciplined so growth stays clean.`,
      tone: "blue",
    });
  }

  const forecastText =
    projectedNet >= 0
      ? `If the current live run-rate holds, care could close the month around ${formatMoney(projectedNet)} net.`
      : `If the current live run-rate holds, care may close the month under pressure at about ${formatMoney(projectedNet)} net.`;

  return (
    <div className="space-y-8">
      <section className="rounded-[38px] border border-black/10 bg-white/80 p-8 shadow-[0_22px_80px_rgba(0,0,0,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04]">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
          Owner command center
        </div>
        <h1 className="mt-2 text-4xl font-black tracking-[-0.03em] text-zinc-950 dark:text-white sm:text-5xl">
          Master control for the entire care operation.
        </h1>
        <p className="mt-4 max-w-3xl text-zinc-600 dark:text-white/65">
          This is the highest layer. You see the real state of the company here:
          urgency, income, expense pressure, records quality, review health, and security.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <QuickLink href="/owner/bookings">Bookings</QuickLink>
          <QuickLink href="/owner/finance">Finance</QuickLink>
          <QuickLink href="/owner/records">Records</QuickLink>
          <QuickLink href="/owner/security">Security</QuickLink>
          <QuickLink href="/owner/settings">Settings</QuickLink>
          <QuickLink href="/owner/reviews">Reviews</QuickLink>
          <QuickLink href="/owner/staff">Staff</QuickLink>
          <QuickLink href="/staff">Field staff</QuickLink>
          <QuickLink href="/manager/expenses">Manager expenses</QuickLink>
          <QuickLink href="/rider/expenses">Rider expenses</QuickLink>
          <QuickLink href="/support/expenses">Support expenses</QuickLink>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={ClipboardList}
          label="Active bookings"
          value={String(activeBookings.length)}
          note="Current operational queue"
        />
        <MetricCard
          icon={FolderArchive}
          label="Archived bookings"
          value={String(archivedBookings.length)}
          note="Older than 30 days"
        />
        <MetricCard
          icon={DollarSign}
          label="Balance"
          value={formatMoney(summary.balance)}
          note={`${formatMoney(summary.total_inflow)} in • ${formatMoney(summary.total_outflow)} out`}
        />
        <MetricCard
          icon={BadgeCheck}
          label="Reviews"
          value={String(approvedReviews)}
          note={`${pendingReviews} pending approval`}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel
          eyebrow="Smart alerts"
          title="Finance and operations anomaly watch"
          subtitle="This is where the owner catches unusual pressure before it becomes damage."
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
              <EmptyState text="No major anomalies are visible right now." />
            )}
          </div>
        </Panel>

        <Panel
          eyebrow="Forecast"
          title="Short-range operational projection"
          subtitle="A live run-rate estimate based on current month tracked activity."
        >
          <div className="grid gap-4">
            <InfoTile label="Month inflow (live)">{formatMoney(monthInflow)}</InfoTile>
            <InfoTile label="Month outflow (live)">{formatMoney(monthOutflow)}</InfoTile>
            <InfoTile label="Projected month-end net">{formatMoney(projectedNet)}</InfoTile>
            <InfoTile label="Flow growth signal">{formatPercent(liveGrowth)}</InfoTile>
            <div className="rounded-2xl border border-black/10 bg-black/[0.03] p-4 text-sm leading-relaxed text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-white/75">
              {forecastText}
            </div>
          </div>
        </Panel>
      </section>

      <section className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel
          eyebrow="Urgency"
          title="Orders demanding attention"
          subtitle="The owner should notice pressure instantly, even if the manager is running the day."
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

                  <div className="font-mono text-sm font-bold text-[color:var(--accent)]">
                    {booking.tracking_code}
                  </div>
                  <div className="mt-2 text-xl font-semibold text-zinc-950 dark:text-white">
                    {booking.customer_name}
                  </div>
                  <div className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-white/65">
                    {booking.service_type} • {booking.status} • {booking.pickup_date || "No pickup date"}
                  </div>
                  <div className="mt-3 text-sm text-zinc-500 dark:text-white/45">
                    {booking.pickup_address}
                  </div>
                </article>
              ))
            ) : (
              <EmptyState text="No urgent bookings at the moment." />
            )}
          </div>
        </Panel>

        <Panel
          eyebrow="Brand state"
          title="Live company presentation"
          subtitle="What the public side is currently pulling from settings."
        >
          <div className="grid gap-4">
            <InfoTile label="Hero badge">{settings?.hero_badge || "—"}</InfoTile>
            <InfoTile label="Support email">{settings?.support_email || "—"}</InfoTile>
            <InfoTile label="Support phone">{settings?.support_phone || "—"}</InfoTile>
            <InfoTile label="Pickup hours">{settings?.pickup_hours || "—"}</InfoTile>
            <InfoTile label="Care domain">{settings?.care_domain || "Not configured yet"}</InfoTile>
            <InfoTile label="Hub domain">{settings?.hub_domain || "Not configured yet"}</InfoTile>

            <Link
              href="/owner/settings"
              className="care-button-primary inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold"
            >
              Open settings
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Panel>
      </section>

      <section className="grid gap-8 xl:grid-cols-[1fr_1fr]">
        <Panel
          eyebrow="Cash movement"
          title="Recent payments"
          subtitle="Quick read on inflow."
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
                        {payment.booking?.customer_name || "General payment"}
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
                        {formatDateTime(payment.created_at)}
                      </div>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState text="No recent payments yet." />
            )}
          </div>
        </Panel>

        <Panel
          eyebrow="Cost pressure"
          title="Recent expenses"
          subtitle="Owner should always understand where money is going."
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
                        {formatDateTime(expense.created_at)}
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
                      View proof
                    </a>
                  ) : null}
                </article>
              ))
            ) : (
              <EmptyState text="No recent expenses yet." />
            )}
          </div>
        </Panel>
      </section>

      <section className="grid gap-8 xl:grid-cols-[1fr_1fr]">
        <Panel
          eyebrow="Review health"
          title="Recent customer voice"
              subtitle="Strong service brands protect trust, not just workflow."
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
                      {review.is_approved ? "approved" : "pending"}
                    </span>
                  </div>
                  <div className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-white/68">
                    {review.review_text}
                  </div>
                  {review.photo_url ? (
                    <div className="mt-4 overflow-hidden rounded-[1.25rem] border border-black/10 bg-white/75 dark:border-white/10 dark:bg-white/[0.05]">
                      <Image
                        src={review.photo_url}
                        alt={`Review photo from ${review.customer_name}`}
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
              <EmptyState text="No reviews available yet." />
            )}
          </div>
        </Panel>

        <Panel
          eyebrow="Intelligence"
          title="What the owner should track next"
          subtitle="The company becomes more productive when insight is turned into action."
        >
          <div className="grid gap-4">
            <FeatureCard
              icon={ShieldAlert}
              title="Smart expense red flags"
              text={
                topExpenseCategory
                  ? `Top recent expense category is ${topExpenseCategory[0]} at ${formatMoney(topExpenseCategory[1])}.`
                  : "No major category pressure is visible yet."
              }
            />
            <FeatureCard
              icon={TriangleAlert}
              title="Booking delay alerts"
              text={`${overdueBookings} overdue booking(s) are visible in the active care queue.`}
            />
            <FeatureCard
              icon={TrendingUp}
              title="Operational forecasting"
              text={forecastText}
            />
            <FeatureCard
              icon={ShieldCheck}
              title="Approval discipline"
              text={`${recordedExpenses.length} expense record(s) are currently waiting for owner action.`}
            />
          </div>
        </Panel>
      </section>

      <section className="rounded-[34px] border border-black/10 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
              Archive policy
            </div>
            <div className="mt-2 text-lg font-semibold text-zinc-950 dark:text-white">
              {monthArchiveNote()}
            </div>
          </div>

          <Link
            href="/owner/records"
            className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 shadow-sm dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
          >
            Open archive-aware records
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
      <h2 className="mt-2 text-3xl font-bold text-zinc-950 dark:text-white">{title}</h2>
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
