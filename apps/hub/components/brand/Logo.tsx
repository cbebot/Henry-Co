"use client";

import { HenryCoLogo, type HenryCoLogoTone } from "@henryco/brand";

/**
 * Hub-side brand mark.
 *
 * Source of truth: `@henryco/brand` SVG. No image asset is loaded — the mark
 * is drawn so it never 404s, scales crisply, and inherits the surface's
 * accent color when needed.
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
