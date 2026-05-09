/**
 * @henryco/dashboard-shell — mobile-shell CSS rules.
 *
 * DASH-7 introduces a fixed-bottom action bar at < 768px and hides the
 * desktop rail at the same breakpoint. The shell renders almost
 * everything via inline `style`, so media queries have to live in a
 * `<style>` block. Host apps mount this string the same way they mount
 * `MOTION_KEYFRAMES_CSS`:
 *
 *   import { MOBILE_SHELL_CSS, MOTION_KEYFRAMES_CSS } from "@henryco/dashboard-shell";
 *   ...
 *   <style dangerouslySetInnerHTML={{ __html: MOTION_KEYFRAMES_CSS + MOBILE_SHELL_CSS }} />
 *
 * The selectors use class hooks (`hc-bottom-action-bar`,
 * `hc-workspace-rail`) so the rules don't fight the inline styles each
 * component emits.
 */

import { SPACING } from "../tokens/spacing";

export const MOBILE_BREAKPOINT_PX = 768;
export const TABLET_BREAKPOINT_PX = 1024;

/**
 * The CSS string. Host apps mount it once at the layout root.
 *
 * Rules:
 *   1. WorkspaceRail (`.hc-workspace-rail`) — visible at >= 768px;
 *      hidden below. The rail's inline style sets it visible by
 *      default; this rule overrides on mobile.
 *
 *   2. BottomActionBar (`.hc-bottom-action-bar`) — hidden at >= 768px;
 *      visible below. The bar's inline style sets it visible by
 *      default; this rule overrides on tablet/desktop.
 *
 *   3. BottomActionBar spacer (`.hc-bottom-action-bar-spacer`) — same
 *      visibility as the bar. Adds bottom padding so fixed-position
 *      content above the bar stays clear.
 *
 *   4. Sticky modal headers — `.hc-sticky-close-header` is the sticky
 *      top inside `BottomSheet` / `Drawer` so the close button stays in
 *      the thumb zone even as the body scrolls.
 *
 *   5. Modal body overscroll containment — `.hc-modal-body` applies
 *      `overscroll-behavior-y: contain` so swipe doesn't scroll the
 *      page underneath.
 */
export const MOBILE_SHELL_CSS = `
.hc-workspace-rail { display: flex; }
.hc-bottom-action-bar { display: none; }
.hc-bottom-action-bar-spacer { display: none; }

@media (max-width: ${MOBILE_BREAKPOINT_PX - 1}px) {
  .hc-workspace-rail { display: none !important; }
  .hc-bottom-action-bar { display: flex !important; }
  .hc-bottom-action-bar-spacer { display: block !important; }
}

.hc-sticky-close-header {
  position: sticky;
  top: 0;
  z-index: 5;
  background-color: inherit;
  /* The sheet/drawer body's surface bleeds through, so the sticky
     header reads as a continuation of the body, not a banner. Each
     consumer sets its own margin/padding inline so the close button
     aligns with the consumer's body padding. */
}

.hc-modal-body {
  overscroll-behavior-y: contain;
  -webkit-overflow-scrolling: touch;
}

/* DASH-7 — main content padding so content doesn't tuck under the bar. */
@media (max-width: ${MOBILE_BREAKPOINT_PX - 1}px) {
  .hc-shell-main {
    padding-bottom: calc(${SPACING.chrome.bottomBarHeight} + env(safe-area-inset-bottom, 0px) + 0.5rem);
  }
}

/* DASH-7 — press-scale microinteraction on BottomActionBar anchors.
   Inline style doesn't support pseudo-classes; this rule lives here so
   the haptic-style scale fires on tap. Reduced-motion users skip the
   transform entirely (no scale either way). */
.hc-bottom-action-bar [role="link"],
.hc-bottom-action-bar a,
.hc-bottom-action-bar button {
  transition: transform 120ms cubic-bezier(0.4, 0, 0.2, 1), color 160ms ease;
  -webkit-tap-highlight-color: transparent;
}
.hc-bottom-action-bar a:active,
.hc-bottom-action-bar button:active {
  transform: scale(0.96);
}

@media (prefers-reduced-motion: reduce) {
  .hc-bottom-action-bar a,
  .hc-bottom-action-bar button {
    transition: color 160ms ease;
  }
  .hc-bottom-action-bar a:active,
  .hc-bottom-action-bar button:active {
    transform: none;
  }
}

/* DASH-7 — sheet max-height also tracks dvh so iOS Safari's collapsing
   address bar doesn't push the bottom sheet below the visible viewport. */
.hc-modal-body {
  max-height: 90dvh;
}

/* DASH-7 — premium polish: 2-line clamp on Modules drawer entry
   descriptions. Inline style can't express -webkit-line-clamp without
   awkward type assertions, so the rule lives here. */
.hc-module-entry-description {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* DASH-7 — premium polish: subtle gold radial gradient on the More
   sheet body, echoing the DASH-5 palette dialog corner. Light-touch —
   visible only on the upper portion of the sheet, fading into surface. */
.hc-more-sheet-body {
  background:
    radial-gradient(
      ellipse 60% 40% at 90% 0%,
      rgba(201, 162, 39, 0.06) 0%,
      transparent 75%
    ),
    transparent;
}

/* iOS auto-zoom prevention — the only reliable cure is a computed
   font-size of at least 16px on the focused control. We scope the rule
   to mobile so desktop typography is unaffected, and only target real
   text-entry controls so radios/checkboxes don't grow. The "max(16px,
   1em)" form keeps the rule deferential: callers that explicitly want
   17px or 18px on a particular field still win. */
@media (max-width: ${MOBILE_BREAKPOINT_PX - 1}px) {
  .hc-shell-main input[type="text"],
  .hc-shell-main input[type="search"],
  .hc-shell-main input[type="email"],
  .hc-shell-main input[type="password"],
  .hc-shell-main input[type="number"],
  .hc-shell-main input[type="tel"],
  .hc-shell-main input[type="url"],
  .hc-shell-main input:not([type]),
  .hc-shell-main textarea,
  .hc-shell-main select {
    font-size: max(16px, 1em);
  }
  /* Also normalise visible "search" UIs that live outside .hc-shell-main
     (palette overlays mount at the body root), so the iOS zoom fix
     applies consistently across every dashboard text-entry surface. */
  body input[data-hc-no-zoom],
  body textarea[data-hc-no-zoom] {
    font-size: max(16px, 1em);
  }
}

/* Search-input motion: a calm 160ms ease on focus so the keyboard
   summon doesn't feel jagged. Honours prefers-reduced-motion. */
.hc-shell-main input,
.hc-shell-main textarea,
.hc-shell-main select {
  transition: box-shadow 160ms cubic-bezier(0.4, 0, 0.2, 1),
              border-color 160ms cubic-bezier(0.4, 0, 0.2, 1),
              background-color 160ms cubic-bezier(0.4, 0, 0.2, 1);
}
@media (prefers-reduced-motion: reduce) {
  .hc-shell-main input,
  .hc-shell-main textarea,
  .hc-shell-main select {
    transition: none;
  }
}
` as const;
