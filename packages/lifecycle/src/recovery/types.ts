/**
 * @henryco/lifecycle/recovery — types for the V3-37 abandoned-journey recovery
 * decision logic (PURE; the server runner lives in apps/account).
 */
import type {
  AbandonedTaskState,
  AbandonedTaskType,
} from "@henryco/data/abandoned-tasks-core";

export type RecoveryChannel = "in_app" | "email" | "push";

/** A detected recoverable journey, ready to upsert via captureAbandonedTask. */
export type DetectedTask = {
  taskType: AbandonedTaskType;
  /** Stable idempotency ref to the underlying record/draft. */
  taskRef: string;
  division: string | null;
  /** Deep link to the EXACT next step (built via @henryco/config helpers). */
  continueUrl: string;
  /** Restorable snapshot — already passed through stripSecretsFromState. */
  state: AbandonedTaskState;
  /** ISO timestamp of the user's last progress. */
  lastProgressAt: string;
};

/** One step of the reminder cadence. */
export type RecoveryStep = {
  /** Applies when the task is at this reminder_count (0 = first reminder). */
  atReminderCount: number;
  /** Minimum idle ms since last progress before this step may fire. */
  minIdleMs: number;
  /** Channels to dispatch at this step. */
  channels: RecoveryChannel[];
  /** Attach an incentive/offer when eligible (the day-7 final step). */
  withOffer?: boolean;
};

/** The user's per-channel reminder preferences + current quiet-hours state. */
export type RecoveryPrefs = {
  /** default true */ inApp?: boolean;
  /** default true */ email?: boolean;
  /** default true */ push?: boolean;
  /** true = the user is currently within their quiet hours */ quietHours?: boolean;
};

export type RecoveryDispatchInput = {
  /** ms epoch — injected for determinism. */
  now: number;
  /** ms epoch of last progress. */
  lastProgressAt: number;
  /** how many reminders have already been sent. */
  reminderCount: number;
  /** ms epoch of the last reminder, or null if none yet. */
  lastReminderAt: number | null;
  prefs?: RecoveryPrefs;
};

export type RecoveryDispatchPlan = {
  action: "dispatch" | "expire" | "noop";
  /** Channels to send on (empty unless action === 'dispatch'). */
  channels: RecoveryChannel[];
  withOffer: boolean;
  /** Human-readable reason (telemetry + tests). */
  reason: string;
};
