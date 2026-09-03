/**
 * @henryco/ui/mobile — mobile consistency primitives.
 *
 * V3-09 — Foundation: Mobile Consistency. The five APIs here cover
 * the workspace-wide mobile concerns that previously lived per-app
 * (safe-area insets, soft-keyboard tracking, Android back-close,
 * scroll-direction driving auto-hide nav):
 *
 *   - `safeAreaInsetClass` / `safeAreaInsetStyle` / `SAFE_AREA_UTILITIES`
 *   - `useKeyboardAvoidance({ surface })`
 *   - `useAndroidBackClose(isOpen, onClose, { surface })`
 *   - `emitModalBackdropTap(surface)`
 *   - `useScrollDirection(threshold)`
 *
 * DESIGN-01 (Marketplace Profile Drawer rebuild) adds:
 *
 *   - `BottomSheet` — bottom-anchored modal sheet primitive composing
 *     `useFocusTrap`, `useAndroidBackClose`, `useReducedMotion` and
 *     `safe-area` helpers. Body scroll lock with iOS-Safari scroll
 *     restoration on close (the "open at bottom of page" fix).
 *
 * The full V3-09 audit lives under `docs/v3/mobile-*`. Wave B.1
 * conductor merges this batch as the third stack atop V3-10 + V3-07.
 */

export {
  safeAreaInsetClass,
  safeAreaInsetStyle,
  SAFE_AREA_UTILITIES,
  type SafeAreaSides,
} from "./safe-area";
export {
  useKeyboardAvoidance,
  type KeyboardAvoidanceState,
  type UseKeyboardAvoidanceOptions,
} from "./use-keyboard-avoidance";
export {
  useAndroidBackClose,
  emitModalBackdropTap,
  suppressSentinelPop,
  suppressSentinelPopForNavLink,
  type UseAndroidBackCloseOptions,
} from "./use-android-back-close";
export {
  useScrollDirection,
  type ScrollDirection,
} from "./use-scroll-direction";
export {
  BottomSheet,
  type BottomSheetProps,
  type BottomSheetCloseReason,
} from "./bottom-sheet";
