"use client";

/**
 * Magnetic — a subtle cursor-pull wrapper for PRIMARY CTAs only (Lagos
 * motion doctrine, 2026-07-08). Within a small proximity the child drifts
 * up to `strength` px (default 4 — a few px, never gimmicky) toward the
 * pointer on the signature curve, and springs back on leave.
 *
 * Pointer-only by design: touch devices and reduced-motion get a plain
 * wrapper (zero listeners, zero transforms). Never attach to more than
 * one element per view — magnetism marks THE primary action.
 */

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "../cn";

export function Magnetic({
  children,
  strength = 4,
  className,
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const fine =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine) return;

    node.style.transition = "transform 250ms var(--home-ease, cubic-bezier(0.22, 1, 0.36, 1))";

    const onMove = (event: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      const reach = Math.max(rect.width, rect.height) * 1.2;
      const distance = Math.hypot(dx, dy);
      if (distance > reach) {
        node.style.transform = "";
        return;
      }
      const pull = 1 - distance / reach;
      node.style.transform = `translate3d(${((dx / distance) * strength * pull).toFixed(1)}px, ${((dy / distance) * strength * pull).toFixed(1)}px, 0)`;
    };
    const onLeave = () => {
      node.style.transform = "";
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    node.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      node.removeEventListener("pointerleave", onLeave);
    };
  }, [strength]);

  return (
    <div ref={ref} className={cn("inline-flex", className)}>
      {children}
    </div>
  );
}
