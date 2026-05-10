/**
 * @henryco/dashboard-shell — interaction-state tokens.
 *
 * PASS 20 — the furnishing system. A small vocabulary so every
 * interactive surface speaks the same hover/pressed/disabled
 * language without re-declaring values per component.
 *
 * The overlays are translucent layers that compose with whatever
 * fill or surface is underneath. Apply via inset box-shadow:
 *
 *   box-shadow: inset 0 0 0 9999px var(--hc-state-hover-overlay);
 *
 * or as a sibling layer with `mix-blend-mode: multiply` (light) or
 * `mix-blend-mode: screen` (dark) — the CSS-variable values are
 * already calibrated for direct application without blend modes.
 *
 * Disabled is opacity, not an overlay, because the entire element
 * (text, fill, icons) needs to fade together. An overlay would only
 * affect the painted surface and leave text floating at full
 * contrast.
 */

/**
 * The CSS custom property names. Read these via `var(--hc-state-*)`
 * so the values swap with the theme.
 */
export const STATE_VARS = {
  hoverOverlay: "--hc-state-hover-overlay",
  pressedOverlay: "--hc-state-pressed-overlay",
  disabledOpacity: "--hc-state-disabled-opacity",
} as const;

/**
 * Per-step intent for picking the right state token.
 *
 * - **hoverOverlay** — mouse-over on actionable surfaces. Subtle.
 *   Pair with the base duration (180ms / ease-standard) for the
 *   transition.
 * - **pressedOverlay** — active press. Roughly 2× hover depth.
 *   Use the fast duration (120ms) for snap.
 * - **disabledOpacity** — applied to the whole element so text +
 *   fill fade together. Pair with `pointer-events: none` and
 *   `aria-disabled="true"`.
 *
 * Focus is NOT here — that lives in `./focus.ts` (the inset 2px
 * accent ring) and never composes with hover.
 */
export const STATE_INTENT = {
  hoverOverlay: "mouse-over on actionable surfaces (180ms / ease-standard)",
  pressedOverlay: "active press (120ms / ease-standard)",
  disabledOpacity: "whole-element fade — pair with pointer-events:none",
} as const;

/**
 * Inline-style escape hatch — use only when the call site cannot
 * reach a CSS variable. Both maps are theme-locked to LIGHT mode;
 * surfaces that need theme-adaptive interaction must read the CSS
 * variable, not this constant.
 */
export const STATE_LIGHT = {
  hoverOverlay: "rgba(24, 24, 27, 0.04)",
  pressedOverlay: "rgba(24, 24, 27, 0.08)",
  disabledOpacity: 0.55,
} as const;

/**
 * The full list of states every interactive element must design:
 * default → hover → pressed → focus-visible → disabled → loading.
 * This array is the audit checklist; a component review that
 * cannot answer all six is incomplete.
 */
export const REQUIRED_INTERACTION_STATES = [
  "default",
  "hover",
  "pressed",
  "focus-visible",
  "disabled",
  "loading",
] as const;

export type InteractionState = (typeof REQUIRED_INTERACTION_STATES)[number];
