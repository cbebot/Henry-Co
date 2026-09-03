/**
 * SA-3 — aftercare / follow-up cadence (ARCHITECTURE §3.2 `live → aftercare`).
 * PURE math (no server import). Once a site is live the orchestrator schedules a
 * templated day-3 check-in and holds the job in `aftercare` through the warranty
 * window; at the window's close the job stops being active (it never mutates a
 * closed job — a warranty fix is a NEW internal-flagged job linked by
 * parent_job_id, per the design). Autonomous because every step is templated and
 * reversible (SAFETY-MODEL Class A).
 */

/** Ratified SA-D2: 14-day warranty window before the job closes. */
export const WARRANTY_WINDOW_DAYS = 14;
/** Templated post-launch check-in, 3 days after go-live. */
export const AFTERCARE_CHECKIN_DAY = 3;

const DAY_MS = 24 * 60 * 60 * 1000;

export type AftercareAction =
  | { kind: "none" }
  | { kind: "checkin" }
  | { kind: "close" };

/**
 * Decide the next aftercare step for a live/aftercare job. `checkinsSent` is the
 * count of day-3 check-ins already emitted (event-derived → idempotent). The
 * check-in fires once at day 3; the job closes once the warranty window elapses.
 */
export function decideAftercareAction(input: {
  liveAtMs: number;
  now: number;
  checkinsSent: number;
}): AftercareAction {
  const { liveAtMs, now, checkinsSent } = input;
  if (!Number.isFinite(liveAtMs) || liveAtMs <= 0) return { kind: "none" };
  const elapsedDays = (now - liveAtMs) / DAY_MS;

  if (elapsedDays >= WARRANTY_WINDOW_DAYS) return { kind: "close" };
  if (checkinsSent < 1 && elapsedDays >= AFTERCARE_CHECKIN_DAY) return { kind: "checkin" };
  return { kind: "none" };
}
