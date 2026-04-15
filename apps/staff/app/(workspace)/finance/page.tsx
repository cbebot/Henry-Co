import { DollarSign } from "lucide-react";
import { RouteLiveRefresh } from "@henryco/ui";
import OperationalWorkspace from "@/components/OperationalWorkspace";
import { StaffEmptyState, StaffPageHeader } from "@/components/StaffPrimitives";
import { viewerHasPermission } from "@/lib/roles";
import { requireStaff } from "@/lib/staff-auth";
import {
  filterWorkspaceRecords,
  getFinanceWorkspaceData,
  getSelectedRecordId,
  parseWorkspaceFilters,
} from "@/lib/workspace-data";

export const dynamic = "force-dynamic";

export default async function FinancePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewer = await requireStaff();
  const hasFinance = viewerHasPermission(viewer, "division.finance");

  if (!hasFinance) {
    return (
      <div className="staff-fade-in">
        <StaffPageHeader eyebrow="Operations" title="Finance" />
        <StaffEmptyState
          icon={DollarSign}
          title="Access restricted"
          description="You do not have finance permissions. Contact your manager if you need access to financial data."
        />
      </div>
    );
  }

  const [filters, data] = await Promise.all([
    parseWorkspaceFilters(searchParams),
    getFinanceWorkspaceData(viewer),
  ]);
  const records = filterWorkspaceRecords(data.records, filters);
  const selectedRecordId = getSelectedRecordId(records, filters);

  return (
    <div className="staff-fade-in">
      <RouteLiveRefresh intervalMs={12000} />
      <StaffPageHeader
        eyebrow="Operations"
        title="Finance"
        description="Cross-division invoice pressure, payout review, payment recovery, and delivery-linked commercial failures now live in one finance workspace."
      />

      <OperationalWorkspace
        basePath="/finance"
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
