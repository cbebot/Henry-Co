import * as React from "react";
import { cn } from "../cn";

/**
 * HenryCoMonogram — a path-based "H&Co" lockup designed for favicons,
 * app icons, and any small surface where a wordmark would be illegible.
 *
 * Why pure paths instead of <text>: at favicon sizes, anti-aliasing on
 * webfont text varies wildly across renderers. Drawing the glyphs as
 * paths guarantees the same crisp lockup at 16px, 32px, and 192px.
 *
 * Composition:
 *   - "H" anchors the lockup, drawn with a serif voice (subtle bracket
 *     serifs, light contrast) so it reads as intentional rather than
 *     a default sans capital.
 *   - "&Co" sits as a small caption inside the lower-right negative
 *     space of the H. The "&" is a hairline italic curve; "Co" caps
 *     follow as small-caps.
 *   - A 4-unit copper accent rule under "&Co" anchors the lockup
 *     visually and is the only piece that takes the brand accent.
 *
 * All shapes draw with `currentColor`. The accent rule takes the
 * `accent` prop (defaults to the HenryCo signature copper).
 */
export type HenryCoMonogramProps = Omit<
  React.SVGProps<SVGSVGElement>,
  "viewBox" | "fill"
> & {
  size?: number;
  accent?: string;
  label?: string;
};

export function HenryCoMonogram({
  size = 32,
  accent = "#C9A227",
  label = "Henry & Co.",
  className,
  style,
  role,
  "aria-label": ariaLabel,
  ...rest
}: HenryCoMonogramProps) {
  const accessibleLabel = ariaLabel ?? label;

  return (
    <svg
      role={role ?? "img"}
      aria-label={accessibleLabel}
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={cn("inline-block align-middle", className)}
      style={{ color: "currentColor", ...style }}
      {...rest}
    >
      <title>{accessibleLabel}</title>

      {/* Serif H — drawn as two stems + a crossbar, with subtle bracket
          serifs at top and bottom of each stem. Numbers are in viewBox
          units (0-64). */}
      <g fill="currentColor">
        {/* Left stem */}
        <path d="M9 7 H17 V57 H9 Z" />
        {/* Subtle top bracket serifs (left stem) */}
        <path d="M6.5 7 H19.5 V9 H6.5 Z" />
        {/* Subtle bottom bracket serifs (left stem) */}
        <path d="M6.5 55 H19.5 V57 H6.5 Z" />

        {/* Right stem */}
        <path d="M37 7 H45 V57 H37 Z" />
        {/* Top bracket serifs (right stem) */}
        <path d="M34.5 7 H47.5 V9 H34.5 Z" />
        {/* Bottom bracket serifs (right stem) */}
        <path d="M34.5 55 H47.5 V57 H34.5 Z" />

        {/* Crossbar — slightly above optical centre so it reads classical */}
        <path d="M9 28 H45 V34 H9 Z" />
      </g>

      {/* "&Co" subtle caption — placed under the right stem in negative
          space outside the H bounding box. Set in italic small-caps via
          font features; the SVG will render with the nearest available
          serif and `font-variant: small-caps`. */}
      <g
        fill="currentColor"
        opacity={0.78}
        style={{
          fontFamily:
            'var(--hc-font-serif), "Source Serif 4", ui-serif, Georgia, Cambria, "Times New Roman", serif',
          fontFeatureSettings: '"smcp" 1, "kern" 1',
          fontVariant: "small-caps",
        }}
      >
        <text
          x={49.5}
          y={53}
          fontStyle="italic"
          fontWeight={400}
          fontSize={11}
          letterSpacing="0.04em"
        >
          &amp;Co
        </text>
      </g>

      {/* Brand-accent rule under the &Co lockup — the only colour
          flourish. Width and position tuned to the &Co block. */}
      <rect x={49.5} y={56} width={11.5} height={1.6} fill={accent} />
    </svg>
  );
}
