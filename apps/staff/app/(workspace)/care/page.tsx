import { getDivisionUrl } from "@henryco/config";
import { Bike, ClipboardList, Headphones, Heart, ShieldCheck } from "lucide-react";
import { requireStaff } from "@/lib/staff-auth";
import { viewerHasAnyFamily, viewerHasDivisionRole } from "@/lib/roles";
import { StaffPageHeader, StaffEmptyState } from "@/components/StaffPrimitives";
import { StaffWorkspaceLaunchpad, type LaunchpadLink } from "@/components/StaffWorkspaceLaunchpad";

export const dynamic = "force-dynamic";

export default async function CarePage() {
  const viewer = await requireStaff();
  const hasCare = viewer.divisions.some((d) => d.division === "care");
  const hasCareLeadership = viewerHasAnyFamily(viewer, ["division_manager", "supervisor", "system_admin"]);
  const links: LaunchpadLink[] = [];

  if (!hasCare) {
    return (
      <div className="staff-fade-in">
        <StaffPageHeader eyebrow="Workspace" title="Care Operations" />
        <StaffEmptyState
          icon={Heart}
          title="Access restricted"
          description="You do not have access to the Care division. Contact your manager if you believe this is an error."
        />
      </div>
    );
  }

  if (hasCareLeadership || viewerHasDivisionRole(viewer, "care", ["care_support", "care_ops"])) {
    links.push({
      href: `${getDivisionUrl("care")}/support/inbox`,
      label: "Support inbox",
      description: "Reply to live care support threads and keep read state accurate.",
      icon: Headphones,
      readiness: "live",
    });
  }

  if (hasCareLeadership || viewerHasDivisionRole(viewer, "care", ["care_manager", "care_finance", "care_ops"])) {
    links.push({
      href: `${getDivisionUrl("care")}/owner/bookings`,
      label: "Owner bookings",
      description: "Inspect booking truth, payment state, and customer follow-through.",
      icon: ClipboardList,
      readiness: "live",
    });
  }

  if (hasCareLeadership || viewerHasDivisionRole(viewer, "care", ["care_manager", "care_ops"])) {
    links.push({
      href: `${getDivisionUrl("care")}/manager/operations`,
      label: "Manager operations",
      description: "Run day-of-service operations, assignments, and queue control.",
      icon: ShieldCheck,
      readiness: "live",
    });
  }

  if (viewerHasDivisionRole(viewer, "care", ["care_rider"])) {
    links.push({
      href: `${getDivisionUrl("care")}/rider/pickups`,
      label: "Rider pickups",
      description: "Verify the rider-side pickup workflow and dispatch readiness.",
      icon: Bike,
      readiness: "live",
    });
  }

  return (
    <div className="staff-fade-in">
      <StaffPageHeader
        eyebrow="Workspace"
        title="Care Operations"
        description="Manage bookings, service riders, reviews, and care workflows."
      />
      <StaffWorkspaceLaunchpad
        overview="Staff HQ is the routing layer, not the care console itself. Use these live HenryCare routes for real booking, support, review, and rider actions instead of waiting on a duplicate dashboard."
        links={links}
        notes={[
          "Role gates still apply inside each destination. Open the route that matches the operator task instead of assuming one page should expose every control.",
          "Account-side care support now mirrors into the care desk again, so replies and status movement are no longer trapped on one surface.",
        ]}
      />
    </div>
  );
}
