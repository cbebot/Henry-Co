import type { CSSProperties } from "react";
import { Manrope } from "next/font/google";
import { getDivisionConfig } from "@henryco/config";
import { onyxTypeAttr } from "@henryco/ui/fonts";

/**
 * Public-surface theme wiring for Property (V3-PUBLIC-REBUILD-property).
 *
 * Adopts the locked --home-* design system on the PUBLIC subtree only, applied
 * on the wrapper that also carries the shared `.home-accent-scope` class
 * (packages/ui/src/styles/public-design.css). The property serif display
 * (--font-property-display, already self-hosted by the root layout) is re-pointed
 * at --home-font-display, so there is no second font load.
 *
 *  • Accent = the config copper (#B06C3E / #7A4924), read from company.ts per §9.
 *    --accent-text-dark lifts the deep AA copper to a brighter sibling that clears
 *    AA on the near-black dark canvas. .home-accent-scope re-resolves the ramp.
 *  • Alias the dark-first --property-* tokens onto theme-aware --home-* so existing
 *    --property-*-styled markup + the (token-based) .property-* utilities flip to
 *    light-primary coherently — WITHOUT touching the dashboards, which read
 *    --property-* from :root.
 *  • Remap the --hc-* tokens that @henryco/dashboard-shell primitives read onto
 *    --home-* too, so any shared shell control reused on a public page (e.g. the
 *    ActionButton ghost = color:var(--hc-ink)) stays readable in both themes —
 *    the lesson folded back from the marketplace cart.
 */
const property = getDivisionConfig("property");

const SERIF_STACK =
  'var(--font-property-display), "Cormorant Garamond", "Iowan Old Style", "Palatino Linotype", "Baskerville", "Times New Roman", Times, serif';

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

// Manrope is the shared public BODY sans (paired with the editorial serif display,
// matching the hub). next/font dedupes the file across divisions.
export const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope-public",
  fallback: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
  adjustFontFallback: true,
});

export const PROPERTY_PUBLIC_THEME_STYLE: CSSProperties = {
  fontFamily: "var(--home-font-sans)",
  ["--home-font-sans" as string]: HOME_SANS,
  ["--accent" as string]: property.accent,
  ["--accent-text" as string]: property.accentText,
  ["--accent-text-dark" as string]: "#E8B894",
  ["--home-font-display" as string]: HOME_DISPLAY,
  ["--font-property-display" as string]: HOME_DISPLAY,
  // READING-01 seam bridge: the --hc-font-* tokens compute at :root (their
  // inner var() freezes there), so the canonical seam must be re-declared on
  // THIS element — where the font .variable classes resolve — for .hc-prose /
  // .hc-font-display / .hc-font-reading to render the loaded faces.
  ["--hc-font-display" as string]: "var(--home-font-display)",
  ["--hc-font-body" as string]: "var(--home-font-sans)",
  ["--hc-font-reading" as string]: "var(--home-font-display)",
  // legacy --property-* -> --home-* (theme-aware, scoped to the public subtree)
  ["--property-bg" as string]: "var(--home-canvas)",
  ["--property-bg-soft" as string]: "var(--home-canvas-deep)",
  ["--property-surface" as string]: "var(--home-sheet)",
  ["--property-surface-strong" as string]: "var(--home-sheet)",
  ["--property-paper" as string]: "var(--home-surface-04)",
  ["--property-ink" as string]: "var(--home-ink)",
  ["--property-ink-soft" as string]: "var(--home-ink-70)",
  ["--property-ink-muted" as string]: "var(--home-ink-50)",
  ["--property-line" as string]: "var(--home-line)",
  ["--property-line-strong" as string]: "var(--home-line-15)",
  ["--property-accent" as string]: "var(--home-accent)",
  // --property-accent-strong is used pervasively as accent-AS-TEXT/icon across the
  // public pages; map it to the theme-aware --home-accent-text (AA copper on paper
  // AND on near-black) rather than --home-accent-strong (a deep fill copper that
  // fails AA as text on the dark canvas). Sage tokens are made theme-aware in
  // globals.css under .home-accent-scope (a single inline value can't flip).
  ["--property-accent-strong" as string]: "var(--home-accent-text)",
  ["--property-accent-soft" as string]: "var(--home-accent-soft)",
  ["--property-shadow" as string]: "0 30px 90px -45px rgb(var(--home-ink-rgb) / 0.18)",
  ["--property-shadow-soft" as string]: "0 18px 60px -40px rgb(var(--home-ink-rgb) / 0.14)",
  // @henryco/dashboard-shell primitives read --hc-* (dark-first at :root); remap
  // them to the theme-aware --home-* so shared shell controls flip with the page.
  ["--hc-ink" as string]: "var(--home-ink)",
  ["--hc-ink-soft" as string]: "var(--home-ink-70)",
  ["--hc-ink-muted" as string]: "var(--home-ink-50)",
  ["--hc-surface" as string]: "var(--home-surface-04)",
  ["--hc-surface-elevated" as string]: "var(--home-sheet)",
  ["--hc-hairline" as string]: "var(--home-line)",
  ["--hc-accent" as string]: "var(--home-accent)",
  ["--hc-accent-strong" as string]: "var(--home-accent-strong)",
  ["--hc-accent-text" as string]: "var(--home-accent)",
  ["--hc-accent-on-surface" as string]: "var(--home-accent)",
  ["--hc-text-on-accent" as string]: "var(--home-accent-ink)",
  ["--hc-focus-ring" as string]: "var(--home-accent)",
};
