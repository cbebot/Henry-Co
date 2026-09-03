/**
 * Toast drip-release planner — PURE. Decides, given the current candidate toasts
 * and what's already on screen, whether to release the next one now, wait, or
 * sit idle. Keeps a viewport calm: at most `limit` visible, revealed ONE AT A
 * TIME with a minimum `gapMs` between appearances, so a backlog or a burst
 * trickles in instead of two popping out at once.
 *
 * The first toast after a lull shows instantly (no artificial delay for a lone
 * arrival); every subsequent release waits out the gap from the previous one.
 *
 * Pure + injected `now` so the pacing is unit-testable without React.
 *
 * V3-FEEDBACK-01: moved here (verbatim) from @henryco/dashboard-shell so the
 * shared action-feedback viewport in @henryco/ui and the dashboard shell's
 * notifications viewport pace toasts with the SAME tested planner.
 * @henryco/dashboard-shell re-exports it for back-compat.
 */

export type ToastReleasePlan =
  | { action: "prune"; releasedKeys: string[] }
  | { action: "release"; key: string }
  | { action: "wait"; waitMs: number }
  | { action: "idle" };

export type PlanToastReleaseInput = {
  /** All candidate toast keys, newest-first. */
  candidateKeys: string[];
  /** Keys already released to the viewport, in release order. */
  releasedKeys: string[];
  /** ms epoch when the last toast was released. */
  lastReleaseAt: number;
  /** ms epoch now (injected). */
  now: number;
  /** Max toasts visible at once. */
  limit: number;
  /** Minimum gap between successive releases. */
  gapMs: number;
};

export function planToastRelease(input: PlanToastReleaseInput): ToastReleasePlan {
  const present = new Set(input.candidateKeys);

  // 1) Drop released keys that have left the candidate set (dismissed/removed).
  const live = input.releasedKeys.filter((k) => present.has(k));
  if (live.length !== input.releasedKeys.length) {
    return { action: "prune", releasedKeys: live };
  }

  // 2) Room? Find the next not-yet-released candidate (newest-first).
  if (live.length >= input.limit) return { action: "idle" };
  const releasedSet = new Set(live);
  const next = input.candidateKeys.find((k) => !releasedSet.has(k));
  if (!next) return { action: "idle" };

  // 3) Pace it: the first one shows instantly; the rest wait out the gap.
  const wait = input.lastReleaseAt + input.gapMs - input.now;
  if (live.length === 0 || wait <= 0) {
    return { action: "release", key: next };
  }
  return { action: "wait", waitMs: wait };
}
