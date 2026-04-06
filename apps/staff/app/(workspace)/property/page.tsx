import { Building2 } from "lucide-react";
import { requireStaff } from "@/lib/staff-auth";
import { StaffPageHeader, StaffEmptyState } from "@/components/StaffPrimitives";

export const dynamic = "force-dynamic";

export default async function PropertyPage() {
  const viewer = await requireStaff();
  const hasProperty = viewer.divisions.some((d) => d.division === "property");

  if (!hasProperty) {
    return (
      <div className="staff-fade-in">
        <StaffPageHeader eyebrow="Workspace" title="Property Operations" />
        <StaffEmptyState
          icon={Building2}
          title="Access restricted"
          description="You do not have access to the Property division. Contact your manager if you believe this is an error."
        />
      </div>
    );
  }

  return (
    <div className="staff-fade-in">
      <StaffPageHeader
        eyebrow="Workspace"
        title="Property Operations"
        description="Manage property listings, inquiries, viewings, and agent relationships."
      />
      <StaffEmptyState
        icon={Building2}
        title="Property operations coming soon"
        description="This workspace will surface property listings, inquiry management, viewing schedules, agent relationships, and moderation queues for the HenryProperty division."
      />
    </div>
  );
}
