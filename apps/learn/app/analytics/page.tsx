import { requireLearnRoles } from "@/lib/learn/auth";
import { getOwnerAnalytics } from "@/lib/learn/data";
import { analyticsNav } from "@/lib/learn/navigation";
import { LearnMetricCard, LearnWorkspaceShell } from "@/components/learn/ui";

export default async function AnalyticsPage() {
  await requireLearnRoles(["academy_owner", "academy_admin", "finance", "internal_manager"], "/analytics");
  const analytics = await getOwnerAnalytics();

  return (
    <LearnWorkspaceShell
      kicker="Analytics View"
      title="Read the academy through outcome signals, not vanity metrics."
      description="This reporting surface stays focused on completion, revenue, assignments, and trust signals for finance, internal managers, and academy leaders."
      nav={analyticsNav("/analytics")}
    >
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <LearnMetricCard label="Revenue" value={String(analytics.metrics.totalRevenue)} hint="Recorded paid and sponsored academy payment events." />
        <LearnMetricCard label="Completion rate" value={`${analytics.metrics.completionRate}%`} hint="Completion logic derived from real enrollments." />
        <LearnMetricCard label="Average rating" value={String(analytics.metrics.averageRating)} hint="Published review sentiment across live course records." />
        <LearnMetricCard label="Overdue assignments" value={String(analytics.metrics.overdueAssignments)} hint="Internal training pressure currently requiring intervention." />
      </div>
    </LearnWorkspaceShell>
  );
}
