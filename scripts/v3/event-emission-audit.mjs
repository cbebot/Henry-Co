#!/usr/bin/env node
/**
 * scripts/v3/event-emission-audit.mjs — V3-10 (S3 / A4)
 *
 * Enumerate every mutating Next.js route handler under
 * `apps/*\/app/api/**\/route.ts` and report two adoption signals:
 *
 *   1. Does the route emit a typed event via @henryco/observability
 *      (`emitEvent(` or `emitIntelligenceEvent(`)?
 *   2. Does the route emit at least one structured log line via the
 *      workspace `logger` (`logger.info|warn|error|debug(` — including
 *      calls on a `.child({...}).info(...)` sub-logger)?
 *
 * A route is "mutating" if its file exports at least one of:
 *   - `export async function POST/PUT/PATCH/DELETE`
 *   - `export const POST/PUT/PATCH/DELETE = ...`
 *
 * Output:
 *   - human table to stdout (counts + sample missing-emission routes)
 *   - JSON snapshot when run with `--json --out <path>` — committed to
 *     docs/v3/event-emission-audit-baseline.json as the V3-10
 *     pre-merge baseline (A4 measures fixes against this).
 *
 * Script does NOT fail on missing emission — V3-10 explicitly defers
 * full coverage. The baseline is what V3-43 (workflow engine
 * foundation) and follow-up passes will close against.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

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

const MUTATING_METHODS = ["POST", "PUT", "PATCH", "DELETE"];

const EMIT_EVENT_RE = /\bemit(Event|IntelligenceEvent)\s*\(/;
const LOGGER_CALL_RE = /\.(?:info|warn|error|debug)\s*\(/;
const LOGGER_IMPORT_RE = /from\s+["']@henryco\/observability(?:\/logger)?["']/;

/**
 * Recursively walk a directory and return absolute paths of files
 * matching the predicate. Uses readdirSync because we want to be
 * portable across Node versions on Windows + Linux runners.
 */
function walk(dir, predicate, out = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      walk(full, predicate, out);
    } else if (entry.isFile() && predicate(full)) {
      out.push(full);
    }
  }
  return out;
}

function isRouteHandler(path) {
  return /[\\/]route\.tsx?$/.test(path);
}

function inspectRoute(absPath) {
  const src = readFileSync(absPath, "utf-8");
  const mutating = MUTATING_METHODS.filter((m) => {
    const re = new RegExp(
      `\\bexport\\s+(?:async\\s+)?(?:function|const|let|var)\\s+${m}\\b`,
    );
    return re.test(src);
  });
  if (mutating.length === 0) return null;

  const emitsEvent = EMIT_EVENT_RE.test(src);
  // Logger usage: must import from @henryco/observability AND make a
  // call on a logger-shaped chain. Just having `console.log` doesn't
  // count.
  const importsLogger = LOGGER_IMPORT_RE.test(src);
  const callsLogger = importsLogger && LOGGER_CALL_RE.test(src);

  return {
    path: relative(REPO_ROOT, absPath).replace(/\\/g, "/"),
    mutatingMethods: mutating,
    emitsEvent,
    callsLogger,
    consoleLog: /\bconsole\.(log|error|warn|info|debug)\s*\(/.test(src),
  };
}

function summarise(routes) {
  const total = routes.length;
  const withEvent = routes.filter((r) => r.emitsEvent).length;
  const withLogger = routes.filter((r) => r.callsLogger).length;
  const withBoth = routes.filter((r) => r.emitsEvent && r.callsLogger).length;
  const withConsole = routes.filter((r) => r.consoleLog).length;

  return {
    total,
    withEvent,
    withLogger,
    withBoth,
    withConsole,
    pctEvent: total ? +((withEvent / total) * 100).toFixed(1) : 0,
    pctLogger: total ? +((withLogger / total) * 100).toFixed(1) : 0,
    pctBoth: total ? +((withBoth / total) * 100).toFixed(1) : 0,
  };
}

function renderTable(perApp) {
  const headers = ["App", "mutating", "emits event", "logger", "both", "console.*"];
  const rows = [];
  for (const [app, data] of Object.entries(perApp)) {
    rows.push([
      app,
      data.total,
      `${data.withEvent} (${data.pctEvent}%)`,
      `${data.withLogger} (${data.pctLogger}%)`,
      `${data.withBoth} (${data.pctBoth}%)`,
      data.withConsole,
    ]);
  }

  const widths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => String(r[i]).length)),
  );
  const fmt = (cols) => cols.map((c, i) => String(c).padEnd(widths[i])).join("  ");

  const lines = [];
  lines.push(fmt(headers));
  lines.push(widths.map((w) => "-".repeat(w)).join("  "));
  for (const row of rows) lines.push(fmt(row));
  return lines.join("\n");
}

