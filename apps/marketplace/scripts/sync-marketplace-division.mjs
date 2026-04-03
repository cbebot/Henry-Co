import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { getDivisionConfig, getDivisionUrl } from "../../../packages/config/company.ts";

const rootDir = path.resolve(process.cwd(), "..", "..");

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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("[marketplace:division] Missing Supabase admin credentials.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const division = getDivisionConfig("marketplace");
const primaryUrl = getDivisionUrl("marketplace");

const payload = {
  slug: division.key,
  name: division.name,
  tagline: division.tagline,
  category: "Marketplace",
  status: "active",
  subdomain: division.subdomain,
  domain: `${division.subdomain}.${process.env.NEXT_PUBLIC_BASE_DOMAIN || "henrycogroup.com"}`,
  short_description: division.description,
  description: division.description,
  primary_url: primaryUrl,
  highlights: [
    "Premium multi-vendor commerce with cleaner discovery",
    "Stronger trust passports for products and stores",
    "Vendor onboarding, moderation, payouts, and dispute control",
    "Split-order clarity for buyers and support teams",
  ],
  who_its_for: [
    "Premium buyers",
    "Trusted local sellers",
    "HenryCo operations teams",
    "Support and finance operators",
  ],
  how_it_works: [
    "Browse premium products with stronger trust signals",
    "Check out with split-order clarity and payment-state visibility",
    "Track, review, and dispute from one HenryCo account",
    "Apply to sell and publish only after moderation approval",
  ],
  trust: [
    "Store trust passports",
    "Moderated seller onboarding",
    "Finance-visible payment verification",
    "Audit-logged operational decisions",
  ],
  accent: division.accent,
  is_published: true,
  is_featured: true,
  sort_order: 3,
  categories: ["Marketplace", "Commerce", "Premium Retail", "Vendor Platforms"],
  lead_name: "HenryCo Marketplace Leadership",
  lead_title: "Marketplace Operations Lead",
};

const { data, error } = await supabase
  .from("company_divisions")
  .upsert(payload, { onConflict: "slug" })
  .select("id, slug, name, primary_url, status")
  .maybeSingle();

if (error) {
  console.error("[marketplace:division] Sync failed:", error.message);
  process.exit(1);
}

console.log("[marketplace:division] Synced:", JSON.stringify(data));
