/**
 * One-shot: copy selected env keys from hub's pulled Vercel env file into staff project.
 * Usage (from repo root): node apps/staff/scripts/push-env-from-hub-pull.mjs
 * Requires: apps/hub/.env.pull.hub from `vercel env pull` against hub.
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const staffDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const hubPull = join(staffDir, "../hub/.env.pull.hub");
const staffRoot = staffDir;

const KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_BASE_DOMAIN",
];

function parseEnvFile(text) {
  const out = {};
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

if (!existsSync(hubPull)) {
  console.error("Missing", hubPull, "— run in apps/hub: vercel env pull .env.pull.hub --environment=production -y");
  process.exit(1);
}

const vars = parseEnvFile(readFileSync(hubPull, "utf8"));

for (const key of KEYS) {
  const value = vars[key];
  if (!value) {
    console.error("Skip (missing in hub pull):", key);
    continue;
  }
  const r = spawnSync(
    "npx",
    [
      "vercel@latest",
      "env",
      "add",
      key,
      "production",
      "--value",
      value,
      "--yes",
      "--force",
      "--scope",
      "henry-co",
    ],
    {
      cwd: staffRoot,
      stdio: "inherit",
      shell: true,
    }
  );
  if (r.status !== 0) process.exit(r.status ?? 1);
}

console.log("Staff production env synced for:", KEYS.filter((k) => vars[k]).join(", "));
