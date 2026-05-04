/**
 * @henryco/ui/brand-typography
 *
 * The single, canonical typography source for every HenryCo Next.js
 * surface (hub, account, care, studio, marketplace, jobs, learn,
 * logistics, property). Email + PDF + OG surfaces import the *stacks*
 * (string fallbacks) from here too so the brand stays unified across
 * channels that cannot load `next/font`.
 *
 * Why a single module:
 * - Pre-this-pass, every app called `next/font/google` itself with a
 *   different family (Plus Jakarta Sans, Manrope, Fraunces, Newsreader,
 *   Cormorant Garamond, local Aptos clones). The brand drifted across
 *   subdomains. Now every Next surface imports `henrycoFontVariables`
 *   here and gets the same family + the same CSS variable names.
 * - `next/font/google` invocations *must* be at module top-level so
 *   the bundler can statically extract them. Centralising them here
 *   means apps still get self-hosted fonts with display:swap and the
 *   correct preload behaviour, but never have to think about which
 *   family they should be using.
 *
 * Fonts:
 *   Source Serif 4 — premium editorial display serif. Used for hero
 *     headings, marketing H1/H2, editorial sections, premium callouts.
 *   Inter — operating sans. Used for body, navigation, buttons, forms,
 *     tables, dashboards, prices, labels. Default for everything that
 *     is not a deliberate marketing/editorial heading.
 *   JetBrains Mono — code, numerics that need tabular alignment,
 *     monospace UI affordances. Optional; not preloaded.
 */

import { Inter, Source_Serif_4, JetBrains_Mono } from "next/font/google";

/**
 * Inter (variable, latin) → `var(--font-henryco-sans)`.
 *
 * Loaded with display:swap and `adjustFontFallback` enabled (default)
 * so the fallback metrics line up with Inter and there is no layout
 * shift when the web font swaps in. This is the *operating* font for
 * every UI surface.
 */
export const henrycoSans = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-henryco-sans",
  weight: ["400", "500", "600", "700", "800"],
  fallback: [
    "ui-sans-serif",
    "system-ui",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "Helvetica Neue",
    "Arial",
    "sans-serif",
  ],
});

/**
 * Source Serif 4 (variable, latin) → `var(--font-henryco-serif)`.
 *
 * The premium editorial face. Reserved for hero headings, marketing
 * display copy, and selected high-level section heads. NOT used for
 * body text, dashboards, tables, forms, or any operational surface
 * (see "Typography usage rules" in CLAUDE typography pass spec).
 */
export const henrycoSerif = Source_Serif_4({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-henryco-serif",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  fallback: [
    "ui-serif",
    "Georgia",
    "Cambria",
    "Times New Roman",
    "serif",
  ],
});

/**
 * JetBrains Mono (latin) → `var(--font-henryco-mono)`.
 *
 * Used by code blocks, tabular numerics, and monospace affordances in
 * staff/admin surfaces. Not preloaded — apps that never render
 * monospace pay no font-loading cost.
 */
export const henrycoMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-henryco-mono",
  weight: ["400", "500", "600"],
  fallback: [
    "ui-monospace",
    "SFMono-Regular",
    "SF Mono",
    "Menlo",
    "Monaco",
    "Consolas",
    "Liberation Mono",
    "Courier New",
    "monospace",
  ],
  preload: false,
});

/**
 * Concatenated CSS variable class names for an `<html>` or `<body>`
 * element. Apply this *and* render normally — every shared component
 * reads from `var(--font-henryco-sans)` / `var(--font-henryco-serif)`,
 * so once the variables are present on the document the whole tree
 * uses the right font.
 *
 * Usage in a Next.js root layout:
 * ```tsx
 * import { henrycoFontVariables } from "@henryco/ui/brand-typography";
 *
 * <html lang={lang} className={henrycoFontVariables}>
 *   <body className="font-sans">...</body>
 * </html>
 * ```
 */
export const henrycoFontVariables = `${henrycoSans.variable} ${henrycoSerif.variable} ${henrycoMono.variable}`;

/**
 * Same as `henrycoFontVariables` but excludes mono — for apps that
 * never render code or tabular monospace and want to avoid the extra
 * variable definition on the root element. Mono is `preload: false`
 * either way, so the size win here is minimal; this is mostly an
 * intent flag.
 */
