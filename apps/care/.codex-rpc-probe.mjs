import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  const baseDir = path.resolve(process.cwd());
  const candidates = [
    ".env.runtime.production",
    ".env.care.production.local",
    ".env.vercel.latest",
    ".env.local",
  ];

  for (const name of candidates) {
    const filePath = path.join(baseDir, name);
    if (!fs.existsSync(filePath)) continue;

    const source = fs.readFileSync(filePath, "utf8");
    for (const line of source.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, "");
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const names = ["exec_sql", "run_sql", "sql", "query", "admin_exec", "execute_sql", "apply_sql"];

for (const name of names) {
  try {
    const res = await supabase.rpc(name, {
      sql: "select 1 as ok",
      query: "select 1 as ok",
      statement: "select 1 as ok",
    });
    console.log(JSON.stringify({ name, error: res.error?.message ?? null, data: res.data ?? null }));
  } catch (error) {
    console.log(
      JSON.stringify({ name, thrown: error instanceof Error ? error.message : String(error) })
    );
  }
}
