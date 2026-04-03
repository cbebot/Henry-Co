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
  "app/(public)/page.tsx",
  "app/(public)/search/page.tsx",
  "app/(public)/property/[slug]/page.tsx",
  "app/(public)/area/[slug]/page.tsx",
  "app/(public)/managed/page.tsx",
  "app/(public)/trust/page.tsx",
  "app/(public)/faq/page.tsx",
  "app/(public)/submit/page.tsx",
  "app/account/page.tsx",
  "app/account/listings/page.tsx",
  "app/owner/page.tsx",
  "app/agent/page.tsx",
  "app/operations/page.tsx",
  "app/moderation/page.tsx",
  "app/support/page.tsx",
  "app/admin/page.tsx",
  "app/api/property/route.ts",
  "app/api/cron/property-automation/route.ts",
  "scripts/seed-property.mjs",
  "supabase/migrations/20260402183000_property_init.sql",
  "supabase/migrations/20260402183500_property_policies.sql",
];

const missingFiles = requiredFiles.filter((file) => !fs.existsSync(path.join(appDir, file)));
if (missingFiles.length) {
  console.error("[property:smoke] Missing required files:");
  for (const file of missingFiles) console.error(` - ${file}`);
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  process.exit(missingFiles.length ? 1 : 0);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let hasFailure = missingFiles.length > 0;

for (const table of [
  "profiles",
  "customer_profiles",
  "customer_activity",
  "customer_notifications",
  "customer_documents",
  "support_threads",
  "support_messages",
]) {
  const { error } = await supabase.from(table).select("id").limit(1);
  if (error) {
    console.error(`[property:smoke] Database check failed for ${table}: ${error.message}`);
    hasFailure = true;
  }
}

const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
if (bucketError) {
  console.error(`[property:smoke] Bucket list failed: ${bucketError.message}`);
  hasFailure = true;
}

for (const bucket of ["property-runtime", "property-media", "property-documents"]) {
  if (!(buckets || []).some((entry) => entry.name === bucket)) {
    console.error(`[property:smoke] Missing bucket: ${bucket}`);
    hasFailure = true;
  }
}

const { data: listingFiles, error: listingError } = await supabase.storage
  .from("property-runtime")
  .list("listings", { limit: 20 });

if (listingError) {
  console.error(`[property:smoke] Runtime listing check failed: ${listingError.message}`);
  hasFailure = true;
} else if (!(listingFiles || []).some((file) => file.name.endsWith(".json"))) {
  console.error("[property:smoke] Runtime listing seed is missing.");
  hasFailure = true;
}

const { error: normalizedTableError } = await supabase.from("property_listings").select("id").limit(1);
if (normalizedTableError && !normalizedTableError.message.includes("Could not find the table")) {
  console.error(`[property:smoke] Unexpected property_listings error: ${normalizedTableError.message}`);
  hasFailure = true;
}

if (!hasFailure) {
  console.log("[property:smoke] File, bucket, and shared-account checks passed.");
}

process.exit(hasFailure ? 1 : 0);
