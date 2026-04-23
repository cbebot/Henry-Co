import { getDivisionUrl } from "@henryco/config";
import { Building2, Headphones, MapPinned, ShieldCheck, UserRound } from "lucide-react";
import { requireStaff } from "@/lib/staff-auth";
import { viewerHasAnyFamily, viewerHasDivisionRole } from "@/lib/roles";
import { StaffPageHeader, StaffEmptyState } from "@/components/StaffPrimitives";
import { StaffWorkspaceLaunchpad, type LaunchpadLink } from "@/components/StaffWorkspaceLaunchpad";

export const dynamic = "force-dynamic";

export default async function PropertyPage() {
  const viewer = await requireStaff();
  const hasProperty = viewer.divisions.some((d) => d.division === "property");
  const hasPropertyOversight = viewerHasAnyFamily(viewer, ["division_manager", "system_admin"]);
  const links: LaunchpadLink[] = [];

  if (!hasProperty) {
    return (
      <div className="staff-fade-in">
        <StaffPageHeader eyebrow="Workspace" title="Property Operations" />
        <StaffEmptyState
          icon={Building2}
          title="Access restricted"
          description="You do not have access to the Property division. Contact your manager if you believe this is an error."
        />
      </div>
    );
  }

  if (
    hasPropertyOversight ||
    viewerHasDivisionRole(viewer, "property", ["listings_manager", "property_moderator"])
  ) {
    links.push({
      href: `${getDivisionUrl("property")}/admin/listings`,
      label: "Governance queue",
      description: "Review listing trust evidence, inspection state, corrections, and publication decisions.",
      icon: ShieldCheck,
      readiness: "live",
    });
  }

  if (hasPropertyOversight || viewerHasDivisionRole(viewer, "property", ["listings_manager"])) {
    links.push({
      href: `${getDivisionUrl("property")}/owner`,
      label: "Owner overview",
      description: "Inspect listing readiness, trust posture, and platform signals.",
      icon: Building2,
      readiness: "live",
    });
  }

  if (
    hasPropertyOversight ||
    viewerHasDivisionRole(viewer, "property", ["viewing_coordinator", "managed_property_ops"])
  ) {
    links.push({
      href: `${getDivisionUrl("property")}/operations`,
      label: "Operations",
      description: "Run inspection scheduling, viewing coordination, and managed-property operations.",
      icon: MapPinned,
      readiness: "live",
    });
  }

  if (hasPropertyOversight || viewerHasDivisionRole(viewer, "property", ["property_moderator"])) {
    links.push({
      href: `${getDivisionUrl("property")}/moderation`,
      label: "Moderation",
      description: "Track blocked, escalated, and correction-heavy cases before they hit publication.",
      icon: ShieldCheck,
      readiness: "live",
    });
  }

  if (viewerHasDivisionRole(viewer, "property", ["property_support"]) || hasPropertyOversight) {
    links.push({
      href: `${getDivisionUrl("property")}/support`,
      label: "Support desk",
      description: "Handle property support issues without exposing owner-only controls.",
      icon: Headphones,
      readiness: "live",
    });
  }

  if (
    hasPropertyOversight ||
    viewerHasDivisionRole(viewer, "property", ["agent_relationship_manager"])
  ) {
    links.push({
      href: `${getDivisionUrl("property")}/agent`,
      label: "Agent surface",
      description: "Verify what agents can actually see and action on the live site.",
      icon: UserRound,
      readiness: "live",
    });
  }

  return (
    <div className="staff-fade-in">
      <StaffPageHeader
        eyebrow="Workspace"
        title="Property Operations"
        description="Run property governance, inspections, viewings, and managed follow-through from the real live property surfaces."
      />
      <StaffWorkspaceLaunchpad
        overview="HenryCo Property now has a real governance queue, inspection ops surface, moderation posture view, and live agent workflow. This workspace sends staff directly into those reviewable production surfaces."
        links={links}
      />
    </div>
  );
}
