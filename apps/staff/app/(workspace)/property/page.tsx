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
        description="Manage property listings, inquiries, viewings, and agent relationships."
      />
      <StaffWorkspaceLaunchpad
        overview="HenryCo Property already exposes owner, admin, operations, moderation, and agent routes. This workspace now sends people there instead of pretending a separate property command center exists."
        links={[
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
            description: "Run viewing coordination, inquiry handling, and property ops.",
            icon: MapPinned,
            readiness: "live",
          },
          {
            href: `${getDivisionUrl("property")}/moderation`,
            label: "Moderation",
            description: "Review listing trust and moderation-sensitive workflow actions.",
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
