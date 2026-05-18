import { MetricCard, WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceRoles } from "@/lib/marketplace/auth";
import { getStaffOverviewData } from "@/lib/marketplace/data";
import { staffNav } from "@/lib/marketplace/navigation";
import { getMarketplacePublicLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

export default async function OwnerPage() {
  const locale = await getMarketplacePublicLocale();
  await requireMarketplaceRoles(["marketplace_owner"], "/owner");
  const data = await getStaffOverviewData();

  return (
    <WorkspaceShell
      title="Owner"
      description="Marketplace overview with vendor applications, disputes, payouts, and order health."
      nav={staffNav("/owner", "/owner", locale)}
    >
      <div className="grid gap-5 md:grid-cols-3">
        <MetricCard label="Pending applications" value={String(data.pendingApplications)} hint="Vendor trust review queue." />
        <MetricCard label="Open disputes" value={String(data.openDisputes)} hint="Support and moderation pressure." />
        <MetricCard label="Stalled orders" value={String(data.stalledOrders)} hint="Operational recovery watchlist." />
      </div>
    </WorkspaceShell>
  );
}
