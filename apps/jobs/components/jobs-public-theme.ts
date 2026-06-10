import type { CSSProperties } from "react";
import { Fraunces, Manrope } from "next/font/google";
import { getDivisionConfig } from "@henryco/config";

/**
 * Public-surface theme wiring for Henry Onyx Jobs (V3-PUBLIC-REBUILD-jobs).
 *
 * Adopts the locked --home-* design system on the jobs public subtree so the
 * whole marketing experience flips light⇄dark with the page (device or toggle),
 * matching property/studio/hub — while keeping jobs' teal-forest SOUL as the
 * accent. The dashboards (candidate/employer/recruiter) are untouched: they
 * read --jobs-* from :root; this aliases --jobs-* onto theme-aware --home-*
 * ONLY inside the public `.home-accent-scope` wrapper, so existing jobs-styled
 * markup re-tones coherently without a per-component rewrite.
 *
 * Fraunces is the shared editorial display face (next/font dedupes the file
 * across importers). We point both --home-font-display AND --font-jobs-display
 * at it, so .jobs-display / .jobs-heading adopt the serif too.
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

const jobs = getDivisionConfig("jobs");

const SERIF_STACK =
  'var(--font-fraunces), "Iowan Old Style", "Palatino Linotype", "Baskerville", "Times New Roman", Times, serif';

export const JOBS_PUBLIC_THEME_STYLE: CSSProperties = {
  fontFamily: "var(--home-font-sans)",
  // Manrope is the shared public BODY sans (next/font dedupes the file across
  // importers); point --home-font-sans at it so all UI/body copy reads Manrope
  // while Fraunces keeps the display heads + the .hc-prose reading face.
  ["--home-font-sans" as string]:
    'var(--font-manrope-public), system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  // Teal soul. --accent-text is AA on the warm-paper light canvas; the
  // dark variant lifts the teal so it stays AA on the near-black canvas.
  ["--accent" as string]: jobs.accent, // #0E7C86
  ["--accent-text" as string]: "#0B6B74",
  ["--accent-text-dark" as string]: "#5CC9D0",
  ["--home-font-display" as string]: SERIF_STACK,
  ["--font-jobs-display" as string]: SERIF_STACK,
  // Alias the legacy --jobs-* tokens onto theme-aware --home-* equivalents so
  // every jobs-* class (.jobs-panel, .jobs-input, .jobs-kicker, .jobs-table…)
  // re-tones with the page instead of staying on the standalone jobs palette.
  ["--jobs-bg" as string]: "var(--home-canvas)",
  ["--jobs-paper" as string]: "var(--home-sheet)",
  ["--jobs-paper-soft" as string]: "var(--home-surface-04)",
  ["--jobs-surface" as string]: "var(--home-surface-04)",
  ["--jobs-ink" as string]: "var(--home-ink)",
  ["--jobs-muted" as string]: "var(--home-ink-70)",
  ["--jobs-line" as string]: "var(--home-line)",
  ["--jobs-accent" as string]: "var(--home-accent)",
  ["--jobs-accent-soft" as string]: "var(--home-accent-soft)",
  ["--jobs-forest" as string]: "var(--home-accent-text)",
  ["--jobs-brass" as string]: "var(--home-accent-text)",
  ["--jobs-brass-soft" as string]: "var(--home-accent-soft)",
  ["--jobs-shadow" as string]: "0 30px 90px -45px rgb(var(--home-ink-rgb) / 0.18)",
  ["--jobs-shadow-strong" as string]: "0 44px 130px -50px rgb(var(--home-ink-rgb) / 0.24)",
};
