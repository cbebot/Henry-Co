import { translateSurfaceLabel } from "@henryco/i18n/server";
import { requireLearnRoles } from "@/lib/learn/auth";
import { getLearnSnapshot } from "@/lib/learn/data";
import { getLearnPublicLocale } from "@/lib/locale-server";
import { instructorNav } from "@/lib/learn/navigation";
import { LearnPanel, LearnSectionIntro, LearnWorkspaceShell } from "@/components/learn/ui";

function pct(value: number, total: number) {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

export default async function InstructorAnalyticsPage() {
  await requireLearnRoles(
    ["academy_owner", "academy_admin", "instructor"],
    "/instructor/analytics",
  );
  const [snapshot, locale] = await Promise.all([getLearnSnapshot(), getLearnPublicLocale()]);
  const t = (text: string) => translateSurfaceLabel(locale, text);

  const courseStats = snapshot.courses.map((course) => {
    const enrollments = snapshot.enrollments.filter((e) => e.courseId === course.id);
    const completed = enrollments.filter((e) => e.status === "completed").length;
    const certificates = snapshot.certificates.filter((c) => c.courseId === course.id).length;
    const reviews = snapshot.reviews.filter((r) => r.courseId === course.id && r.status === "published");
    const ratingAvg = reviews.length
      ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(2))
      : null;
    return {
      id: course.id,
      title: course.title,
      enrolled: enrollments.length,
      completed,
      certificates,
      ratingAvg,
      ratingCount: reviews.length,
      completionRate: pct(completed, enrollments.length),
    };
  });

  return (
    <LearnWorkspaceShell
      kicker={t("Analytics")}
      title={t("Course performance and learner sentiment.")}
      description={t(
        "Track enrolment volume, completion rate, certification yield, and average rating across each course you author.",
      )}
      nav={instructorNav("/instructor/analytics", t)}
    >
      <LearnSectionIntro
        kicker={t("Per course")}
        title={t("Outcomes by course")}
        body={t("Completion rate compares completed enrolments against total enrolments.")}
      />
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--learn-line)] text-left text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--learn-ink-soft)]">
              <th className="py-3 pr-4">{t("Course")}</th>
              <th className="py-3 pr-4">{t("Enrolled")}</th>
              <th className="py-3 pr-4">{t("Completed")}</th>
              <th className="py-3 pr-4">{t("Completion rate")}</th>
              <th className="py-3 pr-4">{t("Certificates")}</th>
              <th className="py-3 pr-4">{t("Rating")}</th>
            </tr>
          </thead>
          <tbody>
            {courseStats.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-[var(--learn-ink-soft)]">
                  {t("No course activity yet.")}
                </td>
              </tr>
            ) : (
              courseStats.map((row) => (
                <tr key={row.id} className="border-b border-[var(--learn-line)]">
                  <td className="py-3 pr-4 text-[var(--learn-ink)]">{row.title}</td>
                  <td className="py-3 pr-4 text-[var(--learn-ink)]">{row.enrolled}</td>
                  <td className="py-3 pr-4 text-[var(--learn-ink)]">{row.completed}</td>
                  <td className="py-3 pr-4 text-[var(--learn-ink)]">{row.completionRate}%</td>
                  <td className="py-3 pr-4 text-[var(--learn-ink)]">{row.certificates}</td>
                  <td className="py-3 pr-4 text-[var(--learn-ink)]">
                    {row.ratingAvg ? `${row.ratingAvg} (${row.ratingCount})` : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <LearnPanel className="mt-10 rounded-[1.6rem]">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-copper)]">
          {t("Privacy note")}
        </p>
        <p className="mt-2 text-sm leading-7 text-[var(--learn-ink-soft)]">
          {t(
            "Learner identifiers are not displayed in this surface — only aggregate counts. Reviews shown here are those published by learners and approved by content moderation.",
          )}
        </p>
      </LearnPanel>
    </LearnWorkspaceShell>
  );
}
