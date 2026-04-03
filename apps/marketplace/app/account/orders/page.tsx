import Link from "next/link";
import { EmptyState, WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceUser } from "@/lib/marketplace/auth";
import { getBuyerDashboardData } from "@/lib/marketplace/data";
import { accountNav } from "@/lib/marketplace/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AccountOrdersPage() {
  await requireMarketplaceUser("/account/orders");
  const data = await getBuyerDashboardData();

  return (
    <WorkspaceShell
      title="Orders"
      description="Each order keeps payment state, split fulfillment, and dispute context visible in one buyer-friendly timeline."
      nav={accountNav("/account/orders")}
    >
      {data.orders.length ? (
        <div className="space-y-4">
          {data.orders.map((order) => (
            <article key={order.orderNo} className="market-paper rounded-[1.75rem] p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="market-kicker">{order.orderNo}</p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--market-ink)]">
                    {formatCurrency(order.grandTotal)} • {order.status}
                  </h2>
                  <p className="mt-2 text-sm leading-7 text-[var(--market-muted)]">
                    {formatDate(order.placedAt)} · {order.groups.length} fulfillment segment{order.groups.length === 1 ? "" : "s"}
                  </p>
                </div>
                <Link href={`/account/orders/${order.orderNo}`} className="market-button-secondary rounded-full px-4 py-2 text-sm font-semibold">
                  View details
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No orders yet."
          body="The order history surface is ready. Once you check out, split-order tracking and payment verification history will show up here."
        />
      )}
    </WorkspaceShell>
  );
}
