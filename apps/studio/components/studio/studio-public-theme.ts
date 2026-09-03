import type { CSSProperties } from "react";
import { Fraunces, Manrope } from "next/font/google";
import { createDivisionPublicThemeStyle } from "@henryco/ui/public-shell";

/**
 * Shared public-surface theme wiring for Studio (V3-PUBLIC-REBUILD-studio).
 *
 * Both the marketing shell (app/(public)/layout.tsx) and the focused brief flow
 * (app/request/layout.tsx) adopt the locked --home-* design system through this
 * single source, so the two never drift. Fraunces is instantiated once here
 * (next/font dedupes the actual file across importers), scoped to whichever
 * public subtree mounts it — never the dashboards.
 *
 * Token consolidation (2026-07-10): accent triplet + font switching + seam
 * bridge come from `createDivisionPublicThemeStyle` (accent truth =
 * company.ts). Only studio's legacy alias block stays local.
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

/**
 * Adopt --home-* on a public subtree (see §9 + §10 of docs/v3/design-system.md):
 *  • Alias the legacy --studio-* tokens onto theme-aware --home-* so existing
 *    --studio-*-styled markup flips to light-primary coherently, WITHOUT
 *    touching the dashboards (which read --studio-* from :root). Point
 *    --font-studio-display at Fraunces so .studio-display/.studio-heading adopt
 *    the serif too.
 */
export const STUDIO_PUBLIC_THEME_STYLE: CSSProperties =
  createDivisionPublicThemeStyle({
    division: "studio",
    displayAliasVars: ["--font-studio-display"],
    extra: {
      "--studio-ink": "var(--home-ink)",
      "--studio-ink-soft": "var(--home-ink-70)",
      "--studio-bg": "var(--home-canvas)",
      "--studio-bg-soft": "var(--home-canvas-deep)",
      "--studio-surface": "var(--home-sheet)",
      "--studio-surface-strong": "var(--home-sheet)",
      "--studio-line": "var(--home-line)",
      "--studio-line-strong": "var(--home-line-15)",
      "--studio-signal": "var(--home-accent-text)",
      "--studio-mint": "var(--home-accent)",
      "--studio-mint-soft": "var(--home-accent-soft)",
      "--studio-copper": "var(--home-accent-text)",
      "--studio-shadow": "0 30px 90px -45px rgb(var(--home-ink-rgb) / 0.18)",
      "--studio-shadow-soft": "0 16px 42px -28px rgb(var(--home-ink-rgb) / 0.14)",
    },
  });
