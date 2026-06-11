/**
 * @henryco/data/abandoned-tasks-core — pure (browser-safe) helpers + types for
 * the V3-37 abandoned-task recovery surface.
 *
 * No DB access and NO `server-only` barrier, so the secret-free guard and shape
 * helpers are unit-testable and importable from the lifecycle detectors. The DB
 * read/write functions live in ./abandoned-tasks (server-only).
 */
import type { Json } from "./database.types";

export const ABANDONED_TASK_TYPES = [
  "form_draft",
  "booking",
  "kyc",
  "proposal",
  "cart",
] as const;
export type AbandonedTaskType = (typeof ABANDONED_TASK_TYPES)[number];

export const ABANDONED_TASK_STATUSES = [
  "pending",
  "recovered",
  "expired",
  "dismissed",
] as const;
export type AbandonedTaskStatus = (typeof ABANDONED_TASK_STATUSES)[number];

/** A restorable, SECRET-FREE snapshot — enough to land on the next step. */
export type AbandonedTaskState = { [key: string]: Json };

/** Normalised camelCase task as the dashboard + cadence consume it. */
export type AbandonedTask = {
  id: string;
  userId: string | null;
  taskType: AbandonedTaskType;
  taskRef: string;
  division: string | null;
  continueUrl: string;
  state: AbandonedTaskState;
  lastProgressAt: string;
  reminderCount: number;
  lastReminderAt: string | null;
  status: AbandonedTaskStatus;
  createdAt: string;
  updatedAt: string;
};

/**
 * Keys that must NEVER be persisted in `state`. Recovery restores a STEP, not a
 * payment instrument or identity document — the actual money/identity action
 * re-runs through the behavior-locked payment/KYC surfaces with their own
 * idempotency. Matched case-insensitively.
 */
export const FORBIDDEN_STATE_KEY_PATTERNS: readonly RegExp[] = [
  /\bpan\b/i,
  /card[_-]?number/i,
  /\bcvv\b/i,
  /\bcvc\b/i,
  /\bcvn\b/i,
  /expiry/i,
  /\bpin\b/i,
  /password/i,
  /passcode/i,
  /secret/i,
  /\btoken\b/i, // raw auth/session tokens (claim_token lives in a column, not state)
  /authorization/i,
  /\bbvn\b/i, // bank verification number
  /account[_-]?number/i,
  /routing/i,
  /\bnin\b/i, // national identity number
  /document[_-]?(bytes|data|base64|blob)/i,
  /id[_-]?image/i,
  /selfie/i,
  /private[_-]?key/i,
];

export function keyIsForbidden(key: string): boolean {
  return FORBIDDEN_STATE_KEY_PATTERNS.some((re) => re.test(key));
}

/**
 * Recursively strip forbidden keys from a candidate state object. Returns a NEW
 * object — never mutates the input. Arrays + primitives are preserved; nested
 * objects are cleaned. Call at EVERY write site so a careless detector can never
 * leak a secret into the table. A non-object top-level collapses to `{}`.
 */
export function stripSecretsFromState(input: unknown): AbandonedTaskState {
  const cleaned = cleanValue(input);
  if (cleaned && typeof cleaned === "object" && !Array.isArray(cleaned)) {
    return cleaned as AbandonedTaskState;
  }
  return {};
}

function cleanValue(value: unknown): Json {
  if (Array.isArray(value)) {
    return value.map((v) => cleanValue(v)) as Json;
  }
  if (value && typeof value === "object") {
    const out: { [k: string]: Json } = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (keyIsForbidden(k)) continue;
      out[k] = cleanValue(v);
    }
    return out;
  }
  if (value === undefined) return null;
  return value as Json;
}

/** Does `input` contain a forbidden key at any depth? (Test/guard assertion.) */
export function stateHasForbiddenKey(input: unknown): boolean {
  if (Array.isArray(input)) return input.some(stateHasForbiddenKey);
  if (input && typeof input === "object") {
    return Object.entries(input as Record<string, unknown>).some(
      ([k, v]) => keyIsForbidden(k) || stateHasForbiddenKey(v),
    );
  }
  return false;
}

export function isAbandonedTaskType(value: unknown): value is AbandonedTaskType {
  return (
    typeof value === "string" &&
    (ABANDONED_TASK_TYPES as readonly string[]).includes(value)
  );
}

export function isAbandonedTaskStatus(value: unknown): value is AbandonedTaskStatus {
  return (
    typeof value === "string" &&
    (ABANDONED_TASK_STATUSES as readonly string[]).includes(value)
  );
}
