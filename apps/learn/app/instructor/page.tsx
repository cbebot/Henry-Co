import type { Metadata } from "next";

import { getLearnInstructorCopy, translateSurfaceLabel } from "@henryco/i18n/server";
import { requireLearnRoles } from "@/lib/learn/auth";
import { getLearnSnapshot } from "@/lib/learn/data";
import { getLearnPublicLocale } from "@/lib/locale-server";
import { instructorNav } from "@/lib/learn/navigation";
import { LearnPanel, LearnSectionIntro, LearnWorkspaceShell } from "@/components/learn/ui";

function pct(value: number, total: number) {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLearnPublicLocale();
  const copy = getLearnInstructorCopy(locale);
  return {
    title: copy.meta.title,
  };
}

export default async function InstructorPage() {
  await requireLearnRoles(["academy_owner", "academy_admin", "instructor"], "/instructor");
  const [snapshot, locale] = await Promise.all([getLearnSnapshot(), getLearnPublicLocale()]);
  const copy = getLearnInstructorCopy(locale);

  const enrollmentsByCourse = new Map<string, number>();
  const completedByCourse = new Map<string, number>();
  for (const enrollment of snapshot.enrollments) {
    enrollmentsByCourse.set(
      enrollment.courseId,
      (enrollmentsByCourse.get(enrollment.courseId) ?? 0) + 1,
    );
    if (enrollment.status === "completed") {
      completedByCourse.set(
        enrollment.courseId,
        (completedByCourse.get(enrollment.courseId) ?? 0) + 1,
      );
    }
  }

  const certificatesByCourse = new Map<string, number>();
  for (const certificate of snapshot.certificates) {
    certificatesByCourse.set(
      certificate.courseId,
      (certificatesByCourse.get(certificate.courseId) ?? 0) + 1,
    );
  }

  const reviewsByCourse = new Map<string, { count: number; sum: number }>();
  for (const review of snapshot.reviews) {
    if (review.status !== "published") continue;
    const entry = reviewsByCourse.get(review.courseId) ?? { count: 0, sum: 0 };
    entry.count += 1;
    entry.sum += review.rating;
    reviewsByCourse.set(review.courseId, entry);
  }

  const totalEnrollments = snapshot.enrollments.length;
  const totalCompleted = snapshot.enrollments.filter((e) => e.status === "completed").length;
  const totalCertificates = snapshot.certificates.length;
  const averageCompletion = pct(totalCompleted, totalEnrollments);

  return (
    <LearnWorkspaceShell
      kicker={copy.hero.kicker}
      title={copy.hero.title}
      description={copy.hero.description}
      nav={instructorNav("/instructor", (text) => translateSurfaceLabel(locale, text))}
    >
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <LearnPanel className="rounded-[1.4rem] p-5">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-ink-soft)]">
            {copy.stats.activeEnrollments}
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-[var(--learn-ink)]">
            {totalEnrollments}
          </p>
        </LearnPanel>
        <LearnPanel className="rounded-[1.4rem] p-5">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-ink-soft)]">
            {copy.stats.completed}
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-[var(--learn-ink)]">
            {totalCompleted}
          </p>
          <p className="mt-1 text-xs text-[var(--learn-ink-soft)]">{averageCompletion}%</p>
        </LearnPanel>
        <LearnPanel className="rounded-[1.4rem] p-5">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-ink-soft)]">
            {copy.stats.certificatesIssued}
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-[var(--learn-ink)]">
            {totalCertificates}
          </p>
        </LearnPanel>
        <LearnPanel className="rounded-[1.4rem] p-5">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-ink-soft)]">
            {copy.stats.coursesAuthored}
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-[var(--learn-ink)]">
            {snapshot.courses.length}
          </p>
        </LearnPanel>
      </section>

      <section className="mt-8">
        <LearnSectionIntro
          kicker={copy.courses.sectionKicker}
          title={copy.courses.sectionTitle}
          body={copy.courses.sectionBody}
        />
        <div className="mt-6 space-y-3">
          {snapshot.courses.length === 0 ? (
            <p className="text-sm text-[var(--learn-ink-soft)]">{copy.courses.emptyState}</p>
          ) : (
            snapshot.courses.map((course) => {
              const enrolled = enrollmentsByCourse.get(course.id) ?? 0;
              const completed = completedByCourse.get(course.id) ?? 0;
              const certificates = certificatesByCourse.get(course.id) ?? 0;
              const reviewStats = reviewsByCourse.get(course.id);
              const avgRating = reviewStats?.count
                ? (reviewStats.sum / reviewStats.count).toFixed(1)
                : "—";
              return (
                <article
                  key={course.id}
                  className="grid gap-3 rounded-[1.4rem] border border-[var(--learn-line)] bg-[var(--learn-fill-faint)] p-5 sm:grid-cols-[1.4fr,1fr] sm:items-center"
                >
                  <div>
                    <p className="text-sm font-semibold text-[var(--learn-ink)]">
                      {course.title}
                    </p>
                    <p className="mt-1 text-xs text-[var(--learn-ink-soft)]">
                      {course.visibility} · {course.accessModel} · {course.status}
                    </p>
                  </div>
                  <dl className="grid grid-cols-4 gap-3 text-center text-xs">
                    <div>
                      <dt className="font-semibold uppercase tracking-[0.16em] text-[var(--learn-ink-soft)]">
                        {copy.courses.enrolledLabel}
                      </dt>
                      <dd className="mt-1 text-base font-semibold text-[var(--learn-ink)]">
                        {enrolled}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold uppercase tracking-[0.16em] text-[var(--learn-ink-soft)]">
                        {copy.courses.completedLabel}
                      </dt>
                      <dd className="mt-1 text-base font-semibold text-[var(--learn-ink)]">
                        {completed}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold uppercase tracking-[0.16em] text-[var(--learn-ink-soft)]">
                        {copy.courses.certificatesLabel}
                      </dt>
                      <dd className="mt-1 text-base font-semibold text-[var(--learn-ink)]">
                        {certificates}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold uppercase tracking-[0.16em] text-[var(--learn-ink-soft)]">
                        {copy.courses.ratingLabel}
                      </dt>
                      <dd className="mt-1 text-base font-semibold text-[var(--learn-ink)]">
                        {avgRating}
                      </dd>
                    </div>
                  </dl>
                </article>
              );
            })
          )}
        </div>
      </section>
    </LearnWorkspaceShell>
  );
}
