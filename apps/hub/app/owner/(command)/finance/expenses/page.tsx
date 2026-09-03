import { translateSurfaceLabel } from "@henryco/i18n";
import { OwnerPageHeader, OwnerPanel } from "@/components/owner/OwnerPrimitives";
import { getFinanceCenterData, getOwnerOverviewData } from "@/lib/owner-data";
import { formatCurrencyAmount } from "@/lib/format";
import { getHubPublicLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

export default async function FinanceExpensesPage() {
  const [overview, finance, locale] = await Promise.all([
    getOwnerOverviewData(),
    getFinanceCenterData(),
    getHubPublicLocale(),
  ]);
  const t = (text: string) => translateSurfaceLabel(locale, text);

  return (
    <div className="space-y-6 acct-fade-in">
      <OwnerPageHeader
        eyebrow={t("Expenses")}
        title={t("Expense posture")}
        description={t("Central outflow visibility combines the live care expense ledger with wallet payouts already marked complete.")}
      />

      <OwnerPanel title={t("Current shared expense visibility")} description={t("This stays intentionally honest about what is already live today.")}>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-[1.3rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4">
            <div className="text-sm font-semibold text-[var(--acct-ink)]">{t("Tracked expense total")}</div>
            <p className="mt-2 text-2xl font-semibold text-[var(--acct-ink)]">{formatCurrencyAmount(overview.metrics.totalExpenseNaira)}</p>
            <p className="mt-2 text-sm text-[var(--acct-muted)]">{t("Current production expense coverage is strongest in care. Additional divisions are being normalized into the same central view.")}</p>
          </div>
          <div className="rounded-[1.3rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4">
            <div className="text-sm font-semibold text-[var(--acct-ink)]">{t("Completed wallet payouts")}</div>
            <p className="mt-2 text-2xl font-semibold text-[var(--acct-ink)]">{formatCurrencyAmount(finance.moneyMovement.recordedOutflowNaira - overview.metrics.totalExpenseNaira)}</p>
            <p className="mt-2 text-sm text-[var(--acct-muted)]">{t("These are customer wallet withdrawals already marked processed, paid, verified, or completed.")}</p>
          </div>
          <div className="rounded-[1.3rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4">
            <div className="text-sm font-semibold text-[var(--acct-ink)]">{t("Owner implication")}</div>
            <p className="mt-2 text-sm leading-7 text-[var(--acct-muted)]">{t("Finance decisions should still be made from the central command center, but broader cross-division expense standardization remains a production data-layer follow-through item.")}</p>
          </div>
        </div>
      </OwnerPanel>
    </div>
  );
}
