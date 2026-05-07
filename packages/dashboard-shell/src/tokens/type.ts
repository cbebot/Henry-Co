/**
 * @henryco/dashboard-shell — type tokens.
 *
 * The HenryCo type scale: clear hierarchy, no oversized landing-style
 * heroes. Closes feedback `feedback_no_giant_hero_text.md` (in shell:
 * the IdentityBar role pill is small uppercase, not 32px hero text;
 * the WorkspaceSlot section headers are calm 14px kickers + 18-20px
 * headlines).
 *
 * Stack matches V2-EMAIL-BRAND-01 and the brand wordmark: Source Serif
 * 4 for accents (rare, used in PageHeader title), Inter for everything
 * else. Both fonts are loaded by the host app via Next/Font; the shell
 * just references the CSS variable names.
 */

/**
 * Font family CSS variables. Host apps wire these via `next/font`
 * (`apps/account/app/layout.tsx`) and the shell consumes the variable
 * names — never the family literal — so swapping fonts at the host
 * level doesn't require shell changes.
 */
export const FONT_VARS = {
  serif: "var(--font-source-serif, ui-serif, Georgia, serif)",
  sans: "var(--font-inter, ui-sans-serif, system-ui, sans-serif)",
} as const;

/**
 * The type scale. Pixel-equivalent rem values for clarity; consumers
 * apply via inline `style` or via Tailwind's `text-[var(--hc-type-X)]`
 * pattern.
 *
 * Hierarchy intent:
 *   - kicker: section labels, all-caps, 0.16em letter-spacing
 *   - eyebrow: meta labels above headlines
 *   - headline: section titles
 *   - title: page titles
 *   - heroTitle: shell-chrome IdentityBar app name
 *   - body: paragraph text
 *   - small: captions, timestamps
 *   - micro: chip / badge text
 */
export const TYPE_SCALE = {
  micro: { size: "0.65rem", weight: 600, lineHeight: 1.2, tracking: "0.14em" },
  small: { size: "0.75rem", weight: 500, lineHeight: 1.45, tracking: "0" },
  body: { size: "0.875rem", weight: 400, lineHeight: 1.55, tracking: "0" },
  bodyStrong: { size: "0.875rem", weight: 600, lineHeight: 1.45, tracking: "0" },
  kicker: { size: "0.7rem", weight: 600, lineHeight: 1.2, tracking: "0.16em" },
  eyebrow: { size: "0.7rem", weight: 500, lineHeight: 1.2, tracking: "0.18em" },
  headline: { size: "1.125rem", weight: 600, lineHeight: 1.35, tracking: "-0.005em" },
  title: { size: "1.5rem", weight: 700, lineHeight: 1.25, tracking: "-0.012em" },
  heroTitle: { size: "1.875rem", weight: 700, lineHeight: 1.2, tracking: "-0.015em" },
} as const;

/**
 * Build the inline style object for a given scale key. Components
 * compose this with their own className for layout/color so the type
 * tokens stay separable from the rest of the styling.
 *
 * Example:
 *   <p style={typeStyle("kicker")} className="text-[var(--hc-ink-muted)]">
 *     Section
 *   </p>
 */
export function typeStyle(key: keyof typeof TYPE_SCALE): React.CSSProperties {
  const t = TYPE_SCALE[key];
  return {
    fontFamily: FONT_VARS.sans,
    fontSize: t.size,
    fontWeight: t.weight,
    lineHeight: t.lineHeight,
    letterSpacing: t.tracking,
    textTransform: key === "kicker" || key === "eyebrow" || key === "micro" ? "uppercase" : undefined,
  };
}

// Re-import the React typing for the helper above. Keeping this at the
// bottom so the rest of the file reads as plain config.
import type * as React from "react";
