import { notFound } from "next/navigation";
import { WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceRoles } from "@/lib/marketplace/auth";
import { getVendorWorkspaceData } from "@/lib/marketplace/data";
import { vendorNav } from "@/lib/marketplace/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function VendorOrderDetailPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  await requireMarketplaceRoles(["vendor", "marketplace_owner", "marketplace_admin"], "/vendor/orders");
  const { groupId } = await params;
  const data = await getVendorWorkspaceData();
  const order = data.orders.find((item) => item.id === groupId);
  if (!order) notFound();

  return (
    <WorkspaceShell
      title={order.orderNo}
      description="Detailed vendor order handling with payment and fulfillment signals aligned."
      nav={vendorNav("/vendor/orders")}
    >
      <article className="market-paper rounded-[1.75rem] p-6">
        <p className="market-kicker">{order.fulfillmentStatus}</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--market-ink)]">{formatCurrency(order.subtotal)}</h2>
        <p className="mt-3 text-sm leading-7 text-[var(--market-muted)]">{formatDate(order.placedAt)} · {order.paymentStatus}</p>
      </article>
    </WorkspaceShell>
  );
}
