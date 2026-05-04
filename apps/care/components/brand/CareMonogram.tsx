import * as React from "react";

/**
 * CareMonogram — the Henry & Co. Fabric Care brand mark.
 *
 * Sub-brand relationship to the parent: same serif H armature as the
 * HenryCoMonogram (so Care reads as part of the family), but the
 * lower-right caption shifts from "&Co" to "Care" small-caps and the
 * accent rule moves from copper to Care periwinkle (#6B7CFF). The
 * caption also picks up a tiny droplet glyph above the rule — a
 * deliberately quiet motif that reads as "fabric care" rather than
 * generic identity, without crossing the line into clip-art.
 *
 * Why pure paths for the H + droplet: at favicon sizes (16/32px),
 * anti-aliased webfont rendering varies wildly across browsers. Paths
 * stay crisp. The "Care" caption stays as <text> because it only
 * renders at sizes where serif kerning and small-caps are reliable.
 *
 * All H/caption shapes draw with `currentColor`. The accent rule and
 * droplet take the `accent` prop (defaults to Care periwinkle).
 */
export type CareMonogramProps = Omit<
  React.SVGProps<SVGSVGElement>,
  "viewBox" | "fill"
> & {
  size?: number;
  accent?: string;
  label?: string;
};

export function CareMonogram({
  size = 32,
  accent = "#6B7CFF",
  label = "Henry & Co. Fabric Care",
  className,
  style,
  role,
  "aria-label": ariaLabel,
  ...rest
}: CareMonogramProps) {
  const accessibleLabel = ariaLabel ?? label;

  return (
    <svg
      role={role ?? "img"}
      aria-label={accessibleLabel}
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      style={{ color: "currentColor", display: "inline-block", verticalAlign: "middle", ...style }}
      {...rest}
    >
      <title>{accessibleLabel}</title>

      {/* Serif H — identical armature to the parent monogram so Care
          reads as part of the Henry & Co. family. */}
      <g fill="currentColor">
        <path d="M9 7 H17 V57 H9 Z" />
        <path d="M6.5 7 H19.5 V9 H6.5 Z" />
        <path d="M6.5 55 H19.5 V57 H6.5 Z" />

        <path d="M37 7 H45 V57 H37 Z" />
        <path d="M34.5 7 H47.5 V9 H34.5 Z" />
        <path d="M34.5 55 H47.5 V57 H34.5 Z" />

        <path d="M9 28 H45 V34 H9 Z" />
      </g>

      {/* Quiet droplet glyph — sits above the accent rule, suggesting
          fabric care without becoming clip-art. */}
      <path
        d="M55.25 44.6
           C 55.25 47.0  53.6 48.7  51.5 48.7
           C 49.4 48.7  47.75 47.0  47.75 44.6
           C 47.75 42.4  49.7 40.0  51.5 38.4
           C 53.3 40.0  55.25 42.4  55.25 44.6 Z"
        fill={accent}
        opacity={0.92}
      />

      {/* "Care" small-caps caption replacing the parent's "&Co". */}
      <g
        fill="currentColor"
        opacity={0.84}
        style={{
          fontFamily: "var(--hc-font-serif)",
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
          letterSpacing="0.06em"
        >
          Care
        </text>
      </g>

      {/* Care periwinkle accent rule under the "Care" caption — the
          only piece that visually distinguishes Care from the parent
          mark at a glance. */}
      <rect x={49.5} y={56} width={13.5} height={1.6} fill={accent} />
    </svg>
  );
}
