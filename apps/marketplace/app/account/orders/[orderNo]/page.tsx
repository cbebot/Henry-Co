import { notFound } from "next/navigation";
import { WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceUser } from "@/lib/marketplace/auth";
import { getOrderByNumber } from "@/lib/marketplace/data";
import { accountNav } from "@/lib/marketplace/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AccountOrderDetailPage({
  params,
}: {
  params: Promise<{ orderNo: string }>;
}) {
  await requireMarketplaceUser("/account/orders");
  const { orderNo } = await params;
  const order = await getOrderByNumber(orderNo);
  if (!order) notFound();

  return (
    <WorkspaceShell
      title={order.orderNo}
      description="Split-order clarity stays visible with vendor-level fulfillment and payment state broken out separately."
      nav={accountNav("/account/orders")}
    >
      <section className="market-paper rounded-[1.75rem] p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--market-muted)]">Placed</p>
            <p className="mt-2 text-lg font-semibold text-[var(--market-ink)]">{formatDate(order.placedAt)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--market-muted)]">Total</p>
            <p className="mt-2 text-lg font-semibold text-[var(--market-ink)]">{formatCurrency(order.grandTotal)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--market-muted)]">Payment</p>
            <p className="mt-2 text-lg font-semibold text-[var(--market-ink)]">{order.paymentStatus}</p>
          </div>
        </div>
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        {order.groups.map((group) => (
          <article key={group.id} className="market-paper rounded-[1.75rem] p-5">
            <p className="market-kicker">{group.ownerType === "company" ? "HenryCo segment" : group.vendorSlug}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--market-muted)]">Fulfillment</p>
                <p className="mt-2 text-lg font-semibold capitalize text-[var(--market-ink)]">{group.fulfillmentStatus}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--market-muted)]">Tracking</p>
                <p className="mt-2 text-lg font-semibold text-[var(--market-ink)]">{group.shipmentTrackingCode || "Pending"}</p>
              </div>
            </div>
          </article>
        ))}
      </section>
    </WorkspaceShell>
  );
}
