import { getDivisionUrl, getHqUrl } from "@henryco/config";
import { IdCard, ShieldCheck, Users } from "lucide-react";
import { requireStaff } from "@/lib/staff-auth";
import { viewerHasPermission } from "@/lib/roles";
import { StaffPageHeader, StaffEmptyState } from "@/components/StaffPrimitives";
import { StaffWorkspaceLaunchpad } from "@/components/StaffWorkspaceLaunchpad";

export const dynamic = "force-dynamic";

export default async function WorkforcePage() {
  const viewer = await requireStaff();
  const hasDirectory = viewerHasPermission(viewer, "staff.directory.view");

  if (!hasDirectory) {
    return (
      <div className="staff-fade-in">
        <StaffPageHeader eyebrow="Operations" title="Workforce" />
        <StaffEmptyState
          icon={Users}
          title="Access restricted"
          description="You do not have permission to view the staff directory. This area is available to supervisors and above."
        />
      </div>
    );
  }

  return (
    <div className="staff-fade-in">
      <StaffPageHeader
        eyebrow="Operations"
        title="Workforce"
        description="Staff directory, team assignments, division membership, and workforce analytics."
      />
      <StaffWorkspaceLaunchpad
        readiness="partial"
        overview="Workforce control already exists in the owner hub and some division-specific staff routes. This page now routes supervisors into those live staff-management surfaces instead of a false empty shell."
        links={[
          {
            href: `${getHqUrl("/owner/staff")}`,
            label: "Staff control",
            description: "Open the owner-side staff overview and assignment control.",
            icon: Users,
            readiness: "live",
          },
          {
            href: `${getHqUrl("/owner/staff/directory")}`,
            label: "Directory",
            description: "Inspect live user records and search the active workforce.",
            icon: IdCard,
            readiness: "live",
          },
          {
            href: `${getHqUrl("/owner/staff/roles")}`,
            label: "Role governance",
            description: "Review roles, governance, and privileged access posture.",
            icon: ShieldCheck,
            readiness: "live",
          },
          {
            href: `${getDivisionUrl("care")}/owner/staff`,
            label: "Care staff roster",
            description: "Check a live division-specific staff surface while shared workforce unification is still incomplete.",
            icon: Users,
            readiness: "live",
          },
        ]}
        notes={[
          "This remains partial because one unified workforce management surface is not live yet; use the hub owner routes for actual governance.",
        ]}
      />
    </div>
  );
}
