export * from "./types";
export * from "./rules";
export * from "./selectors";

export const LIFECYCLE_SNAPSHOT_TABLE = "customer_lifecycle_snapshots";

export const LIFECYCLE_EVENT_NAMES = {
  STAGE_CHANGED: "henry.lifecycle.stage.changed",
  RECOMMENDATION_CLICKED: "henry.lifecycle.recommendation.clicked",
  DORMANT_DETECTED: "henry.lifecycle.dormant.detected",
  REENTRY_COMPLETED: "henry.lifecycle.reentry.completed",
  BLOCKER_DETECTED: "henry.lifecycle.blocker.detected",
} as const;

export type LifecycleEventName =
  (typeof LIFECYCLE_EVENT_NAMES)[keyof typeof LIFECYCLE_EVENT_NAMES];
