import type { CSSProperties } from "react";
import { Fraunces, Manrope } from "next/font/google";
import { onyxTypeAttr } from "@henryco/ui/fonts";

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

const SERIF_STACK =
  'var(--font-fraunces), "Iowan Old Style", "Palatino Linotype", "Baskerville", "Times New Roman", Times, serif';

// Owned type — when the flag is live at build, the public marketing subtree routes
// through the shared brand family tokens instead of the interim Fraunces/Manrope
// next/font handles. Pre-reveal keeps the interim faces (identical to before). The
// --hc-font-display/body/reading entries below reference --home-font-*, so they flip
// automatically.
const live = onyxTypeAttr() === "live";
const HOME_DISPLAY = live ? "var(--hc-font-serif)" : SERIF_STACK;
const HOME_SANS = live
  ? "var(--hc-font-sans)"
  : 'var(--font-manrope-public), system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export const CARE_PUBLIC_THEME_STYLE: CSSProperties = {
  fontFamily: "var(--home-font-sans)",
  // Manrope is the public body sans (display heads stay Fraunces via --home-font-display).
  ["--home-font-sans" as string]: HOME_SANS,
  // Cobalt soul. --accent-text is AA on warm paper; the dark variant lifts the
  // cobalt so it stays AA on the near-black canvas.
  ["--accent" as string]: "#6B7CFF",
  ["--accent-text" as string]: "#4F5BD0",
  ["--accent-text-dark" as string]: "#AAB4FF",
  ["--home-font-display" as string]: HOME_DISPLAY,
  ["--font-display" as string]: HOME_DISPLAY,
  // READING-01 seam bridge: the --hc-font-* tokens compute at :root (their
  // inner var() freezes there), so the canonical seam must be re-declared on
  // THIS element — where the font .variable classes resolve — for .hc-prose /
  // .hc-font-display / .hc-font-reading to render the loaded faces.
  ["--hc-font-display" as string]: "var(--home-font-display)",
  ["--hc-font-body" as string]: "var(--home-font-sans)",
  ["--hc-font-reading" as string]: "var(--home-font-display)",

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
