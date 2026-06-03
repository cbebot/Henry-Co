import type { CSSProperties } from "react";
import { Fraunces } from "next/font/google";

/**
 * Public-surface theme wiring for Henry Onyx Fabric Care (V3-PUBLIC-REBUILD-care).
 *
 * Care shipped light-first dual-token on its own cobalt/teal `--care-*` +
 * `--hc-*` system (a "glass-on-blue-paper" look), never on the shared
 * light-first `--home-*` public design system. This style adopts `--home-*`
 * on the public subtree so the whole marketing experience flips light⇄dark
 * with the page (device or toggle), matching the rest of the platform — while
 * keeping care's COBALT soul as the accent. Dashboards are untouched: they read
 * `--care-*`/`--hc-*` from `:root`; we alias those onto theme-aware `--home-*`
 * ONLY inside the public `.home-accent-scope` wrapper.
 *
 * Fraunces is the shared editorial display face (next/font dedupes the file).
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

const SERIF_STACK =
  'var(--font-fraunces), "Iowan Old Style", "Palatino Linotype", "Baskerville", "Times New Roman", Times, serif';

export const CARE_PUBLIC_THEME_STYLE: CSSProperties = {
  fontFamily: "var(--home-font-sans)",
  // Cobalt soul. --accent-text is AA on warm paper; the dark variant lifts the
  // cobalt so it stays AA on the near-black canvas.
  ["--accent" as string]: "#6B7CFF",
  ["--accent-text" as string]: "#4F5BD0",
  ["--accent-text-dark" as string]: "#AAB4FF",
  ["--home-font-display" as string]: SERIF_STACK,
  ["--font-display" as string]: SERIF_STACK,

  // Alias the legacy --care-* soul onto theme-aware --home-* equivalents so
  // every .care-* class (.care-panel/.care-card/.care-muted/.care-page…)
  // re-tones with the page instead of staying on the standalone cobalt palette.
  ["--care-bg" as string]: "var(--home-canvas)",
  ["--care-bg-elevated" as string]: "var(--home-sheet)",
  ["--care-bg-soft" as string]: "var(--home-surface-04)",
  ["--care-card" as string]: "var(--home-sheet)",
  ["--care-border" as string]: "var(--home-line)",
  ["--care-text" as string]: "var(--home-ink)",
  ["--care-muted" as string]: "var(--home-ink-70)",
  ["--care-accent" as string]: "var(--home-accent)",
  ["--care-accent-strong" as string]: "var(--home-accent-soft)",
  // --care-accent-secondary (teal) + --care-accent-deep keep their own
  // :root/.dark values (already theme-aware); they're sparse two-tone pops.
  ["--care-shadow" as string]: "0 30px 90px -45px rgb(var(--home-ink-rgb) / 0.18)",
  ["--care-shadow-soft" as string]: "0 16px 42px -28px rgb(var(--home-ink-rgb) / 0.14)",
  ["--care-shadow-strong" as string]: "0 44px 130px -50px rgb(var(--home-ink-rgb) / 0.24)",

  // The PASS-20 --hc-* aliases are gold at :root (for dashboard chrome). On the
  // public surface, re-point them at --home-* so any --hc-*-styled control wears
  // the page canvas + the cobalt accent (no gold leak).
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
