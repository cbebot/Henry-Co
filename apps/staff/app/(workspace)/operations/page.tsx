import { RouteLiveRefresh } from "@henryco/ui";
import OperationalWorkspace from "@/components/OperationalWorkspace";
import { StaffPageHeader } from "@/components/StaffPrimitives";
import { requireStaff } from "@/lib/staff-auth";
import {
  filterWorkspaceRecords,
  getOperationsWorkspaceData,
  getSelectedRecordId,
  parseWorkspaceFilters,
} from "@/lib/workspace-data";

export const dynamic = "force-dynamic";

export default async function OperationsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewer = await requireStaff();
  const [filters, data] = await Promise.all([
    parseWorkspaceFilters(searchParams),
    getOperationsWorkspaceData(viewer),
  ]);
  const records = filterWorkspaceRecords(data.records, filters);
  const selectedRecordId = getSelectedRecordId(records, filters);

  return (
    <div className="staff-fade-in">
      <RouteLiveRefresh intervalMs={12000} />
      <StaffPageHeader
        eyebrow="Operations"
        title="Operations Center"
        description="Cross-division queue neglect, delivery failures, stale support, and governance anomalies are surfaced here with deterministic evidence and direct workflow routes."
      />

      <OperationalWorkspace
        basePath="/operations"
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
