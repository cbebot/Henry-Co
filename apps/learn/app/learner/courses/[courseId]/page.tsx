import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Award,
  BookCheck,
  ChevronRight,
  CircleAlert,
  CircleCheckBig,
  FileStack,
  GraduationCap,
  Layers3,
  MessageSquareText,
  Trophy,
  UsersRound,
} from "lucide-react";
import { completeLessonAction, submitQuizAttemptAction } from "@/lib/learn/actions";
import { requireLearnUser } from "@/lib/learn/auth";
import { getLearnerWorkspace } from "@/lib/learn/data";
import { getAccountLearnUrl } from "@/lib/learn/links";
import { courseRoomNav } from "@/lib/learn/navigation";
import { lookupLearnProfiles, resolveLearnProfile } from "@/lib/learn/people";
import { syncViewerIdentity } from "@/lib/learn/workflows";
import { CertificateDownloadButton } from "@/components/learn/certificate-download-button";
import { PendingSubmitButton } from "@/components/learn/pending-submit-button";
import {
  humanizeLabel,
  LearnMarkdown,
  LearnPanel,
  LearnStatusBadge,
  LearnWorkspaceShell,
} from "@/components/learn/ui";

function formatDateLabel(value?: string | null) {
  if (!value) return "Not yet";
  return new Date(value).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatRelativeTime(value?: string | null) {
  if (!value) return "No recent activity yet";
  const time = new Date(value).getTime();
  const delta = Date.now() - time;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (delta < hour) return `${Math.max(1, Math.round(delta / minute))} min ago`;
  if (delta < day) return `${Math.max(1, Math.round(delta / hour))} hr ago`;
  if (delta < day * 7) return `${Math.max(1, Math.round(delta / day))} day ago`;
  return formatDateLabel(value);
}

function displayName(value?: string | null) {
  const text = String(value || "").trim();
  if (!text) return "HenryCo learner";
  return text.split(/\s+/).slice(0, 2).join(" ");
}

function initialsForName(value?: string | null) {
  const parts = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (parts.length === 0) return "HC";
  return parts.map((part) => part[0]?.toUpperCase() || "").join("");
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
  const viewer = await requireLearnUser("/learner/courses");
  await syncViewerIdentity(viewer);
  const workspace = await getLearnerWorkspace(viewer);
  const course = workspace.snapshot.courses.find((item) => item.id === courseId);
  const enrollment = workspace.enrollments.find((item) => item.courseId === courseId);
  if (!course || !enrollment) notFound();

  const instructor =
    workspace.snapshot.instructors.find((item) => item.id === course.primaryInstructorId) || null;
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

  // Read the per-course unlock policy. Defaults to 'sequential' so any
  // existing course (or pre-migration row) keeps the strict gate.
  const unlockPolicyRaw = (course as { unlockPolicy?: string }).unlockPolicy;
  const unlockPolicy: "sequential" | "open" | "module_gated" =
    unlockPolicyRaw === "open" || unlockPolicyRaw === "module_gated"
      ? unlockPolicyRaw
      : "sequential";

  const enrichedModules = modules.map((module, moduleIndex) => {
    const previousModulesComplete = modules
      .slice(0, moduleIndex)
      .every((previousModule) => previousModule.lessons.every((lesson) => completedLessonIds.has(lesson.id)));

    // Module gating depends on the policy:
    //   - open: every module unlocked
    //   - sequential / module_gated: previous module must be 100% complete
    const moduleUnlocked =
      courseAccessActive &&
      (unlockPolicy === "open" || moduleIndex === 0 || previousModulesComplete);

    const lessons = module.lessons.map((lesson, lessonIndex) => {
      const previousLessonsComplete = module.lessons
        .slice(0, lessonIndex)
        .every((previousLesson) => completedLessonIds.has(previousLesson.id));

      // Lesson gating within a module:
      //   - open / module_gated: any order inside an unlocked module
      //   - sequential: must finish previous lesson first
      const lessonUnlocked =
        moduleUnlocked &&
        (unlockPolicy !== "sequential" ||
          lessonIndex === 0 ||
          previousLessonsComplete ||
          completedLessonIds.has(lesson.id));

      return {
        ...lesson,
        completed: completedLessonIds.has(lesson.id),
        unlocked: lessonUnlocked,
      };
    });

    return {
      ...module,
      unlocked: moduleUnlocked,
      completed: lessons.every((lesson) => lesson.completed),
      lessons,
    };
  });

  const currentLesson =
    enrichedModules.flatMap((module) => module.lessons).find((lesson) => lesson.unlocked && !lesson.completed) ||
    enrichedModules
      .flatMap((module) => module.lessons)
      .find((lesson) => lesson.id === enrollment.lastLessonId) ||
    flatLessons[0] ||
    null;

  const currentModule =
    enrichedModules.find((module) => module.lessons.some((lesson) => lesson.id === currentLesson?.id)) || null;
  const roomResources = (currentModule?.lessons || flatLessons)
    .flatMap((lesson) =>
      lesson.resources.map((resource) => ({
        ...resource,
        lessonTitle: lesson.title,
      }))
    )
    .slice(0, 8);

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
        ? "Your seat is reserved and the room is waiting for payment activation."
        : !allLessonsComplete
          ? "Finish every lesson before the final assessment opens."
          : quizPassed
            ? "Assessment passed."
            : remainingAttempts === 0
              ? "The assessment has reached its maximum attempts. Ask the academy team for a review."
              : null;
  const reviewQuestions =
    latestAttempt && !latestAttempt.passed
      ? questions.filter((question) => !isAnswerCorrect(question.correctAnswer, latestAttempt.answers[question.id]))
      : [];

  const certificate = workspace.certificates.find((item) => item.courseId === course.id) || null;
  const certificateHref = certificate ? `/certifications/verify/${certificate.verificationCode}` : null;
  const requirementItems = [
    {
      label: "Every lesson marked complete",
      done: allLessonsComplete,
      detail: `${completedLessonIds.size} of ${flatLessons.length || 0} lessons done`,
    },
    {
      label: quiz ? `Final assessment: ${quiz.passScore}% or higher` : "No final assessment for this program",
      done: quiz ? quizPassed : true,
      detail: quiz
        ? bestAttempt
          ? `Your best score so far: ${bestAttempt.score}%`
          : "Unlocked after all lessons are complete"
        : "You can finish by completing the lessons only",
    },
    {
      label: "Certificate on file (if this course awards one)",
      done: !!certificate,
      detail: certificate
        ? `${certificate.certificateNo} — download or share your verification link`
        : course.certification
          ? "Appears automatically when the two steps above are satisfied"
          : "This course does not include a certificate",
    },
  ];

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
          profile?.fullName || (item.userId === viewer.user?.id ? viewer.user?.fullName : null) || "HenryCo learner",
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

  const recentParticipants = participants.slice(0, 6);
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

  const lessonLookup = new Map(flatLessons.map((lesson) => [lesson.id, lesson]));
  const enrollmentIds = new Set(courseEnrollments.map((item) => item.id));
  const roomFeed = [
    ...workspace.snapshot.progress
      .filter((item) => item.courseId === course.id && enrollmentIds.has(item.enrollmentId))
      .map((item) => {
        const match = courseEnrollments.find((enrollmentItem) => enrollmentItem.id === item.enrollmentId);
        const profile = resolveLearnProfile(profileDirectory, {
          userId: match?.userId || null,
          normalizedEmail: match?.normalizedEmail || null,
        });
        return {
          id: `progress:${item.id}`,
          type: "lesson",
          name: displayName(profile?.fullName),
          avatarUrl: profile?.avatarUrl || null,
          title: `${displayName(profile?.fullName)} completed ${lessonLookup.get(item.lessonId)?.title || "a lesson"}`,
          detail: formatRelativeTime(item.completedAt),
        };
      }),
    ...workspace.snapshot.attempts
      .filter((item) => enrollmentIds.has(item.enrollmentId) && (!quiz || item.quizId === quiz.id))
      .map((item) => {
        const match = courseEnrollments.find((enrollmentItem) => enrollmentItem.id === item.enrollmentId);
        const profile = resolveLearnProfile(profileDirectory, {
          userId: match?.userId || null,
          normalizedEmail: match?.normalizedEmail || null,
        });
        return {
          id: `attempt:${item.id}`,
          type: "assessment",
          name: displayName(profile?.fullName),
          avatarUrl: profile?.avatarUrl || null,
          title: item.passed
            ? `${displayName(profile?.fullName)} passed the assessment`
            : `${displayName(profile?.fullName)} submitted the assessment`,
          detail: `${item.score}% score`,
        };
      }),
  ].slice(0, 8);

  const nextActionLabel =
    enrollment.status === "awaiting_payment"
      ? "Complete payment confirmation"
      : certificate
        ? "Review or download your certificate"
        : currentLesson && !completedLessonIds.has(currentLesson.id)
          ? `Continue with ${currentLesson.title}`
          : quiz && !quizPassed
            ? "Take the final assessment"
            : "Course complete";

  return (
    <LearnWorkspaceShell
      kicker="Learning room"
      title={course.title}
      description="Work through lessons in order, take the final assessment when it unlocks, and download your certificate here when you’ve earned it. Enrollments, billing, and saved courses also appear in your HenryCo account under Learn."
      nav={courseRoomNav(`/learner/courses/${course.id}`)}
      actions={
        <>
          <a
            href={getAccountLearnUrl()}
            className="learn-button-secondary rounded-full px-4 py-2.5 text-sm font-semibold"
          >
            HenryCo account
          </a>
          {certificate ? (
            <CertificateDownloadButton label="Download certificate" className="learn-print-hidden" />
          ) : null}
        </>
      }
    >
      <LearnPanel className="learn-mesh rounded-[2.2rem] p-7 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <LearnStatusBadge label={`${participants.length} learners in this cohort`} tone="signal" />
          <LearnStatusBadge label={`${recentlyActiveCount} active this week`} tone="success" />
          <LearnStatusBadge
            label={humanizeLabel(enrollment.status)}
            tone={
              enrollment.status === "completed"
                ? "success"
                : enrollment.status === "awaiting_payment"
                  ? "warning"
                  : "neutral"
            }
          />
          {quiz ? <LearnStatusBadge label={`${attemptsUsed}/${quiz.maxAttempts} attempts used`} /> : null}
          {certificate ? <LearnStatusBadge label="Certificate issued" tone="success" /> : null}
        </div>

        <div className="space-y-6">
          {quiz ? (
            <LearnPanel className="rounded-[2rem]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--learn-ink-soft)]">
                    Final assessment
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--learn-ink)]">
                    {quiz.title}
                  </h2>
                  <p className="mt-2 text-sm leading-7 text-[var(--learn-ink-soft)]">
                    {quiz.description}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <LearnStatusBadge label={`Pass score ${quiz.passScore}%`} tone="signal" />
                  <LearnStatusBadge
                    label={
                      quizPassed
                        ? "Passed"
                        : quizLockedReason
                          ? "Locked"
                          : `${remainingAttempts} attempts remaining`
                    }
                    tone={quizPassed ? "success" : quizLockedReason ? "warning" : "neutral"}
                  />
                </div>
              </div>

              <div className="mt-6 space-y-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[1.5rem] border border-[var(--learn-line)] bg-white/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--learn-ink-soft)]">
                      Assessment state
                    </p>
                    <p className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[var(--learn-ink)]">
                      {quizPassed ? "Assessment complete" : quizLockedReason ? "Assessment gated" : "Assessment ready"}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-[var(--learn-ink-soft)]">
                      {quizLockedReason || "Lessons are complete. Submit the assessment to unlock final completion and certification."}
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border border-[var(--learn-line)] bg-white/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--learn-ink-soft)]">
                      Attempt history
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
                                label={attempt.passed ? "Passed" : "Review needed"}
                                tone={attempt.passed ? "success" : "warning"}
                              />
                            </div>
                            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--learn-ink-soft)]">
                              {formatRelativeTime(attempt.submittedAt)}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm leading-7 text-[var(--learn-ink-soft)]">No assessment attempt yet.</p>
                      )}
                    </div>
                  </div>
                </div>

                {quizPassed ? (
                  <div className="rounded-[1.6rem] border border-emerald-200/25 bg-emerald-300/8 p-5">
                    <div className="flex items-center gap-3 text-emerald-100">
                      <Trophy className="h-5 w-5" />
                      <p className="text-sm font-semibold">Assessment passed</p>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-[var(--learn-ink-soft)]">
                      Your best score is {bestAttempt?.score ?? 0}%. The room has recorded the passing assessment in your completion path.
                    </p>
                  </div>
                ) : quizLockedReason ? (
                  <div className="rounded-[1.6rem] border border-amber-200/20 bg-amber-300/5 p-5">
                    <div className="flex items-center gap-3 text-amber-100">
                      <CircleAlert className="h-5 w-5" />
                      <p className="text-sm font-semibold">Assessment locked</p>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-[var(--learn-ink-soft)]">{quizLockedReason}</p>
                  </div>
                ) : (
                  <form action={submitQuizAttemptAction} className="space-y-5">
                    <input type="hidden" name="courseId" value={course.id} />
                    <input type="hidden" name="quizId" value={quiz.id} />
                    {questions.map((question, index) => (
                      <div
                        key={question.id}
                        className="rounded-[1.5rem] border border-[var(--learn-line)] bg-white/5 p-5"
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--learn-ink-soft)]">
                          Question {index + 1}
                        </p>
                        <p className="mt-3 text-lg font-semibold text-[var(--learn-ink)]">{question.prompt}</p>
                        <div className="mt-4 space-y-3">
                          {question.questionType === "short_text" ? (
                            <textarea
                              name={`question:${question.id}`}
                              required
                              rows={4}
                              className="learn-textarea rounded-2xl px-4 py-3"
                              placeholder="Write your answer clearly."
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
                    <PendingSubmitButton pendingLabel="Submitting your assessment...">
                      Submit assessment
                    </PendingSubmitButton>
                  </form>
                )}

                {reviewQuestions.length > 0 ? (
                  <div className="rounded-[1.6rem] border border-[var(--learn-line)] bg-black/10 p-5">
                    <div className="flex items-center gap-3 text-[var(--learn-copper)]">
                      <Layers3 className="h-5 w-5" />
                      <p className="text-sm font-semibold">Review before your next attempt</p>
                    </div>
                    <div className="mt-4 space-y-3">
                      {reviewQuestions.map((question) => (
                        <div
                          key={question.id}
                          className="rounded-[1.2rem] border border-[var(--learn-line)] bg-white/5 p-4"
                        >
                          <p className="text-sm font-semibold text-[var(--learn-ink)]">{question.prompt}</p>
                          <p className="mt-2 text-sm leading-7 text-[var(--learn-ink-soft)]">
                            {question.explanation || "Review the related lesson before retrying this concept."}
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
              <p className="text-xs font-semibold uppercase tracking-[0.18em]">Certificate & completion</p>
            </div>
            <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-[var(--learn-ink)]">
              {certificate ? "You’ve earned this credential" : "What you need to finish"}
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
                  Verification live
                </p>
                <p className="mt-2 text-lg font-semibold text-[var(--learn-ink)]">{certificate.certificateNo}</p>
                <p className="mt-1 text-sm leading-7 text-[var(--learn-ink-soft)]">
                  Verification code: {certificate.verificationCode}
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  {certificateHref ? (
                    <Link
                      href={certificateHref}
                      className="learn-button-secondary rounded-full px-4 py-2.5 text-sm font-semibold"
                    >
                      Open certificate
                    </Link>
                  ) : null}
                  <CertificateDownloadButton label="Download certificate" className="learn-print-hidden" />
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
                  Earned certificate
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-[var(--learn-ink)]">
                  Download-ready and publicly verifiable
                </h2>
              </div>
              <CertificateDownloadButton label="Download certificate" />
            </div>

            <div className="mt-8 rounded-[1.9rem] border border-[var(--learn-line)] bg-white/5 p-8 sm:p-10">
              <p className="text-center text-xs font-semibold uppercase tracking-[0.26em] text-[var(--learn-ink-soft)]">
                HenryCo Learn Certificate
              </p>
              <h3 className="mt-6 text-center text-[2.5rem] font-semibold tracking-[-0.05em] text-[var(--learn-ink)] sm:text-[3.4rem]">
                {displayName(viewer.user?.fullName)}
              </h3>
              <p className="mt-4 text-center text-sm leading-8 text-[var(--learn-ink-soft)]">
                has completed the learning and assessment requirements for
              </p>
              <p className="mt-4 text-center text-2xl font-semibold tracking-[-0.04em] text-[var(--learn-ink)]">
                {course.title}
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-[1.3rem] border border-[var(--learn-line)] bg-black/10 p-4 text-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--learn-ink-soft)]">
                    Certificate no
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[var(--learn-ink)]">{certificate.certificateNo}</p>
                </div>
                <div className="rounded-[1.3rem] border border-[var(--learn-line)] bg-black/10 p-4 text-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--learn-ink-soft)]">
                    Verification code
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[var(--learn-ink)]">{certificate.verificationCode}</p>
                </div>
                <div className="rounded-[1.3rem] border border-[var(--learn-line)] bg-black/10 p-4 text-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--learn-ink-soft)]">
                    Issued
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[var(--learn-ink)]">{formatDateLabel(certificate.issuedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </LearnPanel>
      ) : null}
    </LearnWorkspaceShell>
  );
}
