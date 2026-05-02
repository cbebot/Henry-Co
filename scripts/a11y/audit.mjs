#!/usr/bin/env node
// V2-A11Y-01 — axe-core audit runner.
//
// Usage:
//   node scripts/a11y/audit.mjs                 # all apps, all routes
//   node scripts/a11y/audit.mjs --app=hub        # one app
//   node scripts/a11y/audit.mjs --app=hub --route=/about
//   node scripts/a11y/audit.mjs --base-url=http://127.0.0.1:3000 --app=hub
//     --base-url skips the `next start` spawn — useful when the dev server is
//     already running (faster iteration during Y2/Y3).
//
// Writes one JSON per route into .codex-temp/v2-a11y-01/<app>/<route>.json.

import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import pc from "picocolors";
import { ROUTE_MANIFEST } from "./route-manifest.mjs";

const ROOT = resolve(process.cwd());
const OUT_DIR = join(ROOT, ".codex-temp/v2-a11y-01");
const AUTH_DIR = join(OUT_DIR, "auth");

const argv = parseArgs(process.argv.slice(2));
const APPS = argv.app
  ? ROUTE_MANIFEST.filter((m) => m.app === argv.app)
  : ROUTE_MANIFEST;

if (APPS.length === 0) {
  console.error(pc.red(`No app matched --app=${argv.app}`));
  process.exit(2);
}

await mkdir(OUT_DIR, { recursive: true });
await mkdir(AUTH_DIR, { recursive: true });

let totalRoutes = 0;
let totalCritical = 0;
let totalSerious = 0;
let totalModerate = 0;
let totalMinor = 0;

for (const entry of APPS) {
  console.log(pc.bold(pc.cyan(`\n[${entry.app}] starting`)));
  const baseUrl = argv["base-url"] || `http://127.0.0.1:${entry.devPort}`;
  let serverProc = null;

  if (!argv["base-url"]) {
    serverProc = await startNext(entry);
    await waitForReady(baseUrl, 60_000);
  }

  const browser = await chromium.launch();
  const appOut = join(OUT_DIR, entry.app);
  await mkdir(appOut, { recursive: true });

  for (const route of entry.routes) {
    if (argv.route && argv.route !== route.path) continue;

    const ctxOpts = {};
    if (route.auth) {
      const stateFile = join(AUTH_DIR, `${entry.app}.json`);
      if (existsSync(stateFile)) {
        ctxOpts.storageState = stateFile;
      } else {
        console.log(
          pc.yellow(
            `  [skip] ${route.path} — no auth state at ${stateFile}. Record via playwright codegen.`,
          ),
        );
        continue;
      }
    }

    const ctx = await browser.newContext(ctxOpts);
    const page = await ctx.newPage();
    const url = baseUrl.replace(/\/$/, "") + route.path;

    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa", "best-practice"])
        .analyze();

      const counts = countBySeverity(results.violations);
      totalRoutes += 1;
      totalCritical += counts.critical;
      totalSerious += counts.serious;
      totalModerate += counts.moderate;
      totalMinor += counts.minor;

      const slug = route.name || route.path.replace(/\W+/g, "-").replace(/^-|-$/g, "") || "root";
      await writeFile(
        join(appOut, `${slug}.json`),
        JSON.stringify(
          {
            app: entry.app,
            route: route.path,
            name: route.name,
            url,
            timestamp: new Date().toISOString(),
            counts,
            violations: results.violations,
            passes: results.passes.length,
            incomplete: results.incomplete.length,
          },
          null,
          2,
        ),
      );

      const tone =
        counts.critical > 0
          ? pc.red
          : counts.serious > 0
            ? pc.yellow
            : counts.moderate > 0
              ? pc.blue
              : pc.green;
      console.log(
        tone(
          `  ${route.path.padEnd(20)}  C:${counts.critical} S:${counts.serious} M:${counts.moderate} m:${counts.minor}`,
        ),
      );
    } catch (err) {
      console.log(pc.red(`  ${route.path}  ERROR: ${err.message}`));
      await writeFile(
        join(appOut, `${route.name || "err"}.error.json`),
        JSON.stringify({ url, error: err.message }, null, 2),
      );
    } finally {
      await ctx.close();
    }
  }

  await browser.close();
  if (serverProc) await stopProc(serverProc);
}

console.log(
  pc.bold(
    `\nAudit complete: ${totalRoutes} routes  C:${totalCritical} S:${totalSerious} M:${totalModerate} m:${totalMinor}`,
  ),
);

function parseArgs(args) {
  const out = {};
  for (const a of args) {
    const m = /^--([^=]+)(?:=(.*))?$/.exec(a);
    if (!m) continue;
    out[m[1]] = m[2] ?? true;
  }
  return out;
}

function countBySeverity(violations) {
  const counts = { critical: 0, serious: 0, moderate: 0, minor: 0 };
  for (const v of violations) {
    if (counts[v.impact] !== undefined) counts[v.impact] += 1;
  }
  return counts;
}

async function startNext(entry) {
  console.log(pc.gray(`  spawning next start on :${entry.devPort}`));
  const isWin = process.platform === "win32";
  const cmd = isWin ? "pnpm.cmd" : "pnpm";
  const proc = spawn(
    cmd,
    [
      "--filter",
      entry.pkg,
      "exec",
      "next",
      "start",
      "--port",
      String(entry.devPort),
    ],
    { stdio: ["ignore", "pipe", "pipe"], cwd: ROOT, shell: false },
  );
  proc.stderr.on("data", () => {});
  proc.stdout.on("data", () => {});
  return proc;
}

async function stopProc(proc) {
  if (!proc || proc.killed) return;
  try {
    if (process.platform === "win32") {
      spawn("taskkill", ["/pid", String(proc.pid), "/T", "/F"]);
    } else {
      proc.kill("SIGTERM");
    }
    await sleep(500);
  } catch {
    /* ignore */
  }
}

async function waitForReady(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(url, { method: "HEAD" });
      if (r.status < 500) return;
    } catch {
      /* not ready */
    }
    await sleep(1000);
  }
  throw new Error(`Server never became ready at ${url}`);
}
