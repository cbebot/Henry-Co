import { RouteLiveRefresh } from "@henryco/ui";
import { requireStaff } from "@/lib/staff-auth";
import { getFilteredNavItems } from "@/lib/navigation";
import OperationalWorkspace from "@/components/OperationalWorkspace";
import {
  StaffPageHeader,
  StaffQuickLink,
  resolveIcon,
} from "@/components/StaffPrimitives";
import {
  filterWorkspaceRecords,
  getSelectedRecordId,
  getStaffDashboardData,
  parseWorkspaceFilters,
} from "@/lib/workspace-data";

export const dynamic = "force-dynamic";

export default async function StaffDashboard({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewer = await requireStaff();
  const [filters, data] = await Promise.all([
    parseWorkspaceFilters(searchParams),
    getStaffDashboardData(viewer),
  ]);

  const records = filterWorkspaceRecords(data.records, filters);
  const selectedRecordId = getSelectedRecordId(records, filters);
  const navItems = getFilteredNavItems(viewer).filter(
    (item) => item.section === "Workspaces" || item.section === "Operations"
  );
  const workspaceCounts = new Map(
    (data.workspaceCards as Array<{ division: string; count: number }>).map((item) => [
      item.division,
      item.count,
    ])
  );
  const firstName = viewer.user?.fullName?.split(" ")[0] || "there";

  return (
    <div className="staff-fade-in space-y-8">
      <RouteLiveRefresh intervalMs={12000} />
      <StaffPageHeader
        eyebrow="Staff HQ"
        title={`Welcome back, ${firstName}`}
        description="This dashboard is now queue-first: live operational pressure, role-scoped work, and exact drill-downs instead of decorative metrics."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {navItems.map((item) => {
          const Icon = resolveIcon(item.icon);
          const divisionKey = item.href.replace("/", "");
          const count = workspaceCounts.get(divisionKey) ?? 0;
          return (
            <StaffQuickLink
              key={item.href}
              href={item.href}
              label={item.label}
              description={
                count > 0
                  ? `${count} live queue item${count === 1 ? "" : "s"} currently visible.`
                  : `${item.label} is clear right now or waiting on the next live event.`
              }
              icon={Icon}
            />
          );
        })}
      </div>

      <OperationalWorkspace
        basePath="/"
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
