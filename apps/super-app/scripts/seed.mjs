/**
 * Optional staging seed — upserts divisions from the embedded catalog.
 * Requires staging service role credentials in the environment (never commit).
 *
 * Usage (from repo root):
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node apps/super-app/scripts/seed.mjs
 *
 * PROD-READY-01: the seeded `destination_url` per division now respects
 * `BASE_DOMAIN` (preferred) or `EXPO_PUBLIC_BASE_DOMAIN`. Unset → defaults to
 * `henrycogroup.com` so existing behaviour is preserved.
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY for seed.");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const FALLBACK_BASE_DOMAIN = "henrycogroup.com";

function resolveBaseDomain() {
  const raw =
    process.env.BASE_DOMAIN ??
    process.env.NEXT_PUBLIC_BASE_DOMAIN ??
    process.env.EXPO_PUBLIC_BASE_DOMAIN ??
    "";
  const clean = String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/\.+$/, "");
  return clean || FALLBACK_BASE_DOMAIN;
}

const BASE_DOMAIN = resolveBaseDomain();
const divisionUrl = (subdomain) => `https://${subdomain}.${BASE_DOMAIN}`;

const rows = [
  {
    slug: "fabric-care",
    name: "Henry & Co. Fabric Care",
    status: "active",
    featured: true,
    summary:
      "Premium dry-cleaning and laundry with pickup, tracking and polished garment care.",
    accent_hex: "#6B7CFF",
    destination_url: divisionUrl("care"),
    sectors: ["fabric_care"],
  },
  {
    slug: "studio",
    name: "HenryCo Studio",
    status: "active",
    featured: true,
    summary: "Websites, mobile apps, UI systems, branding, e-commerce, and custom software.",
    accent_hex: "#C9A227",
    destination_url: divisionUrl("studio"),
    sectors: ["technology", "design"],
  },
  {
    slug: "marketplace",
    name: "Henry & Co. Marketplace",
    status: "active",
    featured: true,
    summary: "Premium multi-vendor commerce with trust signals and split-order clarity.",
    accent_hex: "#B2863B",
    destination_url: divisionUrl("marketplace"),
    sectors: ["commerce", "marketplace", "premium_retail", "vendor_platforms"],
  },
  {
    slug: "jobs",
    name: "HenryCo Jobs",
    status: "active",
    featured: true,
    summary: "Hiring operating system for HenryCo and verified external employers.",
    accent_hex: "#2DD4BF",
    destination_url: divisionUrl("jobs"),
    sectors: ["general"],
  },
  {
    slug: "property",
    name: "HenryCo Property",
    status: "active",
    featured: true,
    summary: "Listings, viewing coordination, owner submissions, and managed-property services.",
    accent_hex: "#A78BFA",
    destination_url: divisionUrl("property"),
    sectors: ["property", "real_estate"],
  },
  {
    slug: "learn",
    name: "HenryCo Learn",
    status: "active",
    featured: true,
    summary: "Public courses, internal training, certifications, and partner enablement.",
    accent_hex: "#38BDF8",
    destination_url: divisionUrl("learn"),
    sectors: ["education", "academy", "internal_training", "certification"],
  },
  {
    slug: "logistics",
    name: "HenryCo Logistics",
    status: "active",
    featured: true,
    summary: "Pickup, dispatch, same-day and scheduled delivery with proof of delivery.",
    accent_hex: "#D06F32",
    destination_url: divisionUrl("logistics"),
    sectors: ["logistics", "delivery"],
  },
  {
    slug: "buildings-interiors",
    name: "Henry & Co. Buildings & Interiors",
    status: "coming_soon",
    featured: true,
    summary:
      "Building materials, interior finishes, procurement, and engineering support — launching soon.",
    accent_hex: "#4F46E5",
    destination_url: divisionUrl("building"),
    sectors: ["building_materials", "interior_finishes", "construction_supply"],
  },
];

const { error } = await supabase.from("divisions").upsert(rows, { onConflict: "slug" });
if (error) {
  console.error(error);
  process.exit(1);
}
console.log(`Seeded ${rows.length} divisions.`);
