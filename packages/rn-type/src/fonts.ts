// @henryco/rn-type — the React Native half of the owned type system.
//
// packages/ui carries the WEB faces (woff2); this carries the NATIVE faces (ttf,
// what expo-font requires). Both are the SAME drawing behind the SAME stable
// family names, and both read the SAME flag — so web + RN reveal together.
//
// The interim ttf are vendored under ../fonts (Fraunces / Manrope / JetBrains
// Mono). At the owned-type reveal these files swap to the bespoke cut — same
// keys, no app change.

/** The family names expo-font registers the brand faces under. */
export const BRAND_FONT_FAMILIES = {
  serif: "HenryOnyxSerif",
  sans: "HenryOnyxSans",
  sansMedium: "HenryOnyxSans-Medium",
  sansBold: "HenryOnyxSans-Bold",
  mono: "HenryOnyxMono",
} as const;

/**
 * The expo-font asset map. Pass straight to `useFonts()` in each app's root
 * layout: `useFonts(brandFontAssets)`. Metro resolves the bundled ttf.
 */
export const brandFontAssets: Record<string, number> = {
  HenryOnyxSerif: require("../fonts/HenryOnyxSerif.ttf"),
  HenryOnyxSans: require("../fonts/HenryOnyxSans.ttf"),
  "HenryOnyxSans-Medium": require("../fonts/HenryOnyxSans-Medium.ttf"),
  "HenryOnyxSans-Bold": require("../fonts/HenryOnyxSans-Bold.ttf"),
  HenryOnyxMono: require("../fonts/HenryOnyxMono.ttf"),
};
