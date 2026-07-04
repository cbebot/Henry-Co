import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { translateSurfaceLabel } from "@henryco/i18n";
import { MarketplaceActionForm } from "@/components/marketplace/actions/MarketplaceActionForm";
import { EmptyState, WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceRoles } from "@/lib/marketplace/auth";
import { getVendorWorkspaceData } from "@/lib/marketplace/data";
import { vendorWorkspaceNav } from "@/lib/marketplace/navigation";
import {
  fulfillmentStatusLabel,
  paymentStatusLabel,
  payoutStatusLabel,
} from "@/lib/marketplace/vendor/labels";
import { formatVendorMoney } from "@/lib/marketplace/vendor/money";
import { VENDOR_FULFILLMENT_OPTIONS } from "@/lib/marketplace/vendor/orders";
import { formatDate } from "@/lib/utils";
import { getMarketplacePublicLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

export default async function VendorOrdersPage() {
  const locale = await getMarketplacePublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  await requireMarketplaceRoles(["vendor", "marketplace_owner", "marketplace_admin"], "/vendor/orders");
  const data = await getVendorWorkspaceData();
  // Settlement rows carry whole naira; the display seam takes kobo.
  const money = (naira: number) => formatVendorMoney(Math.round(naira * 100), locale);

  return (
    <WorkspaceShell
      title={t("Orders")}
      description={t("Seller order handling stays segmented by fulfilment state and payment readiness.")}
      {...vendorWorkspaceNav("/vendor/orders", locale)}
    >
      {data.orders.length === 0 ? (
        <EmptyState
          title={t("No orders yet")}
          body={t("Orders appear here the moment a buyer checks out with one of your products.")}
          ctaHref="/vendor/products"
          ctaLabel={t("Review your products")}
        />
      ) : (
        <div className="space-y-4">
          {data.orders.map((order) => (
            <article key={order.id} className="market-paper rounded-[1.75rem] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="market-kicker">{order.orderNo}</p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--market-ink)]">
                    {money(order.subtotal)}
                  </h2>
                </div>
                <Link
                  href={`/vendor/orders/${order.id}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--market-line)] px-4 py-2 text-sm font-semibold text-[var(--market-ink)] transition hover:border-[var(--market-brass)]/55"
                >
                  {t("View order")}
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
              <p className="mt-2 text-sm leading-7 text-[var(--market-muted)]">
                {formatDate(order.placedAt)} · {fulfillmentStatusLabel(order.fulfillmentStatus, t)} ·{" "}
                {paymentStatusLabel(order.paymentStatus, t)} · {payoutStatusLabel(order.payoutStatus, t)}
              </p>
              <p className="mt-2 text-sm font-medium text-[var(--market-brass)]">
                {t("Net settlement: {amount}").replace("{amount}", money(order.netVendorAmount))}
              </p>
              <MarketplaceActionForm
                intent="vendor_order_update"
                hidden={{ order_group_id: order.id, return_to: "/vendor/orders" }}
                submitLabel={t("Update")}
                pendingLabel={t("Updating order")}
                successTitle={t("Order updated.")}
                successBody={t("The buyer sees the new fulfilment state on their tracking page.")}
                errorTitle={t("Order could not be updated.")}
                className="mt-4 grid gap-3 md:grid-cols-[1fr,1fr,1fr,auto]"
                buttonClassName="market-button-primary rounded-full px-4 py-3 text-sm font-semibold disabled:cursor-wait disabled:opacity-80"
              >
                <select
                  name="fulfillment_status"
                  aria-label={t("Fulfilment state")}
                  className="market-select rounded-2xl px-4 py-3"
                  defaultValue={order.fulfillmentStatus}
                >
                  {VENDOR_FULFILLMENT_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {fulfillmentStatusLabel(status, t)}
                    </option>
                  ))}
                </select>
                <input
                  name="shipment_carrier"
                  className="market-input rounded-2xl px-4 py-3"
                  placeholder={t("Carrier")}
                  defaultValue={order.shipmentCarrier}
                />
                <input
                  name="shipment_tracking_code"
                  className="market-input rounded-2xl px-4 py-3"
                  placeholder={t("Tracking code")}
                  defaultValue={order.shipmentTrackingCode}
                />
              </MarketplaceActionForm>
            </article>
          ))}
        </div>
      )}
    </WorkspaceShell>
  );
}
