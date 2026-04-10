import { getDivisionUrl } from "@henryco/config";
import { Headphones, PackageSearch, Truck, UserRound } from "lucide-react";
import { requireStaff } from "@/lib/staff-auth";
import { StaffPageHeader, StaffEmptyState } from "@/components/StaffPrimitives";
import { StaffWorkspaceLaunchpad } from "@/components/StaffWorkspaceLaunchpad";

export const dynamic = "force-dynamic";

export default async function LogisticsPage() {
  const viewer = await requireStaff();
  const hasLogistics = viewer.divisions.some((d) => d.division === "logistics");

  if (!hasLogistics) {
    return (
      <div className="staff-fade-in">
        <StaffPageHeader eyebrow="Workspace" title="Logistics Dispatch" />
        <StaffEmptyState
          icon={Truck}
          title="Access restricted"
          description="You do not have access to the Logistics division. Contact your manager if you believe this is an error."
        />
      </div>
    );
  }

  return (
    <div className="staff-fade-in">
      <StaffPageHeader
        eyebrow="Workspace"
        title="Logistics Dispatch"
        description="Manage shipments, tracking, fleet dispatch, and delivery coordination."
      />
      <StaffWorkspaceLaunchpad
        readiness="partial"
        overview="A dedicated logistics backoffice is not fully live yet. These routes are the truthful surfaces available today: public customer and support flows in HenryCo Logistics, plus the shared staff queues in Staff HQ."
        links={[
          {
            href: "/support",
            label: "Staff support desk",
            description: "Use the shared support queue while the dedicated dispatch console is still unfinished.",
            icon: Headphones,
            readiness: "live",
          },
          {
            href: `${getDivisionUrl("logistics")}/support`,
            label: "Customer support surface",
            description: "Inspect the live customer-side logistics support journey.",
            icon: UserRound,
            readiness: "live",
          },
          {
            href: `${getDivisionUrl("logistics")}/track`,
            label: "Tracking flow",
            description: "Verify the public tracking path that customers rely on today.",
            icon: PackageSearch,
            readiness: "live",
          },
          {
            href: `${getDivisionUrl("logistics")}/customer`,
            label: "Customer dashboard",
            description: "Check the current customer-side logistics experience while dispatch tooling catches up.",
            icon: Truck,
            readiness: "partial",
          },
        ]}
        notes={[
          "This is intentionally marked partial because there is still no dedicated logistics staff dispatch console comparable to care, jobs, or studio.",
        ]}
      />
    </div>
  );
}
