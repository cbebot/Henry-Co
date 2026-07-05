// scripts/font/vendor-fonts.mjs
import { mkdirSync, copyFileSync, globSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const OUT = "packages/ui/fonts";

// [package, lowercase substring filters to pick ONE representative woff2, output name]
const MAP = [
  ["@fontsource-variable/fraunces", ["latin", "normal"], "henryonyx-serif-interim.woff2"],
  ["@fontsource-variable/manrope", ["latin", "normal"], "henryonyx-sans-interim.woff2"],
  ["@fontsource-variable/jetbrains-mono", ["latin", "normal"], "henryonyx-mono-interim.woff2"],
  ["@fontsource/noto-sans-arabic", ["arabic", "400", "normal"], "henryonyx-arabic-interim.woff2"],
  ["@fontsource/noto-sans-sc", ["chinese", "400", "normal"], "henryonyx-cjk-interim.woff2"],
];

mkdirSync(OUT, { recursive: true });
for (const [pkg, filters, outName] of MAP) {
  const pkgJson = require.resolve(`${pkg}/package.json`);
  const pkgDir = pkgJson.slice(0, pkgJson.length - "package.json".length);
  const all = globSync("**/*.woff2", { cwd: pkgDir });
  if (!all.length) throw new Error(`No woff2 in ${pkg}`);
  const lc = (s) => s.toLowerCase();
  // Pick the file matching all filters; relax by dropping the last filter until a match.
  let pick;
  for (let n = filters.length; n >= 0 && !pick; n--) {
    pick = all.find((f) => filters.slice(0, n).every((k) => lc(f).includes(lc(k))));
  }
  pick = pick ?? all[0];
  copyFileSync(join(pkgDir, pick), join(OUT, outName));
  console.log(`vendored ${pkg} -> ${OUT}/${outName} (from ${pick})`);
}
