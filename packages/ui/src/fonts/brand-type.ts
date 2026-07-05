// packages/ui/src/fonts/brand-type.ts
import localFont from "next/font/local";

// Interim self-hosted Latin faces. The bespoke woff2 drop into these same paths
// on reveal (Track A). The `fallback` arrays are next/font's load-window metric
// placeholders ONLY; the settled, rendered stacks are the OWNED-only CSS token
// chains in globals.css. (Interim exception per spec §14#2.)
export const brandSerif = localFont({
  src: [{ path: "../../fonts/henryonyx-serif-interim.woff2", weight: "100 900", style: "normal" }],
  variable: "--font-brand-serif",
  display: "swap",
  preload: true,
  fallback: ["Georgia", "serif"],
});

export const brandSans = localFont({
  src: [{ path: "../../fonts/henryonyx-sans-interim.woff2", weight: "100 900", style: "normal" }],
  variable: "--font-brand-sans",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "sans-serif"],
});

export const brandMono = localFont({
  src: [{ path: "../../fonts/henryonyx-mono-interim.woff2", weight: "100 900", style: "normal" }],
  variable: "--font-brand-mono",
  display: "swap",
  preload: false,
  fallback: ["ui-monospace", "monospace"],
});

export const brandFontVariables = `${brandSerif.variable} ${brandSans.variable} ${brandMono.variable}`;
