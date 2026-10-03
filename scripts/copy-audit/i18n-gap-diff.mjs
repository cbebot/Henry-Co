#!/usr/bin/env node
/**
 * COPY-RESET — prove a copy cut added no hardcoded strings.
 *
 * The strict i18n gate fingerprints gaps by file:LINE:kind:text, so deleting
 * lines above an old (baselined) literal re-keys it as "new". This scans to a
 * temp file and compares gap sets with line numbers dropped:
 *   genuinely new = (file, kind, text) present now but not in the baseline.
 * Exit 1 if any genuinely new gap exists; otherwise it is safe to refresh the
 * dated baseline (`node scripts/v3/hardcoded-text-scan.mjs`).
 */
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const dir = join("docs", "v3", "i18n-gaps");
const baseline = readdirSync(dir).filter((n) => /^hardcoded-scan-\d{4}-\d{2}-\d{2}\.json$/.test(n)).sort().pop();
const out = join(mkdtempSync(join(tmpdir(), "gapdiff-")), "scan.json");
const r = spawnSync(process.execPath, ["scripts/v3/hardcoded-text-scan.mjs", `--out=${out}`], { stdio: "ignore" });
if (r.status !== 0) {
  console.error("[gap-diff] scan failed");
  process.exit(2);
}
const gaps = (report) => {
  const m = new Map();
  for (const [file, hits] of Object.entries(report.entriesByFile || {}))
    for (const h of hits) if (h.classification === "GAP") {
      const k = `${file}::${h.kind}::${h.text}`;
      m.set(k, (m.get(k) || 0) + 1);
    }
  return m;
};
const before = gaps(JSON.parse(readFileSync(join(dir, baseline), "utf8")));
const now = gaps(JSON.parse(readFileSync(out, "utf8")));
const added = [];
for (const [k, n] of now) if (n > (before.get(k) || 0)) added.push(k);
let removed = 0;
for (const [k, n] of before) removed += Math.max(0, n - (now.get(k) || 0));
console.log(`[gap-diff] baseline ${baseline}: ${removed} hardcoded gap(s) removed, ${added.length} genuinely new.`);
for (const k of added) console.log(`  NEW  ${k}`);
process.exit(added.length ? 1 : 0);
