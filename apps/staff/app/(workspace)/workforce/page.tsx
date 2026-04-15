import { Users } from "lucide-react";
import { RouteLiveRefresh } from "@henryco/ui";
import OperationalWorkspace from "@/components/OperationalWorkspace";
import { StaffEmptyState, StaffPageHeader } from "@/components/StaffPrimitives";
import { viewerHasPermission } from "@/lib/roles";
import { requireStaff } from "@/lib/staff-auth";
import {
  filterWorkspaceRecords,
  getSelectedRecordId,
  getWorkforceWorkspaceData,
  parseWorkspaceFilters,
} from "@/lib/workspace-data";

export const dynamic = "force-dynamic";

export default async function WorkforcePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
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

  const [filters, data] = await Promise.all([
    parseWorkspaceFilters(searchParams),
    getWorkforceWorkspaceData(viewer),
  ]);
  const records = filterWorkspaceRecords(data.records, filters);
  const selectedRecordId = getSelectedRecordId(records, filters);

  return (
    <div className="staff-fade-in">
      <RouteLiveRefresh intervalMs={12000} />
      <StaffPageHeader
        eyebrow="Operations"
        title="Workforce"
        description="Role governance, dormant invites, membership coverage, and suspicious staff-change patterns now sit in one workforce control surface."
      />

      <OperationalWorkspace
        basePath="/workforce"
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
