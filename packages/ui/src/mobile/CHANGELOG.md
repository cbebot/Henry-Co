# @henryco/ui/mobile — changelog

## DESIGN-01 — Marketplace Profile Drawer rebuild

Added `BottomSheet` — bottom-anchored modal sheet primitive.

API:
- `open: boolean`
- `onClose: (reason: BottomSheetCloseReason) => void`
- `children: ReactNode`
- `labelledBy?: string` / `describedBy?: string` / `ariaLabel?: string`
- `id?: string` — surface id for trigger `aria-controls`
- `surface?: string` — telemetry surface label
- `enableSwipeDismiss?: boolean` — default `true`, auto-disabled under `prefers-reduced-motion: reduce`
- `lockBodyScroll?: boolean` — default `true`, uses the iOS-Safari `position: fixed; top: -scrollY` technique with restoration on close
- `showHandle?: boolean` — default `true` (pill grabber)
- `maxHeight?: string` — default `"92dvh"`
- `className?: string`
- `initialFocusRef?: RefObject<HTMLElement | null>`
- `triggerRef?: RefObject<HTMLElement | null>` — focus restoration target

Close reasons (`BottomSheetCloseReason`):
- `tap_close` / `tap_backdrop` / `escape_key` / `android_back` / `swipe_down` / `programmatic`

Behavioral contract:
- Portal-mounts at `document.body`.
- Swipe-to-dismiss threshold: 80px OR velocity > 0.6 px/ms.
- Open animation 280ms, close animation 220ms, easing `cubic-bezier(0.32, 0.72, 0, 1)`.
- `data-state="open" | "opening" | "closing"` exposed on the surface.
- Auto-wires `useAndroidBackClose` (hardware back) and `useFocusTrap` (keyboard).

Backward compatible — net-new file, no existing import paths changed.

## V3-09 — Foundation: Mobile Consistency

Initial primitives — `safeAreaInsetClass`/`safeAreaInsetStyle`,
`useKeyboardAvoidance`, `useAndroidBackClose`/`emitModalBackdropTap`,
`useScrollDirection`.
