/**
 * V3-FEEDBACK-01: the pure drip planner moved to
 * `@henryco/notifications-ui/toast-pacing` so the shared action-feedback
 * viewport (@henryco/ui/feedback) and this shell's notifications viewport
 * pace toasts with the SAME tested planner. Re-exported here so existing
 * imports and tests keep working unchanged.
 */
export {
  planToastRelease,
  type PlanToastReleaseInput,
  type ToastReleasePlan,
} from "@henryco/notifications-ui/toast-pacing";
