/**
 * `@henryco/lifecycle/recovery` — V3-37 abandoned-journey recovery decision
 * logic (PURE). Cadence planning + detection shaping; the server runner (reads +
 * writes) lives in apps/account. Re-exports the secret-free guard + task types
 * from @henryco/data so detectors have a single import surface.
 */
export type {
  RecoveryChannel,
  RecoveryStep,
  RecoveryPrefs,
  RecoveryDispatchInput,
  RecoveryDispatchPlan,
  DetectedTask,
} from "./types";

export {
  RECOVERY_CADENCE,
  RECOVERY_EXPIRE_IDLE_MS,
  RECOVERY_MIN_GAP_MS,
  planRecoveryDispatch,
  type PlanRecoveryOptions,
} from "./cadence";

export {
  FORM_DRAFT_MIN_IDLE_MS,
  detectFromDraftEnvelope,
  buildDetectedTask,
  isRecoverableByIdle,
} from "./detect";

export {
  stripSecretsFromState,
  stateHasForbiddenKey,
  ABANDONED_TASK_TYPES,
  ABANDONED_TASK_STATUSES,
  type AbandonedTask,
  type AbandonedTaskType,
  type AbandonedTaskState,
  type AbandonedTaskStatus,
} from "@henryco/data/abandoned-tasks-core";
