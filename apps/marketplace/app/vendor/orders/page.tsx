import { translateSurfaceLabel } from "@henryco/i18n";
import { MarketplaceActionForm } from "@/components/marketplace/actions/MarketplaceActionForm";
import { WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceRoles } from "@/lib/marketplace/auth";
import { getVendorWorkspaceData } from "@/lib/marketplace/data";
import { vendorWorkspaceNav } from "@/lib/marketplace/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getMarketplacePublicLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

export default async function VendorOrdersPage() {
  const locale = await getMarketplacePublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  await requireMarketplaceRoles(["vendor", "marketplace_owner", "marketplace_admin"], "/vendor/orders");
  const data = await getVendorWorkspaceData();

  return (
    <WorkspaceShell
      title="Orders"
      description="Seller order handling stays segmented by fulfillment state and payment readiness."
      {...vendorWorkspaceNav("/vendor/orders", locale)}
    >
      <div className="space-y-4">
        {data.orders.map((order) => (
          <article key={order.id} className="market-paper rounded-[1.75rem] p-5">
            <p className="market-kicker">{order.orderNo}</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--market-ink)]">{formatCurrency(order.subtotal)}</h2>
            <p className="mt-2 text-sm leading-7 text-[var(--market-muted)]">
              {formatDate(order.placedAt)} · {order.fulfillmentStatus} · {order.paymentStatus} · payout {order.payoutStatus.replace(/_/g, " ")}
            </p>
            <p className="mt-2 text-sm font-medium text-[var(--market-brass)]">
              Net vendor settlement: {formatCurrency(order.netVendorAmount)}
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
              <select name="fulfillment_status" className="market-select rounded-2xl px-4 py-3" defaultValue={order.fulfillmentStatus}>
                {["confirmed", "packed", "shipped", "delivered", "delayed"].map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <input name="shipment_carrier" className="market-input rounded-2xl px-4 py-3" placeholder="Carrier" />
              <input name="shipment_tracking_code" className="market-input rounded-2xl px-4 py-3" placeholder="Tracking code" />
            </MarketplaceActionForm>
          </article>
        ))}
      </div>
    </WorkspaceShell>
  );
}
