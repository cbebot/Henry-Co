import type { CSSProperties } from "react";
import { Fraunces, Manrope } from "next/font/google";
import { getDivisionConfig } from "@henryco/config";
import { onyxTypeAttr } from "@henryco/ui/fonts";

/**
 * Shared public-surface theme wiring for Studio (V3-PUBLIC-REBUILD-studio).
 *
 * Both the marketing shell (app/(public)/layout.tsx) and the focused brief flow
 * (app/request/layout.tsx) adopt the locked --home-* design system through this
 * single source, so the two never drift. Fraunces is instantiated once here
 * (next/font dedupes the actual file across importers), scoped to whichever
 * public subtree mounts it — never the dashboards.
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

const studio = getDivisionConfig("studio");

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

/**
 * Adopt --home-* on a public subtree (see §9 + §10 of docs/v3/design-system.md):
 *  • Studio accent = config teal (#4AC1C5 / #1F7375); --accent-text-dark lifts it
 *    to AA on the near-black dark canvas. No company.ts change → no gate risk.
 *  • --home-font-display = Fraunces, declared on the SAME element that carries
 *    --font-fraunces so the var() substitution resolves.
 *  • Alias the legacy --studio-* tokens onto theme-aware --home-* so existing
 *    --studio-*-styled markup flips to light-primary coherently, WITHOUT
 *    touching the dashboards (which read --studio-* from :root). Point
 *    --font-studio-display at Fraunces so .studio-display/.studio-heading adopt
 *    the serif too.
 */
export const STUDIO_PUBLIC_THEME_STYLE: CSSProperties = {
  fontFamily: "var(--home-font-sans)",
  ["--home-font-sans" as string]: HOME_SANS,
  ["--accent" as string]: studio.accent,
  ["--accent-text" as string]: studio.accentText,
  ["--accent-text-dark" as string]: "#63D2D5",
  ["--home-font-display" as string]: HOME_DISPLAY,
  ["--font-studio-display" as string]: HOME_DISPLAY,
  // READING-01 seam bridge: the --hc-font-* tokens compute at :root (their
  // inner var() freezes there), so the canonical seam must be re-declared on
  // THIS element — where the font .variable classes resolve — for .hc-prose /
  // .hc-font-display / .hc-font-reading to render the loaded faces.
  ["--hc-font-display" as string]: "var(--home-font-display)",
  ["--hc-font-body" as string]: "var(--home-font-sans)",
  ["--hc-font-reading" as string]: "var(--home-font-display)",
  ["--studio-ink" as string]: "var(--home-ink)",
  ["--studio-ink-soft" as string]: "var(--home-ink-70)",
  ["--studio-bg" as string]: "var(--home-canvas)",
  ["--studio-bg-soft" as string]: "var(--home-canvas-deep)",
  ["--studio-surface" as string]: "var(--home-sheet)",
  ["--studio-surface-strong" as string]: "var(--home-sheet)",
  ["--studio-line" as string]: "var(--home-line)",
  ["--studio-line-strong" as string]: "var(--home-line-15)",
  ["--studio-signal" as string]: "var(--home-accent-text)",
  ["--studio-mint" as string]: "var(--home-accent)",
  ["--studio-mint-soft" as string]: "var(--home-accent-soft)",
  ["--studio-copper" as string]: "var(--home-accent-text)",
  ["--studio-shadow" as string]: "0 30px 90px -45px rgb(var(--home-ink-rgb) / 0.18)",
  ["--studio-shadow-soft" as string]: "0 16px 42px -28px rgb(var(--home-ink-rgb) / 0.14)",
};
