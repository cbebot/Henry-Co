"use client";

/**
 * CountUp — live stat counter (Lagos motion doctrine, 2026-07-08).
 *
 * Counts from 0 to `value` when it enters the viewport, ~700ms, with a
 * DECELERATING ease (the signature curve's ease-out character) so the
 * number "settles" rather than ticking linearly. Formatting is honest:
 * decimals preserved (4.7 counts as 4.7, not 5), optional prefix/suffix,
 * tabular numerals so layout never shifts.
 *
 * Reduced-motion (or no IntersectionObserver): renders the final value
 * immediately — the data is never animation-gated.
 */

import { useEffect, useRef, useState } from "react";

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function CountUp({
  value,
  durationMs = 700,
  prefix = "",
  suffix = "",
  className,
}: {
  value: number;
  durationMs?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const decimals = (String(value).split(".")[1] ?? "").length;
  const ref = useRef<HTMLSpanElement | null>(null);
  const [display, setDisplay] = useState<number | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || typeof IntersectionObserver === "undefined") {
      setDisplay(value);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting) || startedRef.current) return;
        startedRef.current = true;
        io.disconnect();
        const startedAt = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - startedAt) / durationMs);
          setDisplay(value * easeOutCubic(t));
          if (t < 1) requestAnimationFrame(tick);
          else setDisplay(value);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.5 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [value, durationMs]);

  // SSR + pre-observation: render the FINAL value so no-JS users, crawlers,
  // and reduced-motion users always see the truth; the count-up only ever
  // replays from 0 after the observer confirms visibility.
  const shown = display ?? value;

  return (
    <span ref={ref} className={className} style={{ fontVariantNumeric: "tabular-nums" }}>
      {prefix}
      {shown.toFixed(decimals)}
      {suffix}
    </span>
  );
}
