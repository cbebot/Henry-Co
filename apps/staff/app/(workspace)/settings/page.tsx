import { Settings } from "lucide-react";
import { requireStaff } from "@/lib/staff-auth";
import { viewerHasPermission } from "@/lib/roles";
import { StaffPageHeader, StaffEmptyState } from "@/components/StaffPrimitives";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const viewer = await requireStaff();
  const hasSettings = viewerHasPermission(viewer, "settings.view");

  if (!hasSettings) {
    return (
      <div className="staff-fade-in">
        <StaffPageHeader eyebrow="System" title="Settings" />
        <StaffEmptyState
          icon={Settings}
          title="Access restricted"
          description="You do not have permission to view platform settings. Contact a system administrator if you need access."
        />
      </div>
    );
  }

  return (
    <div className="staff-fade-in">
      <StaffPageHeader
        eyebrow="System"
        title="Settings"
        description="Platform configuration, notification preferences, and system administration."
      />
      <StaffEmptyState
        icon={Settings}
        title="Settings coming soon"
        description="Platform configuration will include notification preferences, workspace appearance, integration settings, and system administration tools."
      />
    </div>
  );
}
