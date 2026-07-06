import { BRAND_FONT_FAMILIES as F } from "./fonts";
import { onyxTypeLive } from "./flag";

// RN has no CSS cascade, so a font must be named explicitly on every Text style.
// These role tokens mirror the web seam: serif = reading/display, sans = UI/body,
// mono = code/figures. Pre-reveal they resolve to the platform defaults (flag-dark
// parity with web — nothing changes until the flag flips); when live, to the brand.
const SYSTEM = {
  serif: "serif", // iOS ~ Georgia; Android ~ Noto Serif
  sans: "System", // the platform UI sans
  mono: "monospace",
} as const;

export type BrandType = {
  serif: string;
  sans: string;
  sansMedium: string;
  sansBold: string;
  mono: string;
};

/**
 * The owned RN type tokens. Resolve once at app start (the flag is build-time):
 *   const type = brandType();
 *   <Text style={{ fontFamily: type.sans }}>…</Text>
 */
export function brandType(): BrandType {
  const live = onyxTypeLive();
  return {
    serif: live ? F.serif : SYSTEM.serif,
    sans: live ? F.sans : SYSTEM.sans,
    sansMedium: live ? F.sansMedium : SYSTEM.sans,
    sansBold: live ? F.sansBold : SYSTEM.sans,
    mono: live ? F.mono : SYSTEM.mono,
  };
}
