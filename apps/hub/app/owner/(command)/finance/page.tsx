import Link from "next/link";
import { RouteLiveRefresh } from "@henryco/ui";
import MetricCard from "@/components/owner/MetricCard";
import DivisionBadge from "@/components/owner/DivisionBadge";
import StatusBadge from "@/components/owner/StatusBadge";
import { OwnerPageHeader, OwnerPanel } from "@/components/owner/OwnerPrimitives";
import { getFinanceCenterData } from "@/lib/owner-data";
import { formatCurrencyAmount, formatDateTime } from "@/lib/format";
import { DollarSign, Receipt, Siren, Wallet } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function FinanceCenterPage() {
  const data = await getFinanceCenterData();

  return (
    <div className="space-y-6 acct-fade-in">
      <RouteLiveRefresh intervalMs={12000} />
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
        <MetricCard
          label="Recognized revenue"
          value={formatCurrencyAmount(data.moneyMovement.recognizedRevenueNaira)}
          subtitle="Observed from live financial tables"
          icon={DollarSign}
        />
        <MetricCard
          label="Recorded outflow"
          value={formatCurrencyAmount(data.moneyMovement.recordedOutflowNaira)}
          subtitle="Care expense ledger plus completed wallet payouts"
          icon={Receipt}
        />
        <MetricCard
          label="Funding in review"
          value={formatCurrencyAmount(data.moneyMovement.walletFundingPendingNaira)}
          subtitle={`${data.pendingWalletFundingRequests.length} wallet funding request(s)`}
          icon={Wallet}
        />
        <MetricCard
          label="Withdrawal review"
          value={formatCurrencyAmount(data.moneyMovement.walletWithdrawalPendingNaira)}
          subtitle={`${data.pendingWalletWithdrawals.length} payout request(s) awaiting finance`}
          icon={Siren}
        />
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

      <div className="grid gap-6 xl:grid-cols-2">
        <OwnerPanel
          title="Wallet funding review lane"
          description="Bank-transfer funding requests that still need proof verification before customer balances are released."
        >
          <div className="overflow-x-auto">
            <table className="owner-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {data.pendingWalletFundingRequests.length ? (
                  data.pendingWalletFundingRequests.map((request) => (
                    <tr key={String(request.id)}>
                      <td>{String(request.payment_reference || request.id || "Funding request")}</td>
                      <td>
                        <StatusBadge status={String(request.status || "pending_verification")} />
                      </td>
                      <td>{formatCurrencyAmount(Number(request.amount_kobo || 0), "NGN", { unit: "kobo" })}</td>
                      <td>{formatDateTime(String(request.created_at || new Date().toISOString()))}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-sm text-[var(--acct-muted)]">
                      No wallet funding requests are waiting for review.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </OwnerPanel>

        <OwnerPanel
          title="Wallet withdrawal lane"
          description="Withdrawal requests that finance still needs to approve, reject, or complete with payout evidence."
        >
          <div className="overflow-x-auto">
            <table className="owner-table">
              <thead>
                <tr>
                  <th>Request</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {data.pendingWalletWithdrawals.length ? (
                  data.pendingWalletWithdrawals.map((request) => (
                    <tr key={String(request.id)}>
                      <td>{String(request.payout_reference || request.id || "Withdrawal request")}</td>
                      <td>
                        <StatusBadge status={String(request.status || "pending_review")} />
                      </td>
                      <td>{formatCurrencyAmount(Number(request.amount_kobo || 0), "NGN", { unit: "kobo" })}</td>
                      <td>{formatDateTime(String(request.created_at || new Date().toISOString()))}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-sm text-[var(--acct-muted)]">
                      No wallet withdrawals are waiting for payout review.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </OwnerPanel>
      </div>

      <OwnerPanel
        title="Recent money movement"
        description="A blended tail of revenue, shared invoices, wallet movement, and payment events across the company."
      >
        <div className="overflow-x-auto">
          <table className="owner-table">
            <thead>
              <tr>
                <th>Source</th>
                <th>Reference</th>
                <th>Status</th>
                <th>Amount</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {data.recentPayments.map((item) => (
                <tr key={item.id}>
                  <td>
                    <DivisionBadge division={item.division} />
                  </td>
                  <td>{item.label}</td>
                  <td>
                    <StatusBadge status={item.status} />
                  </td>
                  <td>{formatCurrencyAmount(item.amountNaira)}</td>
                  <td>{item.createdAt ? formatDateTime(item.createdAt) : "Unknown time"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </OwnerPanel>
    </div>
  );
}
