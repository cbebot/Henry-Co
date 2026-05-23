"use client";

/**
 * @henryco/ui/mobile/bottom-sheet — a bottom-anchored modal sheet.
 *
 * DESIGN-01 (Marketplace Profile Drawer Rebuild). The primitive is the
 * foundation for any mobile "open from the bottom" surface — workspace
 * nav, filter sheets, action menus. It composes on the V3-09 platform:
 *
 *   - `useAndroidBackClose` — hardware-back-to-close
 *   - `safeAreaInsetClass({ bottom })` — home-indicator safe area
 *   - `useFocusTrap` (`@henryco/ui/a11y`) — keyboard focus trap
 *   - `useReducedMotion` (`@henryco/ui/a11y`) — motion preference
 *
 * Behaviors:
 *   - Portal-mounts at `document.body` so the sheet escapes any
 *     `transform`/`overflow:hidden` ancestor.
 *   - Body scroll lock via `position: fixed; top: -<scrollY>px`. On
 *     close, `window.scrollTo(0, scrollY)` restores the exact pixel
 *     the user left — the "open at bottom of page" fix.
 *   - Spring-eased open/close (CSS cubic-bezier; no JS frame loop).
 *   - Swipe-down-to-dismiss with velocity + distance thresholds.
 *   - Backdrop tap closes; Esc closes; Android hardware back closes.
 *   - Reduced motion suppresses transitions AND swipe gestures.
 *   - `data-state="open" | "closing"` exposed for downstream styling.
 *
 * Backward compatible: net-new file, no existing import paths change.
 */

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { useFocusTrap, useReducedMotion } from "../a11y";
import { safeAreaInsetClass } from "./safe-area";
import { emitModalBackdropTap, useAndroidBackClose } from "./use-android-back-close";

export type BottomSheetCloseReason =
  | "tap_close"
  | "tap_backdrop"
  | "escape_key"
  | "android_back"
  | "swipe_down"
  | "programmatic";

export type BottomSheetProps = {
  /** Controls visibility. */
  open: boolean;
  /** Invoked when the sheet wants to close. Receives the reason. */
  onClose: (reason: BottomSheetCloseReason) => void;
  /** Sheet content (header, body, footer composition is up to caller). */
  children: ReactNode;
  /** id of an element used for `aria-labelledby` on the surface. */
  labelledBy?: string;
  /** id of an element used for `aria-describedby` on the surface. */
  describedBy?: string;
  /** Plain-text label used when no visible title element exists. */
  ariaLabel?: string;
  /** id assigned to the surface (used by triggers' `aria-controls`). */
  id?: string;
  /** Surface label for telemetry events (`backdrop_tap`, `android_back`). */
  surface?: string;
  /** Toggle swipe-to-dismiss. Default true; ignored when reduced motion. */
  enableSwipeDismiss?: boolean;
  /** Toggle iOS-Safari-safe body scroll lock. Default true. */
  lockBodyScroll?: boolean;
  /** Show the pill handle at the top. Default true. */
  showHandle?: boolean;
  /** Max height. Default `92dvh`. */
  maxHeight?: string;
  /** Optional class on the surface. */
  className?: string;
  /** Ref of the element to focus first when opened. */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** Trigger ref — focus is restored here on close (via focus trap). */
  triggerRef?: RefObject<HTMLElement | null>;
};

/**
 * Easing tuned to feel like Material spring-y emphasized standard.
 * Critically damped, slightly overshoots-by-zero — no bounce, no
 * lethargy. Used identically on open / close so the entrance and the
 * exit are mirror images at slightly different durations.
 */
const SPRING_EASE = "cubic-bezier(0.32, 0.72, 0, 1)";
const OPEN_MS = 280;
const CLOSE_MS = 220;
const BACKDROP_FADE_OUT_MS = 200;

