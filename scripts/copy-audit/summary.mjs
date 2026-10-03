#!/usr/bin/env node
/**
 * COPY-RESET — per-route summary table for one or more measured stages.
 *   node scripts/copy-audit/summary.mjs [--stage before] [--compare after] [--md out.md]
 */
import { readdirSync, readFileSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { DOMAINS, BUDGETS } from "./config.mjs";

function arg(name, fallback = null) {
  const i = process.argv.indexOf(name);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const stage = arg("--stage", "before");
const compare = arg("--compare");
const mdOut = arg("--md");
const dir = (s) => join("docs", "copy-audit", s);

function load(s, domain) {
  const f = join(dir(s), `${domain}.json`);
  return existsSync(f) ? JSON.parse(readFileSync(f, "utf8")) : null;
}

const lines = [];
const totals = [];
for (const d of DOMAINS) {
  const a = load(stage, d.domain);
  if (!a) continue;
  const b = compare ? load(compare, d.domain) : null;
  let sumA = 0;
  let sumB = 0;
  let over = 0;
  lines.push(`\n### ${d.domain}\n`);
  lines.push(
    compare
      ? "| route | type | budget | before | after | Δ | fold before→after | status |\n|---|---|---:|---:|---:|---:|---|---|"
      : "| route | type | budget | words | fold | chrome | h1 | over |\n|---|---|---:|---:|---:|---:|---:|---:|",
  );
  for (const r of a.routes) {
    const rb = b?.routes.find((x) => x.path === r.path);
    const budget = r.budget ?? "—";
    const redirect = r.redirectedTo ? ` ↪ ${r.redirectedTo}` : "";
    if (r.status === "no-sample") {
      lines.push(`| ${r.path} | ${r.type} | ${budget} | no sample (data) | | | | |`);
      continue;
    }
    const counted = !r.redirectedTo;
    if (counted) sumA += r.pageWords || 0;
    if (compare) {
      const after = rb?.pageWords ?? null;
      if (counted && after != null) sumB += after;
      const ok = r.budget == null ? "exempt" : after == null ? "?" : after <= r.budget ? "✅" : `❌ +${after - r.budget}`;
      lines.push(`| ${r.path}${redirect} | ${r.type} | ${budget} | ${r.pageWords} | ${after ?? "—"} | ${after != null ? after - r.pageWords : ""} | ${r.aboveFold}→${rb?.aboveFold ?? "—"} | ${counted ? ok : "redirect"} |`);
    } else {
      const o = r.budget != null && counted && r.pageWords > r.budget ? r.pageWords - r.budget : 0;
      if (o) over++;
      lines.push(`| ${r.path}${redirect} | ${r.type} | ${budget} | ${r.pageWords} | ${r.aboveFold} | ${r.chromeWords} | ${r.visibleH1} | ${o ? "+" + o : counted ? "" : "redirect"} |`);
    }
  }
  totals.push({ domain: d.domain, before: sumA, after: compare && b ? sumB : null, over });
}

const head = [
  `# Copy audit — ${compare ? `${stage} → ${compare}` : stage}`,
  "",
  `Budgets: ${Object.entries(BUDGETS.page).map(([k, v]) => `${k} ${v ?? "exempt"}`).join(" · ")} · above-fold ${BUDGETS.aboveFold} · chrome ${BUDGETS.chrome}`,
  "",
  compare ? "| domain | before | after | cut |\n|---|---:|---:|---:|" : "| domain | visible page words | routes over budget |\n|---|---:|---:|",
  ...totals.map((t) =>
    compare
      ? t.after == null
        ? `| ${t.domain} | ${t.before} | not measured yet | |`
        : `| ${t.domain} | ${t.before} | ${t.after} | ${t.before ? Math.round((1 - t.after / t.before) * 100) : 0}% |`
      : `| ${t.domain} | ${t.before} | ${t.over} |`,
  ),
];
const out = [...head, ...lines].join("\n") + "\n";
if (mdOut) writeFileSync(mdOut, out);
console.log(out);
