#!/usr/bin/env node
/**
 * COPY-RESET — show which rendered blocks a route lost or gained between stages.
 *   node scripts/copy-audit/diff-route.mjs <domain> <route> [--from before] [--to after]
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const [domain, route] = process.argv.slice(2);
const arg = (n, f) => (process.argv.includes(n) ? process.argv[process.argv.indexOf(n) + 1] : f);
const load = (stage) => JSON.parse(readFileSync(join("docs", "copy-audit", stage, `${domain}.json`), "utf8")).routes.find((r) => r.path === route);
const a = load(arg("--from", "before"));
const b = load(arg("--to", "after"));
const texts = (r) => (r?.desktop?.blocks || []).filter((x) => x.region === "main" || x.region === "outside").map((x) => x.text);
const count = (list) => list.reduce((m, t) => m.set(t, (m.get(t) || 0) + 1), new Map());
const A = count(texts(a));
const B = count(texts(b));
for (const [t, n] of A) if ((B.get(t) || 0) < n) console.log(`- ${t}`);
for (const [t, n] of B) if ((A.get(t) || 0) < n) console.log(`+ ${t}`);
