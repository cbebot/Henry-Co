/**
 * @henryco/dashboard-shell — focus-ring tokens.
 *
 * WCAG 2.4.7 mandates visible focus indicators. The shell ships a
 * 2px solid ring inset to the focus-visible target with the accent
 * color, satisfying the AA requirement and the AAA refinement V2-A11Y-01
 * established for HenryCo public surfaces.
 *
 * Inset (rather than outset) avoids the hover-bleed issue where a
 * focus ring sits underneath an adjacent component on dense layouts.
 */

import { CSS_VARS } from "./color";

/**
 * The standard focus-visible inset ring. Components consume via:
 *
 *   className="focus-visible:outline-none focus-visible:[box-shadow:var(--hc-focus-ring-shadow)]"
 *
 * or via the React helper below.
 */
export const FOCUS_RING_WIDTH = "2px";
export const FOCUS_RING_INSET = "2px";

/**
 * The CSS shadow expression for the inset focus ring. Reads the
 * `--hc-focus-ring` CSS variable so a host app may override the ring
 * color per-division.
 */
export const FOCUS_RING_SHADOW = `inset 0 0 0 ${FOCUS_RING_WIDTH} var(${CSS_VARS.focusRing})`;

/**
 * Build the focus-visible style object for an element. Use as
 * `<button style={{ ...focusVisibleStyle() }}>` paired with
 * `className="focus-visible:outline-none"` to suppress the default UA
 * outline.
 *
 * Returns the shadow + a transparent outline to keep keyboard-only
 * detection alive even if the host CSS strips the default outline.
 */
export function focusVisibleStyle(): {
  outline: string;
  boxShadow: string;
} {
  return {
    outline: "2px solid transparent",
    boxShadow: FOCUS_RING_SHADOW,
  };
}
