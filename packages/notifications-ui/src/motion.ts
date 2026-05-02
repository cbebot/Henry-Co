/**
 * Premium motion language for the HenryCo notification surface.
 *
 * Curves are intentional — not the framer-motion defaults — so swipe
 * reveals, toast entries, and the bell pulse share a perceptible house
 * style. Names are stable across the package; consumers reference them
 * via the exported constants rather than inlining bezier values.
 *
 * All durations are in milliseconds. The CSS-string variants below are
 * preformatted `cubic-bezier(...) <ms>ms` strings ready to drop into
 * `transition` properties.
 */

/**
 * Reveal — used when a swipe (or long-press fallback) opens the action
 * tray on a notification card. Fast in, gentle out.
 */
export const henrycoSwipeRevealCurve = "cubic-bezier(0.32, 0.72, 0, 1)";
export const henrycoSwipeRevealMs = 220;

/**
 * Commit — used when a fast swipe past the threshold completes the
 * action immediately, sliding the card off-screen before the optimistic
 * mutation resolves. Tighter than reveal; the user has already
 * communicated intent.
 */
export const henrycoSwipeCommitCurve = "cubic-bezier(0.4, 0.0, 0.2, 1)";
export const henrycoSwipeCommitMs = 180;

/**
 * Settle — used when the user releases mid-swipe below the threshold
 * and the card snaps back to rest. Slightly longer than reveal so the
 * snap reads as forgiving, not punishing.
 */
export const henrycoSwipeSettleCurve = "cubic-bezier(0.16, 1, 0.3, 1)";
export const henrycoSwipeSettleMs = 260;

/**
 * Reduced-motion durations. The motion language degrades to a fade-only
 * cross-state — the easing curve is irrelevant once duration is short
 * enough to be near-instant, but we keep the linear curve for clarity.
 */
export const reducedMotionMs = 0;
export const reducedMotionCurve = "linear";

/**
 * Distance thresholds (px) for the swipe gesture. Tuned at 375 px
 * viewport against the standard 64-px tap target; reads as comfortable
 * at 320–430 px.
 *
 *   directionLockPx — minimum distance before we lock to horizontal
 *                     swipe and start suppressing vertical scroll.
 *   primaryRevealPx — distance at which the first action (archive on
 *                     left swipe, mark-read on right swipe) is
 *                     committed if released here.
 *   secondaryRevealPx — distance at which the secondary action
 *                       (delete on left swipe) is committed.
 *   commitVelocityPxPerMs — release velocity above which we commit
 *                           the currently-armed action regardless of
 *                           distance.
 */
export const SWIPE_DIRECTION_LOCK_PX = 12;
export const SWIPE_PRIMARY_REVEAL_PX = 56;
export const SWIPE_SECONDARY_REVEAL_PX = 112;
export const SWIPE_COMMIT_VELOCITY_PX_PER_MS = 0.55;

/** Long-press fallback duration when prefers-reduced-motion is set. */
export const LONG_PRESS_FALLBACK_MS = 650;

/** Composed `transition` strings. */
export const henrycoSwipeRevealTransition =
  `transform ${henrycoSwipeRevealMs}ms ${henrycoSwipeRevealCurve}`;
export const henrycoSwipeCommitTransition =
  `transform ${henrycoSwipeCommitMs}ms ${henrycoSwipeCommitCurve}`;
export const henrycoSwipeSettleTransition =
  `transform ${henrycoSwipeSettleMs}ms ${henrycoSwipeSettleCurve}`;
