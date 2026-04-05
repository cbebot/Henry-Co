import { MetricCard, WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceRoles } from "@/lib/marketplace/auth";
import { getStaffOverviewData } from "@/lib/marketplace/data";
import { staffNav } from "@/lib/marketplace/navigation";

export const dynamic = "force-dynamic";

export default async function OwnerPage() {
  await requireMarketplaceRoles(["marketplace_owner"], "/owner");
  const data = await getStaffOverviewData();

  return (
    <WorkspaceShell
      title="Owner"
      description="Marketplace overview with vendor applications, disputes, payouts, and order health."
      nav={staffNav("/owner", "/owner")}
    >
      <div className="grid gap-5 md:grid-cols-3">
        <MetricCard label="Pending applications" value={String(data.pendingApplications)} hint="Vendor trust review queue." />
        <MetricCard label="Open disputes" value={String(data.openDisputes)} hint="Support and moderation pressure." />
        <MetricCard label="Stalled orders" value={String(data.stalledOrders)} hint="Operational recovery watchlist." />
      </div>
    </WorkspaceShell>
  );
}
