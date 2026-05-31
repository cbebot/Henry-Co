"use client";

import { motion, type Variants } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import type { HubHomeCopy } from "@henryco/i18n";
import type { DivisionRow } from "../../lib/divisions";
import type { DivisionLiveStat } from "../../lib/division-stats";
import { useHomeMotion } from "./home-motion";

type HomeIndexRowProps = {
  division: DivisionRow;
  stat: DivisionLiveStat | null;
  href: string;
  copy: HubHomeCopy;
};

/**
 * HomeIndexRow — one engine, one large hit-target link, one departures-board row.
 *
 * Left: the engine name (display serif) over a quiet category tag. Center: the
 * one-line tagline. Right: the live proof — the real `metric` in mono when we
 * have one, otherwise the action verb (`cta`); a `metric: null` never becomes a
 * zero. The whole row is the link, with an aria-label that reads the proof.
 *
 * Signature interaction (hover/focus): an accent hairline sweeps in, the row
 * lifts magnetically, and a wash tinted by the division's OWN accent resolves —
 * a hint of the world behind the link. Contrast + accent are CSS (informative,
 * survive reduced motion); the sweep/lift/wash are framer variants gated by
 * `m.enabled`, so reduced motion keeps the meaning and drops the movement.
 */
export function HomeIndexRow({ division, stat, href, copy }: HomeIndexRowProps) {
  const m = useHomeMotion();
  const accent = division.accent || "#C9A227";
  const category = division.categories?.[0] ?? null;
  const proof = stat?.metric ?? stat?.cta ?? null;
  const isLive = Boolean(stat?.metric);
  const ariaLabel = `${division.name}${proof ? ` — ${proof}` : ""}${copy.index.ariaRowSuffix}`;

  const sweep: Variants = m.enabled
    ? {
        rest: { scaleX: 0, opacity: 0 },
        active: {
          scaleX: 1,
          opacity: 1,
          transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
        },
      }
    : { rest: { scaleX: 1, opacity: 0 }, active: { scaleX: 1, opacity: 1 } };

  const wash: Variants = {
    rest: { opacity: 0 },
    active: {
      opacity: m.enabled ? 1 : 0,
      transition: { duration: m.enabled ? 0.3 : 0 },
    },
  };

  return (
    <motion.li variants={m.reveal} className="list-none transition-opacity duration-300">
      <motion.a
        href={href}
        aria-label={ariaLabel}
        initial="rest"
        whileHover="active"
        whileFocus="active"
        className="group relative block rounded-sm border-b border-white/10 px-1 py-7 outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:py-8"
      >
        <motion.span
          aria-hidden
          variants={wash}
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(120% 130% at 100% 50%, color-mix(in srgb, ${accent} 16%, transparent), transparent 72%)`,
          }}
        />

        <motion.div
          variants={m.magnetic}
          className="relative z-10 grid grid-cols-1 items-baseline gap-x-8 gap-y-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto]"
        >
          <span className="flex flex-col gap-1">
            <span
              className="text-2xl font-semibold tracking-tight text-white/85 transition-colors duration-300 group-hover:text-white group-focus-visible:text-white sm:text-3xl"
              style={{ fontFamily: "var(--acct-font-display)" }}
            >
              {division.name}
            </span>
            {category ? (
              <span className="text-[11px] uppercase tracking-[0.22em] text-white/50">
                {category}
              </span>
            ) : null}
          </span>

          {division.tagline ? (
            <span className="min-w-0 truncate text-sm text-white/55 transition-colors duration-300 group-hover:text-white/75 sm:text-base">
              {division.tagline}
            </span>
          ) : (
            <span aria-hidden />
          )}

          <span className="flex items-center justify-start gap-2 sm:justify-end">
            {proof ? (
              <span
                className={
                  isLive
                    ? "text-sm tabular-nums text-white/80"
                    : "text-sm text-white/70 transition-colors duration-300 group-hover:text-white"
                }
                style={isLive ? { fontFamily: "var(--hc-font-mono)" } : undefined}
              >
                {proof}
              </span>
            ) : null}
            <ArrowUpRight
              aria-hidden
              className="h-4 w-4 shrink-0 text-white/30 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-[color:var(--accent)] group-focus-visible:text-[color:var(--accent)]"
            />
          </span>
        </motion.div>

        <motion.span
          aria-hidden
          variants={sweep}
          className="absolute bottom-0 left-0 h-px w-full origin-left"
          style={{ background: accent }}
        />
      </motion.a>
    </motion.li>
  );
}
