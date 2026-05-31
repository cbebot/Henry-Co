"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  r: number; // radius, backing px
  vx: number; // drift, backing px/frame
  vy: number;
  a: number; // base alpha 0..1
};

/** Parse #RGB / #RRGGBB → [r,g,b]; falls back to brand gold on anything odd. */
function parseAccent(input: string): [number, number, number] {
  const hex = input.trim().replace(/^#/, "");
  const read = (s: string) => {
    const n = parseInt(s, 16);
    return Number.isFinite(n) ? n : NaN;
  };
  if (hex.length === 3) {
    const v: [number, number, number] = [
      read(hex[0] + hex[0]),
      read(hex[1] + hex[1]),
      read(hex[2] + hex[2]),
    ];
    if (v.every(Number.isFinite)) return v;
  }
  if (hex.length === 6) {
    const v: [number, number, number] = [
      read(hex.slice(0, 2)),
      read(hex.slice(2, 4)),
      read(hex.slice(4, 6)),
    ];
    if (v.every(Number.isFinite)) return v;
  }
  return [201, 162, 39]; // #C9A227
}

/**
 * HomeAmbientField — the lazy-loaded, theme-decoupled depth layer behind
 * The Standard. A single 2D canvas of accent-tinted points across three
 * implicit depth bands: each point's `z` drives its size, brightness AND drift
 * speed together, so parallax (not real 3D) reads as depth. Deliberately not
 * WebGL — this is the company's front door, so the ambient must be near-free.
 *
 * Mounted only by `home-ambient.tsx` once motion + a wide viewport + no
 * data-saver are confirmed, so it never re-checks those here. It caps DPR,
 * scales density to area, and pauses its rAF loop when the tab is hidden.
 */
export default function HomeAmbientField({ accent }: { accent: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const [ar, ag, ab] = parseAccent(accent);
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    let width = 1;
    let height = 1;
    let particles: Particle[] = [];
    let raf = 0;
    let running = true;

    const seed = (cssW: number, cssH: number) => {
      const count = Math.min(140, Math.round((cssW * cssH) / 9000));
      particles = Array.from({ length: count }, () => {
        const z = Math.random(); // 0 far → 1 near
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          r: (0.5 + z * 1.6) * dpr,
          vx: (0.05 + z * 0.16) * dpr,
          vy: (-0.02 - z * 0.05) * dpr,
          a: 0.1 + z * 0.4,
        };
      });
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, Math.floor(rect.width * dpr));
      height = Math.max(1, Math.floor(rect.height * dpr));
      canvas.width = width;
      canvas.height = height;
      seed(rect.width, rect.height);
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x > width + 4) p.x = -4;
        if (p.y < -4) p.y = height + 4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${ar}, ${ag}, ${ab}, ${p.a})`;
        ctx.fill();
      }
      if (running) raf = requestAnimationFrame(draw);
    };

    const onVisibility = () => {
      const next = document.visibilityState === "visible";
      if (next === running) return;
      running = next;
      cancelAnimationFrame(raf);
      if (running) raf = requestAnimationFrame(draw);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    raf = requestAnimationFrame(draw);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [accent]);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />;
}
