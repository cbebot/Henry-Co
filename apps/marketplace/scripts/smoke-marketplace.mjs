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
  "app/(public)/checkout/page.tsx",
  "app/(public)/product/[slug]/page.tsx",
  "app/(public)/store/[slug]/page.tsx",
  "app/(public)/track/[orderNo]/page.tsx",
  "app/account/orders/page.tsx",
  "app/vendor/orders/page.tsx",
  "app/admin/page.tsx",
  "app/support/page.tsx",
  "app/api/marketplace/route.ts",
  "app/api/cron/marketplace-automation/route.ts",
  "lib/marketplace/automation.ts",
  "supabase/migrations/20260402180000_marketplace_init.sql",
  "supabase/migrations/20260402180500_marketplace_policies.sql",
  "supabase/migrations/20260402223000_marketplace_events_and_application_state.sql",
  "scripts/seed-marketplace.mjs",
  "scripts/sync-marketplace-division.mjs",
];

const missingFiles = requiredFiles.filter((file) => !fs.existsSync(path.join(appDir, file)));
if (missingFiles.length) {
  console.error("[marketplace:smoke] Missing required files:");
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

const tableChecks = [
  "company_divisions",
  "marketplace_role_memberships",
  "marketplace_settings",
  "marketplace_categories",
  "marketplace_brands",
  "marketplace_vendors",
  "marketplace_vendor_applications",
  "marketplace_products",
  "marketplace_product_media",
  "marketplace_product_variants",
  "marketplace_carts",
  "marketplace_cart_items",
  "marketplace_orders",
  "marketplace_order_groups",
  "marketplace_order_items",
  "marketplace_payment_records",
  "marketplace_shipments",
  "marketplace_addresses",
  "marketplace_wishlists",
  "marketplace_vendor_follows",
  "marketplace_recently_viewed",
  "marketplace_user_notifications",
  "marketplace_reviews",
  "marketplace_disputes",
  "marketplace_payout_requests",
  "marketplace_notification_queue",
  "marketplace_events",
  "marketplace_notification_attempts",
  "marketplace_automation_runs",
  "marketplace_user_comm_preferences",
  "marketplace_support_threads",
  "marketplace_support_messages",
];

let hasFailure = missingFiles.length > 0;

for (const table of tableChecks) {
  const { error } = await supabase.from(table).select("id").limit(1);
  if (error) {
    console.error(`[marketplace:smoke] Database check failed for ${table}: ${error.message}`);
    hasFailure = true;
  }
}

const { data: division, error: divisionError } = await supabase
  .from("company_divisions")
  .select("slug, primary_url, status")
  .eq("slug", "marketplace")
  .maybeSingle();

if (divisionError || !division) {
  console.error(
    `[marketplace:smoke] Marketplace division missing: ${
      divisionError?.message || "No company_divisions row for slug=marketplace"
    }`
  );
  hasFailure = true;
}

if (!hasFailure) {
  console.log("[marketplace:smoke] File and database checks passed.");
}

process.exit(hasFailure ? 1 : 0);
