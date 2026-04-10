import { getDivisionUrl } from "@henryco/config";
import { Briefcase, ShieldCheck, UserRoundSearch, Users, Workflow } from "lucide-react";
import { requireStaff } from "@/lib/staff-auth";
import { StaffPageHeader, StaffEmptyState } from "@/components/StaffPrimitives";
import { StaffWorkspaceLaunchpad } from "@/components/StaffWorkspaceLaunchpad";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const viewer = await requireStaff();
  const hasJobs = viewer.divisions.some((d) => d.division === "jobs");

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

  return (
    <div className="staff-fade-in">
      <StaffPageHeader
        eyebrow="Workspace"
        title="Jobs Operations"
        description="Manage job postings, applications, employer accounts, and recruitment pipelines."
      />
      <StaffWorkspaceLaunchpad
        overview="The live jobs controls already exist inside HenryJobs. This workspace now acts as a launchpad into recruiter, moderation, owner, and admin routes instead of showing a passive placeholder."
        links={[
          {
            href: `${getDivisionUrl("jobs")}/recruiter/pipeline`,
            label: "Recruiter pipeline",
            description: "Advance candidates, inspect hiring stages, and keep recruiter action real.",
            icon: Workflow,
            readiness: "live",
          },
          {
            href: `${getDivisionUrl("jobs")}/moderation`,
            label: "Moderation queue",
            description: "Review employers, visibility risks, and trust-sensitive workflow decisions.",
            icon: ShieldCheck,
            readiness: "live",
          },
          {
            href: `${getDivisionUrl("jobs")}/recruiter/candidates`,
            label: "Candidate review",
            description: "Inspect candidate records, messages, and live recruitment movement.",
            icon: UserRoundSearch,
            readiness: "live",
          },
          {
            href: `${getDivisionUrl("jobs")}/owner`,
            label: "Owner control",
            description: "Open the owner-side operational overview for jobs governance.",
            icon: Users,
            readiness: "live",
          },
        ]}
        notes={[
          "Use the moderation route for trust and anti-bypass review, not the public-facing jobs pages.",
          "The jobs live verifier is now loading production env fallbacks so cron and governed workflow checks report real failures instead of missing-secret noise.",
        ]}
      />
    </div>
  );
}
