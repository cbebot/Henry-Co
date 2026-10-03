#!/usr/bin/env node
/**
 * COPY-RESET — build (optional), start, measure, stop — per domain.
 *
 *   node scripts/copy-audit/serve-measure.mjs --stage before [--domains hub,care] \
 *     [--build] [--channel chrome] [--screens DIR] [--aria DIR]
 *
 * Writes docs/copy-audit/<stage>/<domain>.json. Uses the same placeholder
 * Supabase env as CI, so pages render their data-less state: the measurement is
 * of the site's own copy, not of listings or user content.
 */
import { spawn, spawnSync } from "node:child_process";
import { join } from "node:path";
import { DOMAINS } from "./config.mjs";

function arg(name, fallback = null) {
  const i = process.argv.indexOf(name);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const stage = arg("--stage", "before");
const wanted = arg("--domains") ? new Set(arg("--domains").split(",")) : null;
const doBuild = process.argv.includes("--build");
const channel = arg("--channel");
const screens = arg("--screens");
const aria = arg("--aria");
const ROOT = process.cwd();

const ENV = {
  ...process.env,
  NEXT_TELEMETRY_DISABLED: "1",
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ci-placeholder.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiJ9.ci-placeholder-signature",
  SUPABASE_SERVICE_ROLE_KEY:
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.ci-placeholder-signature",
  NEXT_PUBLIC_BASE_DOMAIN: process.env.NEXT_PUBLIC_BASE_DOMAIN || "henryonyx.com",
};
const isWin = process.platform === "win32";

// Domains flagged `mockDb` in config.mjs throw when the database is unreachable;
// they are built and served against the empty stand-in (mock-supabase.mjs).
const MOCK_PORT = 54329;
const MOCK_URL = `http://127.0.0.1:${MOCK_PORT}`;
const envFor = (d) => (d.mockDb ? { ...ENV, NEXT_PUBLIC_SUPABASE_URL: MOCK_URL, SUPABASE_URL: MOCK_URL } : ENV);
const selected = DOMAINS.filter((d) => !wanted || wanted.has(d.domain));
let mock = null;
if (selected.some((d) => d.mockDb)) {
  mock = spawn(process.execPath, [join("scripts", "copy-audit", "mock-supabase.mjs"), "--port", String(MOCK_PORT)], {
    cwd: ROOT,
    stdio: "inherit",
  });
}

const sha = spawnSync("git", ["rev-parse", "--short", "HEAD"], { encoding: "utf8" }).stdout.trim();

function run(cmd, args, opts) {
  return new Promise((resolve) => {
    const p = spawn(cmd, args, { shell: true, stdio: "inherit", env: ENV, ...opts });
    p.on("exit", (code) => resolve(code));
  });
}

async function waitUp(url, ms = 180_000) {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    try {
      const res = await fetch(url, { redirect: "manual" });
      if (res.status > 0) return true;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  return false;
}

function kill(child) {
  if (!child || child.exitCode !== null) return;
  if (isWin) spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
  else child.kill("SIGTERM");
}

let failed = 0;
for (const d of DOMAINS) {
  if (wanted && !wanted.has(d.domain)) continue;
  if (doBuild) {
    console.log(`\n[serve-measure] building ${d.pkg}`);
    const code = await run("pnpm", ["--filter", d.pkg, "run", "build"], { cwd: ROOT, env: envFor(d) });
    if (code !== 0) {
      console.error(`[serve-measure] build failed for ${d.pkg} (exit ${code})`);
      failed++;
      continue;
    }
  }
  console.log(`\n[serve-measure] starting ${d.domain} on :${d.port}`);
  const server = spawn("pnpm", ["exec", "next", "start", "-p", String(d.port)], {
    cwd: join(ROOT, "apps", d.app),
    shell: true,
    stdio: ["ignore", "ignore", "inherit"],
    env: envFor(d),
  });
  const base = `http://localhost:${d.port}`;
  if (!(await waitUp(base + "/"))) {
    console.error(`[serve-measure] ${d.domain} did not start`);
    kill(server);
    failed++;
    continue;
  }
  const args = [
    join("scripts", "copy-audit", "measure.mjs"),
    "--domain", d.domain,
    "--base", base,
    "--out", join("docs", "copy-audit", stage, `${d.domain}.json`),
    "--sha", sha,
  ];
  if (channel) args.push("--channel", channel);
  if (screens) args.push("--screens", join(screens, stage));
  if (aria) args.push("--aria", join(aria, stage));
  // node is spawned without a shell so paths with spaces stay one argument.
  const code = await run(process.execPath, args, { cwd: ROOT, shell: false });
  if (code !== 0) failed++;
  kill(server);
}
kill(mock);
process.exit(failed ? 1 : 0);
