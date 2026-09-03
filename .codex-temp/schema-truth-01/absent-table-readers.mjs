#!/usr/bin/env node
// SCHEMA-TRUTH-01 — for each table that exists only in unapplied migration files
// (absent from prod), count the code files that read it. Live-risk evidence for
// the manifest + the drift triage.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");

const classification = JSON.parse(readFileSync(join(HERE, "classification.json"), "utf8"));
const absent = new Set();
for (const x of classification) {
  for (const e of x.evid.absent) if (e.startsWith("table:")) absent.add(e.slice(6));
}

const rows = [];
for (const t of [...absent].sort()) {
  let out = "";
  try {
    out = execFileSync("git", ["grep", "-l", `.from("${t}")`, "--", "apps", "packages"], {
      cwd: ROOT, encoding: "utf8",
    });
  } catch { /* no hits */ }
  const files = out.split(/\r?\n/).filter(Boolean);
  rows.push({ t, files });
}
rows.sort((a, b) => b.files.length - a.files.length);
for (const { t, files } of rows.filter((r) => r.files.length)) {
  console.log(`${String(files.length).padStart(3)}  ${t}`);
  for (const f of files.slice(0, 5)) console.log(`       ${f}`);
}
console.log(`\nZERO-reader absent tables: ${rows.filter((r) => !r.files.length).map((r) => r.t).join(", ")}`);
