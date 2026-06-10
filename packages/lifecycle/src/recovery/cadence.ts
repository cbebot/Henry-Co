/**
 * Recovery cadence planner — PURE. Given a task's idle/reminder state + the
 * user's prefs, decide the single next dispatch action. No DB, no clock: the
 * caller injects `now`, so every decision is deterministic + unit-testable.
 *
 * Default cadence (idle = time since last progress):
 *   - Day 1  (reminder_count 0): in-app reminder.
 *   - Day 3  (reminder_count 1): email reminder.
 *   - Day 7  (reminder_count 2): final email + push, with an offer if eligible.
 *   - Day 14: expire.
 * Quiet hours suppress the intrusive channels (in_app, push) but never email
 * (it is async). A per-channel opt-out removes that channel. A minimum gap
 * prevents two reminders landing in the same window.
 */
import type {
  RecoveryDispatchInput,
  RecoveryDispatchPlan,
  RecoveryStep,
  RecoveryChannel,
} from "./types";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export const RECOVERY_CADENCE: readonly RecoveryStep[] = [
  { atReminderCount: 0, minIdleMs: 1 * DAY, channels: ["in_app"] },
  { atReminderCount: 1, minIdleMs: 3 * DAY, channels: ["email"] },
  { atReminderCount: 2, minIdleMs: 7 * DAY, channels: ["email", "push"], withOffer: true },
];

/** Idle past this ⇒ expire the task (no more nudges). */
export const RECOVERY_EXPIRE_IDLE_MS = 14 * DAY;

/** Never send two reminders within this window of each other. */
export const RECOVERY_MIN_GAP_MS = 20 * HOUR;

export type PlanRecoveryOptions = {
  cadence?: readonly RecoveryStep[];
  expireIdleMs?: number;
  minGapMs?: number;
};

function channelAllowed(
  channel: RecoveryChannel,
  prefs: NonNullable<RecoveryDispatchInput["prefs"]>,
): boolean {
  if (channel === "in_app" && prefs.inApp === false) return false;
  if (channel === "email" && prefs.email === false) return false;
  if (channel === "push" && prefs.push === false) return false;
  // Quiet hours mute the intrusive channels; email is async and still allowed.
  if (prefs.quietHours && (channel === "in_app" || channel === "push")) return false;
  return true;
}

export function planRecoveryDispatch(
  input: RecoveryDispatchInput,
  options: PlanRecoveryOptions = {},
): RecoveryDispatchPlan {
  const cadence = options.cadence ?? RECOVERY_CADENCE;
  const expireIdleMs = options.expireIdleMs ?? RECOVERY_EXPIRE_IDLE_MS;
  const minGapMs = options.minGapMs ?? RECOVERY_MIN_GAP_MS;

  const idle = input.now - input.lastProgressAt;

  if (idle >= expireIdleMs) {
    return { action: "expire", channels: [], withOffer: false, reason: "idle past expire window" };
  }

  if (input.lastReminderAt != null && input.now - input.lastReminderAt < minGapMs) {
    return { action: "noop", channels: [], withOffer: false, reason: "within min gap since last reminder" };
  }

  const step = cadence.find((s) => s.atReminderCount === input.reminderCount);
  if (!step) {
    return { action: "noop", channels: [], withOffer: false, reason: "no cadence step for reminder_count" };
  }
  if (idle < step.minIdleMs) {
    return { action: "noop", channels: [], withOffer: false, reason: "not idle long enough for step" };
  }

  const prefs = input.prefs ?? {};
  const allowed = step.channels.filter((ch) => channelAllowed(ch, prefs));
  if (allowed.length === 0) {
    return { action: "noop", channels: [], withOffer: false, reason: "all step channels opted out / quiet" };
  }

  return {
    action: "dispatch",
    channels: allowed,
    withOffer: Boolean(step.withOffer),
    reason: `step ${step.atReminderCount} fired`,
  };
}
