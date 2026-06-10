import type { CSSProperties } from "react";
import { Fraunces, Manrope } from "next/font/google";
import { getDivisionConfig } from "@henryco/config";

/**
 * Public-surface theme wiring for Henry Onyx Learn (V3-PUBLIC-REBUILD-learn).
 *
 * Learn shipped DARK-first (its `:root` held the dark forest soul, with a
 * `.light` re-light) on its own `--learn-*` + `--hc-*` tokens — never on the
 * shared, light-first `--home-*` public design system. This style adopts
 * `--home-*` on the public subtree so the whole marketing experience flips
 * light⇄dark with the page (device or toggle), matching property/studio/hub/
 * jobs — while keeping learn's viridian-green SOUL as the accent. The
 * dashboards (learner/instructor/owner) are untouched: they read `--learn-*`/
 * `--hc-*` from `:root`; we alias those onto theme-aware `--home-*` ONLY inside
 * the public `.home-accent-scope` wrapper.
 *
 * Fraunces is the shared editorial display face (learn referenced the name in
 * its font stack but never loaded the file — next/font loads + dedupes it here).
 */
export const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-fraunces",
  fallback: [
    "Iowan Old Style",
    "Palatino Linotype",
    "Baskerville",
    "Times New Roman",
    "Times",
    "serif",
  ],
  adjustFontFallback: true,
});

export const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope-public",
  fallback: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
  adjustFontFallback: true,
});

const learn = getDivisionConfig("learn");

const SERIF_STACK =
  'var(--font-fraunces), "Iowan Old Style", "Palatino Linotype", "Baskerville", "Times New Roman", Times, serif';

export const LEARN_PUBLIC_THEME_STYLE: CSSProperties = {
  fontFamily: "var(--home-font-sans)",
  ["--home-font-sans" as string]:
    'var(--font-manrope-public), system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  // Viridian-green soul. --accent-text is AA on warm paper; the dark variant
  // lifts to mint so it stays AA on the near-black canvas.
  ["--accent" as string]: learn.accent, // #3C8C7A
  ["--accent-text" as string]: learn.accentText || "#2E6E5F",
  ["--accent-text-dark" as string]: "#6FD0B6",
  // Public components read var(--learn-accent, <gold/mint fallback>) (BrandMark
  // monogram, CTA focus rings). Define it on the public scope so it tracks the
  // theme-aware page accent instead of leaking the dashboard gold; dashboards
  // (outside this scope) keep their gold/mint fallback unchanged.
  ["--learn-accent" as string]: "var(--home-accent)",
  ["--home-font-display" as string]: SERIF_STACK,
  ["--font-learn-display" as string]: SERIF_STACK,

  // Alias the legacy --learn-* soul onto theme-aware --home-* equivalents so
  // every .learn-* class re-tones with the page instead of staying dark.
  ["--learn-bg" as string]: "var(--home-canvas)",
  ["--learn-bg-soft" as string]: "var(--home-canvas-deep)",
  ["--learn-surface" as string]: "var(--home-sheet)",
  ["--learn-surface-strong" as string]: "var(--home-sheet)",
  ["--learn-ink" as string]: "var(--home-ink)",
  ["--learn-ink-soft" as string]: "var(--home-ink-70)",
  ["--learn-line" as string]: "var(--home-line)",
  ["--learn-line-strong" as string]: "var(--home-line-15)",
  ["--learn-mint" as string]: "var(--home-accent)",
  ["--learn-mint-soft" as string]: "var(--home-accent-text)",
  ["--learn-copper" as string]: "var(--home-accent-text)",
  ["--learn-shadow" as string]: "0 30px 90px -45px rgb(var(--home-ink-rgb) / 0.18)",
  ["--learn-shadow-soft" as string]: "0 16px 42px -28px rgb(var(--home-ink-rgb) / 0.14)",

  // The PASS-20 --hc-* aliases are gold at :root (for dashboard chrome). On the
  // public surface, re-point them at --home-* so any --hc-*-styled card/control
  // wears the page canvas + the green accent (no gold leak).
  ["--hc-bg" as string]: "var(--home-canvas)",
  ["--hc-bg-soft" as string]: "var(--home-canvas-deep)",
  ["--hc-surface" as string]: "var(--home-sheet)",
  ["--hc-surface-strong" as string]: "var(--home-sheet)",
  ["--hc-surface-elevated" as string]: "var(--home-sheet)",
  ["--hc-paper" as string]: "var(--home-surface-04)",
  ["--hc-ink" as string]: "var(--home-ink)",
  ["--hc-ink-soft" as string]: "var(--home-ink-70)",
  ["--hc-ink-muted" as string]: "var(--home-ink-50)",
  ["--hc-line" as string]: "var(--home-line)",
  ["--hc-line-strong" as string]: "var(--home-line-15)",
  ["--hc-hairline" as string]: "var(--home-line)",
  ["--hc-accent" as string]: "var(--home-accent)",
  ["--hc-accent-strong" as string]: "var(--home-accent-strong)",
  ["--hc-accent-soft" as string]: "var(--home-accent-soft)",
  ["--hc-accent-text" as string]: "var(--home-accent-text)",
  ["--hc-accent-on-surface" as string]: "var(--home-accent-text)",
  ["--hc-ink-on-accent" as string]: "var(--home-accent-ink)",
  ["--hc-focus-ring" as string]: "var(--home-accent)",
};
