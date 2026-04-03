import { EmptyState, WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceUser } from "@/lib/marketplace/auth";
import { getBuyerDashboardData } from "@/lib/marketplace/data";
import { accountNav } from "@/lib/marketplace/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AccountPaymentsPage() {
  await requireMarketplaceUser("/account/payments");
  const data = await getBuyerDashboardData();

  return (
    <WorkspaceShell
      title="Payments"
      description="Payment verification stays visible next to the order reference so bank-transfer review never feels opaque."
      nav={accountNav("/account/payments")}
    >
      {data.payments.length ? (
        <div className="space-y-4">
          {data.payments.map((payment) => (
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
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="No payment records yet." body="Payment evidence and COD state updates will appear here after checkout." />
      )}
    </WorkspaceShell>
  );
}
