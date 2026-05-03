"use client";

import { HenryCoLogo, type HenryCoLogoTone } from "@henryco/brand";

/**
 * Account-side brand mark.
 *
 * Source of truth: `@henryco/brand` SVG. No image asset, no `next/image` —
 * the mark renders as inline SVG so it inherits accent color, never 404s,
 * and stays pixel-perfect across DPR.
 */
export default function Logo({
  size = 40,
  className = "",
  tone = "default",
  accent,
}: {
  size?: number;
  className?: string;
  tone?: HenryCoLogoTone;
  accent?: string;
}) {
  return (
    <HenryCoLogo
      size={size}
      tone={tone}
      accent={accent}
      className={className}
      label="Henry & Co."
    />
  );
}
