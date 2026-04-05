import type { Division, DivisionSector } from "@/domain/division";

/** Canonical division catalog mirrored from the public company hub (audit baseline). */
export const DIVISION_CATALOG: Division[] = [
  {
    slug: "fabric-care",
    name: "Henry & Co. Fabric Care",
    shortName: "Fabric Care",
    status: "active",
    featured: true,
    summary: "Premium dry-cleaning and laundry with pickup, tracking and polished garment care.",
    highlights: ["Pickup and delivery scheduling", "Live tracking", "Premium garment finishing"],
    destinationUrl: "https://care.henrycogroup.com",
    sectors: ["fabric_care"],
    accentHex: "#6B7CFF",
  },
  {
    slug: "studio",
    name: "HenryCo Studio",
    shortName: "Studio",
    status: "active",
    featured: true,
    summary:
      "Websites, mobile apps, UI systems, branding, e-commerce, internal tools, and custom software.",
    highlights: ["Milestone visibility", "Packages & custom briefs", "Delivery teams"],
    destinationUrl: "https://studio.henrycogroup.com",
    sectors: ["technology", "design"],
    accentHex: "#C9A227",
  },
  {
    slug: "marketplace",
    name: "Henry & Co. Marketplace",
    shortName: "Marketplace",
    status: "active",
    featured: true,
    summary: "Premium multi-vendor commerce with trust signals and split-order clarity.",
    highlights: ["Verified sellers", "Orders in one account", "Curated discovery"],
    destinationUrl: "https://marketplace.henrycogroup.com",
    sectors: ["commerce", "marketplace", "premium_retail", "vendor_platforms"],
    accentHex: "#B2863B",
  },
  {
    slug: "jobs",
    name: "HenryCo Jobs",
    shortName: "Jobs",
    status: "active",
    featured: true,
    summary: "Hiring operating system for HenryCo and verified external employers.",
    highlights: ["Verified talent layer", "Employer moderation", "Structured applications"],
    destinationUrl: "https://jobs.henrycogroup.com",
    sectors: ["general"],
    accentHex: "#2DD4BF",
  },
  {
    slug: "property",
    name: "HenryCo Property",
    shortName: "Property",
    status: "active",
    featured: true,
    summary: "Listings, viewing coordination, owner submissions, and managed-property services.",
    highlights: ["Trust notes on listings", "Viewing pipeline", "Area guides"],
    destinationUrl: "https://property.henrycogroup.com",
    sectors: ["property", "real_estate"],
    accentHex: "#A78BFA",
  },
  {
    slug: "learn",
    name: "HenryCo Learn",
    shortName: "Learn",
    status: "active",
    featured: true,
    summary: "Public courses, internal training, certifications, and partner enablement.",
    highlights: ["Learning paths", "Progress tracking", "Certificate verification"],
    destinationUrl: "https://learn.henrycogroup.com",
    sectors: ["education", "academy", "internal_training", "certification"],
    accentHex: "#38BDF8",
  },
  {
    slug: "logistics",
    name: "HenryCo Logistics",
    shortName: "Logistics",
    status: "active",
    featured: true,
    summary: "Pickup, dispatch, same-day and scheduled delivery with proof of delivery.",
    highlights: ["Quotes & bookings", "Rider workflows", "Customer tracking"],
    destinationUrl: "https://logistics.henrycogroup.com",
    sectors: ["logistics", "delivery"],
    accentHex: "#D06F32",
  },
  {
    slug: "buildings-interiors",
    name: "Henry & Co. Buildings & Interiors",
    shortName: "Buildings",
    status: "coming_soon",
    featured: true,
    summary:
      "Building materials, interior finishes, procurement, and engineering support — launching soon.",
    highlights: ["End-to-end solutions", "Trusted engineers", "Premium supply"],
    destinationUrl: "https://building.henrycogroup.com",
    sectors: [
      "building_materials",
      "interior_finishes",
      "construction_supply",
      "engineering_support",
      "architectural_products",
      "project_procurement",
      "home_improvement",
      "commercial_development",
    ],
    accentHex: "#4F46E5",
  },
];

export const DIRECTORY_SECTOR_FILTERS: { id: string; label: string }[] = [
  { id: "all", label: "All sectors" },
  { id: "fabric_care", label: "Fabric Care" },
  { id: "technology", label: "Technology" },
  { id: "design", label: "Design" },
  { id: "commerce", label: "Commerce" },
  { id: "marketplace", label: "Marketplace" },
  { id: "property", label: "Property" },
  { id: "education", label: "Education" },
  { id: "logistics", label: "Logistics" },
  { id: "building_materials", label: "Building materials" },
];

export function filterDivisions(params: {
  query: string;
  sectorId: string;
  status: "all" | Division["status"];
  featuredOnly: boolean;
}): Division[] {
  const q = params.query.trim().toLowerCase();
  return DIVISION_CATALOG.filter((d) => {
    if (params.featuredOnly && !d.featured) return false;
    if (params.status !== "all" && d.status !== params.status) return false;
    if (params.sectorId !== "all" && !d.sectors.includes(params.sectorId as DivisionSector))
      return false;
    if (!q) return true;
    const hay = `${d.name} ${d.summary} ${d.sectors.join(" ")}`.toLowerCase();
    return hay.includes(q);
  });
}
