import Link from "next/link";
import { CheckCircle2, Lock, PlayCircle } from "lucide-react";
import { LearnPanel, LearnStatusBadge } from "@/components/learn/ui";

export type ProgressionLesson = {
  id: string;
  title: string;
  durationMinutes: number;
  completed: boolean;
  unlocked: boolean;
  isPreview?: boolean;
};

export type ProgressionModule = {
  id: string;
  title: string;
  summary?: string | null;
  unlocked: boolean;
  completed: boolean;
  lessons: ProgressionLesson[];
};

export type UnlockPolicy = "sequential" | "open" | "module_gated";

const POLICY_COPY: Record<
  UnlockPolicy,
  { label: string; tagline: string; tone: "signal" | "neutral" | "success" }
> = {
  sequential: {
    label: "Sequential",
    tagline: "Each lesson unlocks the next. Finish in order — no skipping.",
    tone: "signal",
  },
  module_gated: {
    label: "Module-gated",
    tagline:
      "Lessons inside a module are open in any order. The next module opens once you finish the current one.",
    tone: "neutral",
  },
  open: {
    label: "Open exploration",
    tagline:
      "All lessons are unlocked. Move through the course in whatever order works for you.",
    tone: "success",
  },
};

function lessonHref(courseId: string, moduleId: string, lessonId: string) {
  return `/learner/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`;
}

export function ProgressionCard({
  courseId,
  modules,
  policy,
  totalLessonCount,
  completedLessonCount,
}: {
  courseId: string;
  modules: ProgressionModule[];
  policy: UnlockPolicy;
  totalLessonCount: number;
  completedLessonCount: number;
}) {
  const percent =
    totalLessonCount > 0 ? Math.round((completedLessonCount / totalLessonCount) * 100) : 0;
  const policyMeta = POLICY_COPY[policy] ?? POLICY_COPY.sequential;

  return (
    <LearnPanel className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-copper)]">
            Course progression
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-[var(--learn-ink)] sm:text-[1.4rem]">
            {completedLessonCount} of {totalLessonCount} lessons complete
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-7 text-[var(--learn-ink-soft)]">
            {policyMeta.tagline}
          </p>
        </div>
        <LearnStatusBadge label={policyMeta.label} tone={policyMeta.tone} />
      </div>

      <div>
        <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--learn-ink-soft)]">
          <span>Overall progress</span>
          <span>{percent}%</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[color:rgba(255,255,255,0.06)]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--learn-copper)] to-[var(--learn-mint)] transition-[width] duration-500"
            style={{ width: `${percent}%` }}
            aria-hidden
          />
        </div>
      </div>

      <ol className="space-y-4">
        {modules.map((module, moduleIndex) => {
          const moduleCompleted = module.lessons.length
            ? module.lessons.every((l) => l.completed)
            : false;
          const moduleStarted = module.lessons.some((l) => l.completed);
          return (
            <li
              key={module.id}
              className="rounded-[1.4rem] border border-[var(--learn-line)] bg-[color:rgba(255,255,255,0.02)] p-4 sm:p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--learn-ink-soft)]">
                    <span>Module {moduleIndex + 1}</span>
                    {moduleCompleted ? (
                      <span className="text-[var(--learn-mint)]">· complete</span>
                    ) : moduleStarted ? (
                      <span className="text-[var(--learn-copper)]">· in progress</span>
                    ) : module.unlocked ? null : (
                      <span>· locked</span>
                    )}
                  </div>
                  <h3 className="mt-1 text-base font-semibold tracking-tight text-[var(--learn-ink)]">
                    {module.title}
                  </h3>
                  {module.summary ? (
                    <p className="mt-1 text-sm leading-6 text-[var(--learn-ink-soft)]">
                      {module.summary}
                    </p>
                  ) : null}
                </div>
                {moduleCompleted ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--learn-mint)]" />
                ) : !module.unlocked ? (
                  <Lock className="h-5 w-5 shrink-0 text-[var(--learn-ink-soft)]" />
                ) : null}
              </div>

              <ul className="mt-4 space-y-2">
                {module.lessons.map((lesson, lessonIndex) => {
                  const isLocked = !lesson.unlocked && !lesson.completed && !lesson.isPreview;
                  const Body = (
                    <span className="flex items-center justify-between gap-3 rounded-2xl px-3 py-2 transition-colors data-[locked=false]:hover:bg-[color:rgba(255,255,255,0.04)]">
                      <span className="flex min-w-0 items-center gap-3">
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                            lesson.completed
                              ? "bg-[color:rgba(133,225,164,0.15)] text-[var(--learn-mint)]"
                              : isLocked
                                ? "bg-[color:rgba(255,255,255,0.04)] text-[var(--learn-ink-soft)]"
                                : "bg-[color:rgba(228,176,90,0.18)] text-[var(--learn-copper)]"
                          }`}
                          aria-hidden
                        >
                          {lesson.completed ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : isLocked ? (
                            <Lock className="h-3.5 w-3.5" />
                          ) : (
                            <PlayCircle className="h-4 w-4" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-[var(--learn-ink)]">
                            {lessonIndex + 1}. {lesson.title}
                          </span>
                          <span className="block text-[11px] text-[var(--learn-ink-soft)]">
                            {lesson.durationMinutes
                              ? `${lesson.durationMinutes} min`
                              : "Estimated read"}
                            {lesson.isPreview && !lesson.completed ? " · Preview" : ""}
                          </span>
                        </span>
                      </span>
                    </span>
                  );

                  return (
                    <li key={lesson.id}>
                      {isLocked ? (
                        <div data-locked="true" aria-disabled="true">
                          {Body}
                        </div>
                      ) : (
                        <Link
                          data-locked="false"
                          href={lessonHref(courseId, module.id, lesson.id)}
                          className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--learn-copper)] rounded-2xl"
                        >
                          {Body}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ol>
    </LearnPanel>
  );
}
