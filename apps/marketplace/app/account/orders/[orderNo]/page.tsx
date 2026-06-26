import Link from "next/link";
import { notFound } from "next/navigation";
import { translateSurfaceLabel } from "@henryco/i18n";
import { WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceUser } from "@/lib/marketplace/auth";
import { getBuyerDashboardData } from "@/lib/marketplace/data";
import { accountWorkspaceNav } from "@/lib/marketplace/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getMarketplacePublicLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

export default async function AccountOrderDetailPage({
  params,
}: {
  params: Promise<{ orderNo: string }>;
}) {
  const locale = await getMarketplacePublicLocale();
  await requireMarketplaceUser("/account/orders");
  const { orderNo } = await params;
  const { orders } = await getBuyerDashboardData();
  const order = orders.find((candidate) => candidate.orderNo === orderNo);
  if (!order) notFound();

  return (
    <WorkspaceShell
      title={order.orderNo}
      description="Split-order clarity stays visible with vendor-level fulfillment and payment state broken out separately."
      {...accountWorkspaceNav("/account/orders", locale)}
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
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--market-muted)]">Fulfillment</p>
                <p className="mt-2 text-lg font-semibold capitalize text-[var(--market-ink)]">{group.fulfillmentStatus}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--market-muted)]">Tracking</p>
                <p className="mt-2 text-lg font-semibold text-[var(--market-ink)]">{group.shipmentTrackingCode || "Pending"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--market-muted)]">Payout status</p>
                <p className="mt-2 text-lg font-semibold capitalize text-[var(--market-ink)]">{group.payoutStatus.replace(/_/g, " ")}</p>
              </div>
            </div>
            {/* The Onyx Line (WS-4) — contact-safe "Message seller about this
                order". Flag-gated dark; anchors to this order (UUID) + vendor. */}
            {process.env.MARKETPLACE_MESSAGING_ENABLED === "1" && group.vendorId ? (
              <Link
                href={`/account/messages/new?anchor_type=order&anchor_id=${order.id}&vendor_id=${group.vendorId}`}
                className="market-button-secondary mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold"
              >
                {translateSurfaceLabel(locale, "Message seller about this order")}
              </Link>
            ) : null}
          </article>
        ))}
      </section>
      {order.groups.some((group) => group.fulfillmentStatus === "delivered" && group.payoutStatus !== "payout_released") ? (
        <section className="market-paper rounded-[1.75rem] p-6">
          <p className="market-kicker">Buyer protection control</p>
          <p className="mt-3 text-sm leading-7 text-[var(--market-muted)]">
            Confirm completion when the delivered order is satisfactory. HenryCo keeps seller payout in escrow until confirmation or timeout logic clears the segment.
          </p>
          <form action="/api/marketplace" method="POST" className="mt-5 flex flex-wrap gap-3">
            <input type="hidden" name="intent" value="order_confirm_completion" />
            <input type="hidden" name="order_no" value={order.orderNo} />
            <input type="hidden" name="return_to" value={`/account/orders/${order.orderNo}`} />
            <button className="market-button-primary rounded-full px-5 py-3 text-sm font-semibold">Confirm completion</button>
          </form>
        </section>
      ) : null}
    </WorkspaceShell>
  );
}
