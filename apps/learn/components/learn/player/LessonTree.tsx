"use client";

/**
 * LessonTree — sidebar tree of modules + lessons with progress dots.
 *
 * V3 PASS 21 contract: lesson tree with progress dots and the currently-active
 * lesson highlighted. Keyboard-navigable list (tab order + arrow keys handled
 * by the browser via roving links).
 */

import type { ReactNode } from "react";

export type LessonTreeNode = {
  moduleId: string;
  moduleTitle: string;
  moduleSummary?: string;
  lessons: Array<{
    id: string;
    title: string;
    summary?: string;
    lessonType: "video" | "reading" | "quiz" | "resource" | "workshop";
    durationMinutes: number;
    isComplete: boolean;
    isActive: boolean;
    isLocked: boolean;
    href: string;
  }>;
};

export type LessonTreeProps = {
  modules: LessonTreeNode[];
  labels: {
    completed: string;
    locked: string;
    minutes: string;
    moduleNumber: string;
  };
  /** Optional footer slot (e.g. course controls) */
  footer?: ReactNode;
};

function lessonIcon(type: LessonTreeNode["lessons"][number]["lessonType"]) {
  switch (type) {
    case "video":
      return "▶";
    case "reading":
      return "❡";
    case "quiz":
      return "✓";
    case "resource":
      return "📎";
    case "workshop":
      return "◇";
    default:
      return "·";
  }
}

export function LessonTree({ modules, labels, footer }: LessonTreeProps) {
  return (
    <nav
      aria-label="Course lesson tree"
      className="learn-lesson-tree space-y-7"
    >
      {modules.map((module, index) => (
        <div key={module.moduleId}>
          <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-copper)]">
            {labels.moduleNumber} {String(index + 1).padStart(2, "0")}
          </p>
          <p className="mt-1 text-[15px] font-semibold leading-snug text-[var(--learn-ink)]">
            {module.moduleTitle}
          </p>
          {module.moduleSummary ? (
            <p className="mt-1 text-xs leading-5 text-[var(--learn-ink-soft)]">
              {module.moduleSummary}
            </p>
          ) : null}
          <ul className="mt-3 space-y-1.5">
            {module.lessons.map((lesson) => (
              <li key={lesson.id}>
                <a
                  href={lesson.href}
                  aria-current={lesson.isActive ? "page" : undefined}
                  aria-disabled={lesson.isLocked ? "true" : undefined}
                  className={`flex items-start gap-2 rounded-lg border px-2.5 py-2 text-sm leading-snug transition ${
                    lesson.isActive
                      ? "border-[var(--learn-mint-soft)]/55 bg-[var(--learn-mint-soft)]/12 text-[var(--learn-ink)]"
                      : "border-transparent text-[var(--learn-ink-soft)] hover:border-[var(--learn-line)] hover:text-[var(--learn-ink)]"
                  } ${lesson.isLocked ? "pointer-events-none opacity-60" : ""}`}
                >
                  <span
                    aria-hidden="true"
                    className={`mt-1 inline-flex h-2.5 w-2.5 shrink-0 rounded-full ${
                      lesson.isComplete
                        ? "bg-emerald-300"
                        : lesson.isLocked
                          ? "bg-[var(--learn-line)]"
                          : "border border-[var(--learn-mint-soft)]/45"
                    }`}
                  />
                  <span className="flex-1">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <span aria-hidden="true" className="text-[var(--learn-copper)]">
                        {lessonIcon(lesson.lessonType)}
                      </span>
                      {lesson.title}
                    </span>
                    <span className="mt-0.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--learn-ink-soft)]">
                      {lesson.durationMinutes} {labels.minutes}
                      {lesson.isComplete ? ` · ${labels.completed}` : ""}
                      {lesson.isLocked ? ` · ${labels.locked}` : ""}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
      {footer ? <div>{footer}</div> : null}
    </nav>
  );
}
