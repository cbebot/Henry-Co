/**
 * @henryco/dashboard-shell — motion tokens.
 *
 * The HenryCo motion language: fade + soft scale, never slide. Slide
 * implies an off-screen elsewhere; fade respects the user's attention and
 * lets focus stay where it is.
 *
 * Closes anti-pattern #21 (mobile = desktop scaled down) at the motion
 * layer: the same tokens drive bottom-sheet entry and desktop popover
 * entry, so the visual signature reads consistently across breakpoints
 * without each component re-deriving timings.
 */

/**
 * Standard surface entry/exit. 200ms aligns with V2-NOT-02-A's
 * `routeFadeMs` (`packages/notifications-ui/src/motion.ts`) so the shell
 * and the notifications layer feel of a piece.
 */
export const FADE_MS = 200;

/**
 * The success-lock window after a one-shot commit (e.g. payment proof
 * upload, role-switcher confirm). 1200ms holds the lock just long enough
 * for the user to see the green tick + lock icon without making the
 * surface feel frozen on slow networks.
 *
 * Mirrors V5-CLEAR Bug D's PublicButton success-lock pattern at
 * `packages/ui/src/public/public-button.tsx`.
 */
export const SUCCESS_LOCK_MS = 1200;

/**
 * Easing curves. We use two:
 *
 * `OUT` — most surface entries (fade-in, scale-up). Decelerating cubic
 * makes things feel like they "settle" rather than "snap".
 *
 * `IN_OUT` — surface lifts on tap (active state, button press). Both
 * sides slow at the boundaries for a more tactile feel.
 *
 * `LINEAR` — only for opacity-only crossfades on micro-interactions
 * where the easing curve would over-emphasise the transition.
 */
export const EASE_OUT = "cubic-bezier(0.22, 1, 0.36, 1)" as const;
export const EASE_IN_OUT = "cubic-bezier(0.4, 0, 0.2, 1)" as const;
export const LINEAR = "linear" as const;

/**
 * Soft-scale entry: 0.985 → 1.000. Subtle enough that motion-sensitive
 * users don't notice; just enough to make the surface feel like it
 * lands rather than appears.
 */
export const SOFT_SCALE_START = 0.985;
export const SOFT_SCALE_END = 1;

/**
 * Whole motion preset for the surface entry pattern. Components consume
 * via inline `style` so the token is portable across CSS-in-JS, plain
 * Tailwind, and inline-style call sites.
 *
 * Example:
 *   <div style={{ animation: `${MOTION_PRESET.surfaceEntry.keyframes} ${MOTION_PRESET.surfaceEntry.duration}ms ${MOTION_PRESET.surfaceEntry.easing}` }} />
 *
 * Reduced-motion is honoured by every component — when
 * `prefers-reduced-motion: reduce` is set, the keyframe collapses to
 * an opacity-only fade and the scale is skipped.
 */
export const MOTION_PRESET = {
  surfaceEntry: {
    keyframes: "henrycoSurfaceEntry",
    duration: FADE_MS,
    easing: EASE_OUT,
  },
  buttonPress: {
    duration: 120,
    easing: EASE_IN_OUT,
    translateY: "0.5px",
  },
  drawerSlide: {
    keyframes: "henrycoDrawerEntry",
    duration: FADE_MS,
    easing: EASE_OUT,
  },
} as const;

/**
 * The CSS keyframes the preset names. Components consume these via a
 * stylesheet snippet shipped alongside the shell. Token values are kept
 * in sync via the `MOTION_PRESET` object — change a number here and the
 * stylesheet generator picks it up.
 */
export const MOTION_KEYFRAMES_CSS = `
@keyframes henrycoSurfaceEntry {
  from {
    opacity: 0;
    transform: scale(${SOFT_SCALE_START});
  }
  to {
    opacity: 1;
    transform: scale(${SOFT_SCALE_END});
  }
}

@keyframes henrycoDrawerEntry {
  from {
    opacity: 0;
    transform: translateY(0.5rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  @keyframes henrycoSurfaceEntry {
    from { opacity: 0; transform: none; }
    to { opacity: 1; transform: none; }
  }
  @keyframes henrycoDrawerEntry {
    from { opacity: 0; transform: none; }
    to { opacity: 1; transform: none; }
  }
}
` as const;
