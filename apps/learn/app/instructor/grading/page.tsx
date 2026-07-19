import { translateSurfaceLabel } from "@henryco/i18n/server";
import { requireLearnRoles } from "@/lib/learn/auth";
import { getLearnSnapshot } from "@/lib/learn/data";
import { getLearnPublicLocale } from "@/lib/locale-server";
import { instructorNav } from "@/lib/learn/navigation";
import { LearnPanel, LearnSectionIntro, LearnStatusBadge, LearnWorkspaceShell } from "@/components/learn/ui";

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

export default async function InstructorGradingPage() {
  await requireLearnRoles(
    ["academy_owner", "academy_admin", "instructor"],
    "/instructor/grading",
  );
  const [snapshot, locale] = await Promise.all([getLearnSnapshot(), getLearnPublicLocale()]);
  const t = (text: string) => translateSurfaceLabel(locale, text);

  const recentAttempts = [...snapshot.attempts]
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
    .slice(0, 20);

  const pendingAssignments = snapshot.assignments
    .filter((assignment) => assignment.status === "assigned" || assignment.status === "in_progress")
    .slice(0, 20);

  return (
    <LearnWorkspaceShell
      kicker={t("Grading")}
      title={t("Review submissions and quiz attempts.")}
      description={t(
        "Quizzes are graded automatically; use this space to review assignment submissions that need your input and to see recent assessment activity.",
      )}
      nav={instructorNav("/instructor/grading", t)}
    >
      <LearnSectionIntro
        kicker={t("Quiz attempts")}
        title={t("Latest assessment activity")}
        body={t(
          "Quizzes are graded automatically the moment a learner submits, so the score and pass/fail result you see here are final.",
        )}
      />
      <ul className="mt-6 space-y-3">
        {recentAttempts.length === 0 ? (
          <li className="text-sm text-[var(--learn-ink-soft)]">{t("No quiz attempts yet.")}</li>
        ) : (
          recentAttempts.map((attempt) => {
            const quiz = snapshot.quizzes.find((q) => q.id === attempt.quizId);
            const enrollment = snapshot.enrollments.find((e) => e.id === attempt.enrollmentId);
            const course = enrollment
              ? snapshot.courses.find((c) => c.id === enrollment.courseId)
              : null;
            return (
              <li
                key={attempt.id}
                className="grid gap-3 rounded-[1.4rem] border border-[var(--learn-line)] bg-[var(--learn-fill-faint)] p-4 sm:grid-cols-[1.4fr,1fr] sm:items-center"
              >
                <div>
                  <p className="text-sm font-semibold text-[var(--learn-ink)]">
                    {course?.title ?? t("Course")} — {quiz?.title ?? t("Quiz")}
                  </p>
                  <p className="mt-1 text-xs text-[var(--learn-ink-soft)]">
                    {attempt.normalizedEmail ?? t("Anonymous")} ·{" "}
                    {formatDate(attempt.submittedAt)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2 text-xs">
                  <LearnStatusBadge
                    label={`${attempt.score}%`}
                    tone={attempt.passed ? "success" : "warning"}
                  />
                  <LearnStatusBadge
                    label={attempt.passed ? t("Passed") : t("Review")}
                    tone={attempt.passed ? "success" : "warning"}
                  />
                </div>
              </li>
            );
          })
        )}
      </ul>

      <LearnSectionIntro
        className="mt-12"
        kicker={t("Assignments queue")}
        title={t("Assignments awaiting your review")}
        body={t(
          "Once a learner uploads a file or free-text response, it appears here for you to grade.",
        )}
      />
      <ul className="mt-6 space-y-3">
        {pendingAssignments.length === 0 ? (
          <li className="text-sm text-[var(--learn-ink-soft)]">{t("Nothing pending.")}</li>
        ) : (
          pendingAssignments.map((assignment) => {
            const course = assignment.courseId
              ? snapshot.courses.find((c) => c.id === assignment.courseId)
              : null;
            return (
              <li
                key={assignment.id}
                className="rounded-[1.4rem] border border-[var(--learn-line)] bg-[var(--learn-fill-faint)] p-4"
              >
                <p className="text-sm font-semibold text-[var(--learn-ink)]">
                  {course?.title ?? t("Assigned training")}
                </p>
                <p className="mt-1 text-xs text-[var(--learn-ink-soft)]">
                  {assignment.note} ·{" "}
                  {assignment.dueAt ? `${t("Due")} ${formatDate(assignment.dueAt)}` : t("No due date")}
                </p>
                <LearnStatusBadge
                  label={assignment.status}
                  tone={assignment.status === "overdue" ? "warning" : "neutral"}
                />
              </li>
            );
          })
        )}
      </ul>

      <LearnPanel className="mt-10 rounded-[1.6rem]">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-copper)]">
          {t("Implementation note")}
        </p>
        <p className="mt-2 text-sm leading-7 text-[var(--learn-ink-soft)]">
          {t(
            "Assignment submissions land in the queue above as learners upload them. The full grading composer is being finished — for now, use this overview to see what needs review.",
          )}
        </p>
      </LearnPanel>
    </LearnWorkspaceShell>
  );
}
