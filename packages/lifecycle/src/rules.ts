import type { LifecyclePriority, LifecycleStage } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

export const LIFECYCLE_DORMANCY_DAYS = 45;
export const LIFECYCLE_REENGAGEMENT_DAYS = 21;
export const LIFECYCLE_CHURN_RISK_DAYS = 90;
export const LIFECYCLE_AWAITING_USER_STALL_HOURS = 72;
export const LIFECYCLE_AWAITING_BUSINESS_STALL_HOURS = 48;

export function daysSince(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const value = new Date(iso).getTime();
  if (!Number.isFinite(value)) return null;
  return Math.max(0, (Date.now() - value) / DAY_MS);
}

export function hoursSince(iso: string | null | undefined): number | null {
  const d = daysSince(iso);
  return d == null ? null : d * 24;
}

export function isDormantSignal(iso: string | null | undefined): boolean {
  const days = daysSince(iso);
  return days != null && days >= LIFECYCLE_DORMANCY_DAYS;
}

export function isReEngagementCandidate(iso: string | null | undefined): boolean {
  const days = daysSince(iso);
  return days != null && days >= LIFECYCLE_REENGAGEMENT_DAYS && days < LIFECYCLE_DORMANCY_DAYS;
}

export function isChurnRisk(iso: string | null | undefined): boolean {
  const days = daysSince(iso);
  return days != null && days >= LIFECYCLE_CHURN_RISK_DAYS;
}

export function isAwaitingUserStalled(iso: string | null | undefined): boolean {
  const hours = hoursSince(iso);
  return hours != null && hours >= LIFECYCLE_AWAITING_USER_STALL_HOURS;
}

export function isAwaitingBusinessStalled(iso: string | null | undefined): boolean {
  const hours = hoursSince(iso);
  return hours != null && hours >= LIFECYCLE_AWAITING_BUSINESS_STALL_HOURS;
}

/**
 * Deriving blocked/awaiting vs. in_progress is a repeat pattern across divisions.
 * This helper centralises the "who is the ball with right now" call.
 */
export function deriveWaitStage(input: {
  hasUnresolvedAction: boolean;
  hasPendingBusinessReview: boolean;
  hasHardBlocker: boolean;
  lastActivityAt: string | null;
}): LifecycleStage {
  if (input.hasHardBlocker) return "blocked";
  if (input.hasPendingBusinessReview) return "awaiting_business";
  if (input.hasUnresolvedAction) return "awaiting_user";
  if (isDormantSignal(input.lastActivityAt)) return "dormant";
  if (isReEngagementCandidate(input.lastActivityAt)) return "reengagement_candidate";
  return "in_progress";
}

/**
 * Priority default selected from stage + optional explicit override signals.
 * Never returns critical by default — callers must opt-in for critical via `escalate`.
 */
export function derivePriority(input: {
  stage: LifecycleStage;
  escalate?: boolean;
  stalled?: boolean;
}): LifecyclePriority {
  if (input.escalate) return "critical";
  switch (input.stage) {
    case "blocked":
      return "critical";
    case "awaiting_user":
      return input.stalled ? "high" : "normal";
    case "awaiting_business":
      return input.stalled ? "high" : "normal";
    case "reengagement_candidate":
      return "normal";
    case "dormant":
      return "low";
    case "churn_risk":
      return "high";
    case "in_progress":
      return "normal";
    default:
      return "low";
  }
}
