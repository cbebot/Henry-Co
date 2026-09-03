/**
 * Recovery detection helpers — PURE. Turn a raw signal (a stale client draft, or
 * an incomplete server record) into a `DetectedTask` ready for
 * captureAbandonedTask. Every builder runs the snapshot through
 * `stripSecretsFromState`, so a careless caller can never leak a secret.
 *
 * The actual reads (which drafts / which division rows) + the writes live in the
 * server runner (apps/account/lib/recovery). These helpers only decide WHETHER a
 * signal is recoverable and SHAPE the task.
 */
import {
  stripSecretsFromState,
  type AbandonedTaskType,
} from "@henryco/data/abandoned-tasks-core";
import type { DetectedTask } from "./types";

/** Form drafts are recoverable once idle past this (matches drafts STALE_THRESHOLD_MS). */
export const FORM_DRAFT_MIN_IDLE_MS = 24 * 60 * 60 * 1000;

function toIso(value: number | string): string {
  return typeof value === "number" ? new Date(value).toISOString() : value;
}

/**
 * Promote a stale `@henryco/lifecycle/drafts` envelope to a recoverable task.
 * Returns null when the draft is too fresh (still actively being worked) or has
 * no resume target.
 */
export function detectFromDraftEnvelope(
  envelope: { key: string; savedAt: number; value: unknown },
  opts: {
    now: number;
    resumeUrl: string;
    division?: string | null;
    minIdleMs?: number;
  },
): DetectedTask | null {
  if (!opts.resumeUrl) return null;
  const minIdle = opts.minIdleMs ?? FORM_DRAFT_MIN_IDLE_MS;
  if (opts.now - envelope.savedAt < minIdle) return null;

  return {
    taskType: "form_draft",
    taskRef: envelope.key,
    division: opts.division ?? null,
    continueUrl: opts.resumeUrl,
    state: stripSecretsFromState({ draftKey: envelope.key, value: envelope.value }),
    lastProgressAt: toIso(envelope.savedAt),
  };
}

/**
 * Generic builder for server-recorded incomplete journeys (booking / kyc /
 * proposal / cart) the collector/runner already reads. The runner decides the
 * status threshold per division; this shapes + sanitises the task.
 */
export function buildDetectedTask(input: {
  taskType: AbandonedTaskType;
  taskRef: string;
  division?: string | null;
  continueUrl: string;
  state?: unknown;
  lastProgressAt: number | string;
}): DetectedTask {
  return {
    taskType: input.taskType,
    taskRef: input.taskRef,
    division: input.division ?? null,
    continueUrl: input.continueUrl,
    state: stripSecretsFromState(input.state ?? {}),
    lastProgressAt: toIso(input.lastProgressAt),
  };
}

/** Is an incomplete record idle long enough to be worth recovering (but not yet expired)? */
export function isRecoverableByIdle(
  lastProgressMs: number,
  now: number,
  minIdleMs: number,
  expireIdleMs: number,
): boolean {
  const idle = now - lastProgressMs;
  return idle >= minIdleMs && idle < expireIdleMs;
}
