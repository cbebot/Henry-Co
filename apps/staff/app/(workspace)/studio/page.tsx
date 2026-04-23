import { getDivisionUrl } from "@henryco/config";
import { BanknoteArrowDown, Headphones, Palette, Rocket, Workflow } from "lucide-react";
import { requireStaff } from "@/lib/staff-auth";
import { viewerHasAnyFamily, viewerHasDivisionRole } from "@/lib/roles";
import { StaffPageHeader, StaffEmptyState } from "@/components/StaffPrimitives";
import { StaffWorkspaceLaunchpad, type LaunchpadLink } from "@/components/StaffWorkspaceLaunchpad";

export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const viewer = await requireStaff();
  const hasStudio = viewer.divisions.some((d) => d.division === "studio");
  const hasStudioAdmin = viewerHasAnyFamily(viewer, ["system_admin"]);
  const links: LaunchpadLink[] = [];

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

  if (
    hasStudioAdmin ||
    viewerHasDivisionRole(viewer, "studio", ["sales_consultant", "project_manager"])
  ) {
    links.push({
      href: `${getDivisionUrl("studio")}/sales/leads`,
      label: "Sales leads",
      description: "Review incoming briefs, lead quality, and proposal movement.",
      icon: Rocket,
      readiness: "live",
    });
  }

  if (
    hasStudioAdmin ||
    viewerHasDivisionRole(viewer, "studio", [
      "project_manager",
      "delivery_coordinator",
      "developer",
      "designer",
    ])
  ) {
    links.push({
      href: `${getDivisionUrl("studio")}/pm/projects`,
      label: "PM projects",
      description: "Track milestones, revisions, and delivery state on active work.",
      icon: Workflow,
      readiness: "live",
    });
  }

  if (hasStudioAdmin || viewerHasDivisionRole(viewer, "studio", ["studio_finance"])) {
    links.push({
      href: `${getDivisionUrl("studio")}/finance/invoices`,
      label: "Finance invoices",
      description: "Handle invoicing and payment visibility inside the studio runtime.",
      icon: BanknoteArrowDown,
      readiness: "live",
    });
  }

  if (hasStudioAdmin || viewerHasDivisionRole(viewer, "studio", ["client_success", "project_manager"])) {
    links.push({
      href: `${getDivisionUrl("studio")}/support`,
      label: "Client support",
      description: "Open the studio support thread surface for active client issues.",
      icon: Headphones,
      readiness: "live",
    });
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
        links={links}
        notes={[
          "Studio writes now retry without stale schema-cache columns like budget_band, so lead intake survives older production schema caches instead of failing hard.",
        ]}
      />
    </div>
  );
}
