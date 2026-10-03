#!/usr/bin/env node
/**
 * COPY-RESET — copy budget gate.
 *
 *   node scripts/copy-audit/gate.mjs --stage after [--domains care,hub]
 *
 * Reads docs/copy-audit/<stage>/<domain>.json (written by measure.mjs) and fails
 * when a public route breaks the copy contract:
 *   FAIL  page words over the route-type budget (max of desktop/mobile)
 *   FAIL  not exactly one visible h1
 *   FAIL  meta description missing or longer than the limit
 *   FAIL  route did not render (4xx/5xx)
 *   FAIL  domain chrome (header + footer) over the chrome budget
 *   WARN  first-viewport words over the five-second budget
 *   WARN  dynamic route with no renderable sample (data-dependent)
 * Redirecting routes are skipped: their destination is measured on its own.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { DOMAINS, BUDGETS } from "./config.mjs";

function arg(name, fallback = null) {
  const i = process.argv.indexOf(name);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const stage = arg("--stage", "after");
const wanted = arg("--domains") ? new Set(arg("--domains").split(",")) : null;

const fails = [];
const warns = [];
let checked = 0;

for (const d of DOMAINS) {
  if (wanted && !wanted.has(d.domain)) continue;
  const file = join("docs", "copy-audit", stage, `${d.domain}.json`);
  if (!existsSync(file)) {
    fails.push(`${d.domain}: no measurement at ${file}`);
    continue;
  }
  const data = JSON.parse(readFileSync(file, "utf8"));
  let chromeMax = 0;
  for (const r of data.routes) {
    const id = `${d.domain} ${r.path}${r.sample && r.sample !== r.path ? ` (${r.sample})` : ""}`;
    if (r.status === "no-sample") {
      warns.push(`${id}: no renderable sample — data-dependent; measure once data is available`);
      continue;
    }
    if (r.redirectedTo) continue;
    checked++;
    if (typeof r.status === "number" && r.status >= 400) {
      fails.push(`${id}: rendered HTTP ${r.status}`);
      continue;
    }
    chromeMax = Math.max(chromeMax, r.chromeWords || 0);
    if (r.budget != null && r.pageWords > r.budget) fails.push(`${id}: ${r.pageWords} words > ${r.type} budget ${r.budget}`);
    if (r.visibleH1 !== 1) fails.push(`${id}: ${r.visibleH1} visible h1 (need exactly 1)`);
    const metaChars = r.desktop?.metaDescriptionChars ?? 0;
    if (!metaChars) fails.push(`${id}: no meta description`);
    else if (metaChars > BUDGETS.metaDescriptionMaxChars)
      fails.push(`${id}: meta description ${metaChars} chars > ${BUDGETS.metaDescriptionMaxChars}`);
    const h1 = (r.desktop?.h1s || []).find((h) => h.visible);
    if (h1 && h1.text.split(/\s+/).filter(Boolean).length > BUDGETS.h1MaxWords)
      warns.push(`${id}: h1 is ${h1.text.split(/\s+/).length} words (> ${BUDGETS.h1MaxWords})`);
    if (r.aboveFold > BUDGETS.aboveFold) warns.push(`${id}: ${r.aboveFold} words in the first viewport (> ${BUDGETS.aboveFold})`);
  }
  if (chromeMax > BUDGETS.chrome) fails.push(`${d.domain}: chrome ${chromeMax} words > ${BUDGETS.chrome}`);
}

for (const w of warns) console.log(`[copy-gate] WARN  ${w}`);
if (fails.length) {
  for (const f of fails) console.error(`[copy-gate] FAIL  ${f}`);
  console.error(`[copy-gate] ${fails.length} failure(s) across ${checked} measured route(s).`);
  process.exit(1);
}
console.log(`[copy-gate] OK — ${checked} route(s) within budget, one h1 each, meta descriptions in range.`);
