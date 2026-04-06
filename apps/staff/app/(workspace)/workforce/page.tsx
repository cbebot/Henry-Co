import { Users } from "lucide-react";
import { requireStaff } from "@/lib/staff-auth";
import { viewerHasPermission } from "@/lib/roles";
import { StaffPageHeader, StaffEmptyState } from "@/components/StaffPrimitives";

export const dynamic = "force-dynamic";

export default async function WorkforcePage() {
  const viewer = await requireStaff();
  const hasDirectory = viewerHasPermission(viewer, "staff.directory.view");

  if (!hasDirectory) {
    return (
      <div className="staff-fade-in">
        <StaffPageHeader eyebrow="Operations" title="Workforce" />
        <StaffEmptyState
          icon={Users}
          title="Access restricted"
          description="You do not have permission to view the staff directory. This area is available to supervisors and above."
        />
      </div>
    );
  }

  return (
    <div className="staff-fade-in">
      <StaffPageHeader
        eyebrow="Operations"
        title="Workforce"
        description="Staff directory, team assignments, division membership, and workforce analytics."
      />
      <StaffEmptyState
        icon={Users}
        title="Workforce management coming soon"
        description="The workforce workspace will provide a staff directory, division membership management, role assignments, and workforce analytics across all Henry & Co. divisions."
      />
    </div>
  );
}
