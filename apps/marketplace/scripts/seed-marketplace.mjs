import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { getDivisionConfig } from "../../../packages/config/company.ts";

const rootDir = path.resolve(process.cwd(), "..", "..");
const seedNow = new Date("2026-04-02T12:00:00.000Z");
const division = getDivisionConfig("marketplace");
const identities = {
  buyer: "marketplace-buyer@henrycogroup.com",
  vendor: "marketplace-vendor@henrycogroup.com",
  applicant: "marketplace-applicant@henrycogroup.com",
  admin: "marketplace-admin@henrycogroup.com",
  owner: "marketplace-owner@henrycogroup.com",
};

function loadEnvFile(filepath) {
  if (!fs.existsSync(filepath)) return;
  for (const line of fs.readFileSync(filepath, "utf8").split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index <= 0) continue;
    const key = line.slice(0, index).trim();
    const raw = line.slice(index + 1).trim();
    if (!key || process.env[key]) continue;
    process.env[key] = raw.replace(/^['"]|['"]$/g, "");
  }
}

function isoHoursAgo(hours) {
  return new Date(seedNow.getTime() - hours * 3600_000).toISOString();
}

function isoDaysAgo(days) {
  return new Date(seedNow.getTime() - days * 24 * 3600_000).toISOString();
}

async function ensureTable(table, select = "id") {
  const { error } = await supabase.from(table).select(select).limit(1);
  if (error) throw new Error(`[marketplace:seed] ${table} unavailable: ${error.message}`);
}

async function slugMap(table) {
  const { data, error } = await supabase.from(table).select("id, slug");
  if (error) throw error;
  return new Map((data ?? []).map((row) => [String(row.slug), String(row.id)]));
}

async function mustWrite(label, promise) {
  const { error } = await promise;
  if (error) throw new Error(`[marketplace:seed] ${label}: ${error.message}`);
}

async function ensureDivision() {
  const syncScript = path.join(process.cwd(), "scripts", "sync-marketplace-division.mjs");
  await import(`file://${syncScript.replace(/\\/g, "/")}`);
}

loadEnvFile(path.join(rootDir, ".env.local"));
loadEnvFile(path.join(rootDir, ".env.production.vercel"));

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.log("[marketplace:seed] Skipping because Supabase admin credentials are not available.");
  process.exit(0);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

await ensureDivision();
for (const table of [
  "marketplace_settings",
  "marketplace_categories",
  "marketplace_brands",
  "marketplace_vendors",
  "marketplace_vendor_applications",
  "marketplace_role_memberships",
  "marketplace_products",
  "marketplace_product_media",
  "marketplace_product_variants",
  "marketplace_collections",
  "marketplace_collection_items",
  "marketplace_campaigns",
  "marketplace_orders",
  "marketplace_order_groups",
  "marketplace_order_items",
  "marketplace_payment_records",
  "marketplace_shipments",
  "marketplace_reviews",
  "marketplace_returns",
  "marketplace_disputes",
  "marketplace_payout_requests",
  "marketplace_addresses",
  "marketplace_wishlists",
  "marketplace_vendor_follows",
  "marketplace_recently_viewed",
  "marketplace_support_threads",
  "marketplace_support_messages",
  "marketplace_user_notifications",
  "marketplace_notification_queue",
  "marketplace_events",
  "marketplace_notification_attempts",
  "marketplace_automation_runs",
  "marketplace_user_comm_preferences",
  "marketplace_audit_logs",
]) {
  await ensureTable(table);
}

const categories = [
  {
    slug: "premium-living",
    name: "Premium Living",
    description: "Elevated home, decor, kitchen, and lifestyle products with stronger quality control.",
    hero_copy: "Home products with calmer browsing, richer storytelling, and cleaner trust signals.",
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
    hero_copy: "Personal care with better authenticity, support visibility, and premium detail surfaces.",
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
  { slug: "henryco-verified", name: "HenryCo Verified", description: "Company-verified inventory and premium marketplace programs.", accent: division.accent },
  { slug: "atelier-lagos", name: "Atelier Lagos", description: "Design-forward living essentials with a quiet luxury point of view.", accent: "#6E8552" },
  { slug: "lattice-labs", name: "Lattice Labs", description: "Tools, seating, and focused work accessories for modern operators.", accent: "#2F4D5F" },
  { slug: "botanica-seven", name: "Botanica Seven", description: "Performance skincare and wellness products with stronger ingredient discipline.", accent: "#7A4B35" },
];

const vendors = [
  {
    slug: "henryco-verified", name: "HenryCo Verified",
    description: "Company-curated and HenryCo-verified inventory with stronger fulfillment commitments.",
    owner_type: "company", status: "approved", verification_level: "henryco", trust_score: 98, response_sla_hours: 2,
    fulfillment_rate: 97, dispute_rate: 0.8, review_score: 4.9, followers_count: 1842, accent: division.accent,
    hero_image_url: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1600&q=80",
    badges: ["HenryCo verified", "Priority support", "Fast fulfillment"], support_email: division.supportEmail, support_phone: division.supportPhone,
  },
  {
    slug: "luminous-atelier", name: "Luminous Atelier",
    description: "Premium workspace and interior pieces from a verified seller with disciplined service levels.",
    owner_type: "vendor", status: "approved", verification_level: "gold", trust_score: 91, response_sla_hours: 4,
    fulfillment_rate: 95, dispute_rate: 1.7, review_score: 4.8, followers_count: 625, accent: "#4D5F34",
    hero_image_url: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1600&q=80",
    badges: ["Gold verified", "Editorial pick", "White glove delivery"], support_email: identities.vendor, support_phone: "+2349133000000",
  },
  {
    slug: "cedar-and-chrome", name: "Cedar & Chrome",
    description: "Refined living and wellness products with calmer materials and cleaner storytelling.",
    owner_type: "vendor", status: "approved", verification_level: "gold", trust_score: 88, response_sla_hours: 6,
    fulfillment_rate: 94, dispute_rate: 2.1, review_score: 4.7, followers_count: 412, accent: "#855F3F",
    hero_image_url: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1600&q=80",
    badges: ["Gold verified", "Concierge packaging"], support_email: "care@cedarandchrome.co", support_phone: "+2349133222222",
  },
];

const collections = [
  { slug: "signature-week", title: "Signature Week", description: "Editorially merchandised picks across premium living, beauty, and office upgrades.", kicker: "Launch collection", highlight: "Built to show the calmer side of marketplace browsing." },
  { slug: "founder-desk", title: "Founder Desk Edit", description: "A cleaner workspace built around supportable, trustworthy products.", kicker: "Focused productivity", highlight: "Frequently bought together surfaces and split-order clarity, without the marketplace clutter." },
];

const campaigns = [
  { slug: "marketplace-launch", title: "Marketplace Launch", description: "Cleaner product discovery, verified stores, and split-order clarity from day one.", surface: "hero", accent: division.accent, cta_label: "Explore launch picks", cta_href: "/collections/signature-week", countdown_text: "Launch pricing and featured slots are live now.", status: "active" },
  { slug: "verified-deals", title: "Verified Deals", description: "Tasteful price relief across approved products with fast fulfillment or stronger trust passports.", surface: "deals", accent: "#6E8552", cta_label: "See today’s deals", cta_href: "/deals", countdown_text: "Featured pricing refreshes daily.", status: "active" },
];

const setupResults = await Promise.all([
  supabase.from("marketplace_settings").upsert([
    { key: "support_email", value: { value: division.supportEmail } },
    { key: "support_phone", value: { value: division.supportPhone } },
    { key: "launch_state", value: { state: "seeded" } },
    { key: "owner_alert_email", value: { value: process.env.MARKETPLACE_OWNER_ALERT_EMAIL || identities.owner } },
  ], { onConflict: "key" }),
  supabase.from("marketplace_categories").upsert(categories, { onConflict: "slug" }),
  supabase.from("marketplace_brands").upsert(brands, { onConflict: "slug" }),
  supabase.from("marketplace_vendors").upsert(vendors, { onConflict: "slug" }),
  supabase.from("marketplace_collections").upsert(collections, { onConflict: "slug" }),
  supabase.from("marketplace_campaigns").upsert(campaigns, { onConflict: "slug" }),
]);
for (const [index, result] of setupResults.entries()) {
  if (result.error) throw new Error(`[marketplace:seed] setup-${index}: ${result.error.message}`);
}

const categoryIds = await slugMap("marketplace_categories");
const brandIds = await slugMap("marketplace_brands");
const vendorIds = await slugMap("marketplace_vendors");
const collectionIds = await slugMap("marketplace_collections");

const productDefs = [
  {
    slug: "oro-brass-desk-lamp", title: "Oro Brass Desk Lamp", categorySlug: "office-tech", brandSlug: "henryco-verified", vendorSlug: "henryco-verified",
    summary: "Warm brass task lighting with a study-grade silhouette and quieter detail lines.",
    description: "Designed for premium workspaces, the Oro desk lamp pairs a weighted brass stem with a softly diffused cone shade and a low-profile switch.",
    inventory_owner_type: "company", base_price: 185000, compare_at_price: 220000, total_stock: 13, sku: "HCO-ORO-LAMP", rating: 4.9, review_count: 28,
    featured: true, approval_status: "approved", status: "active", trust_badges: ["HenryCo verified", "Serial-checked", "Fast dispatch"],
    filter_data: { delivery: "48 hours", verifiedSeller: true, companyOwned: true, codEligible: true },
    specifications: { Finish: "Brushed brass", Voltage: "220V", Warranty: "12 months", Height: "48 cm" },
    delivery_note: "Dispatches within 48 hours from Lagos.", lead_time: "2 to 3 business days", cod_eligible: true,
    gallery: [
      "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
    ],
    mediaIds: ["f0c0f200-6401-4bf8-a001-000000000001", "f0c0f200-6401-4bf8-a001-000000000002"], variantId: "f0c0f200-6401-4bf8-a101-000000000001", variantSku: "HCO-ORO-LAMP-STD",
  },
  {
    slug: "lattice-ergonomic-chair", title: "Lattice Ergonomic Chair", categorySlug: "office-tech", brandSlug: "lattice-labs", vendorSlug: "luminous-atelier",
    summary: "Structured lumbar support, quieter wheels, and a cleaner executive profile.",
    description: "A refined task chair built for long workdays without the visual bulk of generic office seating.",
    inventory_owner_type: "vendor", base_price: 320000, compare_at_price: 360000, total_stock: 7, sku: "LAT-ERG-CHAIR", rating: 4.8, review_count: 19,
    featured: true, approval_status: "approved", status: "active", trust_badges: ["Gold verified vendor", "Installation support"],
    filter_data: { delivery: "5 days", verifiedSeller: true, companyOwned: false, codEligible: false },
    specifications: { Material: "Performance mesh + aluminum base", Support: "4D armrests", Warranty: "18 months", Weight: "18 kg" },
    delivery_note: "White glove delivery in major cities.", lead_time: "4 to 6 business days", cod_eligible: false,
    gallery: [
      "https://images.unsplash.com/photo-1519947486511-46149fa0a254?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
    ],
    mediaIds: ["f0c0f200-6401-4bf8-a001-000000000003", "f0c0f200-6401-4bf8-a001-000000000004"], variantId: "f0c0f200-6401-4bf8-a101-000000000002", variantSku: "LAT-ERG-CHAIR-BLK",
  },
  {
    slug: "ivory-cashmere-throw", title: "Ivory Cashmere Throw", categorySlug: "premium-living", brandSlug: "atelier-lagos", vendorSlug: "henryco-verified",
    summary: "Soft weight, neutral tone, and boutique finishing for a calmer room.",
    description: "An editorial-grade throw that softens living rooms and bedrooms without leaning cluttered or loud.",
    inventory_owner_type: "company", base_price: 145000, compare_at_price: 168000, total_stock: 16, sku: "IVR-CASH-THROW", rating: 4.7, review_count: 11,
    featured: true, approval_status: "approved", status: "active", trust_badges: ["Company stocked", "Gift-ready packaging"],
    filter_data: { delivery: "48 hours", verifiedSeller: true, companyOwned: true, codEligible: true },
    specifications: { Material: "Cashmere blend", Size: "180 x 130 cm", Care: "Dry clean only", Origin: "Turkey" },
    delivery_note: "Same-day dispatch on weekdays before 2 PM.", lead_time: "1 to 2 business days", cod_eligible: true,
    gallery: [
      "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
    ],
    mediaIds: ["f0c0f200-6401-4bf8-a001-000000000005", "f0c0f200-6401-4bf8-a001-000000000006"], variantId: "f0c0f200-6401-4bf8-a101-000000000003", variantSku: "IVR-CASH-THROW-IVY",
  },
  {
    slug: "cedar-stone-diffuser", title: "Cedar Stone Diffuser", categorySlug: "premium-living", brandSlug: "atelier-lagos", vendorSlug: "cedar-and-chrome",
    summary: "A low-profile diffuser with mineral textures and calmer ambient aroma delivery.",
    description: "Built for living rooms and quieter bedrooms, the Cedar Stone Diffuser pairs muted ceramic with low-noise vapor release.",
    inventory_owner_type: "vendor", base_price: 98000, compare_at_price: 120000, total_stock: 5, sku: "CDC-STN-DIFF", rating: 4.6, review_count: 8,
    featured: true, approval_status: "approved", status: "active", trust_badges: ["Verified seller", "Quiet motor"],
    filter_data: { delivery: "72 hours", verifiedSeller: true, companyOwned: false, codEligible: true },
    specifications: { Finish: "Stone ceramic", Capacity: "350 ml", Runtime: "10 hours", Noise: "Low-noise mode" },
    delivery_note: "Ships from Ikoyi within 72 hours.", lead_time: "2 to 4 business days", cod_eligible: true,
    gallery: [
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1523413651479-597eb2da0ad6?auto=format&fit=crop&w=1200&q=80",
    ],
    mediaIds: ["f0c0f200-6401-4bf8-a001-000000000007", "f0c0f200-6401-4bf8-a001-000000000008"], variantId: "f0c0f200-6401-4bf8-a101-000000000004", variantSku: "CDC-STN-DIFF-SAND",
  },
  {
    slug: "botanica-recovery-serum", title: "Botanica Recovery Serum", categorySlug: "beauty-wellness", brandSlug: "botanica-seven", vendorSlug: "cedar-and-chrome",
    summary: "Barrier-repair serum with premium formulation notes and ingredient clarity.",
    description: "A restorative serum designed for daily use, with calm scent, clearer provenance notes, and strong post-purchase education.",
    inventory_owner_type: "vendor", base_price: 76000, compare_at_price: 89000, total_stock: 11, sku: "BOT-RCV-SRM", rating: 4.8, review_count: 16,
    featured: false, approval_status: "approved", status: "active", trust_badges: ["Ingredient transparency", "Verified seller"],
    filter_data: { delivery: "72 hours", verifiedSeller: true, companyOwned: false, codEligible: true },
    specifications: { Volume: "30 ml", SkinType: "All skin types", Formula: "Fragrance-light", Use: "AM/PM" },
    delivery_note: "Packed with ingredient guide and usage card.", lead_time: "2 to 4 business days", cod_eligible: true,
    gallery: [
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=1200&q=80",
    ],
    mediaIds: ["f0c0f200-6401-4bf8-a001-000000000009", "f0c0f200-6401-4bf8-a001-000000000010"], variantId: "f0c0f200-6401-4bf8-a101-000000000005", variantSku: "BOT-RCV-SRM-30",
  },
  {
    slug: "atlas-noise-headset", title: "Atlas Noise-Cancelling Headset", categorySlug: "office-tech", brandSlug: "lattice-labs", vendorSlug: "luminous-atelier",
    summary: "Focused audio, cleaner calls, and premium travel-grade materials.",
    description: "A premium headset for calls, deep work, and travel with softer ear cushions and better operator ergonomics.",
    inventory_owner_type: "vendor", base_price: 228000, compare_at_price: 255000, total_stock: 9, sku: "ATL-NOISE-HS", rating: 4.7, review_count: 12,
    featured: false, approval_status: "approved", status: "active", trust_badges: ["Gold verified vendor", "Warranty included"],
    filter_data: { delivery: "4 days", verifiedSeller: true, companyOwned: false, codEligible: false },
    specifications: { Battery: "32 hours", Connectivity: "Bluetooth 5.3", Warranty: "12 months", Weight: "242 g" },
    delivery_note: "Ships with hard-shell travel case.", lead_time: "3 to 4 business days", cod_eligible: false,
    gallery: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=1200&q=80",
    ],
    mediaIds: ["f0c0f200-6401-4bf8-a001-000000000011", "f0c0f200-6401-4bf8-a001-000000000012"], variantId: "f0c0f200-6401-4bf8-a101-000000000006", variantSku: "ATL-NOISE-HS-OBS",
  },
  {
    slug: "marble-serve-tray", title: "Marble Serve Tray", categorySlug: "premium-living", brandSlug: "atelier-lagos", vendorSlug: "cedar-and-chrome",
    summary: "A draft premium living piece waiting in moderation with price and material checks outstanding.",
    description: "Submitted product draft for moderation and onboarding verification. This listing should not appear publicly until approved.",
    inventory_owner_type: "vendor", base_price: 112000, compare_at_price: 132000, total_stock: 4, sku: "MRB-SRV-TRAY", rating: 0, review_count: 0,
    featured: false, approval_status: "submitted", status: "active", trust_badges: ["Needs review"],
    filter_data: { delivery: "Pending approval", verifiedSeller: true, companyOwned: false, codEligible: false },
    specifications: { Material: "Marble composite", Finish: "Satin", Care: "Wipe clean" },
    delivery_note: "Awaiting moderation approval.", lead_time: "Pending approval", cod_eligible: false,
    gallery: ["https://images.unsplash.com/photo-1517705008128-361805f42e86?auto=format&fit=crop&w=1200&q=80"],
    mediaIds: ["f0c0f200-6401-4bf8-a001-000000000013"], variantId: "f0c0f200-6401-4bf8-a101-000000000007", variantSku: "MRB-SRV-TRAY-STN",
  },
];

await mustWrite("products-upsert", supabase.from("marketplace_products").upsert(
  productDefs.map((p) => ({
    slug: p.slug, title: p.title, summary: p.summary, description: p.description,
    category_id: categoryIds.get(p.categorySlug) ?? null, brand_id: brandIds.get(p.brandSlug) ?? null, vendor_id: vendorIds.get(p.vendorSlug) ?? null,
    inventory_owner_type: p.inventory_owner_type, base_price: p.base_price, compare_at_price: p.compare_at_price, currency: "NGN",
    total_stock: p.total_stock, sku: p.sku, rating: p.rating, review_count: p.review_count, featured: p.featured,
    approval_status: p.approval_status, status: p.status, trust_badges: p.trust_badges, filter_data: p.filter_data, specifications: p.specifications,
    delivery_note: p.delivery_note, lead_time: p.lead_time, cod_eligible: p.cod_eligible,
    moderation_note: p.approval_status === "submitted" ? "Awaiting style, pricing, and counterfeit risk review." : null,
    reviewed_at: p.approval_status === "approved" ? isoDaysAgo(2) : null,
  })),
  { onConflict: "slug" }
));

const productIds = await slugMap("marketplace_products");
for (const category of categories) {
  await supabase
    .from("marketplace_categories")
    .update({ product_count: productDefs.filter((p) => p.categorySlug === category.slug && p.approval_status === "approved").length })
    .eq("slug", category.slug);
}

const seededProductIds = productDefs.map((p) => productIds.get(p.slug)).filter(Boolean);
const seededCollectionIds = collections.map((c) => collectionIds.get(c.slug)).filter(Boolean);
await Promise.all([
  seededProductIds.length ? supabase.from("marketplace_product_media").delete().in("product_id", seededProductIds) : Promise.resolve(),
  seededProductIds.length ? supabase.from("marketplace_product_variants").delete().in("product_id", seededProductIds) : Promise.resolve(),
  seededCollectionIds.length ? supabase.from("marketplace_collection_items").delete().in("collection_id", seededCollectionIds) : Promise.resolve(),
]);

await mustWrite("product-media", supabase.from("marketplace_product_media").insert(productDefs.flatMap((p) => p.gallery.map((url, i) => ({ id: p.mediaIds[i], product_id: productIds.get(p.slug), kind: "image", url, is_primary: i === 0, sort_order: i })))));
await mustWrite("product-variants", supabase.from("marketplace_product_variants").insert(productDefs.map((p) => ({ id: p.variantId, product_id: productIds.get(p.slug), sku: p.variantSku, options: { finish: p.slug.includes("oro") ? "Brass" : "Standard" }, price: p.base_price, compare_at_price: p.compare_at_price, stock: p.total_stock, status: p.approval_status === "approved" ? "active" : "draft" }))));
await mustWrite("collection-items", supabase.from("marketplace_collection_items").insert([
    { id: "f0c0f200-6401-4bf8-a201-000000000001", collection_id: collectionIds.get("signature-week"), product_id: productIds.get("oro-brass-desk-lamp"), sort_order: 0 },
    { id: "f0c0f200-6401-4bf8-a201-000000000002", collection_id: collectionIds.get("signature-week"), product_id: productIds.get("ivory-cashmere-throw"), sort_order: 1 },
    { id: "f0c0f200-6401-4bf8-a201-000000000003", collection_id: collectionIds.get("signature-week"), product_id: productIds.get("botanica-recovery-serum"), sort_order: 2 },
    { id: "f0c0f200-6401-4bf8-a201-000000000004", collection_id: collectionIds.get("founder-desk"), product_id: productIds.get("oro-brass-desk-lamp"), sort_order: 0 },
    { id: "f0c0f200-6401-4bf8-a201-000000000005", collection_id: collectionIds.get("founder-desk"), product_id: productIds.get("lattice-ergonomic-chair"), sort_order: 1 },
    { id: "f0c0f200-6401-4bf8-a201-000000000006", collection_id: collectionIds.get("founder-desk"), product_id: productIds.get("atlas-noise-headset"), sort_order: 2 },
  ]));

await supabase.from("marketplace_role_memberships").delete().in("normalized_email", Object.values(identities));
await mustWrite("role-memberships", supabase.from("marketplace_role_memberships").insert([
  { normalized_email: identities.vendor, scope_type: "vendor", scope_id: vendorIds.get("luminous-atelier"), role: "vendor", is_active: true },
  { normalized_email: identities.admin, scope_type: "platform", scope_id: null, role: "marketplace_admin", is_active: true },
  { normalized_email: identities.admin, scope_type: "platform", scope_id: null, role: "moderation", is_active: true },
  { normalized_email: identities.admin, scope_type: "platform", scope_id: null, role: "finance", is_active: true },
  { normalized_email: identities.admin, scope_type: "platform", scope_id: null, role: "support", is_active: true },
  { normalized_email: identities.admin, scope_type: "platform", scope_id: null, role: "operations", is_active: true },
  { normalized_email: identities.owner, scope_type: "platform", scope_id: null, role: "marketplace_owner", is_active: true },
]));

await supabase.from("marketplace_vendor_applications").delete().in("normalized_email", [identities.vendor, identities.applicant]);
await mustWrite("vendor-applications", supabase.from("marketplace_vendor_applications").insert([
  {
    id: "f0c0f200-6401-4bf8-a301-000000000001", normalized_email: identities.vendor, store_name: "Luminous Atelier", proposed_store_slug: "luminous-atelier",
    legal_name: "Luminous Atelier Limited", contact_phone: "+2349133000000", category_focus: "Workspace and premium interior products",
    story: "We source quieter workspace and home products with cleaner photography, calmer materials, and dependable delivery handling.",
    status: "approved", progress_step: "review", documents_json: { businessRegistration: "https://files.henrycogroup.com/marketplace/demo/business-registration.pdf" },
    draft_payload: { storeName: "Luminous Atelier", legalName: "Luminous Atelier Limited" }, agreement_accepted_at: isoDaysAgo(14), review_note: "Approved after KYC verification and delivery SLA confirmation.",
    submitted_at: isoDaysAgo(14), reviewed_at: isoDaysAgo(12), onboarding_completed_at: isoDaysAgo(10),
  },
  {
    id: "f0c0f200-6401-4bf8-a301-000000000002", normalized_email: identities.applicant, store_name: "Aurelian Goods", proposed_store_slug: "aurelian-goods",
    legal_name: "Aurelian Goods Nigeria", contact_phone: "+2349133111199", category_focus: "Premium wellness and home accessories",
    story: "We want to launch a cleaner, giftable home and wellness store with premium packaging and faster support response.",
    status: "submitted", progress_step: "review", documents_json: { businessRegistration: "https://files.henrycogroup.com/marketplace/demo/aurelian-registration.pdf" },
    draft_payload: { storeName: "Aurelian Goods", legalName: "Aurelian Goods Nigeria" }, agreement_accepted_at: isoDaysAgo(1), review_note: null, submitted_at: isoHoursAgo(7), reviewed_at: null,
  },
]));

await Promise.all([
  supabase.from("marketplace_addresses").delete().eq("normalized_email", identities.buyer),
  supabase.from("marketplace_wishlists").delete().eq("normalized_email", identities.buyer),
  supabase.from("marketplace_vendor_follows").delete().eq("normalized_email", identities.buyer),
  supabase.from("marketplace_recently_viewed").delete().eq("normalized_email", identities.buyer),
  supabase.from("marketplace_user_notifications").delete().eq("normalized_email", identities.buyer),
  supabase.from("marketplace_support_messages").delete().eq("thread_id", "f0c0f200-6401-4bf8-a513-000000000001"),
  supabase.from("marketplace_support_threads").delete().eq("normalized_email", identities.buyer),
]);

await Promise.all([
  supabase.from("marketplace_addresses").insert([{ id: "f0c0f200-6401-4bf8-a401-000000000001", normalized_email: identities.buyer, label: "Home", recipient_name: "Marketplace Buyer", phone: "+2349133957084", line1: "14 Admiralty Way", line2: "Lekki Phase 1", city: "Lagos", region: "Lagos", country: "Nigeria", is_default: true }]),
  supabase.from("marketplace_wishlists").insert([
    { id: "f0c0f200-6401-4bf8-a402-000000000001", normalized_email: identities.buyer, product_id: productIds.get("oro-brass-desk-lamp") },
    { id: "f0c0f200-6401-4bf8-a402-000000000002", normalized_email: identities.buyer, product_id: productIds.get("botanica-recovery-serum") },
  ]),
  supabase.from("marketplace_vendor_follows").insert([{ id: "f0c0f200-6401-4bf8-a403-000000000001", normalized_email: identities.buyer, vendor_id: vendorIds.get("luminous-atelier") }]),
  supabase.from("marketplace_recently_viewed").insert([
    { id: "f0c0f200-6401-4bf8-a404-000000000001", normalized_email: identities.buyer, product_id: productIds.get("oro-brass-desk-lamp"), last_viewed_at: isoHoursAgo(2) },
    { id: "f0c0f200-6401-4bf8-a404-000000000002", normalized_email: identities.buyer, product_id: productIds.get("cedar-stone-diffuser"), last_viewed_at: isoHoursAgo(1) },
  ]),
]);

await Promise.all([
  supabase.from("marketplace_returns").delete().in("id", ["f0c0f200-6401-4bf8-a507-000000000001"]),
  supabase.from("marketplace_reviews").delete().in("id", ["f0c0f200-6401-4bf8-a506-000000000001", "f0c0f200-6401-4bf8-a506-000000000002"]),
  supabase.from("marketplace_disputes").delete().in("dispute_no", ["MKT-DSP-240402-001"]),
  supabase.from("marketplace_payment_records").delete().in("reference", ["TRF-20260402-991", "TRF-20260402-992"]),
  supabase.from("marketplace_shipments").delete().in("shipment_no", ["MKT-SHP-101", "MKT-SHP-102"]),
  supabase.from("marketplace_order_items").delete().in("id", ["f0c0f200-6401-4bf8-a504-000000000001", "f0c0f200-6401-4bf8-a504-000000000002", "f0c0f200-6401-4bf8-a504-000000000003"]),
  supabase.from("marketplace_order_groups").delete().in("id", ["f0c0f200-6401-4bf8-a503-000000000001", "f0c0f200-6401-4bf8-a503-000000000002", "f0c0f200-6401-4bf8-a503-000000000003"]),
  supabase.from("marketplace_orders").delete().in("order_no", ["MKT-ORD-240402-001", "MKT-ORD-240402-002"]),
]);

const orders = [
  { id: "f0c0f200-6401-4bf8-a501-000000000001", order_no: "MKT-ORD-240402-001", normalized_email: identities.buyer, status: "shipped", payment_status: "verified", payment_method: "bank_transfer", currency: "NGN", subtotal: 465000, shipping_total: 18000, discount_total: 20000, grand_total: 463000, buyer_name: "Marketplace Buyer", buyer_email: identities.buyer, buyer_phone: "+2349133957084", shipping_city: "Lagos", shipping_region: "Lagos", timeline: ["Order placed", "Payment verified by finance", "Split fulfillment prepared", "HenryCo stocked item is in transit", "Vendor shipment packed for handoff"], placed_at: isoHoursAgo(28) },
  { id: "f0c0f200-6401-4bf8-a501-000000000002", order_no: "MKT-ORD-240402-002", normalized_email: identities.buyer, status: "awaiting_payment", payment_status: "pending", payment_method: "bank_transfer", currency: "NGN", subtotal: 228000, shipping_total: 18000, discount_total: 0, grand_total: 246000, buyer_name: "Marketplace Buyer", buyer_email: identities.buyer, buyer_phone: "+2349133957084", shipping_city: "Abuja", shipping_region: "FCT", timeline: ["Order placed", "Awaiting transfer verification"], placed_at: isoHoursAgo(9) },
];
await mustWrite("orders", supabase.from("marketplace_orders").insert(orders));
await mustWrite("order-groups", supabase.from("marketplace_order_groups").insert([
  { id: "f0c0f200-6401-4bf8-a503-000000000001", order_id: orders[0].id, order_no: orders[0].order_no, vendor_id: vendorIds.get("henryco-verified"), owner_type: "company", fulfillment_status: "shipped", payment_status: "verified", payout_status: "paid", subtotal: 145000, commission_amount: 0, net_vendor_amount: 145000, shipment_code: "MKT-SHP-101", shipment_carrier: "GIGL", shipment_tracking_code: "GIGL-001" },
  { id: "f0c0f200-6401-4bf8-a503-000000000002", order_id: orders[0].id, order_no: orders[0].order_no, vendor_id: vendorIds.get("luminous-atelier"), owner_type: "vendor", fulfillment_status: "packed", payment_status: "verified", payout_status: "eligible", subtotal: 320000, commission_amount: 48000, net_vendor_amount: 272000, shipment_code: "MKT-SHP-102", shipment_carrier: "Kwik", shipment_tracking_code: "KWIK-882" },
  { id: "f0c0f200-6401-4bf8-a503-000000000003", order_id: orders[1].id, order_no: orders[1].order_no, vendor_id: vendorIds.get("luminous-atelier"), owner_type: "vendor", fulfillment_status: "awaiting_acceptance", payment_status: "pending", payout_status: "eligible", subtotal: 228000, commission_amount: 34200, net_vendor_amount: 193800 },
]));
await mustWrite("order-items", supabase.from("marketplace_order_items").insert([
  { id: "f0c0f200-6401-4bf8-a504-000000000001", order_id: orders[0].id, order_no: orders[0].order_no, order_group_id: "f0c0f200-6401-4bf8-a503-000000000001", product_id: productIds.get("ivory-cashmere-throw"), vendor_id: vendorIds.get("henryco-verified"), quantity: 1, unit_price: 145000, line_total: 145000, title_snapshot: { title: "Ivory Cashmere Throw", summary: "Soft weight, neutral tone, and boutique finishing for a calmer room." } },
  { id: "f0c0f200-6401-4bf8-a504-000000000002", order_id: orders[0].id, order_no: orders[0].order_no, order_group_id: "f0c0f200-6401-4bf8-a503-000000000002", product_id: productIds.get("lattice-ergonomic-chair"), vendor_id: vendorIds.get("luminous-atelier"), quantity: 1, unit_price: 320000, line_total: 320000, title_snapshot: { title: "Lattice Ergonomic Chair", summary: "Structured lumbar support, quieter wheels, and a cleaner executive profile." } },
  { id: "f0c0f200-6401-4bf8-a504-000000000003", order_id: orders[1].id, order_no: orders[1].order_no, order_group_id: "f0c0f200-6401-4bf8-a503-000000000003", product_id: productIds.get("atlas-noise-headset"), vendor_id: vendorIds.get("luminous-atelier"), quantity: 1, unit_price: 228000, line_total: 228000, title_snapshot: { title: "Atlas Noise-Cancelling Headset", summary: "Focused audio, cleaner calls, and premium travel-grade materials." } },
]));
await mustWrite("payment-records", supabase.from("marketplace_payment_records").insert([
  { id: "f0c0f200-6401-4bf8-a505-000000000001", order_id: orders[0].id, order_no: orders[0].order_no, provider: "manual", method: "bank_transfer", status: "verified", reference: "TRF-20260402-991", amount: 463000, evidence_note: "Receipt verified by finance queue.", verified_at: isoHoursAgo(20) },
  { id: "f0c0f200-6401-4bf8-a505-000000000002", order_id: orders[1].id, order_no: orders[1].order_no, provider: "manual", method: "bank_transfer", status: "pending", reference: "TRF-20260402-992", amount: 246000, evidence_note: "Awaiting proof upload." },
]));
await mustWrite("shipments", supabase.from("marketplace_shipments").insert([
  { id: "f0c0f200-6401-4bf8-a508-000000000001", order_group_id: "f0c0f200-6401-4bf8-a503-000000000001", order_no: orders[0].order_no, shipment_no: "MKT-SHP-101", carrier: "GIGL", tracking_code: "GIGL-001", status: "shipped", shipped_at: isoHoursAgo(8) },
  { id: "f0c0f200-6401-4bf8-a508-000000000002", order_group_id: "f0c0f200-6401-4bf8-a503-000000000002", order_no: orders[0].order_no, shipment_no: "MKT-SHP-102", carrier: "Kwik", tracking_code: "KWIK-882", status: "packed" },
]));
await mustWrite("reviews", supabase.from("marketplace_reviews").insert([
  { id: "f0c0f200-6401-4bf8-a506-000000000001", order_item_id: "f0c0f200-6401-4bf8-a504-000000000001", product_id: productIds.get("ivory-cashmere-throw"), vendor_id: vendorIds.get("henryco-verified"), buyer_name: "Ada M.", rating: 5, title: "Looks far better in person", body: "The packaging, finish quality, and delivery updates all felt premium. This is the cleanest marketplace purchase I have made locally.", media: [], is_verified_purchase: true, status: "published", created_at: isoHoursAgo(48) },
  { id: "f0c0f200-6401-4bf8-a506-000000000002", order_item_id: "f0c0f200-6401-4bf8-a504-000000000002", product_id: productIds.get("lattice-ergonomic-chair"), vendor_id: vendorIds.get("luminous-atelier"), buyer_name: "Chika O.", rating: 4, title: "Clean finish and great support", body: "The chair arrived in excellent condition and the vendor updates were much clearer than usual.", media: [], is_verified_purchase: true, status: "published", created_at: isoHoursAgo(36) },
]));
await mustWrite("returns", supabase.from("marketplace_returns").insert([{ id: "f0c0f200-6401-4bf8-a507-000000000001", order_item_id: "f0c0f200-6401-4bf8-a504-000000000002", reason: "Changed mind after order split", details: "Buyer asked whether the vendor segment could be returned if delivery timing slips further.", status: "requested", requested_at: isoHoursAgo(4) }]));
await mustWrite("disputes", supabase.from("marketplace_disputes").insert([{ id: "f0c0f200-6401-4bf8-a509-000000000001", dispute_no: "MKT-DSP-240402-001", order_id: orders[0].id, order_no: orders[0].order_no, normalized_email: identities.buyer, vendor_id: vendorIds.get("luminous-atelier"), reason: "Delivery delay beyond quoted window", details: "The vendor segment was packed later than expected and the buyer requested support escalation.", status: "investigating" }]));
await mustWrite("payouts", supabase.from("marketplace_payout_requests").upsert([{ id: "f0c0f200-6401-4bf8-a510-000000000001", reference: "MKT-PAY-240401-001", vendor_id: vendorIds.get("luminous-atelier"), amount: 272000, status: "requested", created_at: isoHoursAgo(10) }], { onConflict: "reference" }));

await mustWrite("support-threads", supabase.from("marketplace_support_threads").insert([{ id: "f0c0f200-6401-4bf8-a513-000000000001", normalized_email: identities.buyer, subject: "Delay on vendor shipment for MKT-ORD-240402-001", status: "open", channel: "web", last_message: "Support confirmed the vendor leg is packed and awaiting courier handoff.", created_at: isoHoursAgo(5), updated_at: isoHoursAgo(2) }]));
await mustWrite("support-messages", supabase.from("marketplace_support_messages").insert([
  { id: "f0c0f200-6401-4bf8-a514-000000000001", thread_id: "f0c0f200-6401-4bf8-a513-000000000001", normalized_email: identities.buyer, sender_type: "buyer", body: "The vendor segment looks delayed. Can support confirm whether it has actually left the warehouse?", created_at: isoHoursAgo(5) },
  { id: "f0c0f200-6401-4bf8-a514-000000000002", thread_id: "f0c0f200-6401-4bf8-a513-000000000001", normalized_email: identities.admin, sender_type: "support", body: "We escalated this to operations. The seller segment is packed, and courier handoff is expected within the next business window.", created_at: isoHoursAgo(2) },
]));
await mustWrite("user-notifications", supabase.from("marketplace_user_notifications").insert([
  { id: "f0c0f200-6401-4bf8-a515-000000000001", normalized_email: identities.buyer, channel: "in_app", title: "Payment verified", body: "Finance confirmed your transfer for MKT-ORD-240402-001. Fulfillment teams have been notified.", payload: { orderNo: "MKT-ORD-240402-001", status: "verified" }, created_at: isoHoursAgo(20) },
  { id: "f0c0f200-6401-4bf8-a515-000000000002", normalized_email: identities.buyer, channel: "email", title: "Vendor shipment packed", body: "The Luminous Atelier segment of your order is packed and moving to the carrier handoff stage.", payload: { orderNo: "MKT-ORD-240402-001", status: "packed" }, created_at: isoHoursAgo(6) },
]));
await supabase.from("marketplace_user_comm_preferences").delete().in("normalized_email", [identities.buyer, identities.vendor]);
await mustWrite("comm-preferences", supabase.from("marketplace_user_comm_preferences").insert([
  { normalized_email: identities.buyer, email_enabled: true, whatsapp_enabled: true, marketing_enabled: false, critical_alerts_enabled: true },
  { normalized_email: identities.vendor, email_enabled: true, whatsapp_enabled: false, marketing_enabled: false, critical_alerts_enabled: true },
]));

await mustWrite("events", supabase.from("marketplace_events").upsert([
    { id: "f0c0f200-6401-4bf8-a517-000000000001", event_type: "vendor_application_submitted", dedupe_key: "seed-vendor-application-submitted", normalized_email: identities.applicant, actor_email: identities.applicant, entity_type: "vendor_application", entity_id: "f0c0f200-6401-4bf8-a301-000000000002", payload: { storeName: "Aurelian Goods" }, created_at: isoHoursAgo(7) },
    { id: "f0c0f200-6401-4bf8-a517-000000000002", event_type: "payment_verified", dedupe_key: "seed-payment-verified-order-1", normalized_email: identities.buyer, actor_email: identities.admin, entity_type: "order", entity_id: orders[0].id, payload: { orderNo: orders[0].order_no, statusLabel: "verified" }, created_at: isoHoursAgo(20) },
    { id: "f0c0f200-6401-4bf8-a517-000000000003", event_type: "owner_alert", dedupe_key: "seed-payment-backlog", normalized_email: process.env.MARKETPLACE_OWNER_ALERT_EMAIL || identities.owner, actor_email: identities.admin, entity_type: "payment_backlog", entity_id: orders[1].id, payload: { note: "One payment verification is pending review.", orderNo: orders[1].order_no }, created_at: isoHoursAgo(3) },
  ], { onConflict: "id" }));
await mustWrite("notification-queue", supabase.from("marketplace_notification_queue").upsert([
    { id: "f0c0f200-6401-4bf8-a518-000000000001", event_id: "f0c0f200-6401-4bf8-a517-000000000001", normalized_email: identities.owner, channel: "email", provider: "resend", template_key: "owner_alert", recipient: process.env.MARKETPLACE_OWNER_ALERT_EMAIL || identities.owner, subject: "New seller application needs review", payload: { storeName: "Aurelian Goods" }, status: "sent", entity_type: "vendor_application", entity_id: "f0c0f200-6401-4bf8-a301-000000000002", dedupe_key: "seed-owner-alert-aurelian", delivery_attempts: 1, last_attempted_at: isoHoursAgo(7), sent_at: isoHoursAgo(7) },
    { id: "f0c0f200-6401-4bf8-a518-000000000002", event_id: "f0c0f200-6401-4bf8-a517-000000000002", normalized_email: identities.buyer, channel: "email", provider: "resend", template_key: "payment_verified", recipient: identities.buyer, subject: "Payment verified for MKT-ORD-240402-001", payload: { orderNo: orders[0].order_no }, status: "sent", entity_type: "order", entity_id: orders[0].id, dedupe_key: "seed-payment-verified-email", delivery_attempts: 1, last_attempted_at: isoHoursAgo(20), sent_at: isoHoursAgo(20) },
    { id: "f0c0f200-6401-4bf8-a518-000000000003", event_id: "f0c0f200-6401-4bf8-a517-000000000002", normalized_email: identities.buyer, channel: "whatsapp", provider: "twilio", template_key: "payment_verified", recipient: "+2349133957084", payload: { orderNo: orders[0].order_no }, status: "skipped", entity_type: "order", entity_id: orders[0].id, dedupe_key: "seed-payment-verified-whatsapp", delivery_attempts: 1, last_attempted_at: isoHoursAgo(20), skipped_reason: "Approved business template not configured for proactive payment verification.", last_error: "WhatsApp template missing for payment_verified." },
    { id: "f0c0f200-6401-4bf8-a518-000000000004", event_id: "f0c0f200-6401-4bf8-a517-000000000003", normalized_email: identities.owner, channel: "email", provider: "resend", template_key: "owner_alert", recipient: process.env.MARKETPLACE_OWNER_ALERT_EMAIL || identities.owner, subject: "Payment verification backlog", payload: { orderNo: orders[1].order_no }, status: "queued", entity_type: "payment_backlog", entity_id: orders[1].id, dedupe_key: "seed-payment-backlog-email", delivery_attempts: 0, next_retry_at: isoHoursAgo(-1) },
  ], { onConflict: "id" }));
await mustWrite("notification-attempts", supabase.from("marketplace_notification_attempts").upsert([
    { id: "f0c0f200-6401-4bf8-a519-000000000001", queue_id: "f0c0f200-6401-4bf8-a518-000000000001", channel: "email", provider: "resend", status: "sent", message_id: "seed-owner-001", payload: { recipient: process.env.MARKETPLACE_OWNER_ALERT_EMAIL || identities.owner }, created_at: isoHoursAgo(7) },
    { id: "f0c0f200-6401-4bf8-a519-000000000002", queue_id: "f0c0f200-6401-4bf8-a518-000000000002", channel: "email", provider: "resend", status: "sent", message_id: "seed-payment-001", payload: { recipient: identities.buyer }, created_at: isoHoursAgo(20) },
    { id: "f0c0f200-6401-4bf8-a519-000000000003", queue_id: "f0c0f200-6401-4bf8-a518-000000000003", channel: "whatsapp", provider: "twilio", status: "skipped", reason: "Approved business template not configured for proactive payment verification.", payload: { recipient: "+2349133957084" }, created_at: isoHoursAgo(20) },
  ], { onConflict: "id" }));
await mustWrite("automation-runs", supabase.from("marketplace_automation_runs").upsert([{ id: "f0c0f200-6401-4bf8-a520-000000000001", automation_key: "marketplace_automation", status: "completed", summary: { queuedAlerts: 1, staleOrders: 1, lowStockProducts: 1 }, started_at: isoHoursAgo(1), completed_at: isoHoursAgo(1) }], { onConflict: "id" }));
await mustWrite("audit-logs", supabase.from("marketplace_audit_logs").upsert([
    { id: "f0c0f200-6401-4bf8-a521-000000000001", event_type: "seed_catalog_launch", actor_email: identities.admin, entity_type: "catalog", entity_id: "marketplace-launch", details: { approvedProducts: 6, pendingProducts: 1 }, created_at: isoHoursAgo(1) },
    { id: "f0c0f200-6401-4bf8-a521-000000000002", event_type: "payment_verified", actor_email: identities.admin, entity_type: "order", entity_id: orders[0].id, details: { orderNo: orders[0].order_no, status: "verified" }, created_at: isoHoursAgo(20) },
    { id: "f0c0f200-6401-4bf8-a521-000000000003", event_type: "dispute_opened", actor_email: identities.buyer, entity_type: "dispute", entity_id: "f0c0f200-6401-4bf8-a509-000000000001", details: { disputeNo: "MKT-DSP-240402-001", orderNo: orders[0].order_no }, created_at: isoHoursAgo(4) },
  ], { onConflict: "id" }));

console.log("[marketplace:seed] Seeded real marketplace launch dataset.");
