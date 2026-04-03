import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { getDivisionConfig } from "../../../packages/config/company.ts";

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
  console.log("[marketplace:seed] Skipping because Supabase admin credentials are not available.");
  process.exit(0);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const division = getDivisionConfig("marketplace");

async function ensureDivision() {
  const syncScript = path.join(process.cwd(), "scripts", "sync-marketplace-division.mjs");
  await import(`file://${syncScript.replace(/\\/g, "/")}`);
}

async function ensureTable(table, select = "id") {
  const { error } = await supabase.from(table).select(select).limit(1);
  if (error) {
    throw new Error(`[marketplace:seed] ${table} unavailable: ${error.message}`);
  }
}

await ensureDivision();

const requiredTables = [
  "marketplace_settings",
  "marketplace_categories",
  "marketplace_brands",
  "marketplace_vendors",
  "marketplace_products",
  "marketplace_product_media",
  "marketplace_collections",
  "marketplace_collection_items",
  "marketplace_campaigns",
];

for (const table of requiredTables) {
  await ensureTable(table);
}

const categories = [
  {
    slug: "premium-living",
    name: "Premium Living",
    description: "Elevated home, decor, kitchen, and lifestyle products with stronger quality control.",
    hero_copy: "Home products with calmer browsing and clearer trust signals.",
    sort_order: 1,
    is_featured: true,
    product_count: 0,
    filter_presets: ["verified", "fast_delivery", "cod"],
    trust_notes: ["Moderated catalog", "Clear delivery notes", "Accountable stores"],
  },
  {
    slug: "beauty-wellness",
    name: "Beauty & Wellness",
    description: "Trusted beauty, care, and wellness items from verified sellers.",
    hero_copy: "Personal care with better authenticity and service signals.",
    sort_order: 2,
    is_featured: true,
    product_count: 0,
    filter_presets: ["verified", "top_rated"],
    trust_notes: ["Seller passports", "Review moderation", "Support visibility"],
  },
  {
    slug: "office-tech",
    name: "Office & Tech",
    description: "Cleanly merchandised devices, desks, accessories, and work essentials.",
    hero_copy: "Operational products for focused teams and premium workspaces.",
    sort_order: 3,
    is_featured: true,
    product_count: 0,
    filter_presets: ["fast_delivery", "company_owned"],
    trust_notes: ["Split-order clarity", "Manual payment verification", "Post-purchase support"],
  },
];

const brands = [
  {
    slug: "henryco-verified",
    name: "HenryCo Verified",
    description: "Company-verified products and marketplace programs.",
    accent: division.accent,
  },
  {
    slug: "atelier-lagos",
    name: "Atelier Lagos",
    description: "Design-forward premium living essentials.",
    accent: "#4D5F34",
  },
];

const vendor = {
  slug: "henryco-verified",
  name: "HenryCo Verified",
  description: "Company-curated and HenryCo-verified inventory with stronger fulfillment commitments.",
  owner_type: "company",
  status: "approved",
  verification_level: "henryco",
  trust_score: 98,
  response_sla_hours: 2,
  fulfillment_rate: 97,
  dispute_rate: 0.8,
  review_score: 4.9,
  followers_count: 0,
  accent: division.accent,
  hero_image_url:
    "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1600&q=80",
  badges: ["HenryCo verified", "Priority support", "Fast fulfillment"],
  support_email: division.supportEmail,
  support_phone: division.supportPhone,
};

const collection = {
  slug: "signature-week",
  title: "Signature Week",
  description: "Editorially merchandised picks across premium living, beauty, and office upgrades.",
  kicker: "Launch collection",
  highlight: "Built to show the calmer side of marketplace browsing.",
};

const campaign = {
  slug: "marketplace-launch",
  title: "Marketplace Launch",
  description: "Cleaner product discovery, verified stores, and split-order clarity from day one.",
  surface: "hero",
  accent: division.accent,
  cta_label: "Explore launch picks",
  cta_href: "/collections/signature-week",
  countdown_text: "Launch pricing and featured slots are live now.",
  status: "active",
};

const results = await Promise.all([
  supabase.from("marketplace_settings").upsert(
    [
      { key: "support_email", value: { value: division.supportEmail } },
      { key: "support_phone", value: { value: division.supportPhone } },
      { key: "launch_state", value: { state: "seeded" } },
    ],
    { onConflict: "key" }
  ),
  supabase.from("marketplace_categories").upsert(categories, { onConflict: "slug" }),
  supabase.from("marketplace_brands").upsert(brands, { onConflict: "slug" }),
  supabase.from("marketplace_vendors").upsert(vendor, { onConflict: "slug" }),
  supabase.from("marketplace_collections").upsert(collection, { onConflict: "slug" }),
  supabase.from("marketplace_campaigns").upsert(campaign, { onConflict: "slug" }),
]);

const errors = results.map((result) => result.error).filter(Boolean);
if (errors.length) {
  for (const error of errors) console.error("[marketplace:seed]", error.message || error);
  process.exit(1);
}

console.log("[marketplace:seed] Seeded marketplace baseline records.");
