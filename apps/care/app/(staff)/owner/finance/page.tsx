import type { Metadata } from "next";
import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import {
  ArrowRight,
  BadgeCheck,
  CircleDollarSign,
  ClipboardList,
  ReceiptText,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import PendingSubmitButton from "@/components/forms/PendingSubmitButton";
import { requireRoles } from "@/lib/auth/server";
import {
  getAdminBookings,
  getExpenses,
  getFinanceRows,
  getFinanceSummary,
  getPayments,
} from "@/lib/admin/care-admin";
import { logProtectedPageAccess } from "@/lib/security/logger";
import { approveExpenseAction, voidExpenseAction } from "../actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Owner Finance | Henry & Co. Fabric Care",
  description:
    "Finance command center for revenue, expenses, approvals, trends, profit/loss, and operational alerts.",
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

function formatMonthLabel(key: string) {
  const [year, month] = key.split("-");
  const d = new Date(Number(year), Number(month) - 1, 1);
  if (Number.isNaN(d.getTime())) return key;
  return d.toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
  });
}

function monthKey(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function percentChange(current: number, previous: number) {
  if (!previous) return current ? 100 : 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}

function startOfToday() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

type MonthlySummary = {
  inflow: number;
  outflow: number;
  net: number;
};

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

export default async function OwnerFinancePage() {
  await requireRoles(["owner"]);
  await logProtectedPageAccess("/owner/finance");

  const [summary, payments, expenses, financeRows, activeBookings] = await Promise.all([
    getFinanceSummary(),
    getPayments({ scope: "active", limit: 150 }),
    getExpenses({ scope: "active", limit: 150 }),
    getFinanceRows({ scope: "active", limit: 250 }),
    getAdminBookings({ scope: "active", limit: 400 }),
  ]);

  const recordedExpenses = expenses.filter(
    (row) => String(row.approval_status || "").toLowerCase() === "recorded"
  );

  const refundExpenses = expenses.filter((row) =>
    String(row.category || "").toLowerCase().includes("refund")
  );

  const refundAmount = refundExpenses.reduce(
    (sum, row) => sum + Number(row.amount || 0),
    0
  );

  const monthMap: Record<string, MonthlySummary> = {};

  for (const row of financeRows) {
    const key = monthKey(row.created_at);
    if (!key) continue;

    if (!monthMap[key]) {
      monthMap[key] = { inflow: 0, outflow: 0, net: 0 };
    }

    const amount = Number(row.amount || 0);

    if (row.direction === "inflow") {
      monthMap[key].inflow += amount;
    } else if (row.direction === "outflow") {
      monthMap[key].outflow += amount;
    }

    monthMap[key].net = monthMap[key].inflow - monthMap[key].outflow;
  }

  const sortedMonthKeys = Object.keys(monthMap).sort((a, b) => b.localeCompare(a));
  const currentMonthKey = sortedMonthKeys[0] ?? monthKey(new Date().toISOString()) ?? "";
  const previousMonthKey = sortedMonthKeys[1] ?? "";

  const currentMonth = monthMap[currentMonthKey] ?? { inflow: 0, outflow: 0, net: 0 };
  const previousMonth = monthMap[previousMonthKey] ?? { inflow: 0, outflow: 0, net: 0 };

  const netGrowth = percentChange(currentMonth.net, previousMonth.net);
  const inflowGrowth = percentChange(currentMonth.inflow, previousMonth.inflow);
  const outflowGrowth = percentChange(currentMonth.outflow, previousMonth.outflow);

  const categoryTotals = expenses
    .filter((row) => String(row.approval_status || "").toLowerCase() !== "voided")
    .reduce<Record<string, number>>((acc, row) => {
      const key = String(row.category || "other");
      acc[key] = (acc[key] || 0) + Number(row.amount || 0);
      return acc;
    }, {});

  const categoryLeaders = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const topExpenseCategory = categoryLeaders[0] ?? null;

  const today = startOfToday();
  const overdueBookings = activeBookings.filter((booking) => {
    if (!booking.pickup_date) return false;
    const date = new Date(booking.pickup_date);
    if (Number.isNaN(date.getTime())) return false;
    date.setHours(0, 0, 0, 0);
    const status = String(booking.status || "").toLowerCase();
    return date < today && !["delivered", "cancelled"].includes(status);
  }).length;

  const alerts: AlertItem[] = [];

  if (summary.total_outflow > summary.total_inflow) {
    alerts.push({
      title: "Outflow is higher than inflow",
      text: "The care division is spending more than it has recorded as inflow. Check payments, approvals, and avoidable costs immediately.",
      tone: "red",
    });
  }

  if (recordedExpenses.length >= 3) {
    alerts.push({
      title: "Expense approvals are waiting",
      text: `${recordedExpenses.length} expense record(s) still need owner action.`,
      tone: "amber",
    });
  }

  if (refundExpenses.length >= 2 || refundAmount >= 50000) {
    alerts.push({
      title: "Unusual refund-related pressure",
      text: `Refund-linked expenses currently total ${formatMoney(refundAmount)} across ${refundExpenses.length} item(s).`,
      tone: "red",
    });
  }

  if (overdueBookings >= 3) {
    alerts.push({
      title: "Booking delay risk is visible",
      text: `${overdueBookings} active booking(s) are already overdue in the live queue.`,
      tone: "amber",
    });
  }

  if (currentMonth.net > 0 && netGrowth > 0) {
    alerts.push({
      title: "Net movement is improving",
      text: `Current net trend is stronger than the previous month by ${netGrowth.toFixed(1)}%.`,
      tone: "blue",
    });
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[38px] border border-black/10 bg-white/80 p-8 shadow-[0_22px_80px_rgba(0,0,0,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04]">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent-deep)] dark:text-[color:var(--accent)]">
          Owner finance control
        </div>
        <h1 className="mt-2 text-4xl font-black tracking-[-0.03em] text-zinc-950 dark:text-white sm:text-5xl">
          Track money movement and pressure clearly.
        </h1>
        <p className="mt-4 max-w-3xl text-zinc-600 dark:text-white/65">
          This page gives the owner live visibility into inflow, outflow, approvals, risk,
          category pressure, and short-range finance signals for the care division.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <QuickLink href="/owner">Owner dashboard</QuickLink>
          <QuickLink href="/manager/expenses">Manager expenses</QuickLink>
          <QuickLink href="/rider/expenses">Rider expenses</QuickLink>
          <QuickLink href="/support/expenses">Support expenses</QuickLink>
          <QuickLink href="/owner/settings">Settings</QuickLink>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={CircleDollarSign}
          label="Total inflow"
          value={formatMoney(summary.total_inflow)}
          note="All recorded inflow"
        />
        <MetricCard
          icon={Wallet}
          label="Total outflow"
          value={formatMoney(summary.total_outflow)}
          note="All recorded outflow"
        />
        <MetricCard
          icon={BadgeCheck}
          label="Net balance"
          value={formatMoney(summary.balance)}
          note="Inflow minus outflow"
        />
        <MetricCard
          icon={ReceiptText}
          label="Pending approvals"
          value={String(recordedExpenses.length)}
          note="Expenses waiting for decision"
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel
          eyebrow="Anomaly watch"
          title="Finance and operations alerts"
          subtitle="The owner should see abnormal pressure immediately."
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
          eyebrow="Month signal"
          title="Current vs previous month"
          subtitle="A simple profitability direction read based on ledger activity."
        >
          <div className="grid gap-4">
            <InfoTile label={`Current month${currentMonthKey ? ` • ${formatMonthLabel(currentMonthKey)}` : ""}`}>
              {formatMoney(currentMonth.net)}
            </InfoTile>
            <InfoTile label={`Previous month${previousMonthKey ? ` • ${formatMonthLabel(previousMonthKey)}` : ""}`}>
              {formatMoney(previousMonth.net)}
            </InfoTile>
            <InfoTile label="Net growth">
              {`${netGrowth >= 0 ? "+" : ""}${netGrowth.toFixed(1)}%`}
            </InfoTile>
            <InfoTile label="Inflow growth">
              {`${inflowGrowth >= 0 ? "+" : ""}${inflowGrowth.toFixed(1)}%`}
            </InfoTile>
            <InfoTile label="Outflow growth">
              {`${outflowGrowth >= 0 ? "+" : ""}${outflowGrowth.toFixed(1)}%`}
            </InfoTile>
          </div>
        </Panel>
      </section>

      <section className="grid gap-8 xl:grid-cols-[1fr_1fr]">
        <Panel
          eyebrow="Recent payments"
          title="Latest inflow records"
          subtitle="Quick read on payments entering the care division."
        >
          <div className="grid gap-4">
            {payments.length > 0 ? (
              payments.slice(0, 12).map((payment) => (
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
                      <div className="font-black text-[color:var(--accent-deep)] dark:text-[color:var(--accent-strong)]">
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
          eyebrow="Recent expenses"
          title="Latest outflow records"
          subtitle="The owner should always understand where money is going."
        >
          <div className="grid gap-4">
            {expenses.length > 0 ? (
              expenses.slice(0, 12).map((expense) => (
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
          eyebrow="Expense approvals"
          title="Pending owner decisions"
          subtitle="Approve clean records or void bad ones so finance stays truthful."
        >
          <div className="grid gap-4">
            {recordedExpenses.length > 0 ? (
              recordedExpenses.slice(0, 12).map((expense) => (
                <article
                  key={expense.id}
                  className="rounded-3xl border border-black/10 bg-black/[0.03] p-5 dark:border-white/10 dark:bg-white/5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-zinc-950 dark:text-white">
                        {expense.category}
                      </div>
                      <div className="mt-1 text-xs text-zinc-500 dark:text-white/45">
                        {expense.expense_no} • {expense.description}
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

                  <div className="mt-4 flex flex-wrap gap-3">
                    <form action={approveExpenseAction}>
                      <input type="hidden" name="id" value={expense.id} />
                      <PendingSubmitButton
                        label="Approve"
                        pendingLabel="Approving..."
                        variant="secondary"
                        className="border-emerald-300/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-100"
                      />
                    </form>

                    <form action={voidExpenseAction}>
                      <input type="hidden" name="id" value={expense.id} />
                      <PendingSubmitButton
                        label="Void"
                        pendingLabel="Voiding..."
                        variant="danger"
                      />
                    </form>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState text="No expenses are waiting for approval right now." />
            )}
          </div>
        </Panel>

        <Panel
          eyebrow="Productivity signals"
          title="What the owner should watch"
          subtitle="These are the simple control metrics that make the care division more reliable."
        >
          <div className="grid gap-4">
            <FeatureCard
              icon={ShieldAlert}
              title="Smart expense red flags"
              text={
                topExpenseCategory
                  ? `Top recent expense category is ${topExpenseCategory[0]} at ${formatMoney(topExpenseCategory[1])}.`
                  : "No dominant expense category is visible yet."
              }
            />
            <FeatureCard
              icon={TriangleAlert}
              title="Unusual refund detection"
              text={`Refund-related expense pressure currently stands at ${formatMoney(refundAmount)}.`}
            />
            <FeatureCard
              icon={ClipboardList}
              title="Booking delay alerts"
              text={`${overdueBookings} overdue booking(s) are visible in the active queue.`}
            />
            <FeatureCard
              icon={currentMonth.net >= 0 ? TrendingUp : TrendingDown}
              title="Operational forecasting"
              text={
                currentMonth.net >= 0
                  ? `Current month net signal is positive at ${formatMoney(currentMonth.net)}.`
                  : `Current month net signal is under pressure at ${formatMoney(currentMonth.net)}.`
              }
            />
          </div>
        </Panel>
      </section>

      <section className="rounded-[34px] border border-black/10 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent-deep)] dark:text-[color:var(--accent)]">
          Category pressure
        </div>
        <h2 className="mt-2 text-3xl font-bold text-zinc-950 dark:text-white">
          Where expense weight is concentrating
        </h2>
        <p className="mt-2 text-zinc-600 dark:text-white/65">
          This helps the owner see what is eating margin fastest.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {categoryLeaders.length > 0 ? (
            categoryLeaders.map(([category, amount]) => (
              <InfoTile key={category} label={category}>
                {formatMoney(amount)}
              </InfoTile>
            ))
          ) : (
            <EmptyState text="No category totals are visible yet." />
          )}
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
        <Icon className="h-6 w-6 text-[color:var(--accent-deep)] dark:text-[color:var(--accent-strong)]" />
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
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent-deep)] dark:text-[color:var(--accent)]">
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
        <Icon className="h-5 w-5 text-[color:var(--accent-deep)] dark:text-[color:var(--accent-strong)]" />
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
