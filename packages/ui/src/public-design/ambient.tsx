"use client";

/**
 * AmbientGlow — the ONE sitewide ambient light source (Lagos motion
 * doctrine, 2026-07-08).
 *
 * A single soft radial glow, warm accent-tinted, anchored top-left of its
 * section, with a barely-perceptible 12s breathing loop so the surface
 * never feels frozen — and a CURSOR-AWARE drift: the glow center lerps
 * 8% of the pointer offset with a slow ~300ms follow, the Linear/Vercel
 * "alive without flashy" treatment.
 *
 * One component, one opacity, one blur — every division reuses THIS so
 * ambience reads as one company. Pure CSS + one rAF loop (pauses when
 * the tab is hidden and when the section leaves the viewport).
 * Reduced-motion: static glow, no drift, no breathing. Never intercepts
 * pointer events; paints behind content (z-0; give the parent
 * `relative` and the content `relative z-10` or higher).
 */

import { useEffect, useRef } from "react";
import { cn } from "../cn";

export function AmbientGlow({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    let raf = 0;
    let targetX = 0;
    let targetY = 0;
    let x = 0;
    let y = 0;
    let visible = true;

    const onPointer = (event: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      // Offset from the section center, scaled to the doctrine's subtle 8%.
      targetX = (event.clientX - (rect.left + rect.width / 2)) * 0.08;
      targetY = (event.clientY - (rect.top + rect.height / 2)) * 0.08;
    };

    const tick = () => {
      // Slow lerp (~300ms to settle at 60fps with factor 0.06).
      x += (targetX - x) * 0.06;
      y += (targetY - y) * 0.06;
      node.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      if (visible) raf = requestAnimationFrame(tick);
    };

    const io =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver((entries) => {
            visible = entries.some((entry) => entry.isIntersecting);
            if (visible) {
              cancelAnimationFrame(raf);
              raf = requestAnimationFrame(tick);
            }
          })
        : null;
    io?.observe(node);

    window.addEventListener("pointermove", onPointer, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("pointermove", onPointer);
      cancelAnimationFrame(raf);
      io?.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className={cn(
        "home-breathe pointer-events-none absolute -left-24 -top-24 z-0 h-[28rem] w-[28rem] rounded-full",
        className,
      )}
      style={{
        background:
          "radial-gradient(closest-side, color-mix(in srgb, var(--home-accent) 16%, transparent), transparent 70%)",
        filter: "blur(40px)",
      }}
    />
  );
}
