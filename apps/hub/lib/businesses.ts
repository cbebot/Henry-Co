export type Status = "Live" | "Coming Soon" | "Private";

export type Business = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  category: string;
  status: Status;
  subdomain: string;
  shortDescription: string;
  highlights: string[];
  whoItsFor: string[];
  howItWorks: string[];
  trust: string[];
  logoUrl?: string | null;
  coverUrl?: string | null;
  accent?: string | null;
  sortOrder?: number | null;
};

export const BUSINESSES: Business[] = [
  {
    id: "care",
    slug: "care",
    name: "Henry & Co. Fabric Care",
    tagline: "Premium laundry, dry cleaning & pickup/delivery.",
    category: "Fabric Care",
    status: "Live",
    subdomain: "care",
    shortDescription:
      "From everyday wear to luxury garments — spotless results, careful handling, and convenient scheduling.",
    highlights: [
      "Pickup & delivery scheduling",
      "Order tracking",
      "Care labels + fabric-safe processing",
      "Premium customer experience",
    ],
    whoItsFor: [
      "Busy professionals",
      "Hotels & short-stay apartments",
      "Families and students",
      "Corporate uniforms",
    ],
    howItWorks: [
      "Choose a service and schedule pickup.",
      "We clean, press, and quality-check each item.",
      "Delivery or ready-for-collection notification.",
      "You rate the experience — we keep improving.",
    ],
    trust: ["Quality checks", "Clear pricing", "Customer support", "Secure operations"],
    logoUrl: null,
    coverUrl: null,
    accent: "#C9A227",
    sortOrder: 1,
  },
  {
    id: "building",
    slug: "building",
    name: "Henry & Co. Building",
    tagline: "Construction, renovations & project management.",
    category: "Construction",
    status: "Coming Soon",
    subdomain: "building",
    shortDescription:
      "From concept to completion — quality builds, transparent milestones, and professional supervision.",
    highlights: ["Project planning", "Budget tracking", "Site supervision", "Professional standards"],
    whoItsFor: ["Homeowners", "Developers", "Commercial projects"],
    howItWorks: [
      "Request a consultation with project details.",
      "We scope, quote, and schedule milestones.",
      "Execution with progress updates.",
      "Handover with QA and documentation.",
    ],
    trust: ["Milestone transparency", "Documentation", "Quality assurance"],
    logoUrl: null,
    coverUrl: null,
    accent: "#7C3AED",
    sortOrder: 2,
  },
  {
    id: "hotel",
    slug: "hotel",
    name: "Henry & Co. Hotels",
    tagline: "Bookings, stays, and hospitality experiences.",
    category: "Hospitality",
    status: "Coming Soon",
    subdomain: "hotel",
    shortDescription:
      "A modern hospitality stack — bookings, customer care, and memorable stays built with quality service.",
    highlights: ["Online booking", "Guest support", "Modern rooms", "Service consistency"],
    whoItsFor: ["Travelers", "Business guests", "Families"],
    howItWorks: [
      "Browse rooms and availability.",
      "Reserve and receive confirmation.",
      "Check-in support and service during stay.",
      "Post-stay feedback to improve quality.",
    ],
    trust: ["Reliable support", "Secure reservations", "Clean standards"],
    logoUrl: null,
    coverUrl: null,
    accent: "#06B6D4",
    sortOrder: 3,
  },
];