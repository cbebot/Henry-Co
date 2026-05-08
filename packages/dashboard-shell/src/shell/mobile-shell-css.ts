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
` as const;