function main() {
  const args = process.argv.slice(2);
  const wantJson = args.includes("--json");
  const outIdx = args.indexOf("--out");
  const outPath = outIdx >= 0 ? args[outIdx + 1] : null;

  const perApp = {};
  const allRoutes = [];

  for (const app of WEB_APPS) {
    const apiDir = join(REPO_ROOT, "apps", app, "app", "api");
    if (!existsSync(apiDir)) {
      perApp[app] = summarise([]);
      perApp[app].routes = [];
      continue;
    }
    const files = walk(apiDir, isRouteHandler);
    const routes = files
      .map(inspectRoute)
      .filter((r) => r !== null);
    perApp[app] = summarise(routes);
    perApp[app].routes = routes;
    allRoutes.push(...routes.map((r) => ({ app, ...r })));
  }

  // Strip per-app routes from the summary table view (kept only in JSON).
  const tableInput = {};
  for (const [app, data] of Object.entries(perApp)) {
    const { routes, ...rest } = data;
    tableInput[app] = rest;
    void routes;
  }

  const overall = summarise(allRoutes);

  if (wantJson) {
    const snapshot = {
      generatedAt: new Date().toISOString(),
      overall: {
        total: overall.total,
        withEvent: overall.withEvent,
        withLogger: overall.withLogger,
        withBoth: overall.withBoth,
        withConsole: overall.withConsole,
      },
      perApp,
      missingEmission: allRoutes
        .filter((r) => !r.emitsEvent)
        .map((r) => ({ app: r.app, path: r.path, mutatingMethods: r.mutatingMethods })),
      missingLogger: allRoutes
        .filter((r) => !r.callsLogger)
        .map((r) => ({ app: r.app, path: r.path, mutatingMethods: r.mutatingMethods })),
      consoleStillPresent: allRoutes
        .filter((r) => r.consoleLog)
        .map((r) => ({ app: r.app, path: r.path })),
    };
    const json = JSON.stringify(snapshot, null, 2);
    if (outPath) {
      const abs = outPath.startsWith("/") || /^[A-Z]:/.test(outPath)
        ? outPath
        : join(REPO_ROOT, outPath);
      mkdirSync(dirname(abs), { recursive: true });
      writeFileSync(abs, json + "\n", "utf-8");
      console.log(`Event-emission audit baseline written to ${outPath}`);
    } else {
      console.log(json);
    }
    return;
  }

  console.log("V3-10 event-emission audit");
  console.log("");
  console.log(renderTable(tableInput));
  console.log("");
  console.log(
    `Overall: ${overall.total} mutating route(s)\n` +
      `  ${overall.withEvent} emit typed event (${overall.pctEvent}%)\n` +
      `  ${overall.withLogger} use structured logger (${overall.pctLogger}%)\n` +
      `  ${overall.withBoth} do both (${overall.pctBoth}%)\n` +
      `  ${overall.withConsole} still use console.*`,
  );

  const missing = allRoutes.filter((r) => !r.emitsEvent);
  if (missing.length > 0) {
    console.log("");
    console.log(`Sample routes missing typed event emission (${Math.min(8, missing.length)} of ${missing.length}):`);
    for (const r of missing.slice(0, 8)) {
      console.log(`  ${r.app}: ${r.path}  [${r.mutatingMethods.join(",")}]`);
    }
  }
}

main();
