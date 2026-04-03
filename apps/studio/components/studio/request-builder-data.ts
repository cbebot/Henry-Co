export const businessOptions = [
  "Professional services firm",
  "Premium commerce brand",
  "Financial services or fintech",
  "Healthcare, wellness, or care operations",
  "Education, membership, or community platform",
  "Logistics, field operations, or dispatch",
  "Hospitality, real estate, or lifestyle brand",
  "Technology product or venture-backed business",
  "Internal transformation or enterprise operations",
];

export const budgetOptions = [
  "₦1M to ₦2M",
  "₦2M to ₦5M",
  "₦5M to ₦10M",
  "₦10M to ₦25M",
  "₦25M to ₦50M",
  "₦50M+ / enterprise scope",
];

export const urgencyOptions = [
  "Standard delivery lane",
  "Priority commercial timeline",
  "Urgent launch requirement",
];

export const timelineOptions = [
  "2 to 4 weeks",
  "1 to 2 months",
  "2 to 4 months",
  "4 months+ or phased rollout",
  "Need HenryCo to recommend the timeline",
];

export const projectTypeOptions = [
  "Executive company website",
  "Lead generation or campaign funnel",
  "Premium e-commerce storefront",
  "Client portal or account workspace",
  "Internal operations dashboard",
  "Mobile app",
  "Marketplace or booking platform",
  "Custom workflow software",
];

export const platformOptions = [
  "Best-fit recommendation",
  "Website only",
  "Web app / SaaS product",
  "Mobile app",
  "Website plus admin dashboard",
  "Client portal plus internal operations layer",
  "Commerce storefront plus backend operations layer",
];

export const designOptions = [
  "Quiet luxury and high-trust",
  "Editorial and brand-forward",
  "Technical, product-led, and precise",
  "Corporate, premium, and authoritative",
  "HenryCo should direct the aesthetic",
];

export const pageOptions = [
  "Homepage and offer pages",
  "Services or solution pages",
  "About, team, and trust pages",
  "Case studies or proof pages",
  "Pricing, proposal, or quote surfaces",
  "Client account or portal views",
  "Admin dashboard or internal control room",
  "Checkout, payment, or invoice views",
];

export const moduleOptions = [
  "CMS or structured content management",
  "Admin dashboard",
  "Role-based permissions",
  "Payments and invoicing",
  "Bookings, scheduling, or calendar logic",
  "Client account area",
  "Automation and notifications",
  "Analytics and reporting",
  "CRM, ERP, or third-party integrations",
  "File vault or delivery library",
];

export const addOnOptions = [
  "Brand identity",
  "Copywriting and messaging",
  "SEO foundation",
  "Launch campaign or sales pages",
  "Email lifecycle automation",
  "WhatsApp customer workflow",
  "Maintenance or retained support",
  "Launch support and training",
];

export const stackOptions = [
  "Best-fit stack recommendation",
  "Supabase",
  "Custom CMS",
  "React Native",
  "Flutter",
  "Node.js services",
  "Existing stack continuation",
];

export const requestSteps = [
  {
    key: "path",
    label: "Buying lane",
    title: "Choose the commercial route and service lane.",
    body: "This step decides whether the buyer fits a package or needs a custom proposal path.",
  },
  {
    key: "scope",
    label: "Scope design",
    title: "Define the actual build shape.",
    body: "Custom work gets a full architecture pass. Package buyers stay on a tighter lane.",
  },
  {
    key: "commercial",
    label: "Commercial context",
    title: "Capture the business case, timing, and references.",
    body: "HenryCo needs the real commercial context, not a shallow description.",
  },
  {
    key: "activation",
    label: "Activation",
    title: "Choose team fit, confirm contact details, and submit.",
    body: "The brief should land as a real Studio record with a clear next move.",
  },
] as const;

export function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function formatNaira(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Math.max(0, Math.round(value || 0)));
}

export function toggleValue(values: string[], value: string) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

export function readinessBand(score: number) {
  if (score >= 82) return "High clarity";
  if (score >= 66) return "Commercially strong";
  if (score >= 50) return "Good foundation";
  return "Early brief";
}

export function routeRecommendation(pathway: "package" | "custom", readinessScore: number) {
  if (pathway === "package") {
    return readinessScore >= 70
      ? "Package route is commercially clean."
      : "Package route works, but a custom proposal may be a better fit.";
  }

  return readinessScore >= 70
    ? "Custom proposal route is ready for commercial review."
    : "Custom route is viable, but more references or feature clarity will sharpen pricing.";
}
