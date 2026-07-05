// scripts/font/token-integrity.mjs
import { readFileSync, globSync, realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

export function collectDefined(css) {
  const defined = new Set();
  const re = /(--hc-font-[a-z0-9-]+)\s*:/g;
  let m;
  while ((m = re.exec(css))) defined.add(m[1]);
  return defined;
}

export function collectRefs(css) {
  const refs = [];
  const re = /var\(\s*(--hc-font-[a-z0-9-]+)/g;
  let m;
  while ((m = re.exec(css))) refs.push(m[1]);
  return refs;
}

export function analyzeFontTokens({ seamCss, appFiles }) {
  const defined = collectDefined(seamCss);
  const undefinedRefs = [];
  for (const { file, css } of appFiles) {
    for (const token of collectRefs(css)) {
      if (!defined.has(token)) undefinedRefs.push({ file, token });
    }
  }
  return { defined, undefinedRefs };
}

function main() {
  const seamCss = readFileSync("packages/ui/src/styles/globals.css", "utf8");
  const appFiles = globSync("apps/*/app/**/*.css").map((file) => ({
    file,
    css: readFileSync(file, "utf8"),
  }));
  const { undefinedRefs } = analyzeFontTokens({ seamCss, appFiles });
  if (undefinedRefs.length) {
    for (const r of undefinedRefs) {
      console.error(`✗ undefined --hc-font token ${r.token} referenced in ${r.file}`);
    }
    process.exit(1);
  }
  console.log("token-integrity: OK — every --hc-font-* reference is defined in the seam");
}

const invokedDirectly = (() => {
  try {
    return process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
  } catch {
    return false;
  }
})();
if (invokedDirectly) main();
