import { translateSurfaceLabel } from "@henryco/i18n/server";
import { requireLearnRoles } from "@/lib/learn/auth";
import { getOwnerAnalytics } from "@/lib/learn/data";
import { ownerNav } from "@/lib/learn/navigation";
import { getLearnPublicLocale } from "@/lib/locale-server";
import { LearnMetricCard, LearnPanel, LearnWorkspaceShell } from "@/components/learn/ui";

export default async function OwnerOverviewPage() {
  await requireLearnRoles(["academy_owner", "academy_admin"], "/owner");
  const analytics = await getOwnerAnalytics();
  const locale = await getLearnPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);

  return (
    <LearnWorkspaceShell
      kicker={t("Academy Ops")}
      title={t("Run the academy with real visibility across learning, payments, assignments, and certificates.")}
      description={t("HenryCo Learn keeps operations in focused views so content, learners, assignments, analytics, and announcements stay easy to manage at scale.")}
      nav={ownerNav("/owner", t)}
    >
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <LearnMetricCard label={t("Total courses")} value={String(analytics.metrics.totalCourses)} hint={t("Published plus internal programs in the live academy store.")} />
        <LearnMetricCard label={t("Active learners")} value={String(analytics.metrics.activeLearners)} hint={t("Unique academy identities with active or completed enrollments.")} />
        <LearnMetricCard label={t("Certificates issued")} value={String(analytics.metrics.certificatesIssued)} hint={t("Live academy certificates with verification records.")} />
        <LearnMetricCard label={t("Completion rate")} value={`${analytics.metrics.completionRate}%`} hint={t("Completion based on real enrollment status and verified academy progress.")} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <LearnPanel className="rounded-[2rem]">
          <h3 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--learn-ink)]">{t("Recent courses")}</h3>
          <div className="mt-5 space-y-3">
            {analytics.snapshot.courses.slice(0, 5).map((course) => (
              <div key={course.id} className="rounded-[1.4rem] border border-[var(--learn-line)] bg-white/5 p-4">
                <div className="font-semibold text-[var(--learn-ink)]">{course.title}</div>
                <p className="mt-1 text-sm text-[var(--learn-ink-soft)]">{course.visibility} • {course.accessModel} • {course.status}</p>
              </div>
            ))}
          </div>
        </LearnPanel>

        <LearnPanel className="rounded-[2rem]">
          <h3 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--learn-ink)]">{t("Upcoming pressure points")}</h3>
          <div className="mt-5 space-y-3 text-sm leading-7 text-[var(--learn-ink-soft)]">
            <p>{t("Overdue assignments")}: {analytics.metrics.overdueAssignments}</p>
            <p>{t("Public courses")}: {analytics.metrics.publicCourses}</p>
            <p>{t("Average rating")}: {analytics.metrics.averageRating}</p>
            <p>{t("Total revenue recorded")}: {analytics.metrics.totalRevenue}</p>
          </div>
        </LearnPanel>
      </div>
    </LearnWorkspaceShell>
  );
}
