/**
 * @henryco/dashboard-shell — elevation tokens.
 *
 * PASS 20 — the furnishing system. A four-step elevation ladder
 * with restraint as the standard. Cards barely lift; overlays read
 * as another sheet of paper, not a billboard.
 *
 * In light mode each step is a calibrated drop shadow. In dark mode
 * a heavy outset shadow over a near-black surface reads as a smudge,
 * so the pattern flips to a 1px inset top highlight ("light from
 * above") plus a deeper drop. The CSS variables already encode both
 * modes — the constants below are inline-style escape hatches for
 * call sites that cannot reach the CSS variable (e.g., framer
 * keyframes, WebGL surfaces).
 *
 * Reference these via `var(--hc-elevation-{0,1,2,3})` in CSS or
 * `ELEVATION.{n}` for typed inline-style.
 */

/**
 * The CSS custom property names. Components should prefer reading
 * the variable so the value swaps cleanly on theme change rather
 * than the constant fork below, which is light-mode only.
 */
export const ELEVATION_VARS = {
  e0: "--hc-elevation-0",
  e1: "--hc-elevation-1",
  e2: "--hc-elevation-2",
  e3: "--hc-elevation-3",
} as const;

/**
 * Light-mode literal values, mirroring the `:root` declarations in
 * `packages/ui/src/styles/globals.css`. Useful when a call site
 * cannot reach a CSS variable (e.g. an inline framer-motion keyframe
 * value). Dark-mode values are NOT included here — surfaces that
 * need theme-adaptive elevation must read from the CSS variable, not
 * from this constant. If a literal is required at a non-CSS call
 * site, that surface should be locked to a single theme.
 */
export const ELEVATION_LIGHT = {
  e0: "none",
  e1: "0 1px 2px 0 rgba(15, 23, 42, 0.04)",
  e2: "0 12px 32px -8px rgba(15, 23, 42, 0.12), 0 4px 12px -4px rgba(15, 23, 42, 0.06)",
  e3: "0 20px 48px -8px rgba(15, 23, 42, 0.16), 0 8px 20px -4px rgba(15, 23, 42, 0.08)",
} as const;

/**
 * Per-step intent. Use this comment as the rule of thumb for which
 * step to reach for in any given component:
 *
 * - **e0** — page background. No decoration.
 * - **e1** — cards on the page. Most surfaces. The default.
 * - **e2** — popovers, dropdowns, modals. Floating layers above
 *   the card layer.
 * - **e3** — toasts, command bars. The single highest layer.
 *
 * Hover-lift on actionable cards: bump from e1 to e2 over the base
 * duration (180ms / ease-standard). Pressed: drop back to e1.
 */
export const ELEVATION_INTENT = {
  e0: "page background — no decoration",
  e1: "card on page — default",
  e2: "popover / dropdown / modal — floating",
  e3: "toast / command bar — highest layer",
} as const;
