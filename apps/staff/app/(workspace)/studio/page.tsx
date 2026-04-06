import { Palette } from "lucide-react";
import { requireStaff } from "@/lib/staff-auth";
import { StaffPageHeader, StaffEmptyState } from "@/components/StaffPrimitives";

export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const viewer = await requireStaff();
  const hasStudio = viewer.divisions.some((d) => d.division === "studio");

  if (!hasStudio) {
    return (
      <div className="staff-fade-in">
        <StaffPageHeader eyebrow="Workspace" title="Studio Operations" />
        <StaffEmptyState
          icon={Palette}
          title="Access restricted"
          description="You do not have access to the Studio division. Contact your manager if you believe this is an error."
        />
      </div>
    );
  }

  return (
    <div className="staff-fade-in">
      <StaffPageHeader
        eyebrow="Workspace"
        title="Studio Operations"
        description="Manage leads, active projects, milestones, and delivery pipelines."
      />
      <StaffEmptyState
        icon={Palette}
        title="Studio operations coming soon"
        description="This workspace will surface project pipelines, client leads, milestone tracking, delivery coordination, and creative team assignments for the HenryStudio division."
      />
    </div>
  );
}
