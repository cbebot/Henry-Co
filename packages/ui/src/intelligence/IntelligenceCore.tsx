"use client";

/**
 * IntelligenceCore — the arc-reactor core of the founder command portal.
 *
 * A HUD reactor drawn in gold on onyx: a radar dial of tick marks, a sweeping
 * scanner arc, counter-rotating rings, a reactive polar waveform, and a pulsing
 * central well. It responds to what the assistant is doing — idle it breathes,
 * listening it ripples wide, thinking it spins fast, speaking it undulates.
 *
 * Pure presentation, synthetic (no mic capture — no permission tangle with
 * SpeechRecognition). Reduced-motion holds a calm settled frame.
 */

import { useEffect, useRef } from "react";

export type CoreMode = "idle" | "listening" | "thinking" | "speaking";

const TARGET: Record<CoreMode, { energy: number; speed: number; spin: number }> = {
  idle: { energy: 0.16, speed: 0.5, spin: 0.12 },
  listening: { energy: 0.74, speed: 1.4, spin: 0.5 },
  thinking: { energy: 0.52, speed: 2.2, spin: 1.1 },
  speaking: { energy: 0.92, speed: 1.5, spin: 0.35 },
};

const GOLD = "201, 162, 39";
const GOLD_BRIGHT = "246, 228, 166";

export function IntelligenceCore({
  mode = "idle",
  size = 300,
  className,
}: {
  mode?: CoreMode;
  size?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const modeRef = useRef<CoreMode>(mode);
  modeRef.current = mode;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce =
      typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const R = size * 0.42; // outer radius

    let energy = TARGET[modeRef.current].energy;
    let speed = TARGET[modeRef.current].speed;
    let spin = TARGET[modeRef.current].spin;
    let raf = 0;
    const start = performance.now();

    const drawTicks = (radius: number, count: number, len: number, rot: number, alpha: number) => {
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + rot;
        const inner = radius - len;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
        ctx.lineTo(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius);
        // Every 5th tick brighter (dial major marks).
        ctx.strokeStyle = `rgba(${GOLD}, ${(i % 5 === 0 ? alpha * 1.6 : alpha)})`;
        ctx.lineWidth = i % 5 === 0 ? 1.4 : 0.8;
        ctx.stroke();
      }
    };

    const ring = (radius: number, alpha: number, width: number) => {
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${GOLD}, ${alpha})`;
      ctx.lineWidth = width;
      ctx.stroke();
    };

    const draw = (now: number) => {
      const t = (now - start) / 1000;
      const target = TARGET[modeRef.current];
      const k = reduce ? 1 : 0.06;
      energy += (target.energy - energy) * k;
      speed += (target.speed - speed) * k;
      spin += (target.spin - spin) * k;
      const rot = reduce ? 0 : t * spin;

      ctx.clearRect(0, 0, size, size);

      // Static + rotating dial rings.
      ring(R, 0.35 + energy * 0.25, 1);
      ring(R * 0.86, 0.16, 1);
      drawTicks(R * 0.99, 60, R * 0.05, rot, 0.28 + energy * 0.3);
      drawTicks(R * 0.8, 30, R * 0.035, -rot * 1.6, 0.2);

      // Sweeping scanner arc (the radar sweep) — a bright short arc that rotates.
      const sweep = rot * 2.2;
      const sweepGrad = ctx.createConicGradient
        ? ctx.createConicGradient(sweep, cx, cy)
        : null;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.92, sweep, sweep + Math.PI * 0.32);
      if (sweepGrad) {
        sweepGrad.addColorStop(0, `rgba(${GOLD_BRIGHT}, ${0.5 + energy * 0.4})`);
        sweepGrad.addColorStop(0.12, `rgba(${GOLD}, 0)`);
        ctx.strokeStyle = sweepGrad;
      } else {
        ctx.strokeStyle = `rgba(${GOLD_BRIGHT}, ${0.4 + energy * 0.4})`;
      }
      ctx.lineWidth = 2.4;
      ctx.lineCap = "round";
      ctx.stroke();
      ctx.lineCap = "butt";

      // Reactive polar waveform ring.
      const steps = 120;
      const wR = R * 0.62;
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const a = (i / steps) * Math.PI * 2;
        const wob = reduce
          ? Math.sin(a * 6) * 0.4
          : Math.sin(a * 6 + t * speed) + Math.sin(a * 9 - t * speed * 0.7) * 0.5;
        const rr = wR + wob * R * 0.12 * (0.4 + energy);
        const x = cx + Math.cos(a) * rr;
        const y = cy + Math.sin(a) * rr;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = `rgba(${GOLD}, ${0.55 + energy * 0.4})`;
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Central well — the reactor. A gold radial that pulses with energy.
      const pulse = reduce ? 0.5 : Math.sin(t * speed * 1.6) * 0.5 + 0.5;
      const orbR = R * 0.3 * (0.85 + energy * 0.3 + pulse * energy * 0.2);
      const grad = ctx.createRadialGradient(cx, cy, orbR * 0.1, cx, cy, orbR * 2);
      grad.addColorStop(0, `rgba(${GOLD_BRIGHT}, 0.9)`);
      grad.addColorStop(0.4, `rgba(${GOLD}, ${0.5 + energy * 0.35})`);
      grad.addColorStop(1, `rgba(${GOLD}, 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, orbR * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(${GOLD_BRIGHT}, 0.95)`;
      ctx.beginPath();
      ctx.arc(cx, cy, orbR * 0.42, 0, Math.PI * 2);
      ctx.fill();

      if (!reduce) raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    if (reduce) draw(performance.now());
    return () => cancelAnimationFrame(raf);
  }, [size]);

  return (
    <canvas ref={canvasRef} className={className} style={{ width: size, height: size }} aria-hidden />
  );
}
