import type { StudioServiceKind } from "@/lib/studio/types";

export type StudioPricedOption = {
  id: string;
  label: string;
  description: string;
  amount: number;
  isActive: boolean;
  serviceKinds?: StudioServiceKind[];
};

export type StudioModifierOption = {
  id: string;
  label: string;
  description: string;
  modifierType: "flat" | "percent";
  value: number;
  isActive: boolean;
  serviceKinds?: StudioServiceKind[];
};

export type StudioRequestConfig = {
  businessOptions: string[];
  budgetOptions: string[];
  designOptions: string[];
  stackOptions: string[];
  projectTypes: StudioPricedOption[];
  platformOptions: StudioPricedOption[];
  pageOptions: StudioPricedOption[];
  moduleOptions: StudioPricedOption[];
  addOnOptions: StudioPricedOption[];
  urgencyOptions: StudioModifierOption[];
  timelineOptions: StudioModifierOption[];
};

function cleanText(value?: unknown) {
  return String(value ?? "").trim();
}

function createId(prefix: string, value: string) {
  const slug = cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return `${prefix}-${slug || "item"}`;
}

function asNumber(value: unknown, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function asServiceKinds(value: unknown) {
  if (!Array.isArray(value)) return undefined;
  const kinds = value
    .map((item) => cleanText(item) as StudioServiceKind)
    .filter(Boolean);
  return kinds.length > 0 ? kinds : undefined;
}

function normalizeStringList(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback;
  const list = value.map((item) => cleanText(item)).filter(Boolean);
  return list.length > 0 ? list : fallback;
}

function normalizePricedOptions(value: unknown, fallback: StudioPricedOption[]) {
  if (!Array.isArray(value)) return fallback;
  const mapped = value
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return null;
      const record = item as Record<string, unknown>;
      const label = cleanText(record.label);
      if (!label) return null;
      return {
        id: cleanText(record.id) || createId("option", label),
        label,
        description: cleanText(record.description),
        amount: Math.max(0, Math.round(asNumber(record.amount))),
        isActive: record.isActive !== false,
        serviceKinds: asServiceKinds(record.serviceKinds),
      } satisfies StudioPricedOption;
    })
    .filter(Boolean) as StudioPricedOption[];

  return mapped.length > 0 ? mapped : fallback;
}

function normalizeModifierOptions(value: unknown, fallback: StudioModifierOption[]) {
  if (!Array.isArray(value)) return fallback;
  const mapped = value
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return null;
      const record = item as Record<string, unknown>;
      const label = cleanText(record.label);
      if (!label) return null;
      const modifierType =
        cleanText(record.modifierType) === "percent" ? "percent" : "flat";
      return {
        id: cleanText(record.id) || createId("modifier", label),
        label,
        description: cleanText(record.description),
        modifierType,
        value: Math.max(0, asNumber(record.value)),
        isActive: record.isActive !== false,
        serviceKinds: asServiceKinds(record.serviceKinds),
      } satisfies StudioModifierOption;
    })
    .filter(Boolean) as StudioModifierOption[];

  return mapped.length > 0 ? mapped : fallback;
}

