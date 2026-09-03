/**
 * V3-41 — predictive batch configuration. Extracted so every knob is directly
 * unit-testable (batch.ts is Supabase-bound; this is not) — the V3-40
 * `budget-config.ts` lesson.
 */

import { parseHenryFeatureFlags, isFlagEnabled } from "@henryco/intelligence";
import { LOCK_KEYS } from "@henryco/workflow";

/**
 * The single-flight key for the predictive tick. The row MUST be seeded in the
 * migration: the CAS is an UPDATE, so a missing row is a lock nobody can ever
 * win — which would silently disable the batch rather than fail loudly.
 */
export const PREDICTIVE_TICK_LOCK_KEY = LOCK_KEYS.hubPredictiveTick;

/**
 * TTL deliberately EXCEEDS the cron route's maxDuration (60s) so the platform
 * kills an overrunning tick BEFORE its lock can expire — a live run can never
 * outlive its own lock (the SA-3 TTL lesson).
 */
export const PREDICTIVE_TICK_LOCK_TTL_SECONDS = 300;

/** Bounded reads — a batch must never attempt an unbounded table scan. */
export const QUEUE_HISTORY_DAYS = 28;
export const QUEUE_HISTORY_ROW_LIMIT = 5000;
export const SERVICE_UNIT_LIMIT = 400;
export const TRANSACTION_LIMIT = 400;

/** At most this many narrative calls per run, on top of the daily ceiling. */
export const NARRATIVE_MAX_PER_RUN = 3;

/** Is the deterministic batch enabled at all? Default OFF (dark launch). */
export function predictiveBatchEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  const flags = parseHenryFeatureFlags(env as Record<string, string | undefined>);
  return isFlagEnabled(flags, "predictive_operations");
}

/**
 * Is the OPTIONAL staff-narrative AI slice enabled? Requires BOTH its own flag
 * and the system-wide gateway kill switch — the deterministic forecast never
 * needs it, so this staying false forever costs the platform nothing.
 */
export function predictiveNarrativeEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  const flags = parseHenryFeatureFlags(env as Record<string, string | undefined>);
  return (
    isFlagEnabled(flags, "predictive_quality_narrative") && isFlagEnabled(flags, "ai_gateway")
  );
}
