import { translateSurfaceLabel } from "@henryco/i18n/server";
import { requireLearnRoles } from "@/lib/learn/auth";
import { getOwnerAnalytics } from "@/lib/learn/data";
import { analyticsNav } from "@/lib/learn/navigation";
import { getLearnPublicLocale } from "@/lib/locale-server";
import { LearnMetricCard, LearnWorkspaceShell } from "@/components/learn/ui";

export default async function AnalyticsPage() {
  await requireLearnRoles(["academy_owner", "academy_admin", "finance", "internal_manager"], "/analytics");
  const analytics = await getOwnerAnalytics();
  const locale = await getLearnPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);

  return (
    <LearnWorkspaceShell
      kicker={t("Analytics View")}
      title={t("Read the academy through outcome signals, not vanity metrics.")}
      description={t("This reporting surface stays focused on completion, revenue, assignments, and trust signals for finance, internal managers, and academy leaders.")}
      nav={analyticsNav("/analytics", t)}
    >
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <LearnMetricCard label={t("Revenue")} value={String(analytics.metrics.totalRevenue)} hint={t("Recorded paid and sponsored academy payment events.")} />
        <LearnMetricCard label={t("Completion rate")} value={`${analytics.metrics.completionRate}%`} hint={t("Completion logic derived from real enrollments.")} />
        <LearnMetricCard label={t("Average rating")} value={String(analytics.metrics.averageRating)} hint={t("Published review sentiment across live course records.")} />
        <LearnMetricCard label={t("Overdue assignments")} value={String(analytics.metrics.overdueAssignments)} hint={t("Internal training pressure currently requiring intervention.")} />
      </div>
    </LearnWorkspaceShell>
  );
}
