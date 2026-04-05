/**
 * Apply apps/hub/supabase/migrations/*.sql to live Postgres (HenryCo shared Supabase DB).
 *
 * Requires a direct Postgres URI (NOT the Supabase REST URL):
 *   DATABASE_URL or SUPABASE_DB_URL or DIRECT_URL
 *
 * Add it once from Supabase Dashboard → Project Settings → Database → Connection string → URI
 * (use the `postgres` user password). Optional: save as repo-root `.env.database.local`:
 *   DATABASE_URL=postgresql://postgres:...@db.<ref>.supabase.co:5432/postgres
 *
 * Usage:
 *   pnpm --filter @henryco/hub run db:apply
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const hubRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(hubRoot, "..", "..");
const migrationsDir = path.join(hubRoot, "supabase", "migrations");

function loadEnvFile(absPath) {
  try {
    const raw = fs.readFileSync(absPath, "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    }
  } catch {
    /* optional */
  }
}

loadEnvFile(path.join(hubRoot, ".env.local"));
loadEnvFile(path.join(hubRoot, ".env"));
loadEnvFile(path.join(repoRoot, ".env.local"));
loadEnvFile(path.join(repoRoot, ".env.database.local"));
loadEnvFile(path.join(repoRoot, ".env.vercel.production.hub"));
loadEnvFile(path.join(repoRoot, ".env.vercel.production.account"));

const dbUrl = process.env.SUPABASE_DB_URL || process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!dbUrl || !String(dbUrl).toLowerCase().startsWith("postgres")) {
  console.error(
    "[db:apply] No DATABASE_URL / SUPABASE_DB_URL. Vercel env pull does not include the Postgres URI.\n" +
      "  → Supabase Dashboard → Database → copy Connection string (URI)\n" +
      "  → Put it in repo-root `.env.database.local` as DATABASE_URL=... then re-run this command."
  );
  process.exit(1);
}

const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();
if (!files.length) {
  console.error("[db:apply] No .sql files in", migrationsDir);
  process.exit(1);
}

const { Client } = await import("pg");

const client = new Client({
  connectionString: dbUrl,
  ssl: String(dbUrl).includes("supabase") ? { rejectUnauthorized: false } : undefined,
});

await client.connect();
try {
  for (const file of files) {
    const full = path.join(migrationsDir, file);
    const sql = fs.readFileSync(full, "utf8");
    console.log("\n[db:apply] →", file);
    await client.query(sql);
  }
} finally {
  await client.end();
}

console.log("\n[db:apply] Done. Wait ~60s for PostgREST schema cache, then verify with: node apps/hub/scripts/probe-supabase-tables.mjs");
