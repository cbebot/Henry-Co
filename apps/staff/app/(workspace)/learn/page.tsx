import { getDivisionUrl } from "@henryco/config";
import { BookOpenCheck, GraduationCap, Presentation, ShieldCheck, Users } from "lucide-react";
import { requireStaff } from "@/lib/staff-auth";
import { viewerHasAnyFamily, viewerHasDivisionRole } from "@/lib/roles";
import { StaffPageHeader, StaffEmptyState } from "@/components/StaffPrimitives";
import { StaffWorkspaceLaunchpad, type LaunchpadLink } from "@/components/StaffWorkspaceLaunchpad";

export const dynamic = "force-dynamic";

export default async function LearnPage() {
  const viewer = await requireStaff();
  const hasLearn = viewer.divisions.some((d) => d.division === "learn");
  const hasLearnLeadership = viewerHasAnyFamily(viewer, ["division_manager", "supervisor", "system_admin"]);
  const links: LaunchpadLink[] = [];

  if (!hasLearn) {
    return (
      <div className="staff-fade-in">
        <StaffPageHeader eyebrow="Workspace" title="Learn Operations" />
        <StaffEmptyState
          icon={GraduationCap}
          title="Access restricted"
          description="You do not have access to the Learn division. Contact your manager if you believe this is an error."
        />
      </div>
    );
  }

  if (
    hasLearnLeadership ||
    viewerHasDivisionRole(viewer, "learn", ["academy_admin", "content_manager", "academy_ops"])
  ) {
    links.push({
      href: `${getDivisionUrl("learn")}/owner/courses`,
      label: "Owner courses",
      description: "Manage live course inventory, readiness, and academy publishing.",
      icon: BookOpenCheck,
      readiness: "live",
    });
  }

  if (
    hasLearnLeadership ||
    viewerHasDivisionRole(viewer, "learn", ["academy_admin", "certification_manager"])
  ) {
    links.push({
      href: `${getDivisionUrl("learn")}/owner/instructors`,
      label: "Instructor approvals",
      description: "Review instructors, assignments, and role movement.",
      icon: Users,
      readiness: "live",
    });
  }

  if (
    hasLearnLeadership ||
    viewerHasDivisionRole(viewer, "learn", ["certification_manager", "academy_admin"])
  ) {
    links.push({
      href: `${getDivisionUrl("learn")}/owner/certificates`,
      label: "Certification review",
      description: "Review certificate issuance and verification-sensitive academy records.",
      icon: ShieldCheck,
      readiness: "live",
    });
  }

  if (hasLearnLeadership || viewerHasDivisionRole(viewer, "learn", ["learner_support", "academy_ops"])) {
    links.push({
      href: `${getDivisionUrl("learn")}/support`,
      label: "Learner support",
      description: "Handle learner issues and academy support journeys.",
      icon: ShieldCheck,
      readiness: "live",
    });
  }

  if (hasLearnLeadership || viewerHasDivisionRole(viewer, "learn", ["instructor"])) {
    links.push({
      href: `${getDivisionUrl("learn")}/instructor`,
      label: "Instructor surface",
      description: "Verify what instructors can actually see and act on today.",
      icon: Presentation,
      readiness: "live",
    });
  }

  return (
    <div className="staff-fade-in">
      <StaffPageHeader
        eyebrow="Workspace"
        title="Learn Operations"
        description="Manage enrollments, instructors, certifications, and course content."
      />
      <StaffWorkspaceLaunchpad
        overview="HenryLearn already has live owner, support, instructor, and learner surfaces. This workspace now routes operators into those real controls and avoids pretending that a second dashboard exists."
        links={links}
        notes={[
          "Learn store writes now retry without stale schema-cache columns, so role and application flows no longer hard-fail when production lags the intended schema.",
        ]}
      />
    </div>
  );
}
