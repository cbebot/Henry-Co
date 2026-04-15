import { Settings } from "lucide-react";
import { RouteLiveRefresh } from "@henryco/ui";
import { requireStaff } from "@/lib/staff-auth";
import { viewerHasPermission } from "@/lib/roles";
import OperationalWorkspace from "@/components/OperationalWorkspace";
import { StaffPageHeader, StaffEmptyState } from "@/components/StaffPrimitives";
import {
  filterWorkspaceRecords,
  getSelectedRecordId,
  getSettingsWorkspaceData,
  parseWorkspaceFilters,
} from "@/lib/workspace-data";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
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

  const [filters, data] = await Promise.all([
    parseWorkspaceFilters(searchParams),
    getSettingsWorkspaceData(viewer),
  ]);
  const records = filterWorkspaceRecords(data.records, filters);
  const selectedRecordId = getSelectedRecordId(records, filters);

  return (
    <div className="staff-fade-in">
      <RouteLiveRefresh intervalMs={12000} />
      <StaffPageHeader
        eyebrow="System"
        title="Settings"
        description="System-grade delivery failures, access-change audit pressure, and configuration-adjacent control work now land here before deeper owner-level admin routes."
      />

      <OperationalWorkspace
        basePath="/settings"
        filters={filters}
        queues={data.queues}
        metrics={data.metrics}
        insights={data.insights}
        records={records}
        selectedRecordId={selectedRecordId}
        emptyTitle={data.emptyTitle}
        emptyDescription={data.emptyDescription}
        focusNote={data.focusNote}
      />
    </div>
  );
}
