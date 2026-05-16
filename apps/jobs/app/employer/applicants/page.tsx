import { getJobsCopy } from "@henryco/i18n";
import { ApplicationTable } from "@/components/application-table";
import { requireJobsRoles } from "@/lib/auth";
import { getEmployerDashboardData } from "@/lib/jobs/data";
import { getJobsPublicLocale } from "@/lib/locale-server";
import { employerNav } from "@/lib/jobs/navigation";
import { SectionCard, WorkspaceShell } from "@/components/workspace-shell";

export const dynamic = "force-dynamic";

export default async function EmployerApplicantsPage() {
  const viewer = await requireJobsRoles(["employer", "admin", "owner"], "/employer/applicants");
  const [data, locale] = await Promise.all([
    getEmployerDashboardData(viewer.user!.id, viewer.user!.email),
    getJobsPublicLocale(),
  ]);
  const copy = getJobsCopy(locale).employerApplicants;

  return (
    <WorkspaceShell
      area="employer"
      title={copy.pageTitle}
      subtitle={copy.pageSubtitle}
      nav={employerNav}
      activeHref="/employer/applicants"
      accent="linear-gradient(135deg,#7c5a28 0%,#b88a47 55%,#f1c88c 100%)"
    >
      <SectionCard title={copy.sectionTitle}>
        <ApplicationTable applications={data.applications} detailBase="/employer/applicants" copy={copy} />
      </SectionCard>
    </WorkspaceShell>
  );
}
