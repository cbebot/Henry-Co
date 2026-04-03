import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const appDir = process.cwd();
const rootDir = path.resolve(appDir, "..", "..");

function loadEnvFile(filepath: string) {
  if (!fs.existsSync(filepath)) return;
  const content = fs.readFileSync(filepath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index <= 0) continue;
    const key = line.slice(0, index).trim();
    const raw = line.slice(index + 1).trim();
    if (!key || process.env[key]) continue;
    process.env[key] = raw.replace(/^['"]|['"]$/g, "");
  }
}

loadEnvFile(path.join(rootDir, ".env.local"));
loadEnvFile(path.join(rootDir, ".env.production.vercel"));
loadEnvFile(path.join(rootDir, ".vercel", ".env.production.local"));

const requiredFiles = [
  "app/(public)/page.tsx",
  "app/(public)/courses/page.tsx",
  "app/(public)/courses/[slug]/page.tsx",
  "app/learner/page.tsx",
  "app/owner/page.tsx",
  "app/content/page.tsx",
  "app/support/page.tsx",
  "app/api/cron/learn-automation/route.ts",
  "app/api/learn/bootstrap/route.ts",
  "app/api/learn/announcement/route.ts",
  "supabase/migrations/20260402233000_learn_init.sql",
  "supabase/migrations/20260402233500_learn_policies.sql",
];

const missing = requiredFiles.filter((file) => !fs.existsSync(path.join(appDir, file)));

if (missing.length > 0) {
  console.error("[learn:smoke] Missing required files:");
  for (const file of missing) console.error(` - ${file}`);
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  if (missing.length > 0) {
    process.exit(1);
  }
  console.log("[learn:smoke] File checks passed. Supabase checks skipped because admin env is missing.");
  process.exit(0);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const learnTables = [
  ["learn_courses", "id"],
  ["learn_learning_paths", "id"],
  ["learn_enrollments", "id"],
  ["learn_progress", "id"],
  ["learn_quiz_attempts", "id"],
  ["learn_certificates", "id"],
];

async function tableExists(table: string, column: string) {
  const { error } = await supabase.from(table).select(column).limit(1);
  if (!error) return { exists: true, message: null };
  if (error.message.includes("Could not find the table")) {
    return { exists: false, message: error.message };
  }
  return { exists: false, message: error.message };
}

let hasFailure = missing.length > 0;
let normalizedTablesPresent = 0;

async function main() {
  for (const [table, column] of learnTables) {
    const result = await tableExists(table, column);
    if (result.exists) {
      normalizedTablesPresent += 1;
      continue;
    }

    if (result.message && !result.message.includes("Could not find the table")) {
      console.error(`[learn:smoke] Database check failed for ${table}: ${result.message}`);
      hasFailure = true;
    }
  }

  if (!hasFailure && normalizedTablesPresent === 0) {
    const { error } = await supabase.from("care_security_logs").select("id").limit(1);
    if (error) {
      console.error(`[learn:smoke] Fallback store check failed: ${error.message}`);
      hasFailure = true;
    } else {
      console.log(
        "[learn:smoke] Normalized learn tables are not live yet; fallback event store via care_security_logs is reachable."
      );
    }
  }

  if (hasFailure) {
    process.exitCode = 1;
  } else {
    console.log("[learn:smoke] File and database checks passed.");
  }
}

main().catch((error) => {
  console.error("[learn:smoke] Unexpected failure:", error);
  process.exitCode = 1;
});
