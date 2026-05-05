import { EmptyState, WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceUser } from "@/lib/marketplace/auth";
import { getBuyerDashboardData } from "@/lib/marketplace/data";
import type { MarketplacePaymentRecord } from "@/lib/marketplace/types";
import { accountWorkspaceNav } from "@/lib/marketplace/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AccountPaymentsPage() {
  await requireMarketplaceUser("/account/payments");
  const data = await getBuyerDashboardData();

  return (
    <WorkspaceShell
      title="Payments"
      description="Payment verification stays visible next to the order reference so bank-transfer review never feels opaque."
      {...accountWorkspaceNav("/account/payments")}
    >
      {data.payments.length ? (
        <div className="space-y-4">
          {data.payments.map((payment: MarketplacePaymentRecord) => (
            <article key={payment.id} className="market-paper rounded-[1.75rem] p-5">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="market-kicker">{payment.orderNo}</p>
                  <p className="mt-2 text-xl font-semibold text-[var(--market-ink)]">{formatCurrency(payment.amount)}</p>
                </div>
                <div className="text-sm text-[var(--market-muted)]">
                  <p className="font-semibold capitalize text-[var(--market-ink)]">{payment.status}</p>
                  <p>{payment.verifiedAt ? formatDate(payment.verifiedAt) : "Awaiting review"}</p>
                </div>
              </div>
              <dl className="mt-4 grid gap-3 border-t border-[var(--market-line)] pt-4 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--market-muted)]">
                    Method
                  </dt>
                  <dd className="mt-1 font-semibold capitalize text-[var(--market-ink)]">
                    {payment.method.replace(/_/g, " ")}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--market-muted)]">
                    HenryCo reference
                  </dt>
                  <dd className="mt-1 font-semibold text-[var(--market-ink)]">{payment.reference}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--market-muted)]">
                    Proof
                  </dt>
                  <dd className="mt-1 font-semibold text-[var(--market-ink)]">
                    {payment.proofUrl ? (
                      <a href={payment.proofUrl} target="_blank" rel="noreferrer" className="text-[var(--market-brass)]">
                        {payment.proofName || "View proof"}
                      </a>
                    ) : payment.walletTransactionId ? (
                      "Wallet debit recorded"
                    ) : (
                      "Not uploaded"
                    )}
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="No payment records yet." body="Payment evidence and COD state updates will appear here after checkout." />
      )}
    </WorkspaceShell>
  );
}
