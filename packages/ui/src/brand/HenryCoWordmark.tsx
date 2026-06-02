import * as React from "react";
import { cn } from "../cn";

/**
 * HenryCoWordmark — the canonical "Henry Onyx" set in a refined serif.
 *
 * (File/identifier name keeps the internal "HenryCo" shorthand; the rendered
 * brand is always "Henry Onyx" per V3-IDENTITY-01.)
 *
 * Design notes (so future iterations stay coherent):
 *   - "Henry" set upright in serif (Newsreader / Fraunces / system serif
 *     fallback) at 500 weight — heritage and considered, never decorative.
 *   - "Onyx" — the gemstone, the soul of the name — is the single distinctive
 *     flourish: italic, same weight, letting the jewel-word carry the lift the
 *     old italic ampersand used to. No ampersand anymore.
 *   - Letter-spacing tightened to -0.03em across the wordmark; a touch looser
 *     on the italic "Onyx" so the slant breathes. This matches the rhythm of
 *     every division's display heading.
 *   - All colour comes from `currentColor`, so the mark inherits whatever
 *     wraps it — accent, ink, or paper — without props gymnastics.
 */
export type HenryCoWordmarkProps = Omit<
  React.SVGProps<SVGSVGElement>,
  "viewBox" | "fill"
> & {
  /** Two ways to render the brand name. "full" is the canonical form with the
   * italic gemstone "Onyx". "compact" is a tighter single-line lockup for
   * space-constrained surfaces (mobile nav, footers). */
  variant?: "full" | "compact";
  /** Render height in pixels. Width is auto-derived from the viewBox. */
  height?: number;
  /** Sets the underlying font stack — defaults to `"Newsreader"` so the
   * mark looks at home in the jobs / care / property contexts. Override
   * to `"Fraunces"` for marketplace/studio, or fall back to system serif. */
  fontFamily?: string;
  /** Optional accessible label. Defaults to "Henry Onyx". */
  label?: string;
};

const FALLBACK_SERIF =
  '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif';

export function HenryCoWordmark({
  variant = "full",
  height = 28,
  fontFamily = "Newsreader",
  label = "Henry Onyx",
  className,
  style,
  role,
  "aria-label": ariaLabel,
  ...rest
}: HenryCoWordmarkProps) {
  const stack = `"${fontFamily}", ${FALLBACK_SERIF}`;
  const accessibleLabel = ariaLabel ?? label;

  // Width tuned per variant to give a snug bounding box without clipping the
  // descenders on "y" or the italic overshoot on "Onyx".
  const viewWidth = variant === "full" ? 300 : 280;
  const viewHeight = 64;

  return (
    <svg
      role={role ?? "img"}
      aria-label={accessibleLabel}
      viewBox={`0 0 ${viewWidth} ${viewHeight}`}
      width={(viewWidth / viewHeight) * height}
      height={height}
      className={cn("inline-block align-middle", className)}
      style={{ color: "currentColor", ...style }}
      {...rest}
    >
      <title>{accessibleLabel}</title>
      <g
        fill="currentColor"
        style={{ fontFamily: stack, fontFeatureSettings: '"kern" 1, "liga" 1, "calt" 1' }}
      >
        <text
          x={0}
          y={46}
          fontWeight={500}
          fontSize={variant === "full" ? 48 : 44}
          letterSpacing="-0.03em"
        >
          Henry
        </text>
        {/* "Onyx" — the gemstone, the soul of the brand: italic, the single
            distinctive flourish (it carries the lift the ampersand once did). */}
        <text
          x={variant === "full" ? 150 : 138}
          y={46}
          fontStyle="italic"
          fontWeight={500}
          fontSize={variant === "full" ? 48 : 44}
          letterSpacing="-0.02em"
        >
          Onyx
        </text>
      </g>
    </svg>
  );
}
