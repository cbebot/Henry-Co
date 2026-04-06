import { DollarSign } from "lucide-react";
import { requireStaff } from "@/lib/staff-auth";
import { viewerHasPermission } from "@/lib/roles";
import { StaffPageHeader, StaffEmptyState } from "@/components/StaffPrimitives";

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  const viewer = await requireStaff();
  const hasFinance = viewerHasPermission(viewer, "division.finance");

  if (!hasFinance) {
    return (
      <div className="staff-fade-in">
        <StaffPageHeader eyebrow="Operations" title="Finance" />
        <StaffEmptyState
          icon={DollarSign}
          title="Access restricted"
          description="You do not have finance permissions. Contact your manager if you need access to financial data."
        />
      </div>
    );
  }

  return (
    <div className="staff-fade-in">
      <StaffPageHeader
        eyebrow="Operations"
        title="Finance"
        description="Manage payouts, funding requests, expense approvals, and financial reporting."
      />
      <StaffEmptyState
        icon={DollarSign}
        title="Finance workspace coming soon"
        description="The finance workspace will surface payout management, funding requests, expense tracking, revenue reporting, and approval workflows across all divisions."
      />
    </div>
  );
}
