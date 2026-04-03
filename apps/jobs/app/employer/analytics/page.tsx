import { requireJobsRoles } from "@/lib/auth";
import { getEmployerDashboardData } from "@/lib/jobs/data";
import { employerNav } from "@/lib/jobs/navigation";
import { SectionCard, StatTile, WorkspaceShell } from "@/components/workspace-shell";

export const dynamic = "force-dynamic";

export default async function EmployerAnalyticsPage() {
  const viewer = await requireJobsRoles(["employer", "admin", "owner"], "/employer/analytics");
  const data = await getEmployerDashboardData(viewer.user!.id, viewer.user!.email);

  return (
    <WorkspaceShell
      area="employer"
      title="Employer Analytics"
      subtitle="Track role output, pipeline concentration, and verification posture."
      nav={employerNav}
      activeHref="/employer/analytics"
      accent="linear-gradient(135deg,#7c5a28 0%,#b88a47 55%,#f1c88c 100%)"
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Jobs" value={data.jobs.length} detail="Roles under this employer scope." />
        <StatTile label="Applicants" value={data.applications.length} detail="Total live applicants." />
        <StatTile label="Interviewing" value={data.stageSummary.interview ?? 0} detail="Candidates already in interviews." />
        <StatTile label="Offers" value={data.stageSummary.offer ?? 0} detail="Candidates at offer stage." />
      </div>
      <SectionCard title="Stage distribution">
        <div className="grid gap-3 md:grid-cols-3">
          {Object.entries(data.stageSummary).map(([stage, count]) => (
            <div key={stage} className="rounded-2xl bg-[var(--jobs-paper-soft)] p-4">
              <div className="jobs-kicker">{stage}</div>
              <div className="mt-2 text-2xl font-semibold">{count}</div>
            </div>
          ))}
        </div>
      </SectionCard>
    </WorkspaceShell>
  );
}
