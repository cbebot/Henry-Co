import { milestoneStatusToken } from "@/lib/portal/status";
import { shortDate } from "@/lib/portal/helpers";
import type { ClientMilestone } from "@/types/portal";

function dotState(status: string) {
  if (status === "approved" || status === "complete") return "complete";
  if (status === "in_progress" || status === "ready_for_review") return "current";
  return "upcoming";
}

export function MilestoneProgress({
  milestones,
  layout = "horizontal",
}: {
  milestones: ClientMilestone[];
  layout?: "horizontal" | "vertical";
}) {
  if (milestones.length === 0) return null;

  if (layout === "vertical") {
    return (
      <ol className="space-y-3">
        {milestones.map((milestone) => {
          const status = milestoneStatusToken(milestone.status);
          const state = dotState(milestone.status);
          return (
            <li key={milestone.id} className="portal-progress-step items-start">
              <span className="portal-progress-dot" data-state={state} />
              <div className="min-w-0 flex-1 rounded-2xl border border-[var(--studio-line)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-[14px] font-semibold text-[var(--studio-ink)]">
                    {milestone.title}
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--studio-ink-soft)]">
                    {status.label}
                  </span>
                </div>
                {milestone.description ? (
                  <p className="mt-1.5 text-[12.5px] leading-5 text-[var(--studio-ink-soft)]">
                    {milestone.description}
                  </p>
                ) : null}
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11.5px] text-[var(--studio-ink-soft)]">
                  {milestone.dueDate ? <span>Due {shortDate(milestone.dueDate)}</span> : null}
                  {milestone.dueLabel && !milestone.dueDate ? <span>{milestone.dueLabel}</span> : null}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    );
  }

  return (
    <ol
      className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5"
      aria-label="Project milestone progress"
    >
      {milestones.map((milestone, index) => {
        const status = milestoneStatusToken(milestone.status);
        const state = dotState(milestone.status);
        return (
          <li
            key={milestone.id}
            className="rounded-2xl border border-[var(--studio-line)] bg-[rgba(255,255,255,0.03)] px-3.5 py-3"
            aria-current={state === "current" ? "step" : undefined}
          >
            <div className="flex items-start gap-2.5">
              <span className="portal-progress-dot" data-state={state} />
              <div className="min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--studio-ink-soft)]">
                  Step {index + 1}
                </div>
                <div className="mt-1 truncate text-[13px] font-semibold text-[var(--studio-ink)]">
                  {milestone.title}
                </div>
                <div className="mt-1 text-[11.5px] text-[var(--studio-ink-soft)]">
                  {status.label}
                  {milestone.dueDate ? ` · ${shortDate(milestone.dueDate)}` : milestone.dueLabel ? ` · ${milestone.dueLabel}` : ""}
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
