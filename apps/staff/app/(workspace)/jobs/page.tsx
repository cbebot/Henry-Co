import { getDivisionUrl } from "@henryco/config";
import { Briefcase, Headphones, ShieldCheck, UserRoundSearch, Users, Workflow } from "lucide-react";
import { requireStaff } from "@/lib/staff-auth";
import { viewerHasAnyFamily, viewerHasDivisionRole } from "@/lib/roles";
import { StaffPageHeader, StaffEmptyState } from "@/components/StaffPrimitives";
import { StaffWorkspaceLaunchpad, type LaunchpadLink } from "@/components/StaffWorkspaceLaunchpad";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const viewer = await requireStaff();
  const hasJobs = viewer.divisions.some((d) => d.division === "jobs");
  const hasJobsOversight = viewerHasAnyFamily(viewer, ["division_manager", "system_admin"]);
  const links: LaunchpadLink[] = [];

  if (!hasJobs) {
    return (
      <div className="staff-fade-in">
        <StaffPageHeader eyebrow="Workspace" title="Jobs Operations" />
        <StaffEmptyState
          icon={Briefcase}
          title="Access restricted"
          description="You do not have access to the Jobs division. Contact your manager if you believe this is an error."
        />
      </div>
    );
  }

  if (
    hasJobsOversight ||
    viewerHasDivisionRole(viewer, "jobs", ["recruiter", "internal_recruitment_coordinator"])
  ) {
    links.push({
      href: `${getDivisionUrl("jobs")}/recruiter/pipeline`,
      label: "Recruiter pipeline",
      description: "Advance candidates, inspect hiring stages, and keep recruiter action real.",
      icon: Workflow,
      readiness: "live",
    });
  }

  if (hasJobsOversight || viewerHasDivisionRole(viewer, "jobs", ["jobs_moderator"])) {
    links.push({
      href: `${getDivisionUrl("jobs")}/moderation`,
      label: "Moderation queue",
      description: "Review employers, visibility risks, and trust-sensitive workflow decisions.",
      icon: ShieldCheck,
      readiness: "live",
    });
  }

  if (
    hasJobsOversight ||
    viewerHasDivisionRole(viewer, "jobs", ["recruiter", "internal_recruitment_coordinator", "talent_success"])
  ) {
    links.push({
      href: `${getDivisionUrl("jobs")}/recruiter/candidates`,
      label: "Candidate review",
      description: "Inspect candidate records, messages, and live recruitment movement.",
      icon: UserRoundSearch,
      readiness: "live",
    });
  }

  if (
    viewerHasDivisionRole(viewer, "jobs", ["jobs_support", "talent_success", "employer_success"]) ||
    hasJobsOversight
  ) {
    links.push({
      href: "/support?division=jobs",
      label: "Jobs support queue",
      description: "Filter the shared staff support queue to jobs-specific customer and employer issues.",
      icon: Headphones,
      readiness: "live",
    });
  }

  if (hasJobsOversight) {
    links.push({
      href: `${getDivisionUrl("jobs")}/owner`,
      label: "Owner control",
      description: "Open the owner-side operational overview for jobs governance.",
      icon: Users,
      readiness: "live",
    });
  }

  return (
    <div className="staff-fade-in">
      <StaffPageHeader
        eyebrow="Workspace"
        title="Jobs Operations"
        description="Manage job postings, applications, employer accounts, and recruitment pipelines."
      />
      <StaffWorkspaceLaunchpad
        overview="The live jobs controls already exist inside HenryJobs. This workspace now acts as a launchpad into recruiter, moderation, owner, and admin routes instead of showing a passive placeholder."
        links={links}
        notes={[
          "Use the moderation route for trust and anti-bypass review, not the public-facing jobs pages.",
          "The jobs live verifier is now loading production env fallbacks so cron and governed workflow checks report real failures instead of missing-secret noise.",
        ]}
      />
    </div>
  );
}
