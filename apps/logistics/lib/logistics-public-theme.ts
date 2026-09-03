import type { CSSProperties } from "react";
import { Fraunces, Manrope } from "next/font/google";
import { createDivisionPublicThemeStyle } from "@henryco/ui/public-shell";

/**
 * Public-surface theme wiring for Henry Onyx Logistics (V3-PUBLIC-REBUILD-logistics).
 *
 * Logistics shipped as a dark-only "bronze-on-near-black" surface on its own
 * `--logistics-*` (+ PASS-20 `--hc-*`) tokens. This style adopts the shared
 * light-first `--home-*` design system on the public subtree ONLY (inside the
 * `.home-accent-scope` wrapper), so the marketing/booking experience flips
 * light⇄dark with the page (device or toggle) like every other Henry Onyx site —
 * while keeping logistics' COPPER soul as the accent. Dashboards/operator
 * surfaces are untouched: they read `--logistics-*`/`--hc-*`/`--ws-*` from
 * `:root`; we alias those onto theme-aware `--home-*` only within the public scope.
 *
 * Fraunces is the shared editorial display face (next/font dedupes the file).
 *
 * Token consolidation (2026-07-10): core comes from
 * `createDivisionPublicThemeStyle` (accent truth = company.ts). Only the
 * logistics alias and remap blocks stay local.
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
 * Manrope is the shared public BODY sans (matches the hub + the other divisions).
 * UI/body copy reads Manrope via --home-font-sans; Fraunces keeps the editorial
 * display heads + the .hc-prose reading face. next/font dedupes the file.
 */
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

export const LOGISTICS_PUBLIC_THEME_STYLE: CSSProperties =
  createDivisionPublicThemeStyle({
    division: "logistics",
    // The portal `.log-pf` module renders its serif via --hc-font-display
    // (seam bridge in the shared core); --font-logistics-display keeps the
    // home + track editorial headings on the shared face.
    displayAliasVars: ["--font-logistics-display"],
    extra: {
      // Alias the dark-first --logistics-* soul onto theme-aware --home-* so every
      // --logistics-*-styled control re-tones with the page instead of staying bronze.
      "--logistics-bg": "var(--home-canvas)",
      "--logistics-ink": "var(--home-ink)",
      "--logistics-muted": "var(--home-ink-70)",
      "--logistics-mist": "var(--home-ink-50)",
      "--logistics-line": "var(--home-line)",
      "--logistics-line-strong": "var(--home-line-15)",
      "--logistics-accent": "var(--home-accent)",
      // --logistics-accent-soft is used pervasively as accent-AS-TEXT/icon -> map to the
      // AA-safe --home-accent-text (copper that clears AA on paper AND near-black), not
      // the bright fill copper which fails as small text on warm paper.
      "--logistics-accent-soft": "var(--home-accent-text)",
      "--logistics-panel": "var(--home-sheet)",
      "--logistics-shadow": "0 30px 90px -45px rgb(var(--home-ink-rgb) / 0.18)",

      // @henryco/dashboard-shell + portal primitives read --hc-* (dark-first at :root);
      // remap them to theme-aware --home-* so any shared control reused on a public page
      // flips with the page.
      "--hc-bg": "var(--home-canvas)",
      "--hc-bg-soft": "var(--home-canvas-deep)",
      "--hc-surface": "var(--home-surface-04)",
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
