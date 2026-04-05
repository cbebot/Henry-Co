import Link from "next/link";
import MetricCard from "@/components/owner/MetricCard";
import DivisionBadge from "@/components/owner/DivisionBadge";
import { OwnerPageHeader, OwnerPanel } from "@/components/owner/OwnerPrimitives";
import { getFinanceCenterData } from "@/lib/owner-data";
import { formatCurrencyAmount } from "@/lib/format";
import { DollarSign, Receipt, Siren, Wallet } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function FinanceCenterPage() {
  const data = await getFinanceCenterData();
  const totalRevenue = data.revenueByDivision.reduce((sum, item) => sum + item.valueNaira, 0);

  return (
    <div className="space-y-6 acct-fade-in">
      <OwnerPageHeader
        eyebrow="Finance Center"
        title="Cross-division money visibility"
        description="Payments, invoices, payout backlog, and division-level revenue snapshots now roll into one owner-only finance surface."
        actions={
          <>
            <Link href="/owner/finance/revenue" className="acct-button-secondary">Revenue view</Link>
            <Link href="/owner/finance/invoices" className="acct-button-primary">Invoice pressure</Link>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Recognized revenue" value={formatCurrencyAmount(totalRevenue)} subtitle="Observed from live financial tables" icon={DollarSign} />
        <MetricCard label="Pending invoices" value={data.pendingInvoices.length} subtitle="Shared invoices awaiting payment" icon={Receipt} />
        <MetricCard label="Pending payouts" value={data.pendingPayouts.length} subtitle="Marketplace payout backlog" icon={Wallet} />
        <MetricCard label="Finance alerts" value={data.alerts.length} subtitle="Items requiring owner action" icon={Siren} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <OwnerPanel title="Revenue by division" description="Current recognized revenue lines available from live data.">
          <div className="space-y-3">
            {data.revenueByDivision.map((item) => (
              <div key={item.slug} className="flex items-center justify-between rounded-[1.2rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] px-4 py-3">
                <div className="flex items-center gap-3">
                  <DivisionBadge division={item.slug} />
                  <div className="text-sm font-semibold text-[var(--acct-ink)]">{item.label}</div>
                </div>
                <div className="text-sm font-semibold text-[var(--acct-ink)]">{formatCurrencyAmount(item.valueNaira)}</div>
              </div>
            ))}
          </div>
        </OwnerPanel>

        <OwnerPanel title="Finance alerts" description="Backlog, payout, and delivery issues affecting money movement.">
          <div className="space-y-3">
            {data.alerts.map((signal) => (
              <div key={signal.id} className="rounded-[1.2rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] px-4 py-3">
                <div className="text-sm font-semibold text-[var(--acct-ink)]">{signal.title}</div>
                <p className="mt-2 text-sm text-[var(--acct-muted)]">{signal.body}</p>
              </div>
            ))}
          </div>
        </OwnerPanel>
      </div>
    </div>
  );
}
