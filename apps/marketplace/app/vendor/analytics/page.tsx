import { translateSurfaceLabel } from "@henryco/i18n";
import { EmptyState, MetricCard, WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceRoles } from "@/lib/marketplace/auth";
import { getVendorWorkspaceData } from "@/lib/marketplace/data";
import { vendorWorkspaceNav } from "@/lib/marketplace/navigation";
import {
  deriveVendorAnalytics,
  type VendorOrderItemRollup,
} from "@/lib/marketplace/vendor/analytics";
import { formatVendorMoney } from "@/lib/marketplace/vendor/money";
import { createAdminSupabase } from "@/lib/supabase";
import { getMarketplacePublicLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

/**
 * Item lines for the vendor's own orders — product id, title snapshot, and
 * the order group they belong to. Feeds the top-product frequency only; no
 * buyer fields are selected.
 */
async function getVendorOrderItemRollups(vendorId: string): Promise<VendorOrderItemRollup[]> {
  try {
    const admin = createAdminSupabase();
    const { data } = await admin
      .from("marketplace_order_items")
      .select("product_id, order_group_id, title_snapshot")
      .eq("vendor_id", vendorId);
    return ((data ?? []) as Array<Record<string, unknown>>).map((row) => {
      const snapshot =
        row.title_snapshot && typeof row.title_snapshot === "object"
          ? (row.title_snapshot as Record<string, unknown>)
          : {};
      return {
        productId: row.product_id ? String(row.product_id) : "",
        title: snapshot.title ? String(snapshot.title) : "",
        orderGroupId: row.order_group_id ? String(row.order_group_id) : "",
      };
    });
  } catch {
    return [];
  }
}

export default async function VendorAnalyticsPage() {
  const locale = await getMarketplacePublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  await requireMarketplaceRoles(["vendor", "marketplace_owner", "marketplace_admin"], "/vendor/analytics");
  const data = await getVendorWorkspaceData();
  const items = await getVendorOrderItemRollups(data.vendor.id);
  const summary = deriveVendorAnalytics({
    orders: data.orders,
    disputeCount: data.disputes.length,
    items,
  });
  // Settlement rows carry whole naira; the display seam takes kobo.
  const money = (naira: number) => formatVendorMoney(Math.round(naira * 100), locale);
  const numberLocale = locale === "en" ? "en-NG" : locale;
  const count = (value: number) => new Intl.NumberFormat(numberLocale).format(value);
  const percent = (ratio: number) =>
    new Intl.NumberFormat(numberLocale, { style: "percent", maximumFractionDigits: 1 }).format(ratio);

  return (
    <WorkspaceShell
      title={t("Analytics")}
      description={t("Numbers derived from your real orders and disputes — no estimates, no vanity charts.")}
      {...vendorWorkspaceNav("/vendor/analytics", locale)}
    >
      {summary.ordersCount === 0 ? (
        <EmptyState
          title={t("No order data yet")}
          body={t("Revenue, order volume, and dispute rate appear here after your first order.")}
          ctaHref="/vendor/products"
          ctaLabel={t("Review your products")}
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-3">
          <MetricCard
            label={t("Net settlements")}
            value={money(summary.netSettlementTotal)}
            hint={t("Sum of your net order settlements to date, before payout timing.")}
          />
          <MetricCard
            label={t("Orders")}
            value={count(summary.ordersCount)}
            hint={t("Order groups placed with your store.")}
          />
          <MetricCard
            label={t("Dispute rate")}
            value={summary.disputeRate === null ? "—" : percent(summary.disputeRate)}
            hint={t("Disputes as a share of all orders, including resolved ones.")}
          />
          {summary.topProduct ? (
            <MetricCard
              label={t("Top product")}
              value={summary.topProduct.title}
              hint={t("Appears in {count} orders — your most ordered listing.").replace(
                "{count}",
                count(summary.topProduct.orderCount),
              )}
            />
          ) : null}
        </div>
      )}

      <section className="market-paper rounded-[1.75rem] p-6">
        <p className="market-kicker">{t("Catalog health")}</p>
        <div className="mt-4 grid gap-5 md:grid-cols-2">
          <MetricCard
            label={t("Active listings")}
            value={count(data.products.length)}
            hint={t("Products across draft, review, and live states.")}
          />
          <MetricCard
            label={t("Open issues")}
            value={count(data.disputes.filter((dispute) => dispute.status !== "resolved").length)}
            hint={t("Unresolved disputes that can hold settlements.")}
          />
        </div>
      </section>
    </WorkspaceShell>
  );
}
