import { ApplicationTable } from "@/components/application-table";
import { requireJobsRoles } from "@/lib/auth";
import { getEmployerDashboardData } from "@/lib/jobs/data";
import { employerNav } from "@/lib/jobs/navigation";
import { SectionCard, WorkspaceShell } from "@/components/workspace-shell";

export const dynamic = "force-dynamic";

export default async function EmployerApplicantsPage() {
  const viewer = await requireJobsRoles(["employer", "admin", "owner"], "/employer/applicants");
  const data = await getEmployerDashboardData(viewer.user!.id, viewer.user!.email);

  return (
    <WorkspaceShell
      area="employer"
      title="Applicants"
      subtitle="Review and move real applicants across your employer pipeline."
      nav={employerNav}
      activeHref="/employer/applicants"
      accent="linear-gradient(135deg,#7c5a28 0%,#b88a47 55%,#f1c88c 100%)"
    >
      <SectionCard title="Applicant table">
        <ApplicationTable applications={data.applications} detailBase="/employer/applicants" />
      </SectionCard>
    </WorkspaceShell>
  );
}
