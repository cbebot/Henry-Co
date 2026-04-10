import { getDivisionUrl } from "@henryco/config";
import { BanknoteArrowDown, Headphones, Palette, Rocket, Workflow } from "lucide-react";
import { requireStaff } from "@/lib/staff-auth";
import { StaffPageHeader, StaffEmptyState } from "@/components/StaffPrimitives";
import { StaffWorkspaceLaunchpad } from "@/components/StaffWorkspaceLaunchpad";

export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const viewer = await requireStaff();
  const hasStudio = viewer.divisions.some((d) => d.division === "studio");

  if (!hasStudio) {
    return (
      <div className="staff-fade-in">
        <StaffPageHeader eyebrow="Workspace" title="Studio Operations" />
        <StaffEmptyState
          icon={Palette}
          title="Access restricted"
          description="You do not have access to the Studio division. Contact your manager if you believe this is an error."
        />
      </div>
    );
  }

  return (
    <div className="staff-fade-in">
      <StaffPageHeader
        eyebrow="Workspace"
        title="Studio Operations"
        description="Manage leads, active projects, milestones, and delivery pipelines."
      />
      <StaffWorkspaceLaunchpad
        overview="Studio has live sales, PM, finance, support, and owner surfaces already. This workspace now routes operators into those real controls rather than duplicating a fake studio dashboard."
        links={[
          {
            href: `${getDivisionUrl("studio")}/sales/leads`,
            label: "Sales leads",
            description: "Review incoming briefs, lead quality, and proposal movement.",
            icon: Rocket,
            readiness: "live",
          },
          {
            href: `${getDivisionUrl("studio")}/pm/projects`,
            label: "PM projects",
            description: "Track milestones, revisions, and delivery state on active work.",
            icon: Workflow,
            readiness: "live",
          },
          {
            href: `${getDivisionUrl("studio")}/finance/invoices`,
            label: "Finance invoices",
            description: "Handle invoicing and payment visibility inside the studio runtime.",
            icon: BanknoteArrowDown,
            readiness: "live",
          },
          {
            href: `${getDivisionUrl("studio")}/support`,
            label: "Client support",
            description: "Open the studio support thread surface for active client issues.",
            icon: Headphones,
            readiness: "live",
          },
        ]}
        notes={[
          "Studio writes now retry without stale schema-cache columns like budget_band, so lead intake survives older production schema caches instead of failing hard.",
        ]}
      />
    </div>
  );
}
