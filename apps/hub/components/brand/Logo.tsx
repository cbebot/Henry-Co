"use client";

import { HenryCoMonogram } from "@henryco/ui/brand";

/**
 * Hub-side brand mark.
 *
 * Source of truth: the canonical `HenryCoMonogram` from `@henryco/ui/brand`
 * (the path-based H + small-caps "&Co" + copper accent rule that's wired
 * across all 9 division shells). No image asset is loaded — the mark is
 * drawn as inline SVG so it never 404s, stays pixel-perfect at every DPR,
 * and inherits the surface's text color via currentColor.
 *
 * `tone` is accepted for API compatibility with the prior @henryco/brand
 * Logo wrapper but is ignored at the rendering layer (HenryCoMonogram
 * always uses currentColor + the copper accent rule). Pass `accent` to
 * override the rule color per surface.
 */
export default function Logo({
  size = 40,
  className = "",
  accent,
}: {
  size?: number;
  className?: string;
  tone?: string;
  accent?: string;
}) {
  return (
    <HenryCoMonogram
      size={size}
      accent={accent}
      className={className}
      label="Henry & Co."
    />
  );
}
