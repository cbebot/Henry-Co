import "server-only";

import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

import { Font } from "@react-pdf/renderer";
import { fonts } from "../tokens";

let registered = false;

const req = createRequire(import.meta.url);

function loadFont(specifier: string) {
  return pathToFileURL(req.resolve(specifier)).href;
}

export function registerFonts() {
  if (registered) return;
  registered = true;

  Font.register({
    family: fonts.serif,
    fonts: [
      { src: loadFont("@fontsource/newsreader/files/newsreader-latin-400-normal.ttf"), fontWeight: 400 },
      { src: loadFont("@fontsource/newsreader/files/newsreader-latin-500-normal.ttf"), fontWeight: 500 },
      { src: loadFont("@fontsource/newsreader/files/newsreader-latin-600-normal.ttf"), fontWeight: 600 },
      { src: loadFont("@fontsource/newsreader/files/newsreader-latin-700-normal.ttf"), fontWeight: 700 },
      { src: loadFont("@fontsource/newsreader/files/newsreader-latin-400-italic.ttf"), fontWeight: 400, fontStyle: "italic" },
    ],
  });

  Font.register({
    family: fonts.sans,
    fonts: [
      { src: loadFont("@fontsource/inter/files/inter-latin-400-normal.ttf"), fontWeight: 400 },
      { src: loadFont("@fontsource/inter/files/inter-latin-500-normal.ttf"), fontWeight: 500 },
      { src: loadFont("@fontsource/inter/files/inter-latin-600-normal.ttf"), fontWeight: 600 },
      { src: loadFont("@fontsource/inter/files/inter-latin-700-normal.ttf"), fontWeight: 700 },
    ],
  });

  Font.register({
    family: fonts.mono,
    fonts: [
      { src: loadFont("@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.ttf"), fontWeight: 400 },
      { src: loadFont("@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.ttf"), fontWeight: 500 },
    ],
  });

  Font.registerHyphenationCallback((word) => [word]);
}
