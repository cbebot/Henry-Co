import "server-only";

import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

import { Font } from "@react-pdf/renderer";
import { fonts } from "../tokens";

let registered = false;

const req = createRequire(import.meta.url);

/**
 * Resolve a font specifier into a file:// URL that @react-pdf/renderer can
 * stream. Returns null when the file isn't installed (e.g. an upstream font
 * package shipped only `.woff`/`.woff2` and the matching `.ttf` is missing).
 *
 * PASS 22 issue #5 — earlier code threw whenever a single specifier failed
 * to resolve, which crashed the whole PDF render and surfaced as
 * "We couldn't prepare that document. Please try again." in the UI. We now
 * collect the survivors and let `@react-pdf/renderer` fall back to its
 * built-in PDF base fonts (Helvetica / Times / Courier) when a family has
 * zero usable variants — the document still ships, brand styling degrades
 * gracefully instead of failing closed.
 */
function tryLoadFont(specifier: string): string | null {
  try {
    return pathToFileURL(req.resolve(specifier)).href;
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[branded-documents] font specifier could not be resolved; falling back to base fonts:",
        specifier,
        err instanceof Error ? err.message : err,
      );
    }
    return null;
  }
}

type Variant = { specifier: string; fontWeight: number; fontStyle?: "italic" };

function registerFamily(family: string, variants: ReadonlyArray<Variant>) {
  const resolved = variants.flatMap((v) => {
    const src = tryLoadFont(v.specifier);
    if (!src) return [];
    return [{ src, fontWeight: v.fontWeight, ...(v.fontStyle ? { fontStyle: v.fontStyle } : {}) }];
  });
  // If every variant failed, skip Font.register entirely — react-pdf will
  // resolve the family name through its built-in base font fallbacks.
  if (resolved.length === 0) return;
  Font.register({ family, fonts: resolved });
}

export function registerFonts() {
  if (registered) return;
  registered = true;

  // @fontsource v5+ ships only `.woff` / `.woff2` — no `.ttf`. The
  // previous code asked for `.ttf` which threw at `req.resolve()`, killing
  // the whole render. fontkit (used by @react-pdf/renderer) parses `.woff`
  // natively, so we point at the actual files.
  registerFamily(fonts.serif, [
    { specifier: "@fontsource/newsreader/files/newsreader-latin-400-normal.woff", fontWeight: 400 },
    { specifier: "@fontsource/newsreader/files/newsreader-latin-500-normal.woff", fontWeight: 500 },
    { specifier: "@fontsource/newsreader/files/newsreader-latin-600-normal.woff", fontWeight: 600 },
    { specifier: "@fontsource/newsreader/files/newsreader-latin-700-normal.woff", fontWeight: 700 },
    { specifier: "@fontsource/newsreader/files/newsreader-latin-400-italic.woff", fontWeight: 400, fontStyle: "italic" },
  ]);

  registerFamily(fonts.sans, [
    { specifier: "@fontsource/inter/files/inter-latin-400-normal.woff", fontWeight: 400 },
    { specifier: "@fontsource/inter/files/inter-latin-500-normal.woff", fontWeight: 500 },
    { specifier: "@fontsource/inter/files/inter-latin-600-normal.woff", fontWeight: 600 },
    { specifier: "@fontsource/inter/files/inter-latin-700-normal.woff", fontWeight: 700 },
  ]);

  registerFamily(fonts.mono, [
    { specifier: "@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff", fontWeight: 400 },
    { specifier: "@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff", fontWeight: 500 },
  ]);

  Font.registerHyphenationCallback((word) => [word]);
}
