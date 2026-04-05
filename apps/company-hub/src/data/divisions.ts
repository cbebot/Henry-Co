import type { Division } from "@/types/division";

export const DIVISIONS: Division[] = [
  {
    id: "fabric-care",
    name: "Henry & Co. Fabric Care",
    tagline: "Premium Garment Care",
    summary:
      "Premium dry cleaning and laundry with coordinated pickup, garment tracking, and meticulous finishing.",
    description:
      "Henry & Co. Fabric Care delivers an end-to-end garment care experience built for busy households and professionals who expect reliability. From coordinated pickup and drop-off to real-time garment tracking, every item is processed with meticulous attention to fabric composition and finishing standards. Services span dry cleaning, wet cleaning, pressing, stain treatment, and speciality care for delicate fabrics — all backed by quality assurance checkpoints and transparent pricing.",
    status: "active",
    featured: true,
    accentHex: "#6B7CFF",
    subdomain: "care.henrycogroup.com",
    visitUrl: "https://care.henrycogroup.com",
    iconName: "tshirt-crew-outline",
    sectors: ["Fabric Care", "Laundry", "Dry Cleaning"],
  },
  {
    id: "studio",
    name: "HenryCo Studio",
    tagline: "Design & Technology",
    summary:
      "Websites, mobile apps, UI systems, branding, e-commerce, and custom software.",
    description:
      "HenryCo Studio designs and ships websites, mobile applications, UI design systems, branding, e-commerce platforms, and bespoke software solutions. The studio operates with disciplined delivery, clear communication, and a commitment to long-term maintainability — partnering with clients from concept through launch and ongoing iteration to build digital products that scale.",
    status: "active",
    featured: true,
    accentHex: "#C9A227",
    subdomain: "studio.henrycogroup.com",
    visitUrl: "https://studio.henrycogroup.com",
    iconName: "code-braces",
    sectors: ["Technology", "Design", "Software"],
  },
  {
    id: "marketplace",
    name: "Henry & Co. Marketplace",
    tagline: "Refined Commerce",
    summary:
      "Premium multi-vendor commerce with trust signals and split-order clarity.",
    description:
      "The Henry & Co. Marketplace is a premium multi-vendor commerce platform that brings together curated sellers, verified product listings, and transparent split-order fulfilment. Buyers shop with confidence through trust signals, detailed seller profiles, and integrated dispute resolution. Sellers benefit from streamlined onboarding, inventory management, and unified payouts — creating a commerce ecosystem where quality and accountability are the default.",
    status: "active",
    featured: true,
    accentHex: "#B2863B",
    subdomain: "marketplace.henrycogroup.com",
    visitUrl: "https://marketplace.henrycogroup.com",
    iconName: "shopping-outline",
    sectors: ["Commerce", "Marketplace"],
  },
  {
    id: "jobs",
    name: "HenryCo Jobs",
    tagline: "Verified Talent",
    summary:
      "Verified hiring for HenryCo and trusted external employers.",
    description:
      "HenryCo Jobs is a verified talent and hiring platform serving both HenryCo divisions and trusted external employers. The platform provides structured applications, transparent role requirements, and accountable recruiting workflows — ensuring candidates receive timely feedback and employers access pre-vetted talent pools with clearer hiring signals throughout the process.",
    status: "active",
    featured: true,
    accentHex: "#2DD4BF",
    subdomain: "jobs.henrycogroup.com",
    visitUrl: "https://jobs.henrycogroup.com",
    iconName: "briefcase-outline",
    sectors: ["Talent", "Hiring", "Careers"],
  },
  {
    id: "property",
    name: "HenryCo Property",
    tagline: "Premium Property",
    summary:
      "Premium rentals, viewings, owner submissions, and managed-property services.",
    description:
      "HenryCo Property covers premium rental listings, scheduled viewings, owner property submissions, and fully managed-property services. The platform operates with operational rigor and transparent follow-through — giving tenants a reliable search and application experience while providing property owners with professional management, occupancy reporting, and maintenance coordination.",
    status: "active",
    featured: true,
    accentHex: "#A78BFA",
    subdomain: "property.henrycogroup.com",
    visitUrl: "https://property.henrycogroup.com",
    iconName: "home-city-outline",
    sectors: ["Property", "Real Estate"],
  },
  {
    id: "learn",
    name: "HenryCo Learn",
    tagline: "Growth & Learning",
    summary:
      "Public courses, internal training, certifications, and partner enablement.",
    description:
      "HenryCo Learn brings together public courses, internal staff training, professional certifications, and partner enablement programmes on a single coherent platform. Learners progress through structured curricula with progress tracking, assessments, and verifiable credentials — empowering teams across HenryCo and beyond to build skills systematically.",
    status: "active",
    featured: true,
    accentHex: "#38BDF8",
    subdomain: "learn.henrycogroup.com",
    visitUrl: "https://learn.henrycogroup.com",
    iconName: "school-outline",
    sectors: ["Education", "Training"],
  },
  {
    id: "logistics",
    name: "HenryCo Logistics",
    tagline: "Reliable Delivery",
    summary:
      "Pickup, dispatch, same-day and scheduled delivery with proof of delivery.",
    description:
      "HenryCo Logistics coordinates pickup, dispatch, same-day delivery, and scheduled delivery operations with full end-to-end visibility. Each consignment is tracked from origin to destination with real-time status updates, route optimisation, and digital proof of delivery — keeping operations transparent and accountable for both senders and recipients.",
    status: "active",
    featured: true,
    accentHex: "#D06F32",
    subdomain: "logistics.henrycogroup.com",
    visitUrl: "https://logistics.henrycogroup.com",
    iconName: "truck-delivery-outline",
    sectors: ["Logistics", "Delivery"],
  },
  {
    id: "buildings-interiors",
    name: "Henry & Co. Buildings & Interiors",
    tagline: "Built Environment",
    summary:
      "Building materials, interior finishes, procurement, and engineering support.",
    description:
      "Henry & Co. Buildings & Interiors brings together building materials, interior finishes, procurement services, and engineering support — providing an end-to-end path from concept to site. The division serves developers, contractors, and homeowners with curated product sourcing, project coordination, and technical guidance. This division is coming soon; follow Henry & Co. for launch updates.",
    status: "coming_soon",
    featured: true,
    accentHex: "#4F46E5",
    subdomain: "building.henrycogroup.com",
    visitUrl: "https://building.henrycogroup.com",
    iconName: "office-building-outline",
    sectors: ["Construction", "Interiors"],
  },
];

export function getDivisionById(id: string): Division | undefined {
  return DIVISIONS.find((d) => d.id === id);
}

export function getActiveDivisions(): Division[] {
  return DIVISIONS.filter((d) => d.status === "active");
}

export function getFeaturedDivisions(): Division[] {
  return DIVISIONS.filter((d) => d.featured);
}

export function getComingSoonDivisions(): Division[] {
  return DIVISIONS.filter((d) => d.status === "coming_soon");
}
