#!/usr/bin/env node
/**
 * scripts/v3/sentry-adoption-audit.mjs — V3-10 (S1)
 *
 * Inventory Sentry initialisation across the 10 Next.js web apps.
 *
 * For each app, we check three artefacts:
 *   1. `apps/<app>/instrumentation.ts`            — Sentry.init for nodejs + edge runtimes
 *   2. `apps/<app>/instrumentation-client.ts`     — Sentry.init for the browser runtime
 *   3. `Sentry.init(buildServerSentryConfig())`   — wires the workspace builder, not a fork
 *
 * Output: matrix table to stdout, plus optional JSON for the V3-10 final report.
 *
 * Usage:
 *   node scripts/v3/sentry-adoption-audit.mjs              # human table
 *   node scripts/v3/sentry-adoption-audit.mjs --json       # JSON
 *   node scripts/v3/sentry-adoption-audit.mjs --json --out docs/v3/sentry-adoption-matrix.json
 *
 * Exit code 0 means the script ran. The script does NOT fail on missing inits — V3-10 wires
 * them as part of the same pass. Use the JSON snapshot to compare before/after.
 */

import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

/**
 * Canonical list of Next.js web apps. Expo/native apps (super-app, company-hub)
 * are intentionally excluded — they have a separate observability story.
 */
const WEB_APPS = [
  "account",
  "care",
  "hub",
  "jobs",
  "learn",
  "logistics",
  "marketplace",
  "property",
  "staff",
  "studio",
];

const SERVER_INIT_RE = /Sentry\.init\s*\(\s*buildServerSentryConfig\s*\(/;
const EDGE_INIT_RE = /Sentry\.init\s*\(\s*buildEdgeSentryConfig\s*\(/;
const CLIENT_INIT_RE = /Sentry\.init\s*\(\s*buildClientSentryConfig\s*\(/;

function readFileIfExists(path) {
  if (!existsSync(path)) return null;
  try {
    return readFileSync(path, "utf-8");
  } catch {
    return null;
  }
}

function inspectApp(app) {
  const appDir = join(REPO_ROOT, "apps", app);
  const instr = readFileIfExists(join(appDir, "instrumentation.ts"));
  const instrClient = readFileIfExists(join(appDir, "instrumentation-client.ts"));

  return {
    app,
    instrumentation: {
      present: instr !== null,
      serverInit: instr !== null ? SERVER_INIT_RE.test(instr) : false,
      edgeInit: instr !== null ? EDGE_INIT_RE.test(instr) : false,
    },
    client: {
      present: instrClient !== null,
      clientInit: instrClient !== null ? CLIENT_INIT_RE.test(instrClient) : false,
    },
  };
}

function isFullyAdopted(row) {
  return (
    row.instrumentation.present &&
    row.instrumentation.serverInit &&
    row.instrumentation.edgeInit &&
    row.client.present &&
    row.client.clientInit
  );
}

function renderTable(rows) {
  const headers = ["App", "instrumentation.ts", "server init", "edge init", "client file", "client init", "OK"];
  const tableRows = rows.map((row) => [
    row.app,
    mark(row.instrumentation.present),
    mark(row.instrumentation.serverInit),
    mark(row.instrumentation.edgeInit),
    mark(row.client.present),
    mark(row.client.clientInit),
    mark(isFullyAdopted(row)),
  ]);

  const widths = headers.map((h, i) =>
    Math.max(h.length, ...tableRows.map((r) => String(r[i]).length)),
  );
  const fmt = (cols) => cols.map((c, i) => String(c).padEnd(widths[i])).join("  ");

  const lines = [];
  lines.push(fmt(headers));
  lines.push(widths.map((w) => "-".repeat(w)).join("  "));
  for (const row of tableRows) lines.push(fmt(row));
  return lines.join("\n");
}

function mark(yes) {
  return yes ? "yes" : "no";
}

function main() {
  const args = process.argv.slice(2);
  const wantJson = args.includes("--json");
  const outIdx = args.indexOf("--out");
  const outPath = outIdx >= 0 ? args[outIdx + 1] : null;

  const rows = WEB_APPS.map(inspectApp);
  const summary = {
    generatedAt: new Date().toISOString(),
    apps: rows,
    counts: {
      total: rows.length,
      fullyAdopted: rows.filter(isFullyAdopted).length,
      missingInstrumentation: rows.filter((r) => !r.instrumentation.present).length,
      missingClient: rows.filter((r) => !r.client.present).length,
    },
  };

  if (wantJson) {
    const json = JSON.stringify(summary, null, 2);
    if (outPath) {
      const abs = outPath.startsWith("/") || /^[A-Z]:/.test(outPath)
        ? outPath
        : join(REPO_ROOT, outPath);
      mkdirSync(dirname(abs), { recursive: true });
      writeFileSync(abs, json + "\n", "utf-8");
      console.log(`Sentry adoption matrix written to ${outPath}`);
    } else {
      console.log(json);
    }
  } else {
    console.log("V3-10 Sentry adoption audit");
    console.log("");
    console.log(renderTable(rows));
    console.log("");
    console.log(
      `Adoption: ${summary.counts.fullyAdopted}/${summary.counts.total} apps fully wired (server + edge + client).`,
    );
    if (summary.counts.missingInstrumentation > 0) {
      console.log(
        `  ${summary.counts.missingInstrumentation} app(s) missing instrumentation.ts`,
      );
    }
    if (summary.counts.missingClient > 0) {
      console.log(`  ${summary.counts.missingClient} app(s) missing instrumentation-client.ts`);
    }
  }
}

main();
