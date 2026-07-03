import { MetricCard, WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceRoles } from "@/lib/marketplace/auth";
import { getVendorWorkspaceData } from "@/lib/marketplace/data";
import { vendorWorkspaceNav } from "@/lib/marketplace/navigation";
import { getMarketplacePublicLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

export default async function VendorAnalyticsPage() {
  const locale = await getMarketplacePublicLocale();
  await requireMarketplaceRoles(["vendor", "marketplace_owner", "marketplace_admin"], "/vendor/analytics");
  const data = await getVendorWorkspaceData();

  return (
    <WorkspaceShell
      title="Analytics"
      description="Vendor analytics focus on stock risk, listing readiness, order movement, and payout conversion rather than vanity charts."
      {...vendorWorkspaceNav("/vendor/analytics", locale)}
    >
      <div className="grid gap-5 md:grid-cols-3">
        <MetricCard label="Active listings" value={String(data.products.length)} hint="Submission and stock health tracked together." />
        <MetricCard label="Open issues" value={String(data.disputes.length)} hint="Dispute pressure is visible before it hurts trust score." />
        <MetricCard label="Orders in flow" value={String(data.orders.length)} hint="Vendor-specific fulfillment load." />
      </div>
    </WorkspaceShell>
  );
}
