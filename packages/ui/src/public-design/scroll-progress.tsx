"use client";

/**
 * ScrollProgress — a hairline reading-progress bar at the very top of the
 * viewport (Lagos motion doctrine, 2026-07-08). Accent-toned, 2px,
 * scaleX-driven (no layout, no repaint storms — one rAF-throttled scroll
 * listener writing a transform). Scroll-linked position is NOT an
 * animation, so it stays useful under reduced-motion; only easing-based
 * embellishment is omitted. Renders nothing on pages too short to scroll.
 */

import { useEffect, useRef } from "react";
import { cn } from "../cn";

export function ScrollProgress({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const doc = document.documentElement;
      const total = doc.scrollHeight - doc.clientHeight;
      // Short page → nothing to report; keep it invisible.
      if (total < doc.clientHeight * 0.5) {
        node.style.opacity = "0";
        return;
      }
      node.style.opacity = "1";
      const progress = Math.min(1, Math.max(0, (window.scrollY || 0) / total));
      node.style.transform = `scaleX(${progress.toFixed(4)})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className={cn(
        "fixed inset-x-0 top-0 z-[60] h-0.5 origin-left bg-[color:var(--home-accent)] opacity-0",
        className,
      )}
      style={{ transform: "scaleX(0)" }}
    />
  );
}
