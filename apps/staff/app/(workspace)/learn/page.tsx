import { GraduationCap } from "lucide-react";
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

export default async function LearnPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewer = await requireStaff();
  const hasDivision = viewer.divisions.some((item) => item.division === "learn");

  if (!hasDivision) {
    return (
      <div className="staff-fade-in">
        <StaffPageHeader eyebrow="Workspace" title="Learn Operations" />
        <StaffEmptyState
          icon={GraduationCap}
          title="Access restricted"
          description="You do not have access to the Learn division. Contact your manager if you believe this is an error."
        />
      </div>
    );
  }

  const [filters, data] = await Promise.all([
    parseWorkspaceFilters(searchParams),
    getDivisionWorkspaceData(viewer, "learn"),
  ]);
  const records = filterWorkspaceRecords(data.records, filters);
  const selectedRecordId = getSelectedRecordId(records, filters);

  return (
    <div className="staff-fade-in">
      <RouteLiveRefresh intervalMs={12000} />
      <StaffPageHeader
        eyebrow="Workspace"
        title="Learn Operations"
        description="Pending academy invoices, instructor decisions, and support escalation now stay visible in one operating workspace."
      />

      <OperationalWorkspace
        basePath="/learn"
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
