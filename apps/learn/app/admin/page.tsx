import { translateSurfaceLabel } from "@henryco/i18n/server";
import { requireLearnRoles } from "@/lib/learn/auth";
import { getOwnerAnalytics } from "@/lib/learn/data";
import { adminNav } from "@/lib/learn/navigation";
import { getLearnPublicLocale } from "@/lib/locale-server";
import { LearnMetricCard, LearnWorkspaceShell } from "@/components/learn/ui";

export default async function AdminPage() {
  await requireLearnRoles(["academy_owner", "academy_admin"], "/admin");
  const analytics = await getOwnerAnalytics();
  const locale = await getLearnPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);

  return (
    <LearnWorkspaceShell
      kicker={t("Admin")}
      title={t("Support the academy across courses, learners, assignments, and reporting.")}
      description={t("Admin operators can move between the core academy surfaces without needing the full owner view.")}
      nav={adminNav("/admin", t)}
    >
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <LearnMetricCard label={t("Courses")} value={String(analytics.metrics.totalCourses)} hint={t("Courses currently represented in the academy data layer.")} />
        <LearnMetricCard label={t("Learners")} value={String(analytics.metrics.activeLearners)} hint={t("Distinct learner identities with live academy activity.")} />
        <LearnMetricCard label={t("Certificates")} value={String(analytics.metrics.certificatesIssued)} hint={t("Issued credential volume.")} />
        <LearnMetricCard label={t("Assignments")} value={String(analytics.snapshot.assignments.length)} hint={t("Tracked internal assignment records.")} />
      </div>
    </LearnWorkspaceShell>
  );
}
