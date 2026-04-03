import "server-only";

import { existsSync, readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(currentDir, "../../..");

const envState = globalThis as typeof globalThis & {
  __henrycoPropertyEnvLoaded?: boolean;
};

function parseEnvValue(raw: string) {
  const value = raw.trim();

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  const commentIndex = value.indexOf(" #");
  return commentIndex >= 0 ? value.slice(0, commentIndex).trim() : value;
}

function loadEnvFile(filepath: string) {
  if (!existsSync(filepath)) return;

  const source = readFileSync(filepath, "utf8");
  for (const line of source.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator <= 0) continue;

    const key = trimmed.slice(0, separator).trim();
    if (!key || process.env[key]) continue;

    process.env[key] = parseEnvValue(trimmed.slice(separator + 1));
  }
}

if (!envState.__henrycoPropertyEnvLoaded) {
  loadEnvFile(resolve(workspaceRoot, ".env"));
  loadEnvFile(resolve(workspaceRoot, ".env.local"));
  loadEnvFile(resolve(workspaceRoot, ".env.production.vercel"));
  loadEnvFile(resolve(workspaceRoot, "apps/care/.env.local"));
  loadEnvFile(resolve(workspaceRoot, "apps/care/.env.production.whatsapp"));
  envState.__henrycoPropertyEnvLoaded = true;
}
