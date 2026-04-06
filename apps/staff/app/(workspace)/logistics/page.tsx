import { Truck } from "lucide-react";
import { requireStaff } from "@/lib/staff-auth";
import { StaffPageHeader, StaffEmptyState } from "@/components/StaffPrimitives";

export const dynamic = "force-dynamic";

export default async function LogisticsPage() {
  const viewer = await requireStaff();
  const hasLogistics = viewer.divisions.some((d) => d.division === "logistics");

  if (!hasLogistics) {
    return (
      <div className="staff-fade-in">
        <StaffPageHeader eyebrow="Workspace" title="Logistics Dispatch" />
        <StaffEmptyState
          icon={Truck}
          title="Access restricted"
          description="You do not have access to the Logistics division. Contact your manager if you believe this is an error."
        />
      </div>
    );
  }

  return (
    <div className="staff-fade-in">
      <StaffPageHeader
        eyebrow="Workspace"
        title="Logistics Dispatch"
        description="Manage shipments, tracking, fleet dispatch, and delivery coordination."
      />
      <StaffEmptyState
        icon={Truck}
        title="Logistics dispatch coming soon"
        description="This workspace will surface shipment tracking, dispatch management, fleet operations, driver assignments, and delivery analytics for the HenryLogistics division."
      />
    </div>
  );
}
