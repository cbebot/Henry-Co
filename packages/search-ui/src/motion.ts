/**
 * Premium motion language for the cross-division search palette.
 *
 * Curves and durations follow the same intent as the notifications-ui
 * package: a recognizable house style across surfaces. The palette is
 * a foreground modal — open should feel deliberate (faster than a card
 * sheet), close should feel forgiving.
 */

export const henrycoCommandOpenCurve = "cubic-bezier(0.16, 1, 0.3, 1)";
export const henrycoCommandOpenMs = 180;

export const henrycoCommandCloseCurve = "cubic-bezier(0.4, 0.0, 0.6, 1)";
export const henrycoCommandCloseMs = 140;

/**
 * Mobile sheet motion — a top-down sheet that the user can also dismiss
 * via swipe-down. Slightly slower so the surface reads as physical.
 */
export const henrycoCommandSheetOpenMs = 280;
export const henrycoCommandSheetCloseMs = 220;
export const henrycoCommandSheetDismissPx = 80;

export const henrycoCommandOpenTransition =
  `transform ${henrycoCommandOpenMs}ms ${henrycoCommandOpenCurve}, opacity ${henrycoCommandOpenMs}ms ${henrycoCommandOpenCurve}`;
export const henrycoCommandCloseTransition =
  `transform ${henrycoCommandCloseMs}ms ${henrycoCommandCloseCurve}, opacity ${henrycoCommandCloseMs}ms ${henrycoCommandCloseCurve}`;
