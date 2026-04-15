import { getDivisionUrl } from "@henryco/config";
import { Building2, MapPinned, ShieldCheck, UserRound } from "lucide-react";
import { requireStaff } from "@/lib/staff-auth";
import { StaffPageHeader, StaffEmptyState } from "@/components/StaffPrimitives";
import { StaffWorkspaceLaunchpad } from "@/components/StaffWorkspaceLaunchpad";

export const dynamic = "force-dynamic";

export default async function PropertyPage() {
  const viewer = await requireStaff();
  const hasProperty = viewer.divisions.some((d) => d.division === "property");

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

  return (
    <div className="staff-fade-in">
      <StaffPageHeader
        eyebrow="Workspace"
        title="Property Operations"
        description="Run property governance, inspections, viewings, and managed follow-through from the real live property surfaces."
      />
      <StaffWorkspaceLaunchpad
        overview="HenryCo Property now has a real governance queue, inspection ops surface, moderation posture view, and live agent workflow. This workspace sends staff directly into those reviewable production surfaces."
        links={[
          {
            href: `${getDivisionUrl("property")}/admin/listings`,
            label: "Governance queue",
            description: "Review listing trust evidence, inspection state, corrections, and publication decisions.",
            icon: ShieldCheck,
            readiness: "live",
          },
          {
            href: `${getDivisionUrl("property")}/owner`,
            label: "Owner overview",
            description: "Inspect listing readiness, trust posture, and platform signals.",
            icon: Building2,
            readiness: "live",
          },
          {
            href: `${getDivisionUrl("property")}/operations`,
            label: "Operations",
            description: "Run inspection scheduling, viewing coordination, and managed-property operations.",
            icon: MapPinned,
            readiness: "live",
          },
          {
            href: `${getDivisionUrl("property")}/moderation`,
            label: "Moderation",
            description: "Track blocked, escalated, and correction-heavy cases before they hit publication.",
            icon: ShieldCheck,
            readiness: "live",
          },
          {
            href: `${getDivisionUrl("property")}/agent`,
            label: "Agent surface",
            description: "Verify what agents can actually see and action on the live site.",
            icon: UserRound,
            readiness: "live",
          },
        ]}
      />
    </div>
  );
}
