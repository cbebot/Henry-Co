import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ClipboardCheck, Lock, ShieldCheck, Truck } from "lucide-react";
import { getOrderForViewer } from "@/lib/marketplace/data";
import { getMarketplaceViewer } from "@/lib/marketplace/auth";
import { formatCurrency } from "@/lib/utils";
import { getMarketplacePublicLocale } from "@/lib/locale-server";
import { getMarketplacePublicCopy } from "@/lib/public-copy";
import { PlacementAcknowledgement } from "@/components/marketplace/placement-acknowledgement";

export const dynamic = "force-dynamic";

// Buyer-safe humanizers. The order/payment/payout enums are internal
// operational states; surfacing the raw column value to a buyer (who may reach
// this page with only an order number) both reads as jargon and leaks internal
// wording. These map known states to reassuring buyer-facing language and fall
// back to a clean humanized form for anything unrecognised — never the raw
// underscore enum.
function humanizeEnum(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function buyerPaymentStatusLabel(status: string): string {
  switch (status) {
    case "pending":
    case "awaiting_payment":
    case "proof_submitted":
    case "processing":
      return "Confirming";
    case "paid":
    case "verified":
    case "confirmed":
    case "paid_held":
      return "Confirmed";
    case "refunded":
      return "Refunded";
    case "failed":
      return "Not confirmed";
    default:
      return humanizeEnum(status);
  }
}

function buyerFulfillmentStatusLabel(status: string): string {
  switch (status) {
    case "pending":
    case "awaiting_fulfillment":
      return "Awaiting dispatch";
    case "fulfillment_in_progress":
    case "processing":
    case "preparing":
      return "Being prepared";
    case "shipped":
    case "dispatched":
    case "in_transit":
      return "On the way";
    case "delivered":
      return "Delivered";
    case "cancelled":
    case "canceled":
      return "Cancelled";
    default:
      return humanizeEnum(status);
  }
}

function buyerPayoutStatusLabel(status: string): string {
  switch (status) {
    case "payout_released":
      return "Order complete";
    case "payout_frozen":
      return "Under review";
    default:
      // held / eligible / awaiting_auto_release / requested / approved etc. all
      // read the same to a buyer: their payment is protected until completion.
      return "In buyer protection";
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getMarketplacePublicLocale();
  const copy = getMarketplacePublicCopy(locale);
  return {
    title: copy.track.metadata.title,
    description: copy.track.metadata.description,
  };
}

export default async function TrackOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNo: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { orderNo } = await params;
  const search = (await searchParams) ?? {};
  const justPlaced = search.placed === "1";
  // F-01: the order is fetched via `service_role` keyed on the brute-forceable
  // order_no, so it must be gated on ownership — exactly as the sibling /pay
  // surface already does. A signed-out or non-owning viewer gets `null` → the
  // graceful track recovery page, never buyer PII or the bank-receipt proof.
  const [locale, viewer] = await Promise.all([
    getMarketplacePublicLocale(),
    getMarketplaceViewer(),
  ]);
  const order = await getOrderForViewer(orderNo, viewer);
  if (!order) notFound();
  const copy = getMarketplacePublicCopy(locale);
  const t = copy.track;

  const payoutFrozen = order.groups.some((group) => group.payoutStatus === "payout_frozen");
  const showCompletionConfirm = order.groups.some(
    (group) =>
      group.fulfillmentStatus === "delivered" && group.payoutStatus !== "payout_released",
  );

  return (
    <main className="mx-auto max-w-7xl space-y-14 px-4 py-12 sm:px-6 lg:px-8">
      {justPlaced ? (
        <PlacementAcknowledgement
          orderNo={order.orderNo}
          paymentMethod={order.paymentRecord?.method ?? null}
          buyerEmail={order.buyerEmail || null}
          grandTotal={order.grandTotal}
          currency={order.currency}
        />
      ) : null}

      <section>
        <div className="grid gap-10 lg:grid-cols-[1.15fr,0.85fr] lg:items-end">
          <div>
            <p className="market-kicker text-[10.5px] uppercase tracking-[0.32em]">{t.hero.kicker}</p>
            <h1 className="mt-4 text-balance text-[2.2rem] font-semibold leading-[1.06] tracking-[-0.025em] text-[var(--market-ink)] sm:text-[2.7rem] md:text-[3.1rem]">
              {t.hero.titlePrefix} {order.orderNo}
            </h1>
            <p className="mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-[var(--market-muted)]">
              {t.hero.body}
            </p>
          </div>
          <ul className="grid gap-3 text-sm">
            <li className="flex items-baseline gap-3 border-b border-[var(--market-line)] py-3">
              <ClipboardCheck className="h-3.5 w-3.5 text-[var(--market-brass)]" aria-hidden />
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
                {t.hero.orderValueLabel}
              </span>
              <span className="ml-auto text-right text-sm font-semibold tracking-tight text-[var(--market-ink)]">
                {formatCurrency(order.grandTotal)}
              </span>
            </li>
            <li className="flex items-baseline gap-3 border-b border-[var(--market-line)] py-3">
              <ShieldCheck className="h-3.5 w-3.5 text-[var(--market-brass)]" aria-hidden />
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
                {t.hero.paymentLabel}
              </span>
              <span className="ml-auto text-right text-sm font-semibold capitalize tracking-tight text-[var(--market-ink)]">
                {buyerPaymentStatusLabel(order.paymentStatus)}
              </span>
            </li>
            <li className="flex items-baseline gap-3 border-b border-[var(--market-line)] py-3 last:border-b-0">
              <Lock className="h-3.5 w-3.5 text-[var(--market-brass)]" aria-hidden />
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
                {t.hero.payoutControlLabel}
              </span>
              <span className="ml-auto text-right text-sm font-semibold tracking-tight text-[var(--market-ink)]">
                {payoutFrozen ? t.hero.payoutFrozen : t.hero.payoutEscrowActive}
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
                {t.paymentRecord.kicker}
              </p>
              <h2 className="mt-3 text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--market-ink)] sm:text-[1.85rem]">
                {order.paymentRecord.reference}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--market-muted)]">
                {order.paymentRecord.method === "wallet_balance"
                  ? t.paymentRecord.walletBody
                  : order.paymentRecord.proofUrl
                    ? t.paymentRecord.proofBody
                    : t.paymentRecord.awaitingBody}
              </p>
            </div>
            <dl className="grid gap-3 text-sm sm:grid-cols-3 lg:min-w-[520px]">
              <div className="rounded-[1.2rem] border border-[var(--market-line)] bg-[var(--home-surface-02)] p-4">
                <dt className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--market-muted)]">
                  {t.paymentRecord.methodLabel}
                </dt>
                <dd className="mt-1 font-semibold capitalize text-[var(--market-ink)]">
                  {order.paymentRecord.method.replace(/_/g, " ")}
                </dd>
              </div>
              <div className="rounded-[1.2rem] border border-[var(--market-line)] bg-[var(--home-surface-02)] p-4">
                <dt className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--market-muted)]">
                  {t.paymentRecord.statusLabel}
                </dt>
                <dd className="mt-1 font-semibold capitalize text-[var(--market-ink)]">
                  {buyerPaymentStatusLabel(order.paymentRecord.status)}
                </dd>
              </div>
              <div className="rounded-[1.2rem] border border-[var(--market-line)] bg-[var(--home-surface-02)] p-4">
                <dt className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--market-muted)]">
                  {t.paymentRecord.proofLabel}
                </dt>
                <dd className="mt-1 font-semibold text-[var(--market-ink)]">
                  {order.paymentRecord.proofUrl ? (
                    <a
                      href={order.paymentRecord.proofUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[var(--market-brass)]"
                    >
                      {order.paymentRecord.proofName || t.paymentRecord.viewProof}
                    </a>
                  ) : order.paymentRecord.walletTransactionId ? (
                    t.paymentRecord.walletDebit
                  ) : (
                    t.paymentRecord.pending
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </section>
      ) : null}

      <section className="grid gap-12 lg:grid-cols-[0.95fr,1.05fr] lg:divide-x lg:divide-[var(--market-line)]">
        <div>
          <p className="market-kicker text-[10.5px] uppercase tracking-[0.28em]">{t.timeline.kicker}</p>
          <h2 className="mt-3 text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--market-ink)] sm:text-[1.85rem]">
            {t.timeline.title}
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
            {t.segments.kicker}
          </p>
          <h2 className="mt-3 text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--market-ink)] sm:text-[1.85rem]">
            {t.segments.title}
          </h2>
          <ul className="mt-6 divide-y divide-[var(--market-line)] border-y border-[var(--market-line)]">
            {order.groups.map((group) => (
              <li key={group.id} className="py-5">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-brass)]">
                    {group.ownerType === "company" ? t.segments.henrycoSegment : group.vendorSlug}
                  </p>
                  <Truck className="h-3.5 w-3.5 text-[var(--market-muted)]" aria-hidden />
                </div>
                <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--market-muted)]">
                      {t.segments.fulfillmentLabel}
                    </dt>
                    <dd className="mt-0.5 text-base font-semibold capitalize tracking-tight text-[var(--market-ink)]">
                      {buyerFulfillmentStatusLabel(group.fulfillmentStatus)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--market-muted)]">
                      {t.segments.trackingLabel}
                    </dt>
                    <dd className="mt-0.5 text-base font-semibold tracking-tight text-[var(--market-ink)]">
                      {group.shipmentTrackingCode || t.segments.trackingPending}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--market-muted)]">
                      {t.segments.payoutLabel}
                    </dt>
                    <dd className="mt-0.5 text-base font-semibold capitalize tracking-tight text-[var(--market-ink)]">
                      {buyerPayoutStatusLabel(group.payoutStatus)}
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
            {t.completion.kicker}
          </p>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--market-muted)]">
            {t.completion.body}
          </p>
          <form action="/api/marketplace" method="POST" className="mt-4 flex flex-wrap gap-3">
            <input type="hidden" name="intent" value="order_confirm_completion" />
            <input type="hidden" name="order_no" value={order.orderNo} />
            <input type="hidden" name="return_to" value={`/track/${order.orderNo}`} />
            <button className="market-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold">
              {t.completion.confirmCta}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </section>
      ) : null}

      <section className="border-t border-[var(--market-line)] pt-10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="market-kicker text-[10.5px] uppercase tracking-[0.28em]">{t.help.kicker}</p>
            <h2 className="mt-3 text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--market-ink)] sm:text-[1.85rem]">
              {t.help.title}
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--market-muted)]">
              {t.help.body}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/help?order=${order.orderNo}`}
              className="market-button-primary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
            >
              {t.help.openSupportCta}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/account/orders"
              className="market-button-secondary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
            >
              {t.help.viewAllOrdersCta}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
