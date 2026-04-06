import { GraduationCap } from "lucide-react";
import { requireStaff } from "@/lib/staff-auth";
import { StaffPageHeader, StaffEmptyState } from "@/components/StaffPrimitives";

export const dynamic = "force-dynamic";

export default async function LearnPage() {
  const viewer = await requireStaff();
  const hasLearn = viewer.divisions.some((d) => d.division === "learn");

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

  return (
    <div className="staff-fade-in">
      <StaffPageHeader
        eyebrow="Workspace"
        title="Learn Operations"
        description="Manage enrollments, instructors, certifications, and course content."
      />
      <StaffEmptyState
        icon={GraduationCap}
        title="Learn operations coming soon"
        description="This workspace will surface enrollment management, instructor assignments, certification tracking, content pipelines, and learner support queues for the HenryLearn division."
      />
    </div>
  );
}
