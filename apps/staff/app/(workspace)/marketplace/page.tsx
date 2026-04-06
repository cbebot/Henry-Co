import { ShoppingBag } from "lucide-react";
import { requireStaff } from "@/lib/staff-auth";
import { StaffPageHeader, StaffEmptyState } from "@/components/StaffPrimitives";

export const dynamic = "force-dynamic";

export default async function MarketplacePage() {
  const viewer = await requireStaff();
  const hasMarketplace = viewer.divisions.some((d) => d.division === "marketplace");

  if (!hasMarketplace) {
    return (
      <div className="staff-fade-in">
        <StaffPageHeader eyebrow="Workspace" title="Marketplace Operations" />
        <StaffEmptyState
          icon={ShoppingBag}
          title="Access restricted"
          description="You do not have access to the Marketplace division. Contact your manager if you believe this is an error."
        />
      </div>
    );
  }

  return (
    <div className="staff-fade-in">
      <StaffPageHeader
        eyebrow="Workspace"
        title="Marketplace Operations"
        description="Manage orders, vendor relationships, disputes, and catalog moderation."
      />
      <StaffEmptyState
        icon={ShoppingBag}
        title="Marketplace operations coming soon"
        description="This workspace will surface order management, vendor onboarding, dispute resolution, catalog moderation, and sales analytics for the HenryMarket division."
      />
    </div>
  );
}
