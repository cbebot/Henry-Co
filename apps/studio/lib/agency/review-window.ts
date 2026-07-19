/**
 * SA-3 — client-review silence handling. PURE (no server import) so the cadence
 * is unit-testable and enforced identically wherever it runs.
 *
 * The load-bearing rule (SAFETY-MODEL §6, ratified SA-D2): a client's silence
 * on a preview NEVER auto-advances the job to owner review. Instead the
 * orchestrator sends a bounded trail of templated reminders, and after
 * `CLIENT_REVIEW_ESCALATION_DAYS` (7) the trail ends in an OWNER ESCALATION —
 * the owner decides, because the safety rationale is that the owner approves a
 * site the client has already seen. There is no path here that returns
 * `advance`; the only client→owner_review edge is a client's explicit approval
 * action.
 */

/** Ratified SA-D2: reminders for 7 days, then escalate to the owner. */
export const CLIENT_REVIEW_ESCALATION_DAYS = 7;
/** Reminder cadence (days since entering client_review) — bounded, then escalate. */
export const CLIENT_REVIEW_REMINDER_DAYS: readonly number[] = [2, 4, 6];
/**
 * Included client revision rounds for a template package (SA-D2). Beyond this,
 * further changes are an owner decision (a Mode-B add-on, deferred) — the client
 * cannot force unbounded free rebuilds.
 */
export const MAX_CLIENT_REVISION_ROUNDS = 2;

/** Are the client's included revision rounds used up? */
export function revisionRoundsExhausted(roundsUsed: number): boolean {
  return Math.max(0, Math.trunc(roundsUsed)) >= MAX_CLIENT_REVISION_ROUNDS;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export type ReviewWindowAction =
  | { kind: "none" }
  | { kind: "remind"; reminderIndex: number; dayThreshold: number }
  | { kind: "escalate" };

/**
 * Decide what (if anything) the orchestrator should do for a job that has sat
 * in `client_review` without the client acting. `remindersSent` is the count of
 * reminders already emitted (derived from the append-only event log, so this is
 * idempotent across ticks). Escalation is emitted at most once — the caller
 * transitions the job's ownership of the decision to the owner, it does NOT
 * advance the job.
 */
export function decideReviewWindowAction(input: {
  enteredAtMs: number;
  now: number;
  remindersSent: number;
  escalated: boolean;
}): ReviewWindowAction {
  const { enteredAtMs, now, remindersSent, escalated } = input;
  if (!Number.isFinite(enteredAtMs) || enteredAtMs <= 0) return { kind: "none" };
  const elapsedDays = (now - enteredAtMs) / DAY_MS;

  // Escalate once the window closes — never before, never auto-advance.
  if (elapsedDays >= CLIENT_REVIEW_ESCALATION_DAYS) {
    return escalated ? { kind: "none" } : { kind: "escalate" };
  }

  // Otherwise send the next due reminder, if any remain and its day has arrived.
  const idx = Math.max(0, Math.trunc(remindersSent));
  if (idx < CLIENT_REVIEW_REMINDER_DAYS.length) {
    const dayThreshold = CLIENT_REVIEW_REMINDER_DAYS[idx];
    if (elapsedDays >= dayThreshold) {
      return { kind: "remind", reminderIndex: idx, dayThreshold };
    }
  }
  return { kind: "none" };
}

/** Whole days a job has waited in client_review (for owner-facing copy). */
export function daysWaiting(enteredAtMs: number, now: number): number {
  if (!Number.isFinite(enteredAtMs) || enteredAtMs <= 0) return 0;
  return Math.max(0, Math.floor((now - enteredAtMs) / DAY_MS));
}