export const henrycoFontVariablesNoMono = `${henrycoSans.variable} ${henrycoSerif.variable}`;

/**
 * The Inter `.className` — apply directly to a node when you need the
 * font to take effect WITHOUT relying on `font-family` cascading
 * through CSS. Most callers should use `henrycoFontVariables` on the
 * root and `var(--font-henryco-sans)` in CSS instead.
 */
export const henrycoSansClassName = henrycoSans.className;

/** The Source Serif 4 `.className`. See note on `henrycoSansClassName`. */
export const henrycoSerifClassName = henrycoSerif.className;

/** The JetBrains Mono `.className`. See note on `henrycoSansClassName`. */
export const henrycoMonoClassName = henrycoMono.className;

/** The literal CSS variable name for the brand sans font. */
export const fontSansVariable = "--font-henryco-sans" as const;

/** The literal CSS variable name for the brand serif font. */
export const fontSerifVariable = "--font-henryco-serif" as const;

/** The literal CSS variable name for the brand mono font. */
export const fontMonoVariable = "--font-henryco-mono" as const;

/**
 * The system fallback stack — used as the *value* part of every
 * font-family declaration that references a brand variable. Kept here
 * so app-level globals.css can compose:
 *
 * ```css
 * --font-studio-sans: var(--font-henryco-sans), Inter, ui-sans-serif, system-ui, sans-serif;
 * ```
 *
 * Each entry is intentional: ui-sans-serif resolves to the platform's
 * native UI font when present, system-ui is the html-spec name, and
 * the macOS / Windows / Linux fallbacks below cover the long tail.
 */
export const SYSTEM_SANS_STACK = [
  "ui-sans-serif",
  "system-ui",
  "-apple-system",
  "BlinkMacSystemFont",
  "Segoe UI",
  "Roboto",
  "Helvetica Neue",
  "Arial",
  "sans-serif",
] as const;

/** Companion stack for the brand serif. See note on SYSTEM_SANS_STACK. */
export const SYSTEM_SERIF_STACK = [
  "ui-serif",
  "Georgia",
  "Cambria",
  "Times New Roman",
  "serif",
] as const;

/** Companion stack for monospace. See note on SYSTEM_SANS_STACK. */
export const SYSTEM_MONO_STACK = [
  "ui-monospace",
  "SFMono-Regular",
  "SF Mono",
  "Menlo",
  "Monaco",
  "Consolas",
  "Liberation Mono",
  "Courier New",
  "monospace",
] as const;

/**
 * Email-safe sans stack. Email clients cannot self-host or preload
 * web fonts reliably (Outlook strips @font-face, Gmail rewrites it,
 * Apple Mail honours it inconsistently across iOS/macOS). So email
 * leads with `Inter` for clients that *can* load it, then a chain of
 * widely-available system fonts so unloaded clients still feel
 * HenryCo-clean.
 */
export const EMAIL_FONT_STACK =
  "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

/**
 * Email-safe serif stack. Used only for premium headings in
 * editorial-style emails (newsletters, occasional Studio/Property
 * announcements). Body copy in email always uses EMAIL_FONT_STACK.
 */
export const EMAIL_SERIF_STACK =
  "'Source Serif 4', Georgia, Cambria, 'Times New Roman', serif";

/**
 * Typography tokens shared with TypeScript callers (PDF renderers,
 * canvas layout helpers, OG generators that need explicit numbers).
 * Mirrors the CSS variables in packages/ui/src/styles/globals.css.
 *
 * The CSS source of truth is the stylesheet — these constants exist
 * for places that cannot read CSS variables (server-side @react-pdf
 * renders, edge runtime ImageResponse).
 */
export const typographyTokens = {
  size: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    displaySm: 28,
    displayMd: 36,
    displayLg: 48,
    displayXl: 64,
  },
  lineHeight: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 28,
    xl: 30,
    displaySm: 32,
    displayMd: 40,
    displayLg: 52,
    displayXl: 64,
  },
  tracking: {
    tight: "-0.02em",
    snug: "-0.012em",
    base: "0em",
    eyebrow: "0.22em",
    eyebrowTight: "0.18em",
  },
  weight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    black: 800,
  },
} as const;

export type HenryCoTypographyTokens = typeof typographyTokens;
