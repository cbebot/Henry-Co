import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

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
loadEnvFile(path.join(rootDir, ".env.production.local"));
loadEnvFile(path.join(rootDir, ".vercel", ".env.production.local"));

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.log("[studio:seed] Skipping seed because Supabase admin credentials are not available.");
  process.exit(0);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const services = [
  {
    id: "service-web",
    slug: "premium-websites",
    kind: "website",
    name: "Premium Websites",
    headline: "Conversion-grade websites that look expensive and close hard.",
    summary:
      "Brand-forward marketing sites, launch pages, and high-trust company platforms built for conversion, speed, and credibility.",
    starting_price: 1200000,
    delivery_window: "3 to 6 weeks",
    stack: ["Next.js", "Tailwind CSS", "CMS", "Analytics"],
    outcomes: ["High-conversion launch funnels", "Executive-grade credibility", "Fast editorial iteration"],
    score_boosts: ["website", "branding", "funnel", "marketing"],
    is_published: true,
  },
  {
    id: "service-mobile",
    slug: "mobile-apps",
    kind: "mobile_app",
    name: "Mobile Apps",
    headline: "Operationally serious mobile products with premium interface detail.",
    summary:
      "Cross-platform or native-feel mobile products for customer engagement, field teams, logistics, and internal operations.",
    starting_price: 3800000,
    delivery_window: "6 to 12 weeks",
    stack: ["React Native", "Flutter", "Supabase", "Push"],
    outcomes: ["Cross-platform launch speed", "Premium UX polish", "Role-aware mobile workflows"],
    score_boosts: ["mobile", "app", "field", "consumer"],
    is_published: true,
  },
  {
    id: "service-ui",
    slug: "ui-ux-systems",
    kind: "ui_ux",
    name: "UI/UX Systems",
    headline: "Product flows, design systems, and conversion experiences that reduce friction.",
    summary:
      "Research-backed wireframes, polished interaction systems, and production-aware design handoff for digital products.",
    starting_price: 850000,
    delivery_window: "2 to 5 weeks",
    stack: ["Figma", "Design Systems", "Prototyping", "UX Audit"],
    outcomes: ["Faster engineering handoff", "Higher completion rate", "Premium usability"],
    score_boosts: ["design", "ui", "ux", "audit"],
    is_published: true,
  },
  {
    id: "service-brand",
    slug: "brand-identity",
    kind: "branding",
    name: "Brand Identity",
    headline: "Identity systems that feel premium, memorable, and future-proof.",
    summary:
      "Visual identity, brand language, guidelines, and launch-ready collateral for serious digital businesses.",
    starting_price: 650000,
    delivery_window: "2 to 4 weeks",
    stack: ["Identity System", "Brand Guidelines", "Pitch Assets", "Social Kit"],
    outcomes: ["Clear market positioning", "Executive-grade trust", "Systematic design consistency"],
    score_boosts: ["brand", "identity", "launch"],
    is_published: true,
  },
  {
    id: "service-commerce",
    slug: "ecommerce-systems",
    kind: "ecommerce",
    name: "E-commerce Systems",
    headline: "Revenue-focused storefronts with premium trust architecture.",
    summary:
      "Storefronts, catalog flows, campaigns, and operations dashboards designed for measurable conversion and retention.",
    starting_price: 2100000,
    delivery_window: "4 to 8 weeks",
    stack: ["Next.js", "Payments", "CMS", "Ops Dashboard"],
    outcomes: ["Conversion lift", "Clear merchandising", "Order operations visibility"],
    score_boosts: ["commerce", "store", "checkout"],
    is_published: true,
  },
  {
    id: "service-internal",
    slug: "internal-admin-systems",
    kind: "internal_system",
    name: "Internal Admin Systems",
    headline: "Dashboards and workflows that eliminate spreadsheet chaos.",
    summary:
      "Role-based internal tools for ops, finance, sales, dispatch, inventory, and customer success.",
    starting_price: 2600000,
    delivery_window: "5 to 10 weeks",
    stack: ["Next.js", "Supabase", "Automation", "Reporting"],
    outcomes: ["Clear accountability", "Better operational visibility", "Automated team handoffs"],
    score_boosts: ["admin", "internal", "ops", "dashboard"],
    is_published: true,
  },
  {
    id: "service-custom",
    slug: "custom-software",
    kind: "custom_software",
    name: "Custom Software",
    headline: "Bespoke software for unique business models and serious process leverage.",
    summary:
      "Complex portals, integrated business systems, and custom digital products scoped around commercial outcomes.",
    starting_price: 4500000,
    delivery_window: "8 to 16 weeks",
    stack: ["Architecture", "API Design", "Automation", "Cloud"],
    outcomes: ["Long-term leverage", "Tailored workflow control", "Scalable architecture"],
    score_boosts: ["custom", "software", "platform", "api"],
    is_published: true,
  },
];

