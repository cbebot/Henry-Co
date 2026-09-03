import type { CSSProperties } from "react";
import { Fraunces, Manrope } from "next/font/google";
import { createDivisionPublicThemeStyle } from "@henryco/ui/public-shell";

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
 *
 * Token consolidation (2026-07-10): the cobalt accent triplet now reads
 * from company.ts through `createDivisionPublicThemeStyle` (this file used
 * to hardcode the same hexes — a fork of accent truth). Only care's alias
 * and remap blocks stay local.
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

/**
 * Manrope is the public BODY sans (matches the hub + the editorial reference):
 * UI/body copy reads Manrope while Fraunces keeps the display heads + the
 * `.hc-prose` reading face. next/font dedupes the file across the app.
 */
export const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope-public",
  fallback: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
  adjustFontFallback: true,
});

export const CARE_PUBLIC_THEME_STYLE: CSSProperties =
  createDivisionPublicThemeStyle({
    division: "care",
    displayAliasVars: ["--font-display"],
    extra: {
      // Alias the legacy --care-* soul onto theme-aware --home-* equivalents so
      // every .care-* class (.care-panel/.care-card/.care-muted/.care-page…)
      // re-tones with the page instead of staying on the standalone cobalt palette.
      "--care-bg": "var(--home-canvas)",
      "--care-bg-elevated": "var(--home-sheet)",
      "--care-bg-soft": "var(--home-surface-04)",
      "--care-card": "var(--home-sheet)",
      "--care-border": "var(--home-line)",
      "--care-text": "var(--home-ink)",
      "--care-muted": "var(--home-ink-70)",
      "--care-accent": "var(--home-accent)",
      "--care-accent-strong": "var(--home-accent-soft)",
      // --care-accent-secondary (teal) + --care-accent-deep keep their own
      // :root/.dark values (already theme-aware); they're sparse two-tone pops.
      "--care-shadow": "0 30px 90px -45px rgb(var(--home-ink-rgb) / 0.18)",
      "--care-shadow-soft": "0 16px 42px -28px rgb(var(--home-ink-rgb) / 0.14)",
      "--care-shadow-strong": "0 44px 130px -50px rgb(var(--home-ink-rgb) / 0.24)",

      // The PASS-20 --hc-* aliases are gold at :root (for dashboard chrome). On the
      // public surface, re-point them at --home-* so any --hc-*-styled control wears
      // the page canvas + the cobalt accent (no gold leak).
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
