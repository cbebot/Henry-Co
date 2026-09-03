import type { CSSProperties } from "react";
import { Fraunces, Manrope } from "next/font/google";
import { createDivisionPublicThemeStyle } from "@henryco/ui/public-shell";

/**
 * Public-surface theme wiring for Henry Onyx Jobs (V3-PUBLIC-REBUILD-jobs).
 *
 * Adopts the locked --home-* design system on the jobs public subtree so the
 * whole marketing experience flips light⇄dark with the page (device or toggle),
 * matching property/studio/hub — while keeping jobs' teal-forest SOUL as the
 * accent. The dashboards (candidate/employer/recruiter) are untouched: they
 * read --jobs-* from :root; this aliases --jobs-* onto theme-aware --home-*
 * ONLY inside the public `.home-accent-scope` wrapper, so existing jobs-styled
 * markup re-tones coherently without a per-component rewrite.
 *
 * Fraunces is the shared editorial display face (next/font dedupes the file
 * across importers). We point both --home-font-display AND --font-jobs-display
 * at it, so .jobs-display / .jobs-heading adopt the serif too.
 *
 * Token consolidation (2026-07-10): core comes from
 * `createDivisionPublicThemeStyle`. Jobs keeps `accentTextOverride` — its
 * hand-tuned AA accent-as-text on warm paper deliberately sits below the
 * config value (config accentText #0E7C86 equals the fill accent).
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
  fallback: [
    "system-ui",
    "-apple-system",
    "Segoe UI",
    "Roboto",
    "Helvetica Neue",
    "Arial",
    "sans-serif",
  ],
  adjustFontFallback: true,
});

export const JOBS_PUBLIC_THEME_STYLE: CSSProperties =
  createDivisionPublicThemeStyle({
    division: "jobs",
    displayAliasVars: ["--font-jobs-display"],
    accentTextOverride: "#0B6B74",
    extra: {
      // Alias the legacy --jobs-* tokens onto theme-aware --home-* equivalents so
      // every jobs-* class (.jobs-panel, .jobs-input, .jobs-kicker, .jobs-table…)
      // re-tones with the page instead of staying on the standalone jobs palette.
      "--jobs-bg": "var(--home-canvas)",
      "--jobs-paper": "var(--home-sheet)",
      "--jobs-paper-soft": "var(--home-surface-04)",
      "--jobs-surface": "var(--home-surface-04)",
      "--jobs-ink": "var(--home-ink)",
      "--jobs-muted": "var(--home-ink-70)",
      "--jobs-line": "var(--home-line)",
      "--jobs-accent": "var(--home-accent)",
      "--jobs-accent-soft": "var(--home-accent-soft)",
      "--jobs-forest": "var(--home-accent-text)",
      "--jobs-brass": "var(--home-accent-text)",
      "--jobs-brass-soft": "var(--home-accent-soft)",
      "--jobs-shadow": "0 30px 90px -45px rgb(var(--home-ink-rgb) / 0.18)",
      "--jobs-shadow-strong": "0 44px 130px -50px rgb(var(--home-ink-rgb) / 0.24)",
    },
  });
