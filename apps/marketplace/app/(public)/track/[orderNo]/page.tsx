import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ClipboardCheck, Lock, ShieldCheck, Truck } from "lucide-react";
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

  const payoutFrozen = order.groups.some((group) => group.payoutStatus === "payout_frozen");
  const showCompletionConfirm = order.groups.some(
    (group) =>
      group.fulfillmentStatus === "delivered" && group.payoutStatus !== "payout_released",
  );

  return (
    <main className="mx-auto max-w-7xl space-y-14 px-4 py-12 sm:px-6 lg:px-8">
      <section>
        <div className="grid gap-10 lg:grid-cols-[1.15fr,0.85fr] lg:items-end">
          <div>
            <p className="market-kicker text-[10.5px] uppercase tracking-[0.32em]">Order tracking</p>
            <h1 className="mt-4 text-balance text-[2.2rem] font-semibold leading-[1.06] tracking-[-0.025em] text-[var(--market-ink)] sm:text-[2.7rem] md:text-[3.1rem]">
              Tracking {order.orderNo}
            </h1>
            <p className="mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-[var(--market-muted)]">
              Split-order clarity stays visible here: every vendor segment, payment update, and
              fulfillment milestone gets its own row so support and buyer expectations stay aligned.
            </p>
          </div>
          <ul className="grid gap-3 text-sm">
            <li className="flex items-baseline gap-3 border-b border-[var(--market-line)] py-3">
              <ClipboardCheck className="h-3.5 w-3.5 text-[var(--market-brass)]" aria-hidden />
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
                Order value
              </span>
              <span className="ml-auto text-right text-sm font-semibold tracking-tight text-[var(--market-ink)]">
                {formatCurrency(order.grandTotal)}
              </span>
            </li>
            <li className="flex items-baseline gap-3 border-b border-[var(--market-line)] py-3">
              <ShieldCheck className="h-3.5 w-3.5 text-[var(--market-brass)]" aria-hidden />
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
                Payment
              </span>
              <span className="ml-auto text-right text-sm font-semibold capitalize tracking-tight text-[var(--market-ink)]">
                {order.paymentStatus}
              </span>
            </li>
            <li className="flex items-baseline gap-3 border-b border-[var(--market-line)] py-3 last:border-b-0">
              <Lock className="h-3.5 w-3.5 text-[var(--market-brass)]" aria-hidden />
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
                Payout control
              </span>
              <span className="ml-auto text-right text-sm font-semibold tracking-tight text-[var(--market-ink)]">
                {payoutFrozen ? "Frozen" : "Escrow active"}
              </span>
            </li>
          </ul>
        </div>
      </section>

      {order.paymentRecord ? (
        <section className="market-paper rounded-[2rem] p-6 sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="market-kicker text-[10.5px] uppercase tracking-[0.28em]">
                Payment record
              </p>
              <h2 className="mt-3 text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--market-ink)] sm:text-[1.85rem]">
                {order.paymentRecord.reference}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--market-muted)]">
                {order.paymentRecord.method === "wallet_balance"
                  ? "Wallet balance was debited and the order is held in escrow for fulfillment."
                  : order.paymentRecord.proofUrl
                    ? "Transfer proof is attached for HenryCo finance review."
                    : "Payment is waiting for finance evidence or delivery reconciliation."}
              </p>
            </div>
            <dl className="grid gap-3 text-sm sm:grid-cols-3 lg:min-w-[520px]">
              <div className="rounded-[1.2rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.03)] p-4">
                <dt className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--market-muted)]">
                  Method
                </dt>
                <dd className="mt-1 font-semibold capitalize text-[var(--market-ink)]">
                  {order.paymentRecord.method.replace(/_/g, " ")}
                </dd>
              </div>
              <div className="rounded-[1.2rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.03)] p-4">
                <dt className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--market-muted)]">
                  Status
                </dt>
                <dd className="mt-1 font-semibold capitalize text-[var(--market-ink)]">
                  {order.paymentRecord.status.replace(/_/g, " ")}
                </dd>
              </div>
              <div className="rounded-[1.2rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.03)] p-4">
                <dt className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--market-muted)]">
                  Proof
                </dt>
                <dd className="mt-1 font-semibold text-[var(--market-ink)]">
                  {order.paymentRecord.proofUrl ? (
                    <a
                      href={order.paymentRecord.proofUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[var(--market-brass)]"
                    >
                      {order.paymentRecord.proofName || "View proof"}
                    </a>
                  ) : order.paymentRecord.walletTransactionId ? (
                    "Wallet debit"
                  ) : (
                    "Pending"
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </section>
      ) : null}

      <section className="grid gap-12 lg:grid-cols-[0.95fr,1.05fr] lg:divide-x lg:divide-[var(--market-line)]">
        <div>
          <p className="market-kicker text-[10.5px] uppercase tracking-[0.28em]">Timeline</p>
          <h2 className="mt-3 text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--market-ink)] sm:text-[1.85rem]">
            Customer-visible milestones, in order.
          </h2>
          <ol className="mt-6 divide-y divide-[var(--market-line)] border-y border-[var(--market-line)]">
            {order.timeline.map((step: string, i: number) => (
              <li
                key={step}
                className="grid gap-3 py-4 sm:grid-cols-[auto,1fr] sm:gap-6"
              >
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--market-brass)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-sm font-medium text-[var(--market-ink)]">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="lg:pl-12">
          <p className="market-kicker text-[10.5px] uppercase tracking-[0.28em]">
            Vendor segments
          </p>
          <h2 className="mt-3 text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--market-ink)] sm:text-[1.85rem]">
            Each vendor stays accountable to its own dispatch.
          </h2>
          <ul className="mt-6 divide-y divide-[var(--market-line)] border-y border-[var(--market-line)]">
            {order.groups.map((group) => (
              <li key={group.id} className="py-5">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-brass)]">
                    {group.ownerType === "company" ? "HenryCo segment" : group.vendorSlug}
                  </p>
                  <Truck className="h-3.5 w-3.5 text-[var(--market-muted)]" aria-hidden />
                </div>
                <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--market-muted)]">
                      Fulfillment
                    </dt>
                    <dd className="mt-0.5 text-base font-semibold capitalize tracking-tight text-[var(--market-ink)]">
                      {group.fulfillmentStatus}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--market-muted)]">
                      Tracking
                    </dt>
                    <dd className="mt-0.5 text-base font-semibold tracking-tight text-[var(--market-ink)]">
                      {group.shipmentTrackingCode || "Pending"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--market-muted)]">
                      Payout
                    </dt>
                    <dd className="mt-0.5 text-base font-semibold capitalize tracking-tight text-[var(--market-ink)]">
                      {group.payoutStatus.replace(/_/g, " ")}
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {showCompletionConfirm ? (
        <section className="border-l-2 border-[var(--market-brass)]/55 pl-5">
          <p className="market-kicker text-[10.5px] uppercase tracking-[0.22em]">
            Completion confirmation
          </p>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--market-muted)]">
            Confirm completion once the order is satisfactory. HenryCo only releases seller payout
            after delivery is confirmed or the order qualifies for auto-release.
          </p>
          <form action="/api/marketplace" method="POST" className="mt-4 flex flex-wrap gap-3">
            <input type="hidden" name="intent" value="order_confirm_completion" />
            <input type="hidden" name="order_no" value={order.orderNo} />
            <input type="hidden" name="return_to" value={`/track/${order.orderNo}`} />
            <button className="market-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold">
              Confirm completion
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </section>
      ) : null}

      <section className="border-t border-[var(--market-line)] pt-10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="market-kicker text-[10.5px] uppercase tracking-[0.28em]">Need help?</p>
            <h2 className="mt-3 text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--market-ink)] sm:text-[1.85rem]">
              Disputes, refunds, and delivery concerns route through one thread.
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--market-muted)]">
              Open a support thread with this order number attached so the agent sees the full
              timeline and vendor split without you re-typing it.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/help?order=${order.orderNo}`}
              className="market-button-primary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
            >
              Open support thread
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/account/orders"
              className="market-button-secondary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
            >
              View all orders
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