const packages = [
  {
    id: "pkg-sprint-site",
    service_id: "service-web",
    slug: "studio-launch-sprint",
    name: "Studio Launch Sprint",
    summary: "One decisive launch site for premium positioning and direct conversion.",
    price: 1450000,
    deposit_rate: 0.45,
    timeline_weeks: 4,
    best_for: "Founders and service brands needing a strong premium launch fast.",
    includes: ["Positioning workshop", "5 to 7 pages", "Conversion sections", "Analytics and lead routing"],
    is_published: true,
  },
  {
    id: "pkg-signature-brand",
    service_id: "service-brand",
    slug: "signature-brand-system",
    name: "Signature Brand System",
    summary: "Identity refresh with strategic language, visual system, and rollout kit.",
    price: 920000,
    deposit_rate: 0.5,
    timeline_weeks: 3,
    best_for: "Premium businesses repositioning for a stronger market perception.",
    includes: ["Identity system", "Typography and palette", "Guideline deck", "Launch assets"],
    is_published: true,
  },
  {
    id: "pkg-ops-core",
    service_id: "service-internal",
    slug: "operations-core",
    name: "Operations Core",
    summary: "Internal workflow system for leads, projects, payments, and service coordination.",
    price: 3350000,
    deposit_rate: 0.4,
    timeline_weeks: 8,
    best_for: "Service companies replacing spreadsheet-heavy internal processes.",
    includes: ["Role dashboards", "Workflow automation", "Milestone visibility", "Audit-friendly activity trails"],
    is_published: true,
  },
  {
    id: "pkg-commerce-plus",
    service_id: "service-commerce",
    slug: "commerce-growth-platform",
    name: "Commerce Growth Platform",
    summary: "Premium storefront plus the operational rails needed to scale campaigns confidently.",
    price: 2850000,
    deposit_rate: 0.4,
    timeline_weeks: 6,
    best_for: "Brands needing a polished catalog, trust architecture, and fulfillment visibility.",
    includes: ["Storefront", "Offer pages", "Campaign rails", "Operations dashboard"],
    is_published: true,
  },
];

const teams = [
  {
    id: "team-polaris",
    slug: "polaris-systems",
    name: "Polaris Systems",
    label: "Product Systems Team",
    summary:
      "Best for product-led platforms, dashboards, internal systems, and serious architecture-heavy builds.",
    availability: "open",
    focus: ["Internal tools", "Custom software", "Portals", "Automation"],
    industries: ["Operations", "Services", "Logistics", "B2B SaaS"],
    stack: ["Next.js", "Supabase", "Node.js", "Workflow Automation"],
    highlights: ["Strong delivery governance", "Clean architecture", "Operational reporting"],
    score_biases: ["internal", "custom", "software", "dashboard", "ops"],
    is_published: true,
  },
  {
    id: "team-aether",
    slug: "aether-commerce",
    name: "Aether Commerce",
    label: "Commerce Growth Team",
    summary:
      "Optimized for storefronts, premium offer pages, merchandising systems, and conversion work.",
    availability: "limited",
    focus: ["E-commerce", "Web conversion", "Campaign pages", "Analytics"],
    industries: ["Retail", "Beauty", "Lifestyle", "Premium services"],
    stack: ["Next.js", "CMS", "Payments", "Analytics"],
    highlights: ["Sharper conversion surfaces", "Campaign iteration speed", "High-trust UX"],
    score_biases: ["commerce", "store", "website", "landing", "conversion"],
    is_published: true,
  },
  {
    id: "team-vector",
    slug: "vector-mobile",
    name: "Vector Mobile",
    label: "Mobile Experience Team",
    summary:
      "Focused on mobile apps, multi-role service experiences, field workflows, and mobile retention.",
    availability: "open",
    focus: ["Mobile apps", "Field operations", "Customer apps", "Push workflows"],
    industries: ["Delivery", "Consumer products", "Service businesses", "Marketplaces"],
    stack: ["React Native", "Flutter", "Supabase", "Notifications"],
    highlights: ["Fast cross-platform delivery", "Role-aware mobile UX", "Polished flows"],
    score_biases: ["mobile", "app", "field", "consumer"],
    is_published: true,
  },
  {
    id: "team-lattice",
    slug: "lattice-brand-lab",
    name: "Lattice Brand Lab",
    label: "Brand and Experience Team",
    summary:
      "Handles brand identity, premium UI/UX, launch systems, and narrative-led product surfaces.",
    availability: "open",
    focus: ["Branding", "UI/UX", "Launch systems", "Premium websites"],
    industries: ["Studios", "Hospitality", "Real estate", "Professional services"],
    stack: ["Brand Systems", "Figma", "Next.js", "Motion"],
    highlights: ["Elite art direction", "Design systems", "Luxury-grade polish"],
    score_biases: ["brand", "design", "website", "ui", "ux"],
    is_published: true,
  },
];

async function run() {
  const tasks = [
    supabase.from("studio_services").upsert(services, { onConflict: "id" }),
    supabase.from("studio_packages").upsert(packages, { onConflict: "id" }),
    supabase.from("studio_team_profiles").upsert(teams, { onConflict: "id" }),
  ];

  const results = await Promise.all(tasks);
  const errors = results.map((result) => result.error).filter(Boolean);

  if (errors.length > 0) {
    for (const error of errors) {
      console.error("[studio:seed]", error.message || error);
    }
    process.exit(1);
  }

  console.log(
    `[studio:seed] Seeded ${services.length} services, ${packages.length} packages, and ${teams.length} team profiles.`
  );
}

run().catch((error) => {
  console.error("[studio:seed] Seed failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
