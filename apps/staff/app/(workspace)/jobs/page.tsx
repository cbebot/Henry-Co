import { Briefcase } from "lucide-react";
import { requireStaff } from "@/lib/staff-auth";
import { StaffPageHeader, StaffEmptyState } from "@/components/StaffPrimitives";

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
      <StaffEmptyState
        icon={Briefcase}
        title="Jobs operations coming soon"
        description="This workspace will surface job postings, candidate applications, employer onboarding, recruitment pipelines, and moderation queues for the HenryJobs division."
      />
    </div>
  );
}
