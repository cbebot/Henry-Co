import { requireJobsRoles } from "@/lib/auth";
import { getAnalyticsSnapshot } from "@/lib/jobs/data";
import { SectionCard, StatTile, WorkspaceShell } from "@/components/workspace-shell";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  await requireJobsRoles(["recruiter", "admin", "owner", "moderator"], "/analytics");
  const snapshot = await getAnalyticsSnapshot();

  return (
    <WorkspaceShell area="analytics" title="Platform Analytics" subtitle="High-level jobs platform telemetry for operators and leadership." nav={[{ href: "/analytics", label: "Overview" }, { href: "/recruiter", label: "Recruiter" }]} activeHref="/analytics" accent="linear-gradient(135deg,#123b33 0%,#1f7a59 55%,#8ee0bf 100%)">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Jobs" value={snapshot.totalJobs} detail="Published and draft jobs." />
        <StatTile label="Employers" value={snapshot.employers} detail="Employer profiles in the system." />
        <StatTile label="Applications" value={snapshot.applications} detail="Total applications." />
        <StatTile label="Verified employers" value={snapshot.verifiedEmployers} detail="Employer pages with verified state." />
      </div>
      <SectionCard title="Stage counts">
        <div className="grid gap-3 md:grid-cols-3">
          {Object.entries(snapshot.stageCounts).map(([stage, count]) => (
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
