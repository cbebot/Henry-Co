import { MetricCard, WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceRoles } from "@/lib/marketplace/auth";
import { getStaffOverviewData } from "@/lib/marketplace/data";
import { staffNav } from "@/lib/marketplace/navigation";

export const dynamic = "force-dynamic";

export default async function OperationsPage() {
  await requireMarketplaceRoles(["marketplace_owner", "marketplace_admin", "operations"], "/operations");
  const data = await getStaffOverviewData();

  return (
    <WorkspaceShell
      title="Operations"
      description="Operational visibility tracks stalled orders, low stock, and queue pressure before they become support fires."
      nav={staffNav("/operations", "/operations")}
    >
      <div className="grid gap-5 md:grid-cols-3">
        <MetricCard label="Low stock" value={String(data.lowStockProducts)} hint="Products nearing stockout." />
        <MetricCard label="Stalled orders" value={String(data.stalledOrders)} hint="Orders needing fulfillment intervention." />
        <MetricCard label="Pending products" value={String(data.pendingProducts)} hint="Catalog queue affecting growth." />
      </div>
    </WorkspaceShell>
  );
}
