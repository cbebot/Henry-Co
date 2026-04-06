#!/usr/bin/env node
/**
 * Vercel monorepo helper: find pnpm-workspace.yaml by walking up from cwd,
 * then run install or filtered build from the workspace root.
 *
 * For Vercel CLI production deploys from this monorepo, use the repository root
 * with each app’s vercel.json (see apps/*/vercel.json installCommand and
 * buildCommand). Uploading only apps/<division> omits workspace root files and
 * breaks installs.
 *
 * Legacy local helper (optional):
 *   installCommand: node ../../scripts/vercel/pnpm.mjs install
 *   buildCommand:   node ../../scripts/vercel/pnpm.mjs build @henryco/jobs
 *
 * If Root Directory is the repository root instead, use:
 *   node scripts/vercel/pnpm.mjs install
 *   node scripts/vercel/pnpm.mjs build @henryco/jobs
 */
import { existsSync } from "fs";
import { join, dirname } from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

function findWorkspaceRoot(start) {
  let d = start;
  for (;;) {
    if (existsSync(join(d, "pnpm-workspace.yaml"))) return d;
    const p = dirname(d);
    if (p === d) return null;
    d = p;
  }
}

const startDir = process.cwd();
let root = findWorkspaceRoot(startDir);

if (!root) {
  const here = dirname(fileURLToPath(import.meta.url));
  root = findWorkspaceRoot(join(here, "../.."));
}

if (!root) {
  console.error("[vercel/pnpm.mjs] Could not find pnpm-workspace.yaml from", startDir);
  process.exit(1);
}

process.chdir(root);

const [, , op, filter] = process.argv;

const spawnPnpm = (args) =>
  spawnSync("pnpm", args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

if (op === "install") {
  const r = spawnPnpm(["install", "--no-frozen-lockfile"]);
  process.exit(r.status === 0 ? 0 : r.status ?? 1);
}

if (op === "build") {
  if (!filter || !filter.startsWith("@henryco/")) {
    console.error("[vercel/pnpm.mjs] build requires @henryco/<pkg> argument");
    process.exit(1);
  }
  const r = spawnPnpm(["--filter", filter, "build"]);
  process.exit(r.status === 0 ? 0 : r.status ?? 1);
}

console.error("[vercel/pnpm.mjs] usage: install | build <@henryco/package>");
process.exit(1);
