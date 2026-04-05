import { notFound } from "next/navigation";
import { MetricCard, PageIntro } from "@/components/marketplace/shell";
import { getOrderByNumber } from "@/lib/marketplace/data";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TrackOrderPage({
  params,
}: {
  params: Promise<{ orderNo: string }>;
}) {
  const { orderNo } = await params;
  const order = await getOrderByNumber(orderNo);
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <PageIntro
        kicker="Order tracking"
        title={`Tracking ${order.orderNo}`}
        description="Split-order clarity stays visible here: every vendor segment, payment update, and fulfillment milestone gets its own card so support and buyer expectations stay aligned."
      />

      <div className="grid gap-5 md:grid-cols-3">
        <MetricCard label="Order value" value={formatCurrency(order.grandTotal)} hint="Grand total including shipping." />
        <MetricCard label="Payment state" value={order.paymentStatus} hint="Updated after payment review or cash-on-delivery confirmation." />
        <MetricCard
          label="Payout control"
          value={order.groups.some((group) => group.payoutStatus === "payout_frozen") ? "Frozen" : "Escrow active"}
          hint="Seller payout is released only after the order is properly completed."
        />
      </div>

      <section className="market-panel rounded-[2rem] p-6">
        <p className="market-kicker">Timeline</p>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            {order.timeline.map((step: string) => (
              <div key={step} className="rounded-[1.5rem] border border-[var(--market-line)] bg-[var(--market-bg-soft)] px-4 py-4 text-sm font-medium text-[var(--market-ink)]">
                {step}
              </div>
            ))}
          </div>
          <div className="space-y-4">
            {order.groups.map((group) => (
              <article key={group.id} className="market-paper rounded-[1.5rem] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--market-muted)]">
                  {group.ownerType === "company" ? "HenryCo segment" : group.vendorSlug}
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--market-muted)]">Fulfillment</p>
                    <p className="mt-1 text-lg font-semibold capitalize text-[var(--market-ink)]">{group.fulfillmentStatus}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--market-muted)]">Tracking</p>
                    <p className="mt-1 text-lg font-semibold text-[var(--market-ink)]">{group.shipmentTrackingCode || "Pending"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--market-muted)]">Payout</p>
                    <p className="mt-1 text-lg font-semibold capitalize text-[var(--market-ink)]">{group.payoutStatus.replace(/_/g, " ")}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {order.groups.some((group) => group.fulfillmentStatus === "delivered" && group.payoutStatus !== "payout_released") ? (
        <section className="market-paper rounded-[2rem] p-6">
          <p className="market-kicker">Completion confirmation</p>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--market-muted)]">
            Confirm completion once the order is satisfactory. HenryCo only releases seller payout after delivery is confirmed or the order qualifies for auto-release.
          </p>
          <form action="/api/marketplace" method="POST" className="mt-5 flex flex-wrap gap-3">
            <input type="hidden" name="intent" value="order_confirm_completion" />
            <input type="hidden" name="order_no" value={order.orderNo} />
            <input type="hidden" name="return_to" value={`/track/${order.orderNo}`} />
            <button className="market-button-primary rounded-full px-5 py-3 text-sm font-semibold">Confirm completion</button>
          </form>
        </section>
      ) : null}
    </div>
  );
}
