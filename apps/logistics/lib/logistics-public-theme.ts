import type { CSSProperties } from "react";
import { Fraunces } from "next/font/google";
import { getDivisionConfig } from "@henryco/config";

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

const logistics = getDivisionConfig("logistics");

const SERIF_STACK =
  'var(--font-fraunces), "Iowan Old Style", "Palatino Linotype", "Baskerville", "Times New Roman", Times, serif';

export const LOGISTICS_PUBLIC_THEME_STYLE: CSSProperties = {
  fontFamily: "var(--home-font-sans)",
  // Copper soul — read from company.ts per §9. --accent-text is AA on warm paper;
  // --accent-text-dark lifts the copper so it stays AA on the near-black canvas.
  ["--accent" as string]: logistics.accent || "#D06F32",
  ["--accent-text" as string]: logistics.accentText || "#9D4F1F",
  ["--accent-text-dark" as string]: "#F3A877",
  ["--home-font-display" as string]: SERIF_STACK,
  ["--font-logistics-display" as string]: SERIF_STACK,
  // The portal `.log-pf` module renders its serif via --hc-font-display; re-point
  // it at Fraunces so the home + track editorial headings adopt the shared face.
  ["--hc-font-display" as string]: SERIF_STACK,

  // Alias the dark-first --logistics-* soul onto theme-aware --home-* so every
  // --logistics-*-styled control re-tones with the page instead of staying bronze.
  ["--logistics-bg" as string]: "var(--home-canvas)",
  ["--logistics-ink" as string]: "var(--home-ink)",
  ["--logistics-muted" as string]: "var(--home-ink-70)",
  ["--logistics-mist" as string]: "var(--home-ink-50)",
  ["--logistics-line" as string]: "var(--home-line)",
  ["--logistics-line-strong" as string]: "var(--home-line-15)",
  ["--logistics-accent" as string]: "var(--home-accent)",
  // --logistics-accent-soft is used pervasively as accent-AS-TEXT/icon -> map to the
  // AA-safe --home-accent-text (copper that clears AA on paper AND near-black), not
  // the bright fill copper which fails as small text on warm paper.
  ["--logistics-accent-soft" as string]: "var(--home-accent-text)",
  ["--logistics-panel" as string]: "var(--home-sheet)",
  ["--logistics-shadow" as string]:
    "0 30px 90px -45px rgb(var(--home-ink-rgb) / 0.18)",

  // @henryco/dashboard-shell + portal primitives read --hc-* (dark-first at :root);
  // remap them to theme-aware --home-* so any shared control reused on a public page
  // flips with the page.
  ["--hc-bg" as string]: "var(--home-canvas)",
  ["--hc-bg-soft" as string]: "var(--home-canvas-deep)",
  ["--hc-surface" as string]: "var(--home-surface-04)",
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
