// Vendor interim brand TTF for React Native (expo-font needs ttf/otf, not woff2).
// Fetches the latin ttf from Google Fonts (no browser UA → Google serves a
// TrueType src) and writes it under packages/rn-type/fonts with STABLE family
// filenames. At the owned-type reveal these files swap to the bespoke ttf cut.
import { mkdirSync, writeFileSync } from "node:fs";

const OUT = "packages/rn-type/fonts";
const MAP = [
  ["Fraunces", 400, "HenryOnyxSerif.ttf"],
  ["Manrope", 400, "HenryOnyxSans.ttf"],
  ["Manrope", 500, "HenryOnyxSans-Medium.ttf"],
  ["Manrope", 700, "HenryOnyxSans-Bold.ttf"],
  ["JetBrains Mono", 400, "HenryOnyxMono.ttf"],
];

async function fetchTtf(family, weight) {
  const url = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:wght@${weight}`;
  const css = await (await fetch(url)).text();
  const m = css.match(/src:\s*url\((https:[^)]+)\)\s*format\('(?:truetype|opentype)'\)/);
  if (!m) throw new Error(`No TTF face for ${family} ${weight} — Google returned:\n${css.slice(0, 300)}`);
  return Buffer.from(await (await fetch(m[1])).arrayBuffer());
}

mkdirSync(OUT, { recursive: true });
for (const [family, weight, out] of MAP) {
  const buf = await fetchTtf(family, weight);
  writeFileSync(`${OUT}/${out}`, buf);
  console.log(`vendored ${family} ${weight} -> ${OUT}/${out} (${(buf.length / 1024).toFixed(1)} KB)`);
}
