import { useCallback, useEffect, useRef, useState } from "react";
import {
  henrycoSwipeCommitTransition,
  henrycoSwipeRevealTransition,
  henrycoSwipeSettleTransition,
  LONG_PRESS_FALLBACK_MS,
  SWIPE_COMMIT_VELOCITY_PX_PER_MS,
  SWIPE_DIRECTION_LOCK_PX,
  SWIPE_PRIMARY_REVEAL_PX,
  SWIPE_SECONDARY_REVEAL_PX,
} from "../motion";

export type SwipeAction = "primary-left" | "secondary-left" | "primary-right";

export type SwipeRevealCallbacks = {
  /**
   * Optimistic UI commit. Must update local state synchronously and
   * return a Promise that resolves when the server confirms or rejects.
   * On rejection, the hook does not auto-rollback — the consumer's data
   * source is the source of truth and a `refresh()` will reconcile.
   */
  onAction: (action: SwipeAction) => Promise<void>;
  /**
   * Optional: called after the user releases the gesture but before any
   * action commits. Useful for haptic feedback on mobile.
   */
  onArmed?: (action: SwipeAction | null) => void;
};

export type SwipeRevealState = {
  /** Current horizontal offset in px (negative = left, positive = right). */
  offsetPx: number;
  /** The action that would commit if the user released right now. */
  armed: SwipeAction | null;
  /** True while a server-side action is in flight. */
  busy: boolean;
  /** Pre-composed transition string for the card transform. */
  transition: string;
  /** True if the long-press fallback (reduced-motion) is active. */
  longPressActive: boolean;
};

export type SwipeRevealHandlers = {
  onPointerDown: (event: React.PointerEvent<HTMLElement>) => void;
  onPointerMove: (event: React.PointerEvent<HTMLElement>) => void;
  onPointerUp: (event: React.PointerEvent<HTMLElement>) => void;
  onPointerCancel: (event: React.PointerEvent<HTMLElement>) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => void;
};

const NOOP_PROMISE = Promise.resolve();

function detectReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Premium swipe-reveal gesture for notification rows.
 *
 *   left swipe past PRIMARY_REVEAL_PX  → archive (primary-left)
 *   left swipe past SECONDARY_REVEAL_PX → delete  (secondary-left)
 *   right swipe past PRIMARY_REVEAL_PX → mark-read toggle (primary-right)
 *
 * Velocity above SWIPE_COMMIT_VELOCITY_PX_PER_MS commits whichever action
 * is currently armed regardless of distance.
 *
 * prefers-reduced-motion replaces the gesture with a long-press (650 ms)
 * that opens the static action tray. No transform animation.
 *
 * Keyboard equivalents:
 *   r → primary-right (read toggle)
 *   a → primary-left  (archive)
 *   d → secondary-left (delete)
 *   Esc → cancel any pending reveal
 *
 * Pure React + DOM. Zero runtime dependencies.
 */
