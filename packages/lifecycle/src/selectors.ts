import {
  LIFECYCLE_PRIORITY_WEIGHT,
  type LifecycleActionable,
  type LifecyclePillar,
  type LifecycleSnapshot,
  type LifecycleSnapshotEntry,
  type LifecycleStage,
} from "./types";

const STAGE_WEIGHT: Record<LifecycleStage, number> = {
  blocked: 100,
  awaiting_user: 90,
  awaiting_business: 70,
  in_progress: 55,
  churn_risk: 50,
  reengagement_candidate: 40,
  started: 38,
  evaluating: 32,
  onboarding: 30,
  dormant: 25,
  browsing: 18,
  retained: 12,
  completed: 8,
  new: 6,
};

export function rankActionables(entries: LifecycleActionable[]): LifecycleActionable[] {
  return [...entries].sort((a, b) => {
    const aScore = LIFECYCLE_PRIORITY_WEIGHT[a.priority] + STAGE_WEIGHT[a.stage];
    const bScore = LIFECYCLE_PRIORITY_WEIGHT[b.priority] + STAGE_WEIGHT[b.stage];
    if (aScore !== bScore) return bScore - aScore;
    const aDate = a.lastActiveAt ? new Date(a.lastActiveAt).getTime() : 0;
    const bDate = b.lastActiveAt ? new Date(b.lastActiveAt).getTime() : 0;
    return bDate - aDate;
  });
}

export function countByStage(snapshot: LifecycleSnapshot): Record<LifecycleStage, number> {
  const tally = {
    new: 0,
    onboarding: 0,
    browsing: 0,
    evaluating: 0,
    started: 0,
    awaiting_user: 0,
    awaiting_business: 0,
    blocked: 0,
    in_progress: 0,
    completed: 0,
    retained: 0,
    dormant: 0,
    reengagement_candidate: 0,
    churn_risk: 0,
  } as Record<LifecycleStage, number>;

  for (const entry of snapshot.entries) {
    tally[entry.stage] = (tally[entry.stage] ?? 0) + 1;
  }
  return tally;
}

export function findEntry(
  snapshot: LifecycleSnapshot,
  pillar: LifecyclePillar
): LifecycleSnapshotEntry | null {
  return snapshot.entries.find((entry) => entry.pillar === pillar) ?? null;
}

/**
 * Split snapshot entries into three cohorts the UI typically renders together:
 * - blocking: user must act or HenryCo must act before work continues
 * - continue: work is in-flight and resumable
 * - reengage: dormant / churn risk candidates
 */
export function groupSnapshotForUi(snapshot: LifecycleSnapshot) {
  const blocking: LifecycleSnapshotEntry[] = [];
  const inFlight: LifecycleSnapshotEntry[] = [];
  const reengage: LifecycleSnapshotEntry[] = [];

  for (const entry of snapshot.entries) {
    switch (entry.stage) {
      case "blocked":
      case "awaiting_user":
      case "awaiting_business":
        blocking.push(entry);
        break;
      case "in_progress":
      case "started":
      case "evaluating":
      case "onboarding":
        inFlight.push(entry);
        break;
      case "dormant":
      case "reengagement_candidate":
      case "churn_risk":
        reengage.push(entry);
        break;
      default:
        break;
    }
  }

  return { blocking, inFlight, reengage };
}
