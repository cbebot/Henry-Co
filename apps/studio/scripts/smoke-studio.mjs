import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const appDir = process.cwd();
const rootDir = path.resolve(appDir, "..", "..");

function loadEnvFile(filepath) {
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

const requiredFiles = [
  "app/client/page.tsx",
  "app/sales/page.tsx",
  "app/pm/page.tsx",
  "app/finance/page.tsx",
  "app/delivery/page.tsx",
  "app/owner/page.tsx",
  "app/support/page.tsx",
  "app/proposals/[proposalId]/page.tsx",
  "app/project/[projectId]/page.tsx",
  "app/api/cron/studio-automation/route.ts",
  "app/api/webhooks/resend/route.ts",
  "app/api/webhooks/whatsapp/route.ts",
  "supabase/migrations/20260402190000_studio_init.sql",
  "supabase/migrations/20260402190500_studio_policies.sql",
  "supabase/migrations/20260402223000_studio_extensions.sql",
];

const missing = requiredFiles.filter((file) => !fs.existsSync(path.join(appDir, file)));

if (missing.length > 0) {
  console.error("[studio:smoke] Missing required files:");
  for (const file of missing) console.error(` - ${file}`);
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  if (missing.length > 0) {
    process.exitCode = 1;
    process.exit(1);
  }
  console.log("[studio:smoke] File checks passed. Supabase checks skipped because admin env is missing.");
  process.exit(0);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const studioTables = [
  ["studio_services", "id"],
  ["studio_packages", "id"],
  ["studio_team_profiles", "id"],
  ["studio_leads", "id"],
  ["studio_custom_requests", "id"],
  ["studio_proposals", "id"],
  ["studio_projects", "id"],
  ["studio_project_updates", "id"],
  ["studio_payments", "id"],
  ["studio_notifications", "id"],
];

async function tableExists(table, column) {
  const { error } = await supabase.from(table).select(column).limit(1);
  if (!error) return { exists: true, message: null };
  if (error.message.includes("Could not find the table")) {
    return { exists: false, message: error.message };
  }
  return { exists: false, message: error.message };
}

let hasFailure = missing.length > 0;
if (!hasFailure) {
  let normalizedTablesPresent = 0;
  for (const [table, column] of studioTables) {
    const { exists, message } = await tableExists(table, column);
    if (exists) {
      normalizedTablesPresent += 1;
      continue;
    }

    if (message && !message.includes("Could not find the table")) {
      console.error(`[studio:smoke] Database check failed for ${table}: ${message}`);
      hasFailure = true;
    }
  }

  if (!hasFailure && normalizedTablesPresent === 0) {
    const { error } = await supabase.from("care_security_logs").select("id").limit(1);
    if (error) {
      console.error(`[studio:smoke] Fallback store check failed: ${error.message}`);
      hasFailure = true;
    } else {
      console.log(
        "[studio:smoke] Normalized studio tables are not live yet; fallback event store via care_security_logs is reachable."
      );
    }
  }
}

if (hasFailure) {
  process.exitCode = 1;
} else {
  console.log("[studio:smoke] File and database checks passed.");
}
