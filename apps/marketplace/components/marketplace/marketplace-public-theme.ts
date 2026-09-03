import type { CSSProperties } from "react";
import { Manrope } from "next/font/google";
import { createDivisionPublicThemeStyle } from "@henryco/ui/public-shell";

/**
 * Public-surface theme wiring for Marketplace (V3-PUBLIC-REBUILD-marketplace).
 *
 * Adopts the locked --home-* design system on the PUBLIC subtree only, applied
 * on the wrapper that also carries the shared `.home-accent-scope` class
 * (packages/ui/src/styles/public-design.css). Fraunces is already self-hosted by
 * the root layout as --font-marketplace-display, so we just re-point
 * --home-font-display at it (no second font load).
 *
 * Token consolidation (2026-07-10): the accent triplet, owned-type
 * live/interim font switching, and READING-01 seam bridge come from the
 * shared `createDivisionPublicThemeStyle` recipe — accent truth is
 * company.ts. Only the marketplace-specific blocks below stay local.
 */

// READING-01 (premium sans): pair the editorial Fraunces display with the
// crafted Manrope sans for public body/UI copy — exactly as the hub does — so
// the reading isn't carried by the serif. next/font dedupes the file; the
// variable resolves on the wrapper that also carries `manrope.variable`.
export const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope-public",
  fallback: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
  adjustFontFallback: true,
});

export const MARKETPLACE_PUBLIC_THEME_STYLE: CSSProperties =
  createDivisionPublicThemeStyle({
    division: "marketplace",
    serifFontVar: "--font-marketplace-display",
    displayAliasVars: ["--font-marketplace-display"],
    extra: {
      // legacy --market-* -> --home-* (theme-aware, scoped to public)
      "--market-ink": "var(--home-ink)",
      "--market-paper-white": "var(--home-ink)",
      "--market-muted": "var(--home-ink-70)",
      "--market-bg": "var(--home-canvas)",
      "--market-bg-elevated": "var(--home-sheet)",
      "--market-bg-soft": "var(--home-canvas-deep)",
      "--market-paper": "var(--home-sheet)",
      "--market-noir": "var(--home-canvas-deep)",
      "--market-line": "var(--home-line)",
      "--market-line-strong": "var(--home-line-15)",
      "--market-brass": "var(--home-accent)",
      "--market-brass-soft": "var(--home-accent-soft)",
      "--market-soft-wash": "var(--home-surface-04)",
      "--market-soft-olive": "var(--home-surface-04)",
      "--market-shadow": "0 30px 90px -45px rgb(var(--home-ink-rgb) / 0.18)",
      "--market-shadow-strong": "0 40px 120px -50px rgb(var(--home-ink-rgb) / 0.22)",
      // dashboard-shell primitives (@henryco/dashboard-shell) read --hc-* and are
      // dark-first; the cart reuses ActionButton (ghost = color:var(--hc-ink)) +
      // SaveForLater on this LIGHT public page, where the un-remapped --hc-ink
      // stayed pale → "Remove"/"Add to wishlist" were unreadable. Point the --hc-*
      // tokens these primitives read at the theme-aware --home-* equivalents so
      // every shared shell control on a public page flips with the page.
      "--hc-ink": "var(--home-ink)",
      "--hc-ink-soft": "var(--home-ink-70)",
      "--hc-ink-muted": "var(--home-ink-50)",
      "--hc-surface": "var(--home-surface-04)",
      "--hc-surface-elevated": "var(--home-sheet)",
      "--hc-hairline": "var(--home-line)",
      "--hc-accent": "var(--home-accent)",
      "--hc-accent-strong": "var(--home-accent-strong)",
      "--hc-accent-text": "var(--home-accent)",
      "--hc-accent-on-surface": "var(--home-accent)",
      "--hc-text-on-accent": "var(--home-accent-ink)",
      "--hc-focus-ring": "var(--home-accent)",
    },
  });
