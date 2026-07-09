import type { AbandonedTask, AbandonedTaskType } from "@henryco/data/abandoned-tasks-core";

/**
 * SP6 — the honest "continue where you left off" model.
 *
 * Pure + deterministic so it is table-testable: given the viewer's PENDING
 * abandoned tasks (already captured by the recovery collector), decide what
 * the resume surface says and where it goes.
 *
 *   0 tasks → null            (the widget renders its calm caught-up state)
 *   1 task  → that task       (deep-link straight into the journey)
 *   n tasks → the freshest    (headline carries the count; /continue lists all)
 *
 * No fabrication: the count is the real row count, the destination is the
 * task's own continueUrl (captured secret-free at abandon time).
 */

export type ResumeModel = {
  /** Real pending-task count. */
  count: number;
  /** Calm, specific headline for the widget/chip. */
  headline: string;
  /** Where "Resume" goes — the task itself, or /continue when several. */
  href: string;
  /** The task the headline describes (freshest by lastProgressAt). */
  task: AbandonedTask;
};

/** Calm, task-type-specific fallback when the captured state has no title. */
const TASK_TYPE_HEADLINE: Record<AbandonedTaskType, string> = {
  kyc: "Finish your verification",
  booking: "Finish your booking",
  proposal: "Finish your studio brief",
  cart: "Finish your checkout",
  form_draft: "Finish your application",
};

function taskTitle(task: AbandonedTask): string {
  const raw = task.state && typeof task.state === "object" ? (task.state as Record<string, unknown>).title : null;
  const title = typeof raw === "string" ? raw.trim() : "";
  if (title) return `Pick up ${title}`;
  return TASK_TYPE_HEADLINE[task.taskType] ?? "Continue where you left off";
}

/**
 * Append the resume-surface attribution to a continue URL without disturbing
 * existing query params. Keeps the S8 deep-link telemetry able to distinguish
 * resume-driven arrivals from organic ones.
 */
export function withResumeSource(url: string, surface: string): string {
  if (!url) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}utm_source=henryco_resume&utm_campaign=${encodeURIComponent(surface)}`;
}

export function buildResumeModel(
  tasks: readonly AbandonedTask[],
  opts?: { surface?: string },
): ResumeModel | null {
  const pending = tasks.filter((t) => t.status === "pending" && Boolean(t.continueUrl));
  if (pending.length === 0) return null;

  const freshest = [...pending].sort((a, b) =>
    (b.lastProgressAt || "").localeCompare(a.lastProgressAt || ""),
  )[0];

  const surface = opts?.surface ?? "dashboard_widget";
  if (pending.length === 1) {
    return {
      count: 1,
      headline: taskTitle(freshest),
      href: withResumeSource(freshest.continueUrl, surface),
      task: freshest,
    };
  }

  return {
    count: pending.length,
    headline: `You have ${pending.length} things to finish`,
    // Several journeys → the /continue list ranks them all.
    href: withResumeSource("/continue", surface),
    task: freshest,
  };
}

/** The same model, narrowed to one division (division landings' resume chip). */
export function buildDivisionResumeModel(
  tasks: readonly AbandonedTask[],
  division: string,
  opts?: { surface?: string },
): ResumeModel | null {
  const scoped = tasks.filter((t) => (t.division || "").toLowerCase() === division.toLowerCase());
  return buildResumeModel(scoped, { surface: opts?.surface ?? `division_${division}` });
}