/** Distance (px) past which a downward swipe triggers close. */
const SWIPE_DISMISS_DISTANCE = 80;
/** Velocity (px/ms) past which a downward flick triggers close even if short. */
const SWIPE_DISMISS_VELOCITY = 0.6;

export function BottomSheet({
  open,
  onClose,
  children,
  labelledBy,
  describedBy,
  ariaLabel,
  id,
  surface,
  enableSwipeDismiss = true,
  lockBodyScroll = true,
  showHandle = true,
  maxHeight = "92dvh",
  className,
  initialFocusRef,
  triggerRef,
}: BottomSheetProps) {
  const generatedId = useId();
  const surfaceId = id ?? `henryco-bottom-sheet-${generatedId}`;

  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const defaultCloseRef = useRef<HTMLButtonElement | null>(null);
  const scrollYRef = useRef<number>(0);
  // Tracks the in-flight swipe transform applied to the surface so
  // CSS transitions don't fight the gesture handler. When null, the
  // surface uses its class-driven transform.
  const [dragTranslateY, setDragTranslateY] = useState<number | null>(null);
  // Two-phase visibility: `mounted` keeps the DOM around for the exit
  // animation, `isExiting` flips the visual state to "closing".
  const [mounted, setMounted] = useState(open);
  const [isExiting, setIsExiting] = useState(false);
  const reducedMotion = useReducedMotion();

  // Mirror trigger ref via the focus-trap config. The focus-trap
  // package reads `restoreFocus` and calls `.focus()` on the
  // `previouslyFocused` element it captured. When a `triggerRef` is
  // supplied, we use a layout effect to ensure that ref is the
  // currently-focused element at the moment the trap activates, so
  // restoration lands on the right node.
  useLayoutEffect(() => {
    if (!open) return;
    triggerRef?.current?.focus({ preventScroll: true });
  }, [open, triggerRef]);

  // Mount/unmount choreography. `open: true` flips mounted immediately
  // and clears any exiting flag. `open: false` flips isExiting, then
  // unmounts after the CSS transition completes.
  useEffect(() => {
    if (open) {
      setMounted(true);
      setIsExiting(false);
      return;
    }
    if (!mounted) return;
    setIsExiting(true);
    const closeMs = reducedMotion ? 0 : CLOSE_MS;
    const t = window.setTimeout(() => {
      setMounted(false);
      setIsExiting(false);
      setDragTranslateY(null);
    }, closeMs);
    return () => window.clearTimeout(t);
  }, [open, mounted, reducedMotion]);

  // Body scroll lock + iOS-Safari scroll restoration. Cached on a ref
  // so the close path can restore the exact y the user opened from.
  useLayoutEffect(() => {
    if (!mounted || !open || !lockBodyScroll) return;
    if (typeof window === "undefined") return;
    const scrollY =
      window.scrollY ||
      window.pageYOffset ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0;
    scrollYRef.current = scrollY;
    const html = document.documentElement;
    const body = document.body;
    const priorBody = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
    };
    const priorHtml = {
      overflow: html.style.overflow,
      scrollBehavior: html.style.scrollBehavior,
    };
    // Lock html (covers browsers where html is the scrolling
    // element) AND pin body via the negative-top trick (covers
    // browsers where body is the scrolling element). The body's
    // negative `top` translates the document up so the user keeps
    // looking at the same content; the sheet (portal-mounted at
    // body, `position: fixed`) anchors to the viewport regardless.
    // Without locking both, the sheet can render at "top of page"
    // when the user opened from deep down a long page — the owner-
    // reported regression.
    html.style.overflow = "hidden";
    html.style.scrollBehavior = "auto";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = priorHtml.overflow;
      body.style.position = priorBody.position;
      body.style.top = priorBody.top;
      body.style.left = priorBody.left;
      body.style.right = priorBody.right;
      body.style.width = priorBody.width;
      body.style.overflow = priorBody.overflow;
      // Restore scroll position BEFORE re-enabling whatever scroll-
      // behavior the page had configured — some browsers animate
      // `scrollTo` if `scroll-behavior: smooth` is in effect.
      window.scrollTo(0, scrollY);
      html.style.scrollBehavior = priorHtml.scrollBehavior;
    };
  }, [mounted, open, lockBodyScroll]);

  // Focus trap — active while the sheet is open (not during exit).
  useFocusTrap(surfaceRef, {
    active: open && mounted,
    onEscape: useCallback(() => onClose("escape_key"), [onClose]),
    restoreFocus: true,
    initialFocus: initialFocusRef ?? (defaultCloseRef as RefObject<HTMLElement | null>),
  });

  // Android hardware back support — pushes a popstate sentinel while
  // open, pops on close.
  useAndroidBackClose(
    open && mounted,
    useCallback(() => onClose("android_back"), [onClose]),
    { surface },
  );

  // Swipe-to-dismiss touch handlers. Disabled when reduced motion is
  // active. The handle/header is the gesture surface — body scroll
  // remains independent.
  const swipeState = useRef<{ startY: number; startT: number } | null>(null);
  const swipeAllowed = enableSwipeDismiss && !reducedMotion;

  const onHandleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (!swipeAllowed) return;
      const t = e.touches[0];
      if (!t) return;
      swipeState.current = { startY: t.clientY, startT: performance.now() };
    },
    [swipeAllowed],
  );

  const onHandleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (!swipeAllowed || !swipeState.current) return;
      const t = e.touches[0];
      if (!t) return;
      const delta = t.clientY - swipeState.current.startY;
      if (delta > 0) {
        // Only drag downward; ignore upward pulls (would feel like a
        // glitch). Cap the visible translate so dragging halfway down
        // the screen still leaves the handle reachable.
        setDragTranslateY(Math.min(delta, window.innerHeight));
      } else if (dragTranslateY !== null) {
        setDragTranslateY(0);
      }
    },
    [swipeAllowed, dragTranslateY],
  );

  const onHandleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (!swipeAllowed || !swipeState.current) return;
      const start = swipeState.current;
      swipeState.current = null;
      const endTouch = e.changedTouches[0];
      if (!endTouch) {
        setDragTranslateY(null);
        return;
      }
      const delta = endTouch.clientY - start.startY;
      const elapsed = Math.max(performance.now() - start.startT, 1);
      const velocity = delta / elapsed;
      if (delta > SWIPE_DISMISS_DISTANCE || velocity > SWIPE_DISMISS_VELOCITY) {
        setDragTranslateY(null);
        onClose("swipe_down");
      } else {
        // Spring back to rest.
        setDragTranslateY(null);
      }
    },
    [swipeAllowed, onClose],
  );

  const handleBackdropClick = useCallback(() => {
    emitModalBackdropTap(surface);
    onClose("tap_backdrop");
  }, [onClose, surface]);

  const handleCloseClick = useCallback(() => onClose("tap_close"), [onClose]);

  // Compute the visual state. `data-state="open"` once we've mounted
  // AND a frame has settled — drives the CSS transition from the
  // initial 100% translate to 0.
  const [enterFrameSettled, setEnterFrameSettled] = useState(false);
  useEffect(() => {
    if (!mounted || isExiting) {
      setEnterFrameSettled(false);
      return;
    }
    const raf = window.requestAnimationFrame(() => setEnterFrameSettled(true));
    return () => window.cancelAnimationFrame(raf);
  }, [mounted, isExiting]);

  const surfaceStyle: CSSProperties = useMemo(() => {
    const transitionMs = reducedMotion ? 0 : isExiting ? CLOSE_MS : OPEN_MS;
    // While the user is dragging, suppress the transition so the
    // surface tracks the finger 1:1.
    const dragging = dragTranslateY !== null;
    const transition = dragging
      ? "transform 0ms linear"
      : `transform ${transitionMs}ms ${SPRING_EASE}`;
    let translate: string;
    if (dragging) {
      translate = `translate3d(0, ${dragTranslateY}px, 0)`;
    } else if (isExiting || !enterFrameSettled) {
      translate = `translate3d(0, 100%, 0)`;
    } else {
      translate = `translate3d(0, 0, 0)`;
    }
    return {
      transform: translate,
      transition,
      maxHeight,
    };
  }, [dragTranslateY, enterFrameSettled, isExiting, maxHeight, reducedMotion]);

  const backdropStyle: CSSProperties = useMemo(() => {
    const ms = reducedMotion ? 0 : isExiting ? BACKDROP_FADE_OUT_MS : OPEN_MS;
    const dragging = dragTranslateY !== null;
    // While dragging, the backdrop fades toward 0 alongside the drag
    // delta. ~200px to clear feels right against the 80px threshold.
    const dragOpacity = dragging
      ? Math.max(0, 1 - (dragTranslateY ?? 0) / 200)
      : null;
    const opacity = (() => {
      if (dragging) return dragOpacity ?? 0;
      if (isExiting || !enterFrameSettled) return 0;
      return 1;
    })();
    return {
      opacity,
      transition: dragging ? "opacity 0ms linear" : `opacity ${ms}ms ${SPRING_EASE}`,
    };
  }, [dragTranslateY, enterFrameSettled, isExiting, reducedMotion]);

  if (!mounted) return null;
  if (typeof document === "undefined") return null;

  const surfaceClassName = [
    "relative w-full max-w-[640px] flex flex-col",
    "rounded-t-[1.8rem] border-t",
    "border-[rgba(196,171,130,0.18)]",
    "bg-[rgba(8,12,20,0.96)]",
    "shadow-[0_-16px_48px_-16px_rgba(2,4,10,0.72)]",
    "ring-1 ring-inset ring-white/[0.04]",
    "outline-none",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const dataState = isExiting ? "closing" : enterFrameSettled ? "open" : "opening";

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      data-henryco-bottom-sheet=""
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        onClick={handleBackdropClick}
        className="absolute inset-0 cursor-default bg-[rgba(2,4,10,0.62)] backdrop-blur-md"
        style={backdropStyle}
      />
      {/* Surface */}
      <div
        ref={surfaceRef}
        id={surfaceId}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        aria-label={!labelledBy ? ariaLabel : undefined}
        data-state={dataState}
        tabIndex={-1}
        className={surfaceClassName}
        style={surfaceStyle}
      >
        {/* Gesture/handle region */}
        <div
          className="select-none touch-pan-y px-5 pt-2"
          onTouchStart={onHandleTouchStart}
          onTouchMove={onHandleTouchMove}
          onTouchEnd={onHandleTouchEnd}
          onTouchCancel={onHandleTouchEnd}
          role={showHandle ? "separator" : undefined}
          aria-orientation={showHandle ? "horizontal" : undefined}
        >
          {showHandle ? (
            <div
              aria-hidden="true"
              className="mx-auto mb-1 h-1 w-10 rounded-full bg-[rgba(246,240,222,0.22)]"
            />
          ) : null}
        </div>
        {/* Slot for caller content. Caller composes header + scroll body. */}
        {children}
        {/* Safe-area pad on the outer surface — children can render
            their own scroll container; this just ensures the home
            indicator never overlaps. */}
        <div aria-hidden="true" className={safeAreaInsetClass({ bottom: true })} />
      </div>
      {/* Fallback close button — present in the DOM so the focus trap
          always has a target even if the caller forgot to render one.
          Visually hidden; the caller renders its own visible close. */}
      <button
        ref={defaultCloseRef}
        type="button"
        onClick={handleCloseClick}
        className="sr-only"
        aria-label="Close"
      >
        Close
      </button>
    </div>,
    document.body,
  );
}
