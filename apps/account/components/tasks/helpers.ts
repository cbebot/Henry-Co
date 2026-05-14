export type TaskRow = {
  id: string;
  title: string;
  description?: string;
  sourceDivision: string;
  deeplinkTemplate?: string;
  priority: "low" | "normal" | "high" | "urgent";
  blocking?: boolean;
};

const DIVISION_PALETTE: Record<string, { color: string; label: string }> = {
  account:     { color: "#C9A227", label: "Account" },
  wallet:      { color: "#C9A227", label: "Wallet" },
  support:     { color: "#10B981", label: "Support" },
  marketplace: { color: "#3B82F6", label: "Marketplace" },
  studio:      { color: "#C9A227", label: "Studio" },
  jobs:        { color: "#8B5CF6", label: "Jobs" },
  learn:       { color: "#0EA5E9", label: "Learn" },
  property:    { color: "#6366F1", label: "Property" },
  logistics:   { color: "#D06F32", label: "Logistics" },
  care:        { color: "#10B981", label: "Care" },
};

export function divisionForKey(key: string | null | undefined) {
  if (!key) return { color: "#6B6560", label: "HenryCo" };
  return DIVISION_PALETTE[key] ?? { color: "#6B6560", label: key };
}

/** Roll up task counts by priority + blocking + division. */
export function taskStats(tasks: ReadonlyArray<TaskRow>) {
  let blocking = 0;
  let urgent = 0;
  let high = 0;
  let normal = 0;
  let low = 0;
  const divisionCounts = new Map<string, number>();
  for (const task of tasks) {
    if (task.blocking) blocking += 1;
    switch (task.priority) {
      case "urgent": urgent += 1; break;
      case "high":   high += 1; break;
      case "normal": normal += 1; break;
      case "low":    low += 1; break;
    }
    divisionCounts.set(
      task.sourceDivision,
      (divisionCounts.get(task.sourceDivision) ?? 0) + 1,
    );
  }
  return {
    total: tasks.length,
    blocking,
    urgent,
    high,
    normal,
    low,
    actionable: urgent + high + blocking,
    divisions: Array.from(divisionCounts.entries())
      .map(([key, count]) => {
        const palette = divisionForKey(key);
        return { key, color: palette.color, label: palette.label, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
  };
}

export type HeroState = "empty" | "calm" | "active" | "risk";

export function heroState(stats: ReturnType<typeof taskStats>): HeroState {
  if (stats.total === 0) return "empty";
  if (stats.urgent > 0 || stats.blocking > 0) return "risk";
  if (stats.high > 0) return "active";
  return "calm";
}

export function buildHeadline(state: HeroState, stats: ReturnType<typeof taskStats>): string {
  if (state === "empty") return "Nothing in the queue.";
  if (state === "risk") {
    if (stats.blocking > 0)
      return `${stats.blocking} ${stats.blocking === 1 ? "blocker" : "blockers"} need clearing.`;
    return `${stats.urgent} urgent ${stats.urgent === 1 ? "task" : "tasks"} to clear.`;
  }
  if (state === "active") return `${stats.total} task${stats.total === 1 ? "" : "s"} to work through.`;
  return `${stats.total} item${stats.total === 1 ? "" : "s"} on your queue.`;
}

export function buildBlurb(state: HeroState): string {
  if (state === "empty") {
    return "Your account is in order — verification, payouts, and review-sensitive lanes are all clear. We'll surface the next move here automatically when it shows up.";
  }
  if (state === "risk") {
    return "These items gate higher-trust actions across HenryCo — wallet withdrawals, marketplace seller approval, employer verification. Clearing them unblocks each lane.";
  }
  return "Each row routes you to the next action with one tap. Filters, priority chips, and deeplinks are kept consistent across every HenryCo division.";
}