export function defaultStudioRequestConfig(): StudioRequestConfig {
  return {
    businessOptions: [
      "Professional services firm",
      "Premium commerce brand",
      "Financial services or fintech",
      "Healthcare, wellness, or care operations",
      "Education, membership, or community platform",
      "Logistics, field operations, or dispatch",
      "Hospitality, real estate, or lifestyle brand",
      "Technology product or venture-backed business",
      "Operations transformation or enterprise operations",
    ],
    budgetOptions: [
      "₦1M to ₦2M",
      "₦2M to ₦5M",
      "₦5M to ₦10M",
      "₦10M to ₦25M",
      "₦25M to ₦50M",
      "₦50M+ / enterprise scope",
    ],
    designOptions: [
      "Quiet luxury and high-trust",
      "Editorial and brand-forward",
      "Technical, product-led, and precise",
      "Corporate, premium, and authoritative",
      "HenryCo should direct the aesthetic",
    ],
    stackOptions: [
      "Best-fit stack recommendation",
      "Managed backend",
      "Custom CMS",
      "React Native",
      "Flutter",
      "Node.js services",
      "Existing stack continuation",
    ],
    projectTypes: [
      {
        id: "project-type-executive-company-website",
        label: "Executive company website",
        description: "For premium lead-generation, corporate positioning, and credibility-first websites.",
        amount: 0,
        isActive: true,
        serviceKinds: ["website"],
      },
      {
        id: "project-type-lead-generation-funnel",
        label: "Lead generation or campaign funnel",
        description: "Revenue-focused landing experiences with stronger conversion logic and campaign reporting.",
        amount: 280000,
        isActive: true,
        serviceKinds: ["website", "branding", "ui_ux"],
      },
      {
        id: "project-type-premium-ecommerce",
        label: "Premium e-commerce storefront",
        description: "Commerce-led experiences with merchandising, checkout logic, and backend operations.",
        amount: 580000,
        isActive: true,
        serviceKinds: ["ecommerce", "website"],
      },
      {
        id: "project-type-client-portal",
        label: "Client portal or account workspace",
        description: "Secure customer-facing spaces with account views, status, files, and approvals.",
        amount: 760000,
        isActive: true,
        serviceKinds: ["website", "custom_software", "internal_system"],
      },
      {
        id: "project-type-internal-dashboard",
        label: "Internal operations dashboard",
        description: "Control-room interfaces for teams, finance, sales, delivery, and reporting.",
        amount: 840000,
        isActive: true,
        serviceKinds: ["internal_system", "custom_software"],
      },
      {
        id: "project-type-mobile-app",
        label: "Mobile app",
        description: "Native-feeling mobile products, member apps, or companion platforms.",
        amount: 1180000,
        isActive: true,
        serviceKinds: ["mobile_app"],
      },
      {
        id: "project-type-marketplace-booking",
        label: "Marketplace or booking platform",
        description: "Multi-sided experiences with listings, bookings, payments, and operational logic.",
        amount: 980000,
        isActive: true,
        serviceKinds: ["custom_software", "ecommerce", "mobile_app"],
      },
      {
        id: "project-type-custom-workflow-software",
        label: "Custom operations software",
        description: "Software for approvals, team coordination, process automation, or client operations.",
        amount: 1240000,
        isActive: true,
        serviceKinds: ["custom_software", "internal_system"],
      },
      {
        id: "project-type-brand-system",
        label: "Brand system and digital identity",
        description: "Identity, brand direction, and digital design language for higher-trust launches.",
        amount: 320000,
        isActive: true,
        serviceKinds: ["branding", "ui_ux"],
      },
      {
        id: "project-type-product-design-system",
        label: "Product UX/UI direction",
        description: "Research-led interface design, flows, and component libraries for complex products.",
        amount: 460000,
        isActive: true,
        serviceKinds: ["ui_ux"],
      },
    ],
    platformOptions: [
      {
        id: "platform-best-fit",
        label: "Best-fit recommendation",
        description: "HenryCo recommends the architecture after reviewing scope and growth constraints.",
        amount: 0,
        isActive: true,
      },
      {
        id: "platform-website-only",
        label: "Website only",
        description: "Public-facing website without a deeper account or operations layer.",
        amount: 0,
        isActive: true,
      },
      {
        id: "platform-web-app",
        label: "Web app / SaaS product",
        description: "Product-grade authenticated application layer with real user journeys and business logic.",
        amount: 1050000,
        isActive: true,
      },
      {
        id: "platform-mobile-app",
        label: "Mobile app",
        description: "iOS/Android-oriented product delivery with app-specific interaction and release overhead.",
        amount: 1450000,
        isActive: true,
      },
      {
        id: "platform-website-admin",
        label: "Website plus operations dashboard",
        description: "Public site plus a private operations and publishing layer.",
        amount: 900000,
        isActive: true,
      },
      {
        id: "platform-portal-ops",
        label: "Client portal plus operations layer",
        description: "Customer-facing workspace with a private team management surface.",
        amount: 1750000,
        isActive: true,
      },
      {
        id: "platform-commerce-backend",
        label: "Commerce storefront plus backend operations layer",
        description: "Storefront, order pipeline, fulfillment, and operational control surfaces.",
        amount: 1550000,
        isActive: true,
      },
    ],
    pageOptions: [
      {
        id: "page-home-offers",
        label: "Homepage and offer pages",
        description: "Core landing architecture, offer framing, and conversion-first lead surfaces.",
        amount: 240000,
        isActive: true,
      },
      {
        id: "page-services-solutions",
        label: "Services or solution pages",
        description: "Service detail, solution architecture, or product marketing pages.",
        amount: 180000,
        isActive: true,
      },
      {
        id: "page-about-trust",
        label: "About, team, and trust pages",
        description: "Reassurance surfaces for credibility, company profile, and team positioning.",
        amount: 160000,
        isActive: true,
      },
      {
        id: "page-proof",
        label: "Case studies or proof pages",
        description: "Proof-led pages for results, delivery stories, and trust assets.",
        amount: 220000,
        isActive: true,
      },
      {
        id: "page-pricing-proposal",
        label: "Pricing, proposal, or quote surfaces",
        description: "Commercial clarity pages for quotes, packages, or scoped decision flows.",
        amount: 180000,
        isActive: true,
      },
      {
        id: "page-client-portal",
        label: "Client account or portal views",
        description: "Authenticated user-facing account, project, or portal screens.",
        amount: 620000,
        isActive: true,
      },
      {
        id: "page-admin-control",
        label: "Operations dashboard or control room",
        description: "Private dashboards, queues, approvals, and operational coordination.",
        amount: 780000,
        isActive: true,
      },
      {
        id: "page-checkout-payment",
        label: "Checkout, payment, or invoice views",
        description: "Transaction-facing views for payment, invoice, proof, or commerce confirmation.",
        amount: 280000,
        isActive: true,
      },
    ],
    moduleOptions: [
      {
        id: "module-cms",
        label: "CMS or structured content management",
        description: "Publishing flows and controlled content administration.",
        amount: 320000,
        isActive: true,
      },
      {
        id: "module-admin",
        label: "Operations dashboard",
        description: "Operational oversight surfaces for private team use.",
        amount: 760000,
        isActive: true,
      },
      {
        id: "module-permissions",
        label: "Role-based permissions",
        description: "Secure access models across staff, client, and finance roles.",
        amount: 280000,
        isActive: true,
      },
      {
        id: "module-payments",
        label: "Payments and invoicing",
        description: "Payment records, proofs, invoices, and finance coordination.",
        amount: 460000,
        isActive: true,
      },
      {
        id: "module-bookings",
        label: "Bookings, scheduling, or calendar logic",
        description: "Reservations, schedules, availability, or appointment logic.",
        amount: 420000,
        isActive: true,
      },
      {
        id: "module-client-account",
        label: "Client account area",
        description: "Customer-visible workspace, status history, and account features.",
        amount: 620000,
        isActive: true,
      },
      {
        id: "module-automation",
        label: "Automation and notifications",
        description: "Email, WhatsApp, reminders, and triggered operations.",
        amount: 540000,
        isActive: true,
      },
      {
        id: "module-analytics",
        label: "Analytics and reporting",
        description: "Operational visibility, reporting, and commercial performance views.",
        amount: 380000,
        isActive: true,
      },
      {
        id: "module-integrations",
        label: "CRM, ERP, or third-party integrations",
        description: "External platforms, middleware, and enterprise connection logic.",
        amount: 680000,
        isActive: true,
      },
      {
        id: "module-file-vault",
        label: "File vault or delivery library",
        description: "Structured file storage, delivery handoff, and proof/document rails.",
        amount: 340000,
        isActive: true,
      },
    ],
    addOnOptions: [
      {
        id: "addon-brand-identity",
        label: "Brand identity",
        description: "Naming support, identity direction, visual language, and core brand assets.",
        amount: 650000,
        isActive: true,
      },
      {
        id: "addon-copywriting",
        label: "Copywriting and messaging",
        description: "Offer framing, conversion copy, and clearer brand language.",
        amount: 380000,
        isActive: true,
      },
      {
        id: "addon-seo",
        label: "SEO foundation",
        description: "Search structure, metadata, and technical launch fundamentals.",
        amount: 320000,
        isActive: true,
      },
      {
        id: "addon-launch-campaign",
        label: "Launch campaign or sales pages",
        description: "Launch-specific landing experiences, campaign structure, and selling surfaces.",
        amount: 540000,
        isActive: true,
      },
      {
        id: "addon-email-automation",
        label: "Email lifecycle automation",
        description: "Automated email journeys for onboarding, nurture, or operational updates.",
        amount: 450000,
        isActive: true,
      },
      {
        id: "addon-whatsapp-workflow",
        label: "WhatsApp customer journey",
        description: "Operational or customer messaging flows over WhatsApp where appropriate.",
        amount: 420000,
        isActive: true,
      },
      {
        id: "addon-maintenance",
        label: "Maintenance or retained support",
        description: "Ongoing technical care, iteration, and operator support after launch.",
        amount: 600000,
        isActive: true,
      },
      {
        id: "addon-launch-training",
        label: "Launch support and training",
        description: "Operator enablement, walkthroughs, and team transition support.",
        amount: 300000,
        isActive: true,
      },
    ],
    urgencyOptions: [
      {
        id: "urgency-standard",
        label: "Standard delivery lane",
        description: "Balanced planning and production schedule.",
        modifierType: "percent",
        value: 0,
        isActive: true,
      },
      {
        id: "urgency-priority",
        label: "Priority commercial timeline",
        description: "Elevated priority across delivery planning and team resourcing.",
        modifierType: "percent",
        value: 0.08,
        isActive: true,
      },
      {
        id: "urgency-urgent",
        label: "Urgent launch requirement",
        description: "Compressed delivery, faster stakeholder cycles, and higher coordination pressure.",
        modifierType: "percent",
        value: 0.18,
        isActive: true,
      },
    ],
    timelineOptions: [
      {
        id: "timeline-4-7-days",
        label: "4-7 days",
        description: "Emergency launch lane for highly compressed scope.",
        modifierType: "percent",
        value: 0.22,
        isActive: true,
      },
      {
        id: "timeline-8-14-days",
        label: "8-14 days",
        description: "Rush delivery for compact, tightly managed execution.",
        modifierType: "percent",
        value: 0.14,
        isActive: true,
      },
      {
        id: "timeline-2-3-weeks",
        label: "2-3 weeks",
        description: "Fast-track delivery lane with moderate compression.",
        modifierType: "percent",
        value: 0.08,
        isActive: true,
      },
      {
        id: "timeline-4-6-weeks",
        label: "4-6 weeks",
        description: "Default premium delivery lane for most well-scoped web work.",
        modifierType: "percent",
        value: 0,
        isActive: true,
      },
      {
        id: "timeline-6-10-weeks",
        label: "6-10 weeks",
        description: "Standard planning window for deeper product or platform work.",
        modifierType: "percent",
        value: 0,
        isActive: true,
      },
      {
        id: "timeline-2-4-months",
        label: "2-4 months or phased rollout",
        description: "Longer operating lane for multi-phase programs and enterprise scope.",
        modifierType: "percent",
        value: 0,
        isActive: true,
      },
      {
        id: "timeline-recommend",
        label: "Need HenryCo to recommend the timeline",
        description: "Use this if the right sequence depends on deeper scope review.",
        modifierType: "percent",
        value: 0,
        isActive: true,
      },
    ],
  };
}

