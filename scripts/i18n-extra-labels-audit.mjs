#!/usr/bin/env node
import { pathToFileURL } from "node:url";
import path from "node:path";

const ROOT = process.cwd();
const FILE = path.join(ROOT, "packages", "i18n", "src", "surface-extra-labels.ts");
const mod = await import(pathToFileURL(FILE).href);

const LOCS = ["fr", "es", "pt", "ar", "de", "it", "zh", "hi", "ig", "yo", "ha"];
const all = {};
for (const loc of LOCS) {
  const k = `EXTRA_SURFACE_LABELS_${loc.toUpperCase()}`;
  all[loc] = mod[k];
  if (!all[loc]) {
    console.error(`Missing export: ${k}`);
    process.exit(1);
  }
}

const universe = new Set();
for (const m of Object.values(all)) for (const k of Object.keys(m)) universe.add(k);

console.log("Universe size:", universe.size);
console.log();
console.log("Locale | Have | Missing | Echo-EN");
console.log("-------|-----:|--------:|-------:");
for (const [loc, m] of Object.entries(all)) {
  const have = Object.keys(m).length;
  const missing = universe.size - have;
  const echoEn = Object.entries(m).filter(([k, v]) => v === k).length;
  console.log(`${loc.padEnd(6)} | ${String(have).padStart(4)} | ${String(missing).padStart(7)} | ${String(echoEn).padStart(7)}`);
}

const samplesByLocale = {};
for (const [loc, m] of Object.entries(all)) {
  samplesByLocale[loc] = [...universe].filter(k => !(k in m)).slice(0, 8);
}
console.log("\nSample missing keys per locale:");
for (const [loc, samples] of Object.entries(samplesByLocale)) {
  if (!samples.length) continue;
  console.log(`\n${loc}:`);
  for (const s of samples) console.log(`  - "${s.slice(0, 80)}${s.length > 80 ? "…" : ""}"`);
}
