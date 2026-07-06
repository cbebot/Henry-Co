// packages/ui/src/fonts/brand-type.ts
import localFont from "next/font/local";

// Interim self-hosted Latin faces. The bespoke woff2 drop into these same paths
// on reveal (Track A). adjustFontFallback:false + NO `fallback` array is
// DELIBERATE: next/font must not append a system font (Georgia/Arial/serif) to
// --font-brand-*, or that generic would sit AHEAD of the owned Arabic/CJK
// companions in the globals.css token stack and intercept non-Latin glyphs in a
// SYSTEM font (proven live: companions stayed `unloaded`). The CSS token layer
// owns the entire OWNED-only chain: brand face -> owned companions -> a generic
// the coverage gate proves unreachable. (Interim load FOUT accepted, spec §14#2.)
export const brandSerif = localFont({
  src: [{ path: "../../fonts/henryonyx-serif-interim.woff2", weight: "100 900", style: "normal" }],
  variable: "--font-brand-serif",
  display: "swap",
  preload: false, // preload flips true at reveal — keeps flag-dark dark for payload too
  adjustFontFallback: false,
});

export const brandSans = localFont({
  src: [{ path: "../../fonts/henryonyx-sans-interim.woff2", weight: "100 900", style: "normal" }],
  variable: "--font-brand-sans",
  display: "swap",
  preload: false, // preload flips true at reveal — keeps flag-dark dark for payload too
  adjustFontFallback: false,
});

export const brandMono = localFont({
  src: [{ path: "../../fonts/henryonyx-mono-interim.woff2", weight: "100 900", style: "normal" }],
  variable: "--font-brand-mono",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});

export const brandFontVariables = `${brandSerif.variable} ${brandSans.variable} ${brandMono.variable}`;
