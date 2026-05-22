/**
 * @henryco/ui/mobile/safe-area — safe-area inset helpers.
 *
 * V3-09(S1). Single source of truth for `env(safe-area-inset-*)`
 * usage across the platform. Two APIs:
 *
 *   1. `safeAreaInsetClass({ top, bottom, left, right })` — returns
 *      a space-separated string of utility class names (defined in
 *      `packages/ui/src/styles/globals.css`). Use when you want the
 *      Tailwind / utility-class flow.
 *
 *   2. `safeAreaInsetStyle({ top, bottom, left, right })` — returns
 *      a React style object using `env(safe-area-inset-*, 0px)`. Use
 *      when you want inline-style flow (per-component styling that
 *      already uses inline style, e.g. dashboard-shell tokens).
 *
 * Why both: large parts of the dashboard-shell + chat-composer use
 * inline style (CSS-in-JS via style prop) — adding utility class
 * names would split the source-of-truth in two. Both APIs route to
 * the same `env(safe-area-inset-*)` family.
 *
 * Coverage:
 *   - top:    status bar (Safari notch, Dynamic Island)
 *   - bottom: home indicator + iOS Safari accessory bar
 *   - left/right: landscape orientations + foldables
 *
 * Tested baseline: iOS Safari 17+, Chrome iOS 120+, Chrome Android
 * 120+, Samsung Internet 24+. Non-supporting UAs receive 0px from
 * the `env()` fallback (CSS spec) — no JS feature detection needed.
 */

export type SafeAreaSides = {
  /** Apply safe-area-inset-top via padding-top. */
  top?: boolean;
  /** Apply safe-area-inset-bottom via padding-bottom. */
  bottom?: boolean;
  /** Apply safe-area-inset-left via padding-left. */
  left?: boolean;
  /** Apply safe-area-inset-right via padding-right. */
  right?: boolean;
};

/**
 * Return a className string referencing the utility classes defined
 * in `packages/ui/src/styles/globals.css`. The classes resolve to
 * `padding: env(safe-area-inset-*, 0px)` so non-notched / desktop
 * viewports receive 0 — no layout change.
 *
 * Example:
 *   `<header className={cn("sticky top-0", safeAreaInsetClass({ top: true }))}>`
 */
export function safeAreaInsetClass(sides: SafeAreaSides): string {
  const parts: string[] = [];
  if (sides.top) parts.push("hc-safe-top");
  if (sides.bottom) parts.push("hc-safe-bottom");
  if (sides.left) parts.push("hc-safe-left");
  if (sides.right) parts.push("hc-safe-right");
  return parts.join(" ");
}

/**
 * Return a React inline-style object that applies the requested
 * safe-area insets via `env(safe-area-inset-*, 0px)`. Adds to the
 * existing padding rather than replacing — callers should ensure
 * their existing style does NOT also set `padding{Top,Bottom,...}`.
 *
 * Example:
 *   `<div style={{ ...existingStyle, ...safeAreaInsetStyle({ bottom: true }) }} />`
 */
export function safeAreaInsetStyle(sides: SafeAreaSides): React.CSSProperties {
  const style: React.CSSProperties = {};
  if (sides.top) style.paddingTop = "env(safe-area-inset-top, 0px)";
  if (sides.bottom) style.paddingBottom = "env(safe-area-inset-bottom, 0px)";
  if (sides.left) style.paddingLeft = "env(safe-area-inset-left, 0px)";
  if (sides.right) style.paddingRight = "env(safe-area-inset-right, 0px)";
  return style;
}

/**
 * Returns a Tailwind-compatible className list as a tuple. Useful
 * when consumers want fine-grained control over which side maps to
 * which utility (e.g. `marginBottom` instead of `paddingBottom`).
 *
 * The four utilities are stable contract — they are documented in
 * `globals.css` and any change requires bumping V3-09.
 */
export const SAFE_AREA_UTILITIES = {
  top: "hc-safe-top",
  bottom: "hc-safe-bottom",
  left: "hc-safe-left",
  right: "hc-safe-right",
} as const;
