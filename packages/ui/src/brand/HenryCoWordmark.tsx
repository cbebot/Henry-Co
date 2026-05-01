import * as React from "react";
import { cn } from "../cn";

/**
 * HenryCoWordmark — the canonical "Henry & Co." set in a refined serif.
 *
 * Design notes (so future iterations stay coherent):
 *   - "Henry" + "Co." in serif (Newsreader / Fraunces / system serif fallback)
 *     at 500 weight. The serif voice lands "heritage and considered" without
 *     being decorative.
 *   - The ampersand is its own micro-statement: italic, slightly smaller,
 *     and lifted to a higher x-height baseline so it reads as a connector
 *     rather than a glyph in line.
 *   - Letter-spacing is tightened to -0.03em across the wordmark and a touch
 *     more around the small-caps "& Co." This matches the rhythm of every
 *     division's display heading.
 *   - All colour comes from `currentColor`, so the mark inherits whatever
 *     wraps it — accent, ink, or paper — without props gymnastics.
 */
export type HenryCoWordmarkProps = Omit<
  React.SVGProps<SVGSVGElement>,
  "viewBox" | "fill"
> & {
  /** Two ways to render the brand name. "full" is the canonical heritage
   * form. "compact" is the modern single-word form for space-constrained
   * surfaces (mobile nav, footers). */
  variant?: "full" | "compact";
  /** Render height in pixels. Width is auto-derived from the viewBox. */
  height?: number;
  /** Sets the underlying font stack — defaults to `"Newsreader"` so the
   * mark looks at home in the jobs / care / property contexts. Override
   * to `"Fraunces"` for marketplace, or fall back to system serif. */
  fontFamily?: string;
  /** Optional accessible label. Defaults to "Henry & Co." */
  label?: string;
};

const FALLBACK_SERIF =
  '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif';

export function HenryCoWordmark({
  variant = "full",
  height = 28,
  fontFamily = "Newsreader",
  label = "Henry & Co.",
  className,
  style,
  role,
  "aria-label": ariaLabel,
  ...rest
}: HenryCoWordmarkProps) {
  const stack = `"${fontFamily}", ${FALLBACK_SERIF}`;
  const accessibleLabel = ariaLabel ?? label;

  // Width tuned per variant to give a snug bounding box without clipping
  // the descenders on "y" or the period on "Co.".
  const viewWidth = variant === "full" ? 320 : 200;
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
      {variant === "full" ? (
        <g
          fill="currentColor"
          style={{ fontFamily: stack, fontFeatureSettings: '"kern" 1, "liga" 1, "calt" 1' }}
        >
          <text
            x={0}
            y={46}
            fontWeight={500}
            fontSize={48}
            letterSpacing="-0.03em"
          >
            Henry
          </text>
          {/* Italic ampersand, lifted slightly into the cap-height band so
              it reads as a tasteful connector. */}
          <text
            x={148}
            y={42}
            fontStyle="italic"
            fontWeight={400}
            fontSize={36}
            letterSpacing="-0.01em"
            opacity={0.92}
          >
            &amp;
          </text>
          <text
            x={186}
            y={46}
            fontWeight={500}
            fontSize={48}
            letterSpacing="-0.03em"
          >
            Co.
          </text>
        </g>
      ) : (
        <g
          fill="currentColor"
          style={{ fontFamily: stack, fontFeatureSettings: '"kern" 1, "liga" 1' }}
        >
          <text
            x={0}
            y={46}
            fontWeight={600}
            fontSize={48}
            letterSpacing="-0.04em"
          >
            HenryCo
          </text>
        </g>
      )}
    </svg>
  );
}
