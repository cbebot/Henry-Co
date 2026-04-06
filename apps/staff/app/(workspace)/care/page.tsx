import { Heart } from "lucide-react";
import { requireStaff } from "@/lib/staff-auth";
import { StaffPageHeader, StaffEmptyState } from "@/components/StaffPrimitives";

export const dynamic = "force-dynamic";

export default async function CarePage() {
  const viewer = await requireStaff();
  const hasCare = viewer.divisions.some((d) => d.division === "care");

  if (!hasCare) {
    return (
      <div className="staff-fade-in">
        <StaffPageHeader eyebrow="Workspace" title="Care Operations" />
        <StaffEmptyState
          icon={Heart}
          title="Access restricted"
          description="You do not have access to the Care division. Contact your manager if you believe this is an error."
        />
      </div>
    );
  }

  return (
    <div className="staff-fade-in">
      <StaffPageHeader
        eyebrow="Workspace"
        title="Care Operations"
        description="Manage bookings, service riders, reviews, and care workflows."
      />
      <StaffEmptyState
        icon={Heart}
        title="Care operations coming soon"
        description="This workspace will surface bookings, rider assignments, customer reviews, and operational metrics for the HenryCare division."
      />
    </div>
  );
}
