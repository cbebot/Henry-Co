import { ApplicationTable } from "@/components/application-table";
import { requireJobsRoles } from "@/lib/auth";
import { getRecruiterOverviewData } from "@/lib/jobs/data";
import { recruiterNav } from "@/lib/jobs/navigation";
import { SectionCard, WorkspaceShell } from "@/components/workspace-shell";

export const dynamic = "force-dynamic";

export default async function RecruiterPipelinePage() {
  await requireJobsRoles(["recruiter", "admin", "owner", "moderator"], "/recruiter/pipeline");
  const data = await getRecruiterOverviewData();

  return (
    <WorkspaceShell
      area="recruiter"
      title="Pipeline"
      subtitle="Cross-employer applicant movement in one structured table."
      nav={recruiterNav}
      activeHref="/recruiter/pipeline"
      accent="linear-gradient(135deg,#1d3f6f 0%,#3266b4 55%,#6db7ff 100%)"
    >
      <SectionCard title="Pipeline table">
        <ApplicationTable applications={data.applications} detailBase="/employer/applicants" />
      </SectionCard>
    </WorkspaceShell>
  );
}
