import { OwnerPageHeader, OwnerPanel } from "@/components/owner/OwnerPrimitives";
import { getOwnerOverviewData } from "@/lib/owner-data";
import { formatCurrencyAmount } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function FinanceExpensesPage() {
  const data = await getOwnerOverviewData();

  return (
    <div className="space-y-6 acct-fade-in">
      <OwnerPageHeader
        eyebrow="Expenses"
        title="Expense posture"
        description="Central expense visibility currently comes from the live care expense ledger while broader division expense tables are still being unified."
      />

      <OwnerPanel title="Current shared expense visibility" description="This stays intentionally honest about what is already live today.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-[1.3rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4">
            <div className="text-sm font-semibold text-[var(--acct-ink)]">Tracked expense total</div>
            <p className="mt-2 text-2xl font-semibold text-[var(--acct-ink)]">{formatCurrencyAmount(data.metrics.totalExpenseNaira)}</p>
            <p className="mt-2 text-sm text-[var(--acct-muted)]">Current production expense coverage is strongest in care. Additional divisions are being normalized into the same central view.</p>
          </div>
          <div className="rounded-[1.3rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4">
            <div className="text-sm font-semibold text-[var(--acct-ink)]">Owner implication</div>
            <p className="mt-2 text-sm leading-7 text-[var(--acct-muted)]">Finance decisions should still be made from the central command center, but broader cross-division expense standardization remains a production data-layer follow-through item.</p>
          </div>
        </div>
      </OwnerPanel>
    </div>
  );
}
