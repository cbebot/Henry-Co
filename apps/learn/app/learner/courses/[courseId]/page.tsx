import { notFound } from "next/navigation";
import { completeLessonAction, submitQuizAttemptAction } from "@/lib/learn/actions";
import { requireLearnUser } from "@/lib/learn/auth";
import { getLearnerWorkspace } from "@/lib/learn/data";
import { getAccountLearnUrl } from "@/lib/learn/links";
import { courseRoomNav } from "@/lib/learn/navigation";
import { syncViewerIdentity } from "@/lib/learn/workflows";
import { PendingSubmitButton } from "@/components/learn/pending-submit-button";
import { humanizeLabel, LearnMarkdown, LearnPanel, LearnStatusBadge, LearnWorkspaceShell } from "@/components/learn/ui";

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

  const modules = workspace.snapshot.modules
    .filter((item) => item.courseId === course.id)
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((module) => ({
      ...module,
      lessons: workspace.snapshot.lessons
        .filter((lesson) => lesson.moduleId === module.id)
        .sort((left, right) => left.sortOrder - right.sortOrder),
    }));
  const progressByLesson = new Map(
    workspace.progress
      .filter((item) => item.courseId === course.id)
      .map((item) => [item.lessonId, item])
  );
  const quiz = workspace.snapshot.quizzes.find((item) => item.courseId === course.id) || null;
  const questions = quiz ? workspace.snapshot.questions.filter((item) => item.quizId === quiz.id) : [];
  const certificate = workspace.certificates.find((item) => item.courseId === course.id) || null;

  return (
    <LearnWorkspaceShell
      kicker="Course Room"
      title={course.title}
      description="Keep learning inside the focused course room, while HenryCo Account keeps your wider learning history, certificates, saved courses, and notifications together."
      nav={courseRoomNav(`/learner/courses/${course.id}`)}
      actions={
        <a
          href={getAccountLearnUrl()}
          className="learn-button-secondary rounded-full px-4 py-2.5 text-sm font-semibold"
        >
          Open account
        </a>
      }
    >
      {enrollment.status === "awaiting_payment" ? (
        <LearnPanel className="rounded-[2rem]">
          <p className="text-sm text-amber-200">Payment confirmation is still in progress for this course. Your seat is reserved and your lessons will unlock as soon as confirmation is complete.</p>
        </LearnPanel>
      ) : null}

      <LearnPanel className="rounded-[2rem]">
        <div className="flex flex-wrap items-center gap-2">
          <LearnStatusBadge label={`${enrollment.percentComplete}% complete`} tone="signal" />
          <LearnStatusBadge label={humanizeLabel(enrollment.status)} tone={enrollment.status === "completed" ? "success" : "neutral"} />
          {certificate ? <LearnStatusBadge label="Certificate issued" tone="success" /> : null}
        </div>
        <div className="mt-5 rounded-full bg-white/10 p-1">
          <div className="h-3 rounded-full bg-[linear-gradient(135deg,#d8f4eb,#5fc5ab)] transition-[width] duration-500" style={{ width: `${Math.max(8, enrollment.percentComplete)}%` }} />
        </div>
      </LearnPanel>

      <div className="space-y-5">
        {modules.map((module, moduleIndex) => (
          <LearnPanel key={module.id} className="rounded-[2rem]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--learn-ink-soft)]">Module {moduleIndex + 1}</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--learn-ink)]">{module.title}</h3>
                <p className="mt-2 text-sm leading-7 text-[var(--learn-ink-soft)]">{module.summary}</p>
              </div>
            </div>
            <div className="mt-5 space-y-4">
              {module.lessons.map((lesson) => {
                const progress = progressByLesson.get(lesson.id);
                return (
                  <div key={lesson.id} className="rounded-[1.6rem] border border-[var(--learn-line)] bg-white/5 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h4 className="text-xl font-semibold tracking-[-0.03em] text-[var(--learn-ink)]">{lesson.title}</h4>
                        <p className="mt-2 text-sm leading-7 text-[var(--learn-ink-soft)]">{lesson.summary}</p>
                      </div>
                      <LearnStatusBadge label={progress ? "Completed" : "Ready"} tone={progress ? "success" : "signal"} />
                    </div>
                    <div className="mt-4">
                      <LearnMarkdown value={lesson.bodyMarkdown} />
                    </div>
                    {!progress ? (
                      <form action={completeLessonAction} className="mt-5">
                        <input type="hidden" name="courseId" value={course.id} />
                        <input type="hidden" name="lessonId" value={lesson.id} />
                        <PendingSubmitButton pendingLabel="Saving your progress...">Mark lesson complete</PendingSubmitButton>
                      </form>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </LearnPanel>
        ))}
      </div>

      {quiz ? (
        <LearnPanel className="rounded-[2rem]">
          <h3 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--learn-ink)]">{quiz.title}</h3>
          <p className="mt-3 text-sm leading-7 text-[var(--learn-ink-soft)]">{quiz.description}</p>
          <form action={submitQuizAttemptAction} className="mt-6 space-y-6">
            <input type="hidden" name="courseId" value={course.id} />
            <input type="hidden" name="quizId" value={quiz.id} />
            {questions.map((question, index) => (
              <div key={question.id} className="rounded-[1.6rem] border border-[var(--learn-line)] bg-white/5 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--learn-ink-soft)]">Question {index + 1}</p>
                <p className="mt-3 text-lg font-semibold text-[var(--learn-ink)]">{question.prompt}</p>
                <div className="mt-4 space-y-3">
                  {question.options.map((option) => (
                    <label key={option} className="flex items-center gap-3 rounded-2xl border border-[var(--learn-line)] px-4 py-3 text-sm text-[var(--learn-ink)]">
                      <input type="radio" name={`question:${question.id}`} value={option} required className="h-4 w-4" />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <PendingSubmitButton pendingLabel="Submitting your assessment...">Submit assessment</PendingSubmitButton>
          </form>
        </LearnPanel>
      ) : null}

      {certificate ? (
        <LearnPanel className="rounded-[2rem]">
          <h3 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--learn-ink)]">Certificate ready</h3>
          <p className="mt-3 text-sm leading-7 text-[var(--learn-ink-soft)]">Verification code: {certificate.verificationCode}</p>
        </LearnPanel>
      ) : null}
    </LearnWorkspaceShell>
  );
}
