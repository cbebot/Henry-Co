// scripts/font/font-coverage.mjs
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import * as fontkit from "fontkit";
import { FACES } from "./coverage-config.mjs";

export function blockCodePoints({ start, end }) {
  const out = [];
  for (let cp = start; cp <= end; cp++) out.push(cp);
  return out;
}

export function missingCodePoints(font, codePoints) {
  return codePoints.filter((cp) => !font.hasGlyphForCodePoint(cp));
}

export function coverageReport({ faces }) {
  const report = [];
  for (const face of faces) {
    const font = fontkit.openSync(face.file);
    for (const block of face.blocks) {
      const missing = missingCodePoints(font, blockCodePoints(block)).length;
      report.push({ face: face.label, block: block.name, missing });
    }
  }
  return report;
}

function main() {
  const strict = process.argv.includes("--strict");
  const report = coverageReport({ faces: FACES });
  const gaps = report.filter((r) => r.missing > 0);
  for (const r of report) {
    const mark = r.missing === 0 ? "✓" : strict ? "✗" : "⚠";
    console.log(`${mark} ${r.face} · ${r.block} · ${r.missing} missing`);
  }
  if (gaps.length) {
    console.log(`\nfont:coverage — ${gaps.length} block(s) with gaps (${strict ? "error-mode" : "warn-mode"})`);
    if (strict) process.exit(1);
  } else {
    console.log("\nfont:coverage: OK — every required block is fully covered");
  }
}

const invokedDirectly = (() => {
  try {
    return process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
  } catch {
    return false;
  }
})();
if (invokedDirectly) main();
