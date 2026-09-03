"use client";

import { useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";

/**
 * Swipe-to-dismiss for a toast card. Follow-the-finger horizontal drag;
 * commit (fling out + dismiss) past a distance OR velocity threshold,
 * otherwise spring back. Shared by the signal and imperative toast cards.
 *
 * Design:
 *   - An 8px dead-zone before the drag "decides", so a tap still clicks the
 *     toast's link/close button instead of being eaten as a swipe.
 *   - While dragging we override transform/transition/opacity; when idle we
 *     emit ONLY `touchAction` so we never fight the entry animation or the
 *     hover-lift on a resting card.
 *   - Pointer events (not touch/mouse) so it works for mouse, touch and pen
 *     with one path; pointer capture keeps the drag glued to the card.
 */

const DECIDE_PX = 8; // dead-zone before a drag engages (taps pass through)
const COMMIT_PX = 96; // distance past which release dismisses
const COMMIT_VELOCITY = 0.5; // px/ms flick that dismisses regardless of distance
const FLING_PX = 480; // how far the committed card flies before removal
const FADE_OVER_PX = 360; // distance over which opacity fades to 0

export type ToastSwipe = {
  dragging: boolean;
  offset: number;
  handlers: {
    onPointerDown?: (e: ReactPointerEvent) => void;
    onPointerMove?: (e: ReactPointerEvent) => void;
    onPointerUp?: (e: ReactPointerEvent) => void;
    onPointerCancel?: (e: ReactPointerEvent) => void;
  };
  /** Merge LAST into the card's style so it overrides transform while active. */
  style: CSSProperties;
};

export function useToastSwipe(onDismiss: () => void, enabled = true): ToastSwipe {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef<number | null>(null);
  const startedAt = useRef(0);
  const decided = useRef(false);
  const committed = useRef(false);

  if (!enabled) {
    return { dragging: false, offset: 0, handlers: {}, style: { touchAction: "pan-y" } };
  }

  const onPointerDown = (e: ReactPointerEvent) => {
    if (committed.current) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    startX.current = e.clientX;
    startedAt.current = e.timeStamp;
    decided.current = false;
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    if (startX.current === null || committed.current) return;
    const delta = e.clientX - startX.current;
    if (!decided.current) {
      if (Math.abs(delta) < DECIDE_PX) return; // still a tap
      decided.current = true;
      setDragging(true);
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        /* setPointerCapture can throw if the pointer is already gone */
      }
    }
    setOffset(delta);
  };

  const end = (e: ReactPointerEvent) => {
    if (startX.current === null) return;
    const delta = e.clientX - startX.current;
    const dt = Math.max(1, e.timeStamp - startedAt.current);
    const velocity = Math.abs(delta) / dt;
    startX.current = null;
    if (decided.current && (Math.abs(delta) > COMMIT_PX || velocity > COMMIT_VELOCITY)) {
      committed.current = true;
      setOffset(delta >= 0 ? FLING_PX : -FLING_PX);
      // Let the fling animate, then hand off to the normal two-phase dismiss.
      window.setTimeout(onDismiss, 160);
      return;
    }
    setDragging(false);
    setOffset(0);
  };

  const active = decided.current || offset !== 0;
  const style: CSSProperties = active
    ? {
        transform: `translateX(${offset}px)`,
        transition: dragging
          ? "none"
          : "transform 200ms cubic-bezier(0.22,1,0.36,1), opacity 200ms ease",
        opacity: Math.max(0, 1 - Math.abs(offset) / FADE_OVER_PX),
        touchAction: "pan-y",
      }
    : { touchAction: "pan-y" };

  return {
    dragging,
    offset,
    handlers: { onPointerDown, onPointerMove, onPointerUp: end, onPointerCancel: end },
    style,
  };
}
