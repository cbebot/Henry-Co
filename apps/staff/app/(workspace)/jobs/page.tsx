import { Briefcase } from "lucide-react";
import { RouteLiveRefresh } from "@henryco/ui";
import OperationalWorkspace from "@/components/OperationalWorkspace";
import { StaffEmptyState, StaffPageHeader } from "@/components/StaffPrimitives";
import { requireStaff } from "@/lib/staff-auth";
import {
  filterWorkspaceRecords,
  getDivisionWorkspaceData,
  getSelectedRecordId,
  parseWorkspaceFilters,
} from "@/lib/workspace-data";

export const dynamic = "force-dynamic";

export default async function JobsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewer = await requireStaff();
  const hasDivision = viewer.divisions.some((item) => item.division === "jobs");

  if (!hasDivision) {
    return (
      <div className="staff-fade-in">
        <StaffPageHeader eyebrow="Workspace" title="Jobs Operations" />
        <StaffEmptyState
          icon={Briefcase}
          title="Access restricted"
          description="You do not have access to the Jobs division. Contact your manager if you believe this is an error."
        />
      </div>
    );
  }

  const [filters, data] = await Promise.all([
    parseWorkspaceFilters(searchParams),
    getDivisionWorkspaceData(viewer, "jobs"),
  ]);
  const records = filterWorkspaceRecords(data.records, filters);
  const selectedRecordId = getSelectedRecordId(records, filters);

  return (
    <div className="staff-fade-in">
      <RouteLiveRefresh intervalMs={12000} />
      <StaffPageHeader
        eyebrow="Workspace"
        title="Jobs Operations"
        description="Recruiter alert failures, unread queue pressure, and jobs support work now resolve from one truth-based operations surface."
      />

      <OperationalWorkspace
        basePath="/jobs"
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
