import { translateSurfaceLabel } from "@henryco/i18n/server";
import { requireLearnRoles } from "@/lib/learn/auth";
import { getOwnerAnalytics } from "@/lib/learn/data";
import { ownerNav } from "@/lib/learn/navigation";
import { getLearnPublicLocale } from "@/lib/locale-server";
import { LearnMetricCard, LearnPanel, LearnWorkspaceShell } from "@/components/learn/ui";

export default async function OwnerAnalyticsPage() {
  await requireLearnRoles(["academy_owner", "academy_admin", "finance", "internal_manager"], "/owner/analytics");
  const analytics = await getOwnerAnalytics();
  const locale = await getLearnPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);

  return (
    <LearnWorkspaceShell
      kicker={t("Analytics")}
      title={t("Read academy health through completion, adoption, revenue, and trust.")}
      description={t("The analytics view uses live academy records for completions, certificates, assignments, and review sentiment.")}
      nav={ownerNav("/owner/analytics", t)}
    >
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <LearnMetricCard label={t("Paths")} value={String(analytics.metrics.paths)} hint={t("Structured programs currently represented in the academy.")} />
        <LearnMetricCard label={t("Revenue")} value={String(analytics.metrics.totalRevenue)} hint={t("Manual and sponsored payment records captured in the academy store.")} />
        <LearnMetricCard label={t("Average rating")} value={String(analytics.metrics.averageRating)} hint={t("Public review sentiment across published courses.")} />
        <LearnMetricCard label={t("Overdue assignments")} value={String(analytics.metrics.overdueAssignments)} hint={t("Internal training items already past the due threshold.")} />
      </div>

      <LearnPanel className="rounded-[2rem]">
        <h3 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--learn-ink)]">{t("Operational readout")}</h3>
        <div className="mt-5 space-y-3 text-sm leading-7 text-[var(--learn-ink-soft)]">
          <p>{t("Public courses")}: {analytics.metrics.publicCourses}</p>
          <p>{t("Completion rate")}: {analytics.metrics.completionRate}%</p>
          <p>{t("Certificates issued")}: {analytics.metrics.certificatesIssued}</p>
          <p>{t("Active learners")}: {analytics.metrics.activeLearners}</p>
        </div>
      </LearnPanel>
    </LearnWorkspaceShell>
  );
}
