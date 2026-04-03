import { MetricCard, WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceRoles } from "@/lib/marketplace/auth";
import { getVendorWorkspaceData } from "@/lib/marketplace/data";
import { vendorNav } from "@/lib/marketplace/navigation";

export const dynamic = "force-dynamic";

export default async function VendorAnalyticsPage() {
  await requireMarketplaceRoles(["vendor", "marketplace_owner", "marketplace_admin"], "/vendor/analytics");
  const data = await getVendorWorkspaceData();

  return (
    <WorkspaceShell
      title="Analytics"
      description="Vendor analytics focus on stock risk, listing readiness, order movement, and payout conversion rather than vanity charts."
      nav={vendorNav("/vendor/analytics")}
    >
      <div className="grid gap-5 md:grid-cols-3">
        <MetricCard label="Active listings" value={String(data.products.length)} hint="Submission and stock health tracked together." />
        <MetricCard label="Open issues" value={String(data.disputes.length)} hint="Dispute pressure is visible before it hurts trust score." />
        <MetricCard label="Orders in flow" value={String(data.orders.length)} hint="Vendor-specific fulfillment load." />
      </div>
    </WorkspaceShell>
  );
}
