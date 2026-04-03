import Link from "next/link";
import { requireJobsRoles } from "@/lib/auth";
import { getEmployerDashboardData } from "@/lib/jobs/data";
import { employerNav } from "@/lib/jobs/navigation";
import { SectionCard, StatTile, WorkspaceShell } from "@/components/workspace-shell";

export const dynamic = "force-dynamic";

export default async function EmployerOverviewPage() {
  const viewer = await requireJobsRoles(["employer", "admin", "owner"], "/employer");
  const data = await getEmployerDashboardData(viewer.user!.id, viewer.user!.email);

  return (
    <WorkspaceShell
      area="employer"
      title="Employer Workspace"
      subtitle="Company onboarding, verified trust posture, roles, applicants, and hiring notes stay in one premium control surface."
      nav={employerNav}
      activeHref="/employer"
      accent="linear-gradient(135deg,#7c5a28 0%,#b88a47 55%,#f1c88c 100%)"
    >
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatTile label="Memberships" value={data.memberships.length} detail="Employer entities tied to this account." />
          <StatTile label="Live jobs" value={data.jobs.length} detail="Roles published or under review." />
          <StatTile label="Applicants" value={data.applications.length} detail="Candidates across your roles." />
          <StatTile label="Shortlisted" value={data.stageSummary.shortlisted ?? 0} detail="Applications already past early review." />
        </div>

        <SectionCard title="Recent applicants" body="Fresh candidate movement across your employer scope." actions={<Link href="/employer/applicants" className="text-sm font-semibold text-[var(--jobs-accent)]">View all</Link>}>
          <div className="space-y-3">
            {data.applications.slice(0, 6).map((application) => (
              <Link key={application.applicationId} href={`/employer/applicants/${application.applicationId}`} className="block rounded-2xl bg-[var(--jobs-paper-soft)] p-4 hover:bg-[var(--jobs-accent-soft)]">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold">{application.candidateName}</div>
                    <div className="mt-1 text-sm text-[var(--jobs-muted)]">{application.jobTitle}</div>
                  </div>
                  <span className="rounded-full bg-[var(--jobs-accent-soft)] px-3 py-1 text-xs font-semibold">{application.stage}</span>
                </div>
              </Link>
            ))}
          </div>
        </SectionCard>
      </div>
    </WorkspaceShell>
  );
}