export function normalizeStudioRequestConfig(value?: unknown): StudioRequestConfig {
  const defaults = defaultStudioRequestConfig();
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return defaults;
  }

  const record = value as Record<string, unknown>;

  return {
    businessOptions: normalizeStringList(record.businessOptions, defaults.businessOptions),
    budgetOptions: normalizeStringList(record.budgetOptions, defaults.budgetOptions),
    designOptions: normalizeStringList(record.designOptions, defaults.designOptions),
    stackOptions: normalizeStringList(record.stackOptions, defaults.stackOptions),
    projectTypes: normalizePricedOptions(record.projectTypes, defaults.projectTypes),
    platformOptions: normalizePricedOptions(record.platformOptions, defaults.platformOptions),
    pageOptions: normalizePricedOptions(record.pageOptions, defaults.pageOptions),
    moduleOptions: normalizePricedOptions(record.moduleOptions, defaults.moduleOptions),
    addOnOptions: normalizePricedOptions(record.addOnOptions, defaults.addOnOptions),
    urgencyOptions: normalizeModifierOptions(record.urgencyOptions, defaults.urgencyOptions),
    timelineOptions: normalizeModifierOptions(record.timelineOptions, defaults.timelineOptions),
  };
}

function matchesServiceKinds<T extends { serviceKinds?: StudioServiceKind[]; isActive?: boolean }>(
  option: T,
  serviceKind?: StudioServiceKind | null
) {
  if (option.isActive === false) return false;
  if (!serviceKind || !option.serviceKinds || option.serviceKinds.length === 0) return true;
  return option.serviceKinds.includes(serviceKind);
}

export function filterPricedOptions(
  options: StudioPricedOption[],
  serviceKind?: StudioServiceKind | null
) {
  return options.filter((option) => matchesServiceKinds(option, serviceKind));
}

export function filterModifierOptions(
  options: StudioModifierOption[],
  serviceKind?: StudioServiceKind | null
) {
  return options.filter((option) => matchesServiceKinds(option, serviceKind));
}

export function findPricedOptionByLabel(
  options: StudioPricedOption[],
  label?: string | null,
  serviceKind?: StudioServiceKind | null
) {
  const normalized = cleanText(label).toLowerCase();
  if (!normalized) return null;
  return (
    filterPricedOptions(options, serviceKind).find(
      (option) => option.label.toLowerCase() === normalized
    ) ?? null
  );
}

export function findModifierOptionByLabel(
  options: StudioModifierOption[],
  label?: string | null,
  serviceKind?: StudioServiceKind | null
) {
  const normalized = cleanText(label).toLowerCase();
  if (!normalized) return null;
  return (
    filterModifierOptions(options, serviceKind).find(
      (option) => option.label.toLowerCase() === normalized
    ) ?? null
  );
}
