import Link from "next/link";
import { ArrowRight } from "lucide-react";
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
      {/* The counts above were previously dead ends — route the owner straight
          to the decision surfaces so every number has an action beside it. */}
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/owner/seller-applications"
          className="market-button-primary inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
        >
          Review seller applications <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </WorkspaceShell>
  );
}
