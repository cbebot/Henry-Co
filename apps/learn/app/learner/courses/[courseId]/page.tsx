import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Award,
  CircleAlert,
  CircleCheckBig,
  Layers3,
  Trophy,
} from "lucide-react";
import { resolveLocalizedDynamicField, translateSurfaceLabel } from "@henryco/i18n/server";
import { submitQuizAttemptAction } from "@/lib/learn/actions";
import { requireLearnUser } from "@/lib/learn/auth";
import { getLearnerWorkspace } from "@/lib/learn/data";
import { getAccountLearnUrl } from "@/lib/learn/links";
import { getLearnPublicLocale } from "@/lib/locale-server";
import { courseRoomNav } from "@/lib/learn/navigation";
import { lookupLearnProfiles, resolveLearnProfile } from "@/lib/learn/people";
import { syncViewerIdentity } from "@/lib/learn/workflows";
import { CertificateDownloadButton } from "@/components/learn/certificate-download-button";
import { PendingSubmitButton } from "@/components/learn/pending-submit-button";
import {
  humanizeLabel,
  LearnPanel,
  LearnStatusBadge,
  LearnWorkspaceShell,
} from "@/components/learn/ui";

type LearnTranslator = (text: string) => string;

function formatDateLabel(value: string | null | undefined, t: LearnTranslator, locale: string) {
  if (!value) return t("Not yet");
  return new Date(value).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatRelativeTime(value: string | null | undefined, t: LearnTranslator, locale: string) {
  if (!value) return t("No recent activity yet");
  const time = new Date(value).getTime();
  const delta = Date.now() - time;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (delta < hour) return `${Math.max(1, Math.round(delta / minute))} ${t("min ago")}`;
  if (delta < day) return `${Math.max(1, Math.round(delta / hour))} ${t("hr ago")}`;
  if (delta < day * 7) return `${Math.max(1, Math.round(delta / day))} ${t("day ago")}`;
  return formatDateLabel(value, t, locale);
}

function displayName(value: string | null | undefined, t: LearnTranslator) {
  const text = String(value || "").trim();
  if (!text) return t("HenryCo learner");
  return text.split(/\s+/).slice(0, 2).join(" ");
}

function isAnswerCorrect(expected: string[], submitted: string[] | undefined) {
  const expectedSignature = expected.map((value) => value.trim().toLowerCase()).sort().join("|");
  const submittedSignature = (submitted || []).map((value) => value.trim().toLowerCase()).sort().join("|");
  return expectedSignature === submittedSignature;
}

export default async function LearnerCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const locale = await getLearnPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const viewer = await requireLearnUser("/learner/courses");
  await syncViewerIdentity(viewer);
  const workspace = await getLearnerWorkspace(viewer);
  const course = workspace.snapshot.courses.find((item) => item.id === courseId);
  const enrollment = workspace.enrollments.find((item) => item.courseId === courseId);
  if (!course || !enrollment) notFound();
  const courseAccessActive = ["active", "completed"].includes(enrollment.status);

  const modules = workspace.snapshot.modules
    .filter((item) => item.courseId === course.id)
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((module) => ({
      ...module,
      lessons: workspace.snapshot.lessons
        .filter((lesson) => lesson.moduleId === module.id)
        .sort((left, right) => left.sortOrder - right.sortOrder)
        .map((lesson) => ({
          ...lesson,
          resources: workspace.snapshot.resources.filter((resource) => resource.lessonId === lesson.id),
        })),
    }));

  const progressByLesson = new Map(
    workspace.progress.filter((item) => item.courseId === course.id).map((item) => [item.lessonId, item])
  );
  const flatLessons = modules.flatMap((module) => module.lessons);
  const completedLessonIds = new Set(
    [...progressByLesson.values()].filter((item) => item.status === "completed").map((item) => item.lessonId)
  );

  const quiz = workspace.snapshot.quizzes.find((item) => item.courseId === course.id) || null;
  const questions = quiz
    ? workspace.snapshot.questions
        .filter((item) => item.quizId === quiz.id)
        .sort((left, right) => left.sortOrder - right.sortOrder)
    : [];
  const attempts = quiz
    ? workspace.attempts
        .filter((item) => item.enrollmentId === enrollment.id && item.quizId === quiz.id)
        .sort((left, right) => new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime())
    : [];
  const latestAttempt = attempts[0] || null;
  const bestAttempt =
    attempts.slice().sort((left, right) => right.score - left.score || new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime())[0] ||
    null;
  const attemptsUsed = attempts.length;
  const remainingAttempts = quiz ? Math.max(quiz.maxAttempts - attemptsUsed, 0) : 0;
  const allLessonsComplete = flatLessons.length > 0 && flatLessons.every((lesson) => completedLessonIds.has(lesson.id));
  const quizPassed = !!bestAttempt?.passed;
  const quizLockedReason =
    !quiz
      ? null
      : !courseAccessActive
        ? t("Your seat is reserved and the room is waiting for payment activation.")
        : !allLessonsComplete
          ? t("Finish every lesson before the final assessment opens.")
          : quizPassed
            ? t("Assessment passed.")
            : remainingAttempts === 0
              ? t("The assessment has reached its maximum attempts. Ask the academy team for a review.")
              : null;
  const certificate = workspace.certificates.find((item) => item.courseId === course.id) || null;
  const certificateHref = certificate ? `/certifications/verify/${certificate.verificationCode}` : null;
  const requirementItems = [
    {
      label: t("Every lesson marked complete"),
      done: allLessonsComplete,
      detail: `${completedLessonIds.size} / ${flatLessons.length || 0} ${t("lessons done")}`,
    },
    {
      label: quiz ? `${t("Final assessment")} — ${quiz.passScore}%+` : t("No final assessment for this program"),
      done: quiz ? quizPassed : true,
      detail: quiz
        ? bestAttempt
          ? `${t("Best score")}: ${bestAttempt.score}%`
          : t("Unlocked after all lessons are complete")
        : t("You can finish by completing the lessons only"),
    },
    {
      label: t("Certificate on file (if this course awards one)"),
      done: !!certificate,
      detail: certificate
        ? `${certificate.certificateNo} — ${t("download or share your verification link")}`
        : course.certification
          ? t("Appears automatically when the two steps above are satisfied")
          : t("This course does not include a certificate"),
    },
  ];

  // WAVE A — translate Supabase-row-driven text via the cached DeepL pipeline.
  const machineTranslate = locale !== "en";
  const courseRecord = course as unknown as Record<string, unknown>;
  const quizRecord = quiz as unknown as Record<string, unknown> | null;
  const [courseTitle, quizTitle, quizDescription, questionsLocalized] = await Promise.all([
    resolveLocalizedDynamicField({
      record: courseRecord,
      field: "title",
      locale,
      fallback: course.title ?? "",
      machineTranslate,
    }),
    quizRecord
      ? resolveLocalizedDynamicField({
          record: quizRecord,
          field: "title",
          locale,
          fallback: quiz?.title ?? "",
          machineTranslate,
        })
      : Promise.resolve(""),
    quizRecord
      ? resolveLocalizedDynamicField({
          record: quizRecord,
          field: "description",
          locale,
          fallback: quiz?.description ?? "",
          machineTranslate,
        })
      : Promise.resolve(""),
    Promise.all(
      questions.map(async (question) => {
        const questionRecord = question as unknown as Record<string, unknown>;
        const [prompt, explanation] = await Promise.all([
          resolveLocalizedDynamicField({
            record: questionRecord,
            field: "prompt",
            locale,
            fallback: question.prompt ?? "",
            machineTranslate,
          }),
          resolveLocalizedDynamicField({
            record: questionRecord,
            field: "explanation",
            locale,
            fallback: question.explanation ?? "",
            machineTranslate,
          }),
        ]);
        return { ...question, prompt, explanation };
      }),
    ),
  ]);

  const reviewQuestions =
    latestAttempt && !latestAttempt.passed
      ? questionsLocalized.filter(
          (question) => !isAnswerCorrect(question.correctAnswer, latestAttempt.answers[question.id]),
        )
      : [];

  const courseEnrollments = workspace.snapshot.enrollments.filter(
    (item) =>
      item.courseId === course.id &&
      ["active", "completed", "awaiting_payment", "paused"].includes(item.status)
  );
  const profileDirectory = await lookupLearnProfiles(
    courseEnrollments.map((item) => ({
      userId: item.userId,
      normalizedEmail: item.normalizedEmail,
    }))
  );

  const participants = courseEnrollments
    .map((item) => {
      const profile = resolveLearnProfile(profileDirectory, {
        userId: item.userId,
        normalizedEmail: item.normalizedEmail,
      });
      return {
        id: item.id,
        fullName:
          profile?.fullName || (item.userId === viewer.user?.id ? viewer.user?.fullName : null) || t("HenryCo learner"),
        avatarUrl: profile?.avatarUrl || null,
        status: item.status,
        percentComplete: item.percentComplete,
        lastActivityAt: item.lastActivityAt,
      };
    })
    .sort((left, right) => {
      const leftTime = left.lastActivityAt ? new Date(left.lastActivityAt).getTime() : 0;
      const rightTime = right.lastActivityAt ? new Date(right.lastActivityAt).getTime() : 0;
      return rightTime - leftTime || right.percentComplete - left.percentComplete;
    });

  const activityReferenceTime = participants.reduce((latest, participant) => {
    const activityTime = participant.lastActivityAt
      ? new Date(participant.lastActivityAt).getTime()
      : 0;
    return activityTime > latest ? activityTime : latest;
  }, new Date(enrollment.lastActivityAt || enrollment.enrolledAt || "1970-01-01T00:00:00.000Z").getTime());
  const recentlyActiveCount = participants.filter((participant) => {
    if (!participant.lastActivityAt) return false;
    return activityReferenceTime - new Date(participant.lastActivityAt).getTime() <= 7 * 24 * 60 * 60 * 1000;
  }).length;

  return (
    <LearnWorkspaceShell
      kicker={t("Learning room")}
      title={courseTitle || course.title}
      description={t(
        "Work through lessons in order, take the final assessment when it unlocks, and download your certificate here when you’ve earned it. Enrollments, billing, and saved courses also appear in your HenryCo account under Learn.",
      )}
      nav={courseRoomNav(`/learner/courses/${course.id}`, t)}
      actions={
        <>
          <a
            href={getAccountLearnUrl()}
            className="learn-button-secondary rounded-full px-4 py-2.5 text-sm font-semibold"
          >
            {t("HenryCo account")}
          </a>
          {certificate ? (
            <CertificateDownloadButton
              verificationCode={certificate.verificationCode}
              learnerName={viewer.user?.fullName ?? null}
              courseTitle={courseTitle || course.title}
              label={t("Download certificate")}
              className="learn-print-hidden"
            />
          ) : null}
        </>
      }
    >
      <LearnPanel className="learn-mesh rounded-[2.2rem] p-7 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <LearnStatusBadge label={`${participants.length} ${t("learners in this cohort")}`} tone="signal" />
          <LearnStatusBadge label={`${recentlyActiveCount} ${t("active this week")}`} tone="success" />
          <LearnStatusBadge
            label={t(humanizeLabel(enrollment.status))}
            tone={
              enrollment.status === "completed"
                ? "success"
                : enrollment.status === "awaiting_payment"
                  ? "warning"
                  : "neutral"
            }
          />
          {quiz ? <LearnStatusBadge label={`${attemptsUsed}/${quiz.maxAttempts} ${t("attempts used")}`} /> : null}
          {certificate ? <LearnStatusBadge label={t("Certificate issued")} tone="success" /> : null}
        </div>

        <div className="space-y-6">
          {quiz ? (
            <LearnPanel className="rounded-[2rem]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--learn-ink-soft)]">
                    {t("Final assessment")}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--learn-ink)]">
                    {quizTitle || quiz.title}
                  </h2>
                  <p className="mt-2 text-sm leading-7 text-[var(--learn-ink-soft)]">
                    {quizDescription || quiz.description}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <LearnStatusBadge label={`${t("Pass score")}: ${quiz.passScore}%`} tone="signal" />
                  <LearnStatusBadge
                    label={
                      quizPassed
                        ? t("Passed")
                        : quizLockedReason
                          ? t("Locked")
                          : `${t("Attempts remaining")}: ${remainingAttempts}`
                    }
                    tone={quizPassed ? "success" : quizLockedReason ? "warning" : "neutral"}
                  />
                </div>
              </div>

              <div className="mt-6 space-y-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[1.5rem] border border-[var(--learn-line)] bg-white/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--learn-ink-soft)]">
                      {t("Assessment state")}
                    </p>
                    <p className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[var(--learn-ink)]">
                      {quizPassed ? t("Assessment complete") : quizLockedReason ? t("Assessment gated") : t("Assessment ready")}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-[var(--learn-ink-soft)]">
                      {quizLockedReason || t("Lessons are complete. Submit the assessment to unlock final completion and certification.")}
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border border-[var(--learn-line)] bg-white/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--learn-ink-soft)]">
                      {t("Attempt history")}
                    </p>
                    <div className="mt-4 space-y-3">
                      {attempts.length > 0 ? (
                        attempts.slice(0, 3).map((attempt) => (
                          <div
                            key={attempt.id}
                            className="rounded-[1.2rem] border border-[var(--learn-line)] bg-black/10 p-3"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold text-[var(--learn-ink)]">{attempt.score}%</p>
                              <LearnStatusBadge
                                label={attempt.passed ? t("Passed") : t("Review needed")}
                                tone={attempt.passed ? "success" : "warning"}
                              />
                            </div>
                            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--learn-ink-soft)]">
                              {formatRelativeTime(attempt.submittedAt, t, locale)}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm leading-7 text-[var(--learn-ink-soft)]">{t("No assessment attempt yet.")}</p>
                      )}
                    </div>
                  </div>
                </div>

                {quizPassed ? (
                  <div className="rounded-[1.6rem] border border-emerald-200/25 bg-emerald-300/8 p-5">
                    <div className="flex items-center gap-3 text-emerald-100">
                      <Trophy className="h-5 w-5" />
                      <p className="text-sm font-semibold">{t("Assessment passed")}</p>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-[var(--learn-ink-soft)]">
                      {t("Your best score is")} {bestAttempt?.score ?? 0}%. {t("The room has recorded the passing assessment in your completion path.")}
                    </p>
                  </div>
                ) : quizLockedReason ? (
                  <div className="rounded-[1.6rem] border border-amber-200/20 bg-amber-300/5 p-5">
                    <div className="flex items-center gap-3 text-amber-100">
                      <CircleAlert className="h-5 w-5" />
                      <p className="text-sm font-semibold">{t("Assessment locked")}</p>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-[var(--learn-ink-soft)]">{quizLockedReason}</p>
                  </div>
                ) : (
                  <form action={submitQuizAttemptAction} className="space-y-5">
                    <input type="hidden" name="courseId" value={course.id} />
                    <input type="hidden" name="quizId" value={quiz.id} />
                    {questionsLocalized.map((question, index) => (
                      <div
                        key={question.id}
                        className="rounded-[1.5rem] border border-[var(--learn-line)] bg-white/5 p-5"
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--learn-ink-soft)]">
                          {t("Question")} {index + 1}
                        </p>
                        <p className="mt-3 text-lg font-semibold text-[var(--learn-ink)]">{question.prompt}</p>
                        <div className="mt-4 space-y-3">
                          {question.questionType === "short_text" ? (
                            <textarea
                              name={`question:${question.id}`}
                              required
                              rows={4}
                              className="learn-textarea rounded-2xl px-4 py-3"
                              placeholder={t("Write your answer clearly.")}
                            />
                          ) : question.questionType === "multiple_choice" ? (
                            question.options.map((option) => (
                              <label
                                key={option}
                                className="flex items-start gap-3 rounded-2xl border border-[var(--learn-line)] px-4 py-3 text-sm text-[var(--learn-ink)]"
                              >
                                <input type="checkbox" name={`question:${question.id}`} value={option} className="mt-1 h-4 w-4" />
                                <span>{option}</span>
                              </label>
                            ))
                          ) : (
                            question.options.map((option) => (
                              <label
                                key={option}
                                className="flex items-start gap-3 rounded-2xl border border-[var(--learn-line)] px-4 py-3 text-sm text-[var(--learn-ink)]"
                              >
                                <input type="radio" name={`question:${question.id}`} value={option} required className="mt-1 h-4 w-4" />
                                <span>{option}</span>
                              </label>
                            ))
                          )}
                        </div>
                      </div>
                    ))}
                    <PendingSubmitButton pendingLabel={t("Submitting your assessment...")}>
                      {t("Submit assessment")}
                    </PendingSubmitButton>
                  </form>
                )}

                {reviewQuestions.length > 0 ? (
                  <div className="rounded-[1.6rem] border border-[var(--learn-line)] bg-black/10 p-5">
                    <div className="flex items-center gap-3 text-[var(--learn-copper)]">
                      <Layers3 className="h-5 w-5" />
                      <p className="text-sm font-semibold">{t("Review before your next attempt")}</p>
                    </div>
                    <div className="mt-4 space-y-3">
                      {reviewQuestions.map((question) => (
                        <div
                          key={question.id}
                          className="rounded-[1.2rem] border border-[var(--learn-line)] bg-white/5 p-4"
                        >
                          <p className="text-sm font-semibold text-[var(--learn-ink)]">{question.prompt}</p>
                          <p className="mt-2 text-sm leading-7 text-[var(--learn-ink-soft)]">
                            {question.explanation || t("Review the related lesson before retrying this concept.")}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </LearnPanel>
          ) : null}

          <LearnPanel className="rounded-[2rem]">
            <div className="flex items-center gap-3 text-[var(--learn-copper)]">
              <Award className="h-5 w-5" />
              <p className="text-xs font-semibold uppercase tracking-[0.18em]">{t("Certificate & completion")}</p>
            </div>
            <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-[var(--learn-ink)]">
              {certificate ? t("You’ve earned this credential") : t("What you need to finish")}
            </h2>
            <div className="mt-5 space-y-3">
              {requirementItems.map((item) => (
                <div
                  key={item.label}
                  className="rounded-[1.4rem] border border-[var(--learn-line)] bg-white/5 p-4"
                >
                  <div className="flex items-start gap-3">
                    {item.done ? (
                      <CircleCheckBig className="mt-0.5 h-5 w-5 text-emerald-200" />
                    ) : (
                      <CircleAlert className="mt-0.5 h-5 w-5 text-amber-200" />
                    )}
                    <div>
                      <p className="text-sm font-semibold text-[var(--learn-ink)]">{item.label}</p>
                      <p className="mt-1 text-sm leading-7 text-[var(--learn-ink-soft)]">{item.detail}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {certificate ? (
              <div className="mt-5 rounded-[1.5rem] border border-emerald-200/20 bg-emerald-300/6 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">
                  {t("Verification live")}
                </p>
                <p className="mt-2 text-lg font-semibold text-[var(--learn-ink)]">{certificate.certificateNo}</p>
                <p className="mt-1 text-sm leading-7 text-[var(--learn-ink-soft)]">
                  {t("Verification code")}: {certificate.verificationCode}
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  {certificateHref ? (
                    <Link
                      href={certificateHref}
                      className="learn-button-secondary rounded-full px-4 py-2.5 text-sm font-semibold"
                    >
                      {t("Open certificate")}
                    </Link>
                  ) : null}
                  <CertificateDownloadButton
                    verificationCode={certificate.verificationCode}
                    learnerName={viewer.user?.fullName ?? null}
                    courseTitle={course.title}
                    label={t("Download certificate")}
                    className="learn-print-hidden"
                  />
                </div>
              </div>
            ) : null}
          </LearnPanel>
        </div>
      </LearnPanel>

      {certificate ? (
        <LearnPanel className="learn-print-sheet rounded-[2.1rem] p-0">
          <div className="rounded-[2.1rem] border border-[var(--learn-line)] bg-[linear-gradient(160deg,rgba(227,188,126,0.16),rgba(95,197,171,0.1))] p-8 sm:p-10">
            <div className="learn-print-hidden flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--learn-ink-soft)]">
                  {t("Earned certificate")}
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-[var(--learn-ink)]">
                  {t("Download-ready and publicly verifiable")}
                </h2>
              </div>
              <CertificateDownloadButton
                verificationCode={certificate.verificationCode}
                learnerName={viewer.user?.fullName ?? null}
                courseTitle={courseTitle || course.title}
                label={t("Download certificate")}
              />
            </div>

            <div className="mt-8 rounded-[1.9rem] border border-[var(--learn-line)] bg-white/5 p-8 sm:p-10">
              <p className="text-center text-xs font-semibold uppercase tracking-[0.26em] text-[var(--learn-ink-soft)]">
                {t("HenryCo Learn Certificate")}
              </p>
              <h3 className="mt-6 text-center text-[2.5rem] font-semibold tracking-[-0.05em] text-[var(--learn-ink)] sm:text-[3.4rem]">
                {displayName(viewer.user?.fullName, t)}
              </h3>
              <p className="mt-4 text-center text-sm leading-8 text-[var(--learn-ink-soft)]">
                {t("has completed the learning and assessment requirements for")}
              </p>
              <p className="mt-4 text-center text-2xl font-semibold tracking-[-0.04em] text-[var(--learn-ink)]">
                {courseTitle || course.title}
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-[1.3rem] border border-[var(--learn-line)] bg-black/10 p-4 text-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--learn-ink-soft)]">
                    {t("Certificate no")}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[var(--learn-ink)]">{certificate.certificateNo}</p>
                </div>
                <div className="rounded-[1.3rem] border border-[var(--learn-line)] bg-black/10 p-4 text-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--learn-ink-soft)]">
                    {t("Verification code")}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[var(--learn-ink)]">{certificate.verificationCode}</p>
                </div>
                <div className="rounded-[1.3rem] border border-[var(--learn-line)] bg-black/10 p-4 text-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--learn-ink-soft)]">
                    {t("Issued")}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[var(--learn-ink)]">{formatDateLabel(certificate.issuedAt, t, locale)}</p>
                </div>
              </div>
            </div>
          </div>
        </LearnPanel>
      ) : null}
    </LearnWorkspaceShell>
  );
}
