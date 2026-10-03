#!/usr/bin/env node
/**
 * COPY-RESET — print a readable transcript of a measured domain.
 *   node scripts/copy-audit/transcript.mjs docs/copy-audit/before/care.json [--route /about] [--all-regions]
 */
import { readFileSync } from "node:fs";

const file = process.argv[2];
const routeArg = process.argv.includes("--route") ? process.argv[process.argv.indexOf("--route") + 1] : null;
const allRegions = process.argv.includes("--all-regions");
const data = JSON.parse(readFileSync(file, "utf8"));

for (const r of data.routes) {
  if (routeArg && r.path !== routeArg) continue;
  const over = r.budget != null && r.pageWords > r.budget ? ` OVER by ${r.pageWords - r.budget}` : "";
  console.log(`\n## ${data.domain} ${r.path}${r.sample && r.sample !== r.path ? ` (${r.sample})` : ""} — ${r.type} · page ${r.pageWords ?? "-"} / budget ${r.budget ?? "exempt"}${over} · fold ${r.aboveFold ?? "-"} · status ${r.status}${r.redirectedTo ? ` ↪ ${r.redirectedTo}` : ""}`);
  if (!r.desktop?.blocks) continue;
  console.log(`title: ${r.desktop.title}`);
  console.log(`meta (${r.desktop.metaDescriptionChars}): ${r.desktop.metaDescription}`);
  for (const b of r.desktop.blocks) {
    if (!allRegions && b.region !== "main" && b.region !== "outside") continue;
    console.log(`${String(b.words).padStart(3)} ${b.aboveFold ? "^" : " "} ${b.tag.padEnd(10).slice(0, 10)} ${b.region === "main" ? "" : `[${b.region}] `}${b.text}`);
  }
}
