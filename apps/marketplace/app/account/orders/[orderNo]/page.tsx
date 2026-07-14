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

// Buyer-facing labels: raw payment/fulfilment/payout enum values never reach
// the buyer. Unknown values fall back to a calm title-cased form. Wording is
// buyer-first ("Protected until delivery") rather than internal payout state.
function humanizeEnum(value: string): string {
  const spaced = value.replace(/_/g, " ").trim();
  if (spaced === "") return "";
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function buyerPaymentStatusLabel(status: string, t: (label: string) => string): string {
  switch (status) {
    case "pending":
    case "awaiting_payment":
      return t("Awaiting payment");
    case "receipt_submitted":
      return t("Confirming your payment");
    case "verified":
    case "paid":
      return t("Payment confirmed");
    case "failed":
      return t("Payment failed");
    case "refunded":
      return t("Refunded");
    default:
      return humanizeEnum(status);
  }
}

function buyerFulfillmentStatusLabel(status: string, t: (label: string) => string): string {
  switch (status) {
    case "awaiting_acceptance":
      return t("Awaiting seller");
    case "confirmed":
      return t("Confirmed");
    case "fulfillment_in_progress":
      return t("Being prepared");
    case "packed":
      return t("Packed");
    case "shipped":
      return t("Shipped");
    case "delivered":
      return t("Delivered");
    case "delivered_pending_confirmation":
      return t("Delivered, awaiting your confirmation");
    case "delayed":
      return t("Delayed");
    case "returned":
      return t("Returned");
    default:
      return humanizeEnum(status);
  }
}

// Buyer-facing "order protection" wording for the seller payout state.
function buyerProtectionLabel(status: string, t: (label: string) => string): string {
  switch (status) {
    case "awaiting_payment":
    case "pending":
      return t("Awaiting payment");
    case "paid_held":
    case "delivered_pending_confirmation":
    case "awaiting_auto_release":
    case "payout_releasable":
    case "eligible":
    case "requested":
    case "under_review":
    case "approved":
    case "scheduled":
      return t("Protected until you confirm");
    case "payout_frozen":
    case "frozen":
    case "disputed":
      return t("Under review");
    case "refunded":
      return t("Refunded");
    case "partially_refunded":
      return t("Partially refunded");
    case "payout_released":
    case "released":
    case "paid":
      return t("Completed");
    default:
      return humanizeEnum(status);
  }
}

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

  const t = (label: string) => translateSurfaceLabel(locale, label);

  return (
    <WorkspaceShell
      title={order.orderNo}
      description="See each part of your order — its delivery progress and payment — broken out clearly."
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
            <p className="mt-2 text-lg font-semibold text-[var(--market-ink)]">{buyerPaymentStatusLabel(order.paymentStatus, t)}</p>
          </div>
        </div>
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        {order.groups.map((group) => (
          <article key={group.id} className="market-paper rounded-[1.75rem] p-5">
            <p className="market-kicker">{group.ownerType === "company" ? "Henry Onyx segment" : group.vendorSlug}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--market-muted)]">Fulfillment</p>
                <p className="mt-2 text-lg font-semibold text-[var(--market-ink)]">{buyerFulfillmentStatusLabel(group.fulfillmentStatus, t)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--market-muted)]">Tracking</p>
                <p className="mt-2 text-lg font-semibold text-[var(--market-ink)]">{group.shipmentTrackingCode || "Pending"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--market-muted)]">Order protection</p>
                <p className="mt-2 text-lg font-semibold text-[var(--market-ink)]">{buyerProtectionLabel(group.payoutStatus, t)}</p>
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
          <p className="market-kicker">Buyer protection</p>
          <p className="mt-3 text-sm leading-7 text-[var(--market-muted)]">
            Confirm completion when your delivered order is right. Until you confirm, the seller&rsquo;s payment stays protected — and it releases automatically if you don&rsquo;t confirm within the protection window.
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
