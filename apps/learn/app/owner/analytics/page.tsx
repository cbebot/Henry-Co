import { requireLearnRoles } from "@/lib/learn/auth";
import { getOwnerAnalytics } from "@/lib/learn/data";
import { ownerNav } from "@/lib/learn/navigation";
import { LearnMetricCard, LearnPanel, LearnWorkspaceShell } from "@/components/learn/ui";

export default async function OwnerAnalyticsPage() {
  await requireLearnRoles(["academy_owner", "academy_admin", "finance", "internal_manager"], "/owner/analytics");
  const analytics = await getOwnerAnalytics();

  return (
    <LearnWorkspaceShell
      kicker="Analytics"
      title="Read academy health through completion, adoption, revenue, and trust."
      description="The analytics view uses live academy records for completions, certificates, assignments, and review sentiment."
      nav={ownerNav("/owner/analytics")}
    >
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <LearnMetricCard label="Paths" value={String(analytics.metrics.paths)} hint="Structured programs currently represented in the academy." />
        <LearnMetricCard label="Revenue" value={String(analytics.metrics.totalRevenue)} hint="Manual and sponsored payment records captured in the academy store." />
        <LearnMetricCard label="Average rating" value={String(analytics.metrics.averageRating)} hint="Public review sentiment across published courses." />
        <LearnMetricCard label="Overdue assignments" value={String(analytics.metrics.overdueAssignments)} hint="Internal training items already past the due threshold." />
      </div>

      <LearnPanel className="rounded-[2rem]">
        <h3 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--learn-ink)]">Operational readout</h3>
        <div className="mt-5 space-y-3 text-sm leading-7 text-[var(--learn-ink-soft)]">
          <p>Public courses: {analytics.metrics.publicCourses}</p>
          <p>Completion rate: {analytics.metrics.completionRate}%</p>
          <p>Certificates issued: {analytics.metrics.certificatesIssued}</p>
          <p>Active learners: {analytics.metrics.activeLearners}</p>
        </div>
      </LearnPanel>
    </LearnWorkspaceShell>
  );
}