export function useSwipeReveal({
  onAction,
  onArmed,
}: SwipeRevealCallbacks): {
  state: SwipeRevealState;
  handlers: SwipeRevealHandlers;
  reset: () => void;
} {
  const [offsetPx, setOffsetPx] = useState(0);
  const [armed, setArmed] = useState<SwipeAction | null>(null);
  const [busy, setBusy] = useState(false);
  const [longPressActive, setLongPressActive] = useState(false);
  const [transition, setTransition] = useState<string>("");

  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const startTimeRef = useRef(0);
  const lockedRef = useRef<"horizontal" | "vertical" | null>(null);
  const trackingRef = useRef(false);
  const reducedMotionRef = useRef(false);
  const longPressTimerRef = useRef<number | null>(null);
  const lastArmedRef = useRef<SwipeAction | null>(null);

  useEffect(() => {
    reducedMotionRef.current = detectReducedMotion();
    if (typeof window !== "undefined" && window.matchMedia) {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      const handler = (event: MediaQueryListEvent) => {
        reducedMotionRef.current = event.matches;
      };
      mq.addEventListener?.("change", handler);
      return () => mq.removeEventListener?.("change", handler);
    }
    return undefined;
  }, []);

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current !== null) {
        window.clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    };
  }, []);

  const computeArmed = useCallback((dx: number): SwipeAction | null => {
    if (dx <= -SWIPE_SECONDARY_REVEAL_PX) return "secondary-left";
    if (dx <= -SWIPE_PRIMARY_REVEAL_PX) return "primary-left";
    if (dx >= SWIPE_PRIMARY_REVEAL_PX) return "primary-right";
    return null;
  }, []);

  const reset = useCallback(() => {
    setOffsetPx(0);
    setArmed(null);
    setLongPressActive(false);
    setTransition(henrycoSwipeSettleTransition);
    lockedRef.current = null;
    trackingRef.current = false;
    lastArmedRef.current = null;
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const commit = useCallback(
    async (action: SwipeAction) => {
      setBusy(true);
      setTransition(henrycoSwipeCommitTransition);
      try {
        await onAction(action);
      } finally {
        setBusy(false);
        reset();
      }
    },
    [onAction, reset],
  );

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (busy) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;
      trackingRef.current = true;
      startXRef.current = event.clientX;
      startYRef.current = event.clientY;
      startTimeRef.current = performance.now();
      lockedRef.current = null;
      setTransition("");
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // ignore browsers without pointer capture
      }
      if (reducedMotionRef.current) {
        if (longPressTimerRef.current !== null) {
          window.clearTimeout(longPressTimerRef.current);
        }
        longPressTimerRef.current = window.setTimeout(() => {
          setLongPressActive(true);
          longPressTimerRef.current = null;
        }, LONG_PRESS_FALLBACK_MS);
      }
    },
    [busy],
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (!trackingRef.current || busy) return;
      const dx = event.clientX - startXRef.current;
      const dy = event.clientY - startYRef.current;
      if (reducedMotionRef.current) {
        if (Math.abs(dx) + Math.abs(dy) > SWIPE_DIRECTION_LOCK_PX) {
          if (longPressTimerRef.current !== null) {
            window.clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
          }
        }
        return;
      }
      if (lockedRef.current === null) {
        if (Math.abs(dx) + Math.abs(dy) < SWIPE_DIRECTION_LOCK_PX) return;
        lockedRef.current = Math.abs(dx) > Math.abs(dy) ? "horizontal" : "vertical";
      }
      if (lockedRef.current !== "horizontal") return;
      event.preventDefault();
      const clamped = Math.max(-SWIPE_SECONDARY_REVEAL_PX * 1.5, Math.min(SWIPE_PRIMARY_REVEAL_PX * 1.5, dx));
      setOffsetPx(clamped);
      setTransition("");
      const next = computeArmed(clamped);
      if (next !== lastArmedRef.current) {
        lastArmedRef.current = next;
        setArmed(next);
        onArmed?.(next);
      }
    },
    [busy, computeArmed, onArmed],
  );

  const onPointerUp = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (!trackingRef.current) return;
      trackingRef.current = false;
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        // ignore
      }
      if (reducedMotionRef.current) {
        if (longPressTimerRef.current !== null) {
          window.clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
        return;
      }
      const elapsedMs = Math.max(1, performance.now() - startTimeRef.current);
      const dx = event.clientX - startXRef.current;
      const velocity = Math.abs(dx) / elapsedMs;
      const decided = computeArmed(dx);
      if (decided !== null) {
        void commit(decided);
        return;
      }
      if (velocity >= SWIPE_COMMIT_VELOCITY_PX_PER_MS && lockedRef.current === "horizontal") {
        const inferred: SwipeAction =
          dx < 0 ? "primary-left" : "primary-right";
        void commit(inferred);
        return;
      }
      setTransition(henrycoSwipeSettleTransition);
      setOffsetPx(0);
      setArmed(null);
      lastArmedRef.current = null;
    },
    [commit, computeArmed],
  );

  const onPointerCancel = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (!trackingRef.current) return;
      trackingRef.current = false;
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        // ignore
      }
      setTransition(henrycoSwipeSettleTransition);
      setOffsetPx(0);
      setArmed(null);
      lastArmedRef.current = null;
      if (longPressTimerRef.current !== null) {
        window.clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    },
    [],
  );

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      if (busy) return;
      const key = event.key.toLowerCase();
      if (key === "r") {
        event.preventDefault();
        void commit("primary-right");
        return;
      }
      if (key === "a") {
        event.preventDefault();
        void commit("primary-left");
        return;
      }
      if (key === "d") {
        event.preventDefault();
        void commit("secondary-left");
        return;
      }
      if (key === "escape") {
        event.preventDefault();
        reset();
      }
    },
    [busy, commit, reset],
  );

  void NOOP_PROMISE;

  return {
    state: {
      offsetPx,
      armed,
      busy,
      transition: transition || henrycoSwipeRevealTransition,
      longPressActive,
    },
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
      onKeyDown,
    },
    reset,
  };
}
