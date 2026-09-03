import type { CSSProperties } from "react";
import { Manrope } from "next/font/google";
import { createDivisionPublicThemeStyle } from "@henryco/ui/public-shell";

/**
 * Public-surface theme wiring for Property (V3-PUBLIC-REBUILD-property).
 *
 * Adopts the locked --home-* design system on the PUBLIC subtree only, applied
 * on the wrapper that also carries the shared `.home-accent-scope` class
 * (packages/ui/src/styles/public-design.css). The property serif display
 * (--font-property-display, already self-hosted by the root layout) is re-pointed
 * at --home-font-display, so there is no second font load.
 *
 *  • Alias the dark-first --property-* tokens onto theme-aware --home-* so existing
 *    --property-*-styled markup + the (token-based) .property-* utilities flip to
 *    light-primary coherently — WITHOUT touching the dashboards, which read
 *    --property-* from :root.
 *  • Remap the --hc-* tokens that @henryco/dashboard-shell primitives read onto
 *    --home-* too, so any shared shell control reused on a public page (e.g. the
 *    ActionButton ghost = color:var(--hc-ink)) stays readable in both themes —
 *    the lesson folded back from the marketplace cart.
 *
 * Token consolidation (2026-07-10): core comes from
 * `createDivisionPublicThemeStyle` (accent truth = company.ts). Property keeps
 * `serifStackOverride` — its interim fallback chain inserts "Cormorant
 * Garamond" ahead of the shared tail.
 */

// Manrope is the shared public BODY sans (paired with the editorial serif display,
// matching the hub). next/font dedupes the file across divisions.
export const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope-public",
  fallback: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
  adjustFontFallback: true,
});

export const PROPERTY_PUBLIC_THEME_STYLE: CSSProperties =
  createDivisionPublicThemeStyle({
    division: "property",
    serifStackOverride:
      'var(--font-property-display), "Cormorant Garamond", "Iowan Old Style", "Palatino Linotype", "Baskerville", "Times New Roman", Times, serif',
    displayAliasVars: ["--font-property-display"],
    extra: {
      // legacy --property-* -> --home-* (theme-aware, scoped to the public subtree)
      "--property-bg": "var(--home-canvas)",
      "--property-bg-soft": "var(--home-canvas-deep)",
      "--property-surface": "var(--home-sheet)",
      "--property-surface-strong": "var(--home-sheet)",
      "--property-paper": "var(--home-surface-04)",
      "--property-ink": "var(--home-ink)",
      "--property-ink-soft": "var(--home-ink-70)",
      "--property-ink-muted": "var(--home-ink-50)",
      "--property-line": "var(--home-line)",
      "--property-line-strong": "var(--home-line-15)",
      "--property-accent": "var(--home-accent)",
      // --property-accent-strong is used pervasively as accent-AS-TEXT/icon across the
      // public pages; map it to the theme-aware --home-accent-text (AA copper on paper
      // AND on near-black) rather than --home-accent-strong (a deep fill copper that
      // fails AA as text on the dark canvas). Sage tokens are made theme-aware in
      // globals.css under .home-accent-scope (a single inline value can't flip).
      "--property-accent-strong": "var(--home-accent-text)",
      "--property-accent-soft": "var(--home-accent-soft)",
      "--property-shadow": "0 30px 90px -45px rgb(var(--home-ink-rgb) / 0.18)",
      "--property-shadow-soft": "0 18px 60px -40px rgb(var(--home-ink-rgb) / 0.14)",
      // @henryco/dashboard-shell primitives read --hc-* (dark-first at :root); remap
      // them to the theme-aware --home-* so shared shell controls flip with the page.
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
