import { Panel, EmptyState } from "@henryco/dashboard-shell/components";
import { translateSurfaceLabel } from "@henryco/i18n";
import { getLogisticsViewer } from "@/lib/logistics/auth";
import { getRiderDashboardData } from "@/lib/logistics/data";
import { getLogisticsPublicLocale } from "@/lib/locale-server";

/**
 * V3 PASS 21 — Rider workspace: fuel + maintenance expense log.
 */
export const dynamic = "force-dynamic";

export default async function RiderExpensesPage() {
  const locale = await getLogisticsPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const viewer = await getLogisticsViewer();
  const data = await getRiderDashboardData(viewer);
  const expenses = data.expenses.filter(
    (e) => e.riderUserId && e.riderUserId === viewer.user?.id,
  );

  return (
    <div className="space-y-8 py-6">
      <header>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--logistics-accent-soft)]">
          {t("Expenses")}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          {t("Fuel + maintenance")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--logistics-muted)]">
          {t("Log work-related spend so finance can reimburse on the next payout cycle.")}
        </p>
      </header>

      <Panel tone="flat">
        {expenses.length === 0 ? (
          <EmptyState
            kicker={t("No entries")}
            headline={t("Nothing logged yet this period")}
            body={t("Add fuel and maintenance entries as you incur them; finance settles weekly.")}
          />
        ) : (
          <ul className="divide-y divide-[var(--logistics-line)]">
            {expenses.map((expense) => (
              <li
                key={expense.id}
                className="flex items-center justify-between py-3 text-sm"
              >
                <div>
                  <p className="font-semibold tracking-tight text-white">
                    {t(expense.category)}
                  </p>
                  <p className="text-xs text-[var(--logistics-muted)]">
                    {new Date(expense.createdAt).toLocaleDateString(locale)} · {t("status")}{" "}
                    {t(expense.status)}
                  </p>
                </div>
                <p className="font-semibold tracking-tight text-white">
                  {expense.amount} {expense.currency}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
