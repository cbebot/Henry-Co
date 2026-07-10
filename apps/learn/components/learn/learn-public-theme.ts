import type { CSSProperties } from "react";
import { Fraunces, Manrope } from "next/font/google";
import { createDivisionPublicThemeStyle } from "@henryco/ui/public-shell";

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
 *
 * Token consolidation (2026-07-10): core comes from
 * `createDivisionPublicThemeStyle` (accent truth = company.ts). Only learn's
 * alias and remap blocks stay local.
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

export const LEARN_PUBLIC_THEME_STYLE: CSSProperties =
  createDivisionPublicThemeStyle({
    division: "learn",
    displayAliasVars: ["--font-learn-display"],
    extra: {
      // Public components read var(--learn-accent, <gold/mint fallback>) (BrandMark
      // monogram, CTA focus rings). Define it on the public scope so it tracks the
      // theme-aware page accent instead of leaking the dashboard gold; dashboards
      // (outside this scope) keep their gold/mint fallback unchanged.
      "--learn-accent": "var(--home-accent)",

      // Alias the legacy --learn-* soul onto theme-aware --home-* equivalents so
      // every .learn-* class re-tones with the page instead of staying dark.
      "--learn-bg": "var(--home-canvas)",
      "--learn-bg-soft": "var(--home-canvas-deep)",
      "--learn-surface": "var(--home-sheet)",
      "--learn-surface-strong": "var(--home-sheet)",
      "--learn-ink": "var(--home-ink)",
      "--learn-ink-soft": "var(--home-ink-70)",
      "--learn-line": "var(--home-line)",
      "--learn-line-strong": "var(--home-line-15)",
      "--learn-mint": "var(--home-accent)",
      "--learn-mint-soft": "var(--home-accent-text)",
      "--learn-copper": "var(--home-accent-text)",
      "--learn-shadow": "0 30px 90px -45px rgb(var(--home-ink-rgb) / 0.18)",
      "--learn-shadow-soft": "0 16px 42px -28px rgb(var(--home-ink-rgb) / 0.14)",

      // The PASS-20 --hc-* aliases are gold at :root (for dashboard chrome). On the
      // public surface, re-point them at --home-* so any --hc-*-styled card/control
      // wears the page canvas + the green accent (no gold leak).
      "--hc-bg": "var(--home-canvas)",
      "--hc-bg-soft": "var(--home-canvas-deep)",
      "--hc-surface": "var(--home-sheet)",
      "--hc-surface-strong": "var(--home-sheet)",
      "--hc-surface-elevated": "var(--home-sheet)",
      "--hc-paper": "var(--home-surface-04)",
      "--hc-ink": "var(--home-ink)",
      "--hc-ink-soft": "var(--home-ink-70)",
      "--hc-ink-muted": "var(--home-ink-50)",
      "--hc-line": "var(--home-line)",
      "--hc-line-strong": "var(--home-line-15)",
      "--hc-hairline": "var(--home-line)",
      "--hc-accent": "var(--home-accent)",
      "--hc-accent-strong": "var(--home-accent-strong)",
      "--hc-accent-soft": "var(--home-accent-soft)",
      "--hc-accent-text": "var(--home-accent-text)",
      "--hc-accent-on-surface": "var(--home-accent-text)",
      "--hc-ink-on-accent": "var(--home-accent-ink)",
      "--hc-focus-ring": "var(--home-accent)",
    },
  });
