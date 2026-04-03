// apps/hub/app/(site)/HubParticles.tsx
"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { useTheme } from "next-themes";

type Particle = { x: number; y: number; vx: number; vy: number; r: number };

export default function HubParticles() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const frame = useRef<number | null>(null);
  const { resolvedTheme } = useTheme();

  const palette = useMemo(() => {
    const dark = resolvedTheme === "dark";
    return {
      bgA: dark ? "rgba(0,0,0,0.0)" : "rgba(255,255,255,0.0)",
      dot: dark ? "rgba(255,255,255,0.60)" : "rgba(0,0,0,0.55)",
      line: dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)",
    };
  }, [resolvedTheme]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0;
    let H = 0;

    const particles: Particle[] = [];
    const targetCount = () => {
      const area = W * H;
      return Math.max(40, Math.min(160, Math.floor(area / 18000)));
    };

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      W = parent.clientWidth;
      H = parent.clientHeight;
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = targetCount();
      while (particles.length < count) {
        particles.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          r: 1 + Math.random() * 1.8,
        });
      }
      while (particles.length > count) particles.pop();
    };

    const step = () => {
      ctx.clearRect(0, 0, W, H);

      // dots
      ctx.fillStyle = palette.dot;
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -20) p.x = W + 20;
        if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20;
        if (p.y > H + 20) p.y = -20;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // lines
      ctx.strokeStyle = palette.line;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const max = 120;
          if (dist < max) {
            const alpha = 1 - dist / max;
            ctx.globalAlpha = 0.85 * alpha;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;

      frame.current = requestAnimationFrame(step);
    };

    resize();
    step();

    const onResize = () => resize();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [palette]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="absolute inset-0 h-full w-full"
      style={{ background: palette.bgA }}
    />
  );
}