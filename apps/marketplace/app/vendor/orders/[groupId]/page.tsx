import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { translateSurfaceLabel } from "@henryco/i18n";
import { MarketplaceActionForm } from "@/components/marketplace/actions/MarketplaceActionForm";
import { WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceRoles } from "@/lib/marketplace/auth";
import { getVendorWorkspaceData } from "@/lib/marketplace/data";
import { vendorWorkspaceNav } from "@/lib/marketplace/navigation";
import {
  fulfillmentStatusLabel,
  paymentStatusLabel,
  payoutStatusLabel,
} from "@/lib/marketplace/vendor/labels";
import { formatVendorMoney } from "@/lib/marketplace/vendor/money";
import { deriveOrderTimeline, VENDOR_FULFILLMENT_OPTIONS } from "@/lib/marketplace/vendor/orders";
import { createAdminSupabase } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";
import { getMarketplacePublicLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

type OrderItemLine = {
  id: string;
  title: string;
  quantity: number;
  lineTotal: number;
};

/**
 * Buyer-safe items for one of the vendor's own order groups: title snapshot,
 * quantity, and money only — never buyer identity or shipping detail beyond
 * what the orders list already shows.
 */
async function getOrderGroupItems(groupId: string): Promise<OrderItemLine[]> {
  try {
    const admin = createAdminSupabase();
    const { data } = await admin
      .from("marketplace_order_items")
      .select("id, quantity, line_total, title_snapshot")
      .eq("order_group_id", groupId);
    return ((data ?? []) as Array<Record<string, unknown>>).map((row) => {
      const snapshot =
        row.title_snapshot && typeof row.title_snapshot === "object"
          ? (row.title_snapshot as Record<string, unknown>)
          : {};
      return {
        id: String(row.id),
        title: snapshot.title ? String(snapshot.title) : "",
        quantity: Number(row.quantity || 0),
        lineTotal: Number(row.line_total || 0),
      };
    });
  } catch {
    return [];
  }
}

const TIMELINE_DOT_CLASS: Record<string, string> = {
  done: "bg-[var(--market-brass)] border-[var(--market-brass)]",
  current: "bg-transparent border-[var(--market-brass)]",
  attention: "bg-[var(--market-alert)] border-[var(--market-alert)]",
  upcoming: "bg-transparent border-[var(--market-line-strong)]",
};

export default async function VendorOrderDetailPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const locale = await getMarketplacePublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  await requireMarketplaceRoles(["vendor", "marketplace_owner", "marketplace_admin"], "/vendor/orders");
  const { groupId } = await params;
  const data = await getVendorWorkspaceData();
  const order = data.orders.find((item) => item.id === groupId);
  if (!order) notFound();

  const items = await getOrderGroupItems(order.id);
  const timeline = deriveOrderTimeline(order, t);
  // Settlement rows carry whole naira; the display seam takes kobo.
  const money = (naira: number) => formatVendorMoney(Math.round(naira * 100), locale);

  return (
    <WorkspaceShell
      title={order.orderNo || t("Order")}
      description={t("Fulfilment detail for one order — items, timeline, and the settlement that follows delivery.")}
      {...vendorWorkspaceNav("/vendor/orders", locale)}
      actions={
        <Link
          href="/vendor/orders"
          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--market-line)] px-4 py-2 text-sm font-semibold text-[var(--market-paper-white)] transition hover:border-[var(--market-brass)]/55"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t("Back to orders")}
        </Link>
      }
    >
      <article className="market-paper rounded-[1.75rem] p-6">
        <p className="market-kicker">{fulfillmentStatusLabel(order.fulfillmentStatus, t)}</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--market-ink)]">
          {money(order.subtotal)}
        </h2>
        <p className="mt-3 text-sm leading-7 text-[var(--market-muted)]">
          {formatDate(order.placedAt)} · {paymentStatusLabel(order.paymentStatus, t)} ·{" "}
          {payoutStatusLabel(order.payoutStatus, t)}
        </p>
        <p className="mt-2 text-sm font-medium text-[var(--market-brass)]">
          {t("Net settlement: {amount}").replace("{amount}", money(order.netVendorAmount))}
        </p>
        {items.length > 0 ? (
          <ul className="mt-5 space-y-3 border-t border-[var(--market-line)] pt-5">
            {items.map((item) => (
              <li key={item.id} className="flex items-baseline justify-between gap-4 text-sm">
                <span className="text-[var(--market-ink)]">
                  {item.title || t("Product")}
                  <span className="ml-2 text-[var(--market-muted)]">
                    {t("× {count}").replace("{count}", String(item.quantity))}
                  </span>
                </span>
                <span className="font-medium text-[var(--market-ink)]">{money(item.lineTotal)}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </article>

      <section className="market-paper rounded-[1.75rem] p-6">
        <p className="market-kicker">{t("Timeline")}</p>
        <ol className="mt-5 space-y-4">
          {timeline.map((step) => (
            <li key={step.key} className="flex items-start gap-3">
              <span
                aria-hidden
                className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full border ${TIMELINE_DOT_CLASS[step.state]}`}
              />
              <div>
                <p className="text-sm font-semibold text-[var(--market-ink)]">{step.label}</p>
                <p className="text-sm leading-6 text-[var(--market-muted)]">
                  {step.key === "placed" ? formatDate(order.placedAt) : step.detail}
                  {step.key === "fulfilment" && order.deliveredAt
                    ? ` · ${formatDate(order.deliveredAt)}`
                    : null}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <MarketplaceActionForm
        intent="vendor_order_update"
        hidden={{ order_group_id: order.id, return_to: `/vendor/orders/${order.id}` }}
        submitLabel={t("Update")}
        pendingLabel={t("Updating order")}
        successTitle={t("Order updated.")}
        successBody={t("The buyer sees the new fulfilment state on their tracking page.")}
        errorTitle={t("Order could not be updated.")}
        className="market-paper grid gap-3 rounded-[1.75rem] p-6 md:grid-cols-[1fr,1fr,1fr,auto]"
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
    </WorkspaceShell>
  );
}
