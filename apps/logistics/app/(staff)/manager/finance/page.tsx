import {
  Panel,
  MetricCard,
} from "@henryco/dashboard-shell/components";
import { Banknote, ReceiptText, Wallet } from "lucide-react";
import { getFinanceDashboardData } from "@/lib/logistics/data";
import { formatCurrency } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function ManagerFinancePage() {
  const finance = await getFinanceDashboardData();

  return (
    <div className="space-y-8 py-6">
      <header>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--logistics-accent-soft)]">
          Finance
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Revenue, payouts, expenses
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--logistics-muted)]">
          The money view. Pricing engine is governance — overrides are audited
          and surfaced on the owner workspace.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Quoted"
          value={formatCurrency(finance.totals.quoted, "NGN")}
          icon={<ReceiptText className="h-4 w-4" aria-hidden />}
          context={{
            kind: "comparison",
            vs: "total quoted",
            delta: `${finance.shipments.length} shipments`,
          }}
        />
        <MetricCard
          label="Paid"
          value={formatCurrency(finance.totals.paid, "NGN")}
          icon={<Wallet className="h-4 w-4" aria-hidden />}
          context={{
            kind: "comparison",
            vs: "settled total",
            delta: `${Math.round(
              (finance.totals.paid /
                Math.max(1, finance.totals.quoted)) *
                100,
            )}% of quoted`,
          }}
        />
        <MetricCard
          label="Expenses"
          value={formatCurrency(finance.totals.expenses, "NGN")}
          icon={<Banknote className="h-4 w-4" aria-hidden />}
          context={{
            kind: "trend",
            direction: finance.totals.expenses > 0 ? "up" : "flat",
            magnitude: `${finance.expenses.length} ${finance.expenses.length === 1 ? "entry" : "entries"}`,
          }}
        />
        <MetricCard
          label="Margin"
          value={formatCurrency(finance.totals.margin, "NGN")}
          icon={<Wallet className="h-4 w-4" aria-hidden />}
          context={{
            kind: "trend",
            direction: finance.totals.margin >= 0 ? "up" : "down",
            magnitude:
              finance.totals.margin >= 0
                ? "Positive period"
                : "Investigate cost line",
          }}
        />
      </section>

      <Panel tone="flat">
        <header className="border-b border-[var(--logistics-line)] pb-3">
          <h2 className="text-base font-semibold tracking-tight text-white">
            Recent expenses
          </h2>
        </header>
        {finance.expenses.length === 0 ? (
          <p className="py-6 text-center text-sm text-[var(--logistics-muted)]">
            No expense entries logged yet this period.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--logistics-line)]">
            {finance.expenses.slice(0, 12).map((expense) => (
              <li
                key={expense.id}
                className="flex items-center justify-between py-3 text-sm"
              >
                <div>
                  <p className="font-semibold tracking-tight text-white">
                    {expense.category}
                  </p>
                  <p className="text-xs text-[var(--logistics-muted)]">
                    {new Date(expense.createdAt).toLocaleDateString()} · status{" "}
                    {expense.status}
                  </p>
                </div>
                <p className="font-semibold tracking-tight text-white">
                  {formatCurrency(expense.amount, expense.currency)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
