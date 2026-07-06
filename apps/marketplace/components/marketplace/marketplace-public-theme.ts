import type { CSSProperties } from "react";
import { Manrope } from "next/font/google";
import { getDivisionConfig } from "@henryco/config";
import { onyxTypeAttr } from "@henryco/ui/fonts";

/**
 * Public-surface theme wiring for Marketplace (V3-PUBLIC-REBUILD-marketplace).
 *
 * Adopts the locked --home-* design system on the PUBLIC subtree only, applied
 * on the wrapper that also carries the shared `.home-accent-scope` class
 * (packages/ui/src/styles/public-design.css). Fraunces is already self-hosted by
 * the root layout as --font-marketplace-display, so we just re-point
 * --home-font-display at it (no second font load).
 *
 *  • Accent = the config bronze (#B2863B / #7E5E1F), read from company.ts per §9.
 *    --accent-text-dark lifts the deep AA bronze to a bright sibling that clears
 *    AA on the near-black dark canvas. .home-accent-scope re-resolves the ramp.
 *  • Alias the legacy --market-* tokens onto theme-aware --home-* so existing
 *    --market-*-styled markup + the (token-based) .market-* utility classes flip
 *    to light-primary coherently — WITHOUT touching the dashboards, which read
 *    --market-* from :root.
 */
const marketplace = getDivisionConfig("marketplace");

const SERIF_STACK =
  'var(--font-marketplace-display), "Iowan Old Style", "Palatino Linotype", "Baskerville", "Times New Roman", Times, serif';

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

export const MARKETPLACE_PUBLIC_THEME_STYLE: CSSProperties = {
  fontFamily: "var(--home-font-sans)",
  ["--accent" as string]: marketplace.accent,
  ["--accent-text" as string]: marketplace.accentText,
  ["--accent-text-dark" as string]: "#E3C088",
  ["--home-font-display" as string]: HOME_DISPLAY,
  ["--font-marketplace-display" as string]: HOME_DISPLAY,
  // READING-01 seam bridge: the --hc-font-* tokens compute at :root (their
  // inner var() freezes there), so the canonical seam must be re-declared on
  // THIS element — where the font .variable classes resolve — for .hc-prose /
  // .hc-font-display / .hc-font-reading to render the loaded faces.
  ["--hc-font-display" as string]: "var(--home-font-display)",
  ["--hc-font-body" as string]: "var(--home-font-sans)",
  ["--hc-font-reading" as string]: "var(--home-font-display)",
  // Public body/UI copy reads the loaded Manrope (declared on the same wrapper
  // that carries `manrope.variable`, so var(--font-manrope-public) resolves).
  ["--home-font-sans" as string]: HOME_SANS,
  // legacy --market-* -> --home-* (theme-aware, scoped to public)
  ["--market-ink" as string]: "var(--home-ink)",
  ["--market-paper-white" as string]: "var(--home-ink)",
  ["--market-muted" as string]: "var(--home-ink-70)",
  ["--market-bg" as string]: "var(--home-canvas)",
  ["--market-bg-elevated" as string]: "var(--home-sheet)",
  ["--market-bg-soft" as string]: "var(--home-canvas-deep)",
  ["--market-paper" as string]: "var(--home-sheet)",
  ["--market-noir" as string]: "var(--home-canvas-deep)",
  ["--market-line" as string]: "var(--home-line)",
  ["--market-line-strong" as string]: "var(--home-line-15)",
  ["--market-brass" as string]: "var(--home-accent)",
  ["--market-brass-soft" as string]: "var(--home-accent-soft)",
  ["--market-soft-wash" as string]: "var(--home-surface-04)",
  ["--market-soft-olive" as string]: "var(--home-surface-04)",
  ["--market-shadow" as string]: "0 30px 90px -45px rgb(var(--home-ink-rgb) / 0.18)",
  ["--market-shadow-strong" as string]: "0 40px 120px -50px rgb(var(--home-ink-rgb) / 0.22)",
  // dashboard-shell primitives (@henryco/dashboard-shell) read --hc-* and are
  // dark-first; the cart reuses ActionButton (ghost = color:var(--hc-ink)) +
  // SaveForLater on this LIGHT public page, where the un-remapped --hc-ink
  // stayed pale → "Remove"/"Add to wishlist" were unreadable. Point the --hc-*
  // tokens these primitives read at the theme-aware --home-* equivalents so
  // every shared shell control on a public page flips with the page.
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
