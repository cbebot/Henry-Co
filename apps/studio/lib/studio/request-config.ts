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
  /** Legacy free-form stack list — kept for backward compat with older briefs.
   *  New code should prefer `frameworkOptions` / `backendOptions` / `hostingOptions`. */
  stackOptions: string[];
  /** Programming language preferences. Free-text list; reads as a "house language". */
  programmingLanguageOptions: string[];
  /** Frontend / app framework choices (filtered by serviceKind). */
  frameworkOptions: StudioPricedOption[];
  /** Backend / data platform choices (filtered by serviceKind). */
  backendOptions: StudioPricedOption[];
  /** Hosting / deployment lane (free-form list — most are no-cost and HenryCo neutral). */
  hostingOptions: string[];
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
      "HenryCo recommends the stack",
      "Continue with our existing stack",
      "Open-source first / no vendor lock-in",
      "Cloud-native / serverless preferred",
      "Strict on-prem or self-hosted",
    ],
    programmingLanguageOptions: [
      "HenryCo's recommendation",
      "TypeScript",
      "JavaScript",
      "Python",
      "Go",
      "Rust",
      "PHP",
      "Ruby",
      "Java / Kotlin",
      "C# / .NET",
      "Swift",
      "Dart",
    ],
    frameworkOptions: [
      {
        id: "framework-recommend",
        label: "HenryCo's framework recommendation",
        description: "We pick the right framework for the job once scope is reviewed.",
        amount: 0,
        isActive: true,
      },
      {
        id: "framework-nextjs",
        label: "Next.js (React) — App Router",
        description: "Server components, streaming, edge-ready. HenryCo's default for premium web.",
        amount: 0,
        isActive: true,
        serviceKinds: ["website", "ecommerce", "internal_system", "custom_software", "ui_ux"],
      },
      {
        id: "framework-react-vite",
        label: "React + Vite SPA",
        description: "Lighter SPA shell when SEO is not the priority and bundle independence matters.",
        amount: 0,
        isActive: true,
        serviceKinds: ["custom_software", "internal_system"],
      },
      {
        id: "framework-astro",
        label: "Astro (content-first)",
        description: "Zero-JS-by-default sites for content marketing and editorial speed.",
        amount: 0,
        isActive: true,
        serviceKinds: ["website"],
      },
      {
        id: "framework-svelte",
        label: "SvelteKit",
        description: "Compiler-driven framework — small bundles, fast TTI for smaller surfaces.",
        amount: 0,
        isActive: true,
        serviceKinds: ["website", "internal_system", "custom_software"],
      },
      {
        id: "framework-react-native",
        label: "React Native (Expo)",
        description: "Cross-platform mobile from a single TypeScript codebase. Default mobile lane.",
        amount: 0,
        isActive: true,
        serviceKinds: ["mobile_app"],
      },
      {
        id: "framework-flutter",
        label: "Flutter (Dart)",
        description: "Single codebase iOS + Android with strong UI fidelity and native bridges.",
        amount: 0,
        isActive: true,
        serviceKinds: ["mobile_app"],
      },
      {
        id: "framework-native",
        label: "Native iOS (Swift) and Android (Kotlin)",
        description: "Two native codebases for projects that demand platform-native polish or hardware access.",
        amount: 850000,
        isActive: true,
        serviceKinds: ["mobile_app"],
      },
      {
        id: "framework-django",
        label: "Django (Python)",
        description: "Mature batteries-included Python web framework — strong fit for content + admin.",
        amount: 0,
        isActive: true,
        serviceKinds: ["custom_software", "internal_system", "website"],
      },
      {
        id: "framework-fastapi",
        label: "FastAPI (Python services)",
        description: "Async Python services for typed APIs and data-heavy workloads.",
        amount: 0,
        isActive: true,
        serviceKinds: ["custom_software", "internal_system"],
      },
      {
        id: "framework-laravel",
        label: "Laravel (PHP)",
        description: "Established PHP stack with strong ecosystem for ops + admin systems.",
        amount: 0,
        isActive: true,
        serviceKinds: ["custom_software", "internal_system", "website"],
      },
    ],
    backendOptions: [
      {
        id: "backend-recommend",
        label: "HenryCo recommends the backend",
        description: "We choose between Supabase, custom Node services, or a managed cloud stack.",
        amount: 0,
        isActive: true,
      },
      {
        id: "backend-supabase",
        label: "Supabase (Postgres + Auth + Storage)",
        description: "HenryCo's default — Postgres, row-level security, magic-link auth, file storage.",
        amount: 0,
        isActive: true,
      },
      {
        id: "backend-firebase",
        label: "Firebase (Google Cloud)",
        description: "When the team already uses Firebase auth, Firestore, or Cloud Functions.",
        amount: 0,
        isActive: true,
        serviceKinds: ["mobile_app", "custom_software"],
      },
      {
        id: "backend-node-services",
        label: "Custom Node.js services",
        description: "Bespoke API services in Node/TypeScript with the database of your choice.",
        amount: 380000,
        isActive: true,
      },
      {
        id: "backend-rails",
        label: "Ruby on Rails monolith",
        description: "Mature monolith pattern for ops-heavy products with rich admin needs.",
        amount: 420000,
        isActive: true,
        serviceKinds: ["custom_software", "internal_system"],
      },
      {
        id: "backend-aws",
        label: "AWS-native (Lambda + DynamoDB / RDS)",
        description: "Serverless services on AWS for enterprise alignment or compliance scopes.",
        amount: 620000,
        isActive: true,
        serviceKinds: ["custom_software", "internal_system"],
      },
      {
        id: "backend-headless-cms",
        label: "Headless CMS (Sanity / Contentful)",
        description: "Editorial CMS layered with a custom frontend.",
        amount: 240000,
        isActive: true,
        serviceKinds: ["website", "ecommerce"],
      },
      {
        id: "backend-existing",
        label: "Continue with our existing backend",
        description: "We integrate with the API or platform you already operate.",
        amount: 0,
        isActive: true,
      },
    ],
    hostingOptions: [
      "HenryCo recommends the host",
      "Vercel (managed Next.js / Edge)",
      "Cloudflare Pages / Workers",
      "Netlify",
      "AWS (Amplify / EC2 / ECS)",
      "Google Cloud / Firebase Hosting",
      "DigitalOcean / Render",
      "On-prem / private cloud",
      "Continue with our current host",
    ],
    /**
     * Project types — the kind of thing the customer is building.
     *
     * Project types are the FIRST decision and drive every downstream filter.
     * They are deliberately mutually exclusive of platforms: a "Mobile app"
     * project type implies the mobile platform, so we no longer carry a
     * duplicate "Mobile app" platform option.
     */
    projectTypes: [
      {
        id: "project-type-executive-company-website",
        label: "Executive company website",
        description: "Premium lead-generation site for credibility, services, and corporate positioning.",
        amount: 0,
        isActive: true,
        serviceKinds: ["website"],
      },
      {
        id: "project-type-lead-generation-funnel",
        label: "Lead generation or campaign funnel",
        description: "Revenue-focused landing pages with conversion logic and campaign reporting.",
        amount: 280000,
        isActive: true,
        serviceKinds: ["website"],
      },
      {
        id: "project-type-premium-ecommerce",
        label: "Premium e-commerce storefront",
        description: "Commerce-led experience with merchandising, checkout logic, and back-of-house ops.",
        amount: 580000,
        isActive: true,
        serviceKinds: ["ecommerce"],
      },
      {
        id: "project-type-client-portal",
        label: "Client portal or account workspace",
        description: "Secure customer-facing space with account views, status, files, and approvals.",
        amount: 760000,
        isActive: true,
        serviceKinds: ["custom_software", "internal_system"],
      },
      {
        id: "project-type-internal-dashboard",
        label: "Internal operations dashboard",
        description: "Control-room interface for teams: finance, sales, dispatch, reporting.",
        amount: 840000,
        isActive: true,
        serviceKinds: ["internal_system"],
      },
      {
        id: "project-type-mobile-app",
        label: "Mobile app",
        description: "iOS + Android product, member app, or companion app to a web platform.",
        amount: 1180000,
        isActive: true,
        serviceKinds: ["mobile_app"],
      },
      {
        id: "project-type-marketplace-booking",
        label: "Marketplace or booking platform",
        description: "Multi-sided experience with listings, bookings, payments, and operational logic.",
        amount: 980000,
        isActive: true,
        serviceKinds: ["custom_software", "ecommerce"],
      },
      {
        id: "project-type-custom-workflow-software",
        label: "Custom operations software",
        description: "Approvals, team coordination, process automation, or client operations.",
        amount: 1240000,
        isActive: true,
        serviceKinds: ["custom_software"],
      },
      {
        id: "project-type-brand-system",
        label: "Brand identity & system",
        description: "Naming support, identity direction, visual language, and core brand assets.",
        amount: 320000,
        isActive: true,
        serviceKinds: ["branding"],
      },
      {
        id: "project-type-product-design-system",
        label: "Product UX / UI direction",
        description: "Research-led interface design, flows, and component libraries for complex products.",
        amount: 460000,
        isActive: true,
        serviceKinds: ["ui_ux"],
      },
    ],
    /**
     * Platforms — where the thing is delivered. No longer overlaps with
     * project types (Mobile app removed; that's a project type now).
     */
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
        label: "Public website only",
        description: "Public-facing site without a deeper account or operations layer.",
        amount: 0,
        isActive: true,
        serviceKinds: ["website", "ecommerce", "branding", "ui_ux"],
      },
      {
        id: "platform-web-app",
        label: "Web app / SaaS product",
        description: "Authenticated application layer with real user journeys and business logic.",
        amount: 1050000,
        isActive: true,
        serviceKinds: ["custom_software", "internal_system"],
      },
      {
        id: "platform-website-admin",
        label: "Public site + private operations dashboard",
        description: "Public site plus a private operations and publishing layer.",
        amount: 900000,
        isActive: true,
        serviceKinds: ["website", "ecommerce", "internal_system"],
      },
      {
        id: "platform-portal-ops",
        label: "Client portal + private operations layer",
        description: "Customer-facing workspace with a private team management surface.",
        amount: 1750000,
        isActive: true,
        serviceKinds: ["custom_software", "internal_system"],
      },
      {
        id: "platform-commerce-backend",
        label: "Storefront + back-of-house operations",
        description: "Storefront, order pipeline, fulfillment, and operational control surfaces.",
        amount: 1550000,
        isActive: true,
        serviceKinds: ["ecommerce"],
      },
      {
        id: "platform-mobile-companion",
        label: "Mobile app paired with a web companion",
        description: "Native-feeling mobile product with a web admin/console companion.",
        amount: 1450000,
        isActive: true,
        serviceKinds: ["mobile_app"],
      },
    ],
    /**
     * Pages — now constrained to web/commerce service kinds. Mobile and
     * software projects use module/feature options instead, so they don't
     * see irrelevant page choices.
     */
    pageOptions: [
      {
        id: "page-home-offers",
        label: "Homepage and offer pages",
        description: "Core landing architecture, offer framing, and conversion-first lead surfaces.",
        amount: 240000,
        isActive: true,
        serviceKinds: ["website", "ecommerce"],
      },
      {
        id: "page-services-solutions",
        label: "Services or solution pages",
        description: "Service detail, solution architecture, or product marketing pages.",
        amount: 180000,
        isActive: true,
        serviceKinds: ["website"],
      },
      {
        id: "page-about-trust",
        label: "About, team, and trust pages",
        description: "Reassurance surfaces for credibility, company profile, and team positioning.",
        amount: 160000,
        isActive: true,
        serviceKinds: ["website"],
      },
      {
        id: "page-proof",
        label: "Case studies or proof pages",
        description: "Proof-led pages for results, delivery stories, and trust assets.",
        amount: 220000,
        isActive: true,
        serviceKinds: ["website"],
      },
      {
        id: "page-pricing-proposal",
        label: "Pricing, proposal, or quote surfaces",
        description: "Commercial clarity pages for quotes, packages, or scoped decision flows.",
        amount: 180000,
        isActive: true,
        serviceKinds: ["website", "ecommerce"],
      },
      {
        id: "page-blog-content",
        label: "Blog, newsroom, or content hub",
        description: "Editorial publishing surface with categories, search, and structured authoring.",
        amount: 320000,
        isActive: true,
        serviceKinds: ["website"],
      },
      {
        id: "page-product-catalog",
        label: "Product catalogue & listing",
        description: "Browseable storefront, filters, and product detail pages.",
        amount: 380000,
        isActive: true,
        serviceKinds: ["ecommerce"],
      },
      {
        id: "page-checkout-payment",
        label: "Checkout, payment, or invoice views",
        description: "Transaction surfaces — checkout, invoice, payment confirmation.",
        amount: 280000,
        isActive: true,
        serviceKinds: ["ecommerce", "website"],
      },
    ],
    /**
     * Modules / features — now project-aware. Web pages live in `pageOptions`,
     * software/mobile features live here so the user only sees relevant
     * choices for what they're actually building.
     */
    moduleOptions: [
      {
        id: "module-cms",
        label: "CMS or structured content management",
        description: "Publishing flows and controlled content administration.",
        amount: 320000,
        isActive: true,
        serviceKinds: ["website", "ecommerce"],
      },
      {
        id: "module-permissions",
        label: "Role-based permissions",
        description: "Secure access models across staff, client, and finance roles.",
        amount: 280000,
        isActive: true,
        serviceKinds: ["custom_software", "internal_system", "ecommerce"],
      },
      {
        id: "module-payments",
        label: "Payments and invoicing",
        description: "Payment records, proofs, invoices, and finance coordination.",
        amount: 460000,
        isActive: true,
        serviceKinds: ["ecommerce", "custom_software", "internal_system"],
      },
      {
        id: "module-bookings",
        label: "Bookings, scheduling, or calendar logic",
        description: "Reservations, schedules, availability, and appointment logic.",
        amount: 420000,
        isActive: true,
        serviceKinds: ["custom_software", "internal_system", "mobile_app"],
      },
      {
        id: "module-client-account",
        label: "Client account area",
        description: "Customer-visible workspace, status history, and account features.",
        amount: 620000,
        isActive: true,
        serviceKinds: ["custom_software", "ecommerce", "mobile_app"],
      },
      {
        id: "module-automation",
        label: "Automation and notifications",
        description: "Email, WhatsApp, reminders, and triggered operations.",
        amount: 540000,
        isActive: true,
        serviceKinds: ["custom_software", "internal_system", "ecommerce", "mobile_app"],
      },
      {
        id: "module-analytics",
        label: "Analytics and reporting",
        description: "Operational visibility, reporting, and commercial performance views.",
        amount: 380000,
        isActive: true,
        serviceKinds: ["custom_software", "internal_system", "ecommerce", "mobile_app"],
      },
      {
        id: "module-integrations",
        label: "CRM, ERP, or third-party integrations",
        description: "External platforms, middleware, and enterprise connection logic.",
        amount: 680000,
        isActive: true,
        serviceKinds: ["custom_software", "internal_system", "ecommerce"],
      },
      {
        id: "module-file-vault",
        label: "File vault or delivery library",
        description: "Structured file storage, delivery handoff, and proof/document rails.",
        amount: 340000,
        isActive: true,
        serviceKinds: ["custom_software", "internal_system"],
      },
      {
        id: "module-push-offline",
        label: "Push notifications & offline support",
        description: "Mobile push, offline-first sync, and background fetch.",
        amount: 380000,
        isActive: true,
        serviceKinds: ["mobile_app"],
      },
      {
        id: "module-realtime",
        label: "Real-time updates (websockets / live)",
        description: "Live dashboards, presence, chat, or collaborative editing.",
        amount: 480000,
        isActive: true,
        serviceKinds: ["custom_software", "internal_system", "mobile_app"],
      },
    ],
    /**
     * Add-ons — non-core supporting work. Stays unfiltered (any project can
     * benefit) but de-duped against `moduleOptions`.
     */
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
        serviceKinds: ["website", "ecommerce"],
      },
      {
        id: "addon-launch-campaign",
        label: "Launch campaign or sales pages",
        description: "Launch-specific landing experiences, campaign structure, and selling surfaces.",
        amount: 540000,
        isActive: true,
        serviceKinds: ["website", "ecommerce"],
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
        id: "addon-app-store-launch",
        label: "App Store + Play Store launch",
        description: "Listings, screenshots, review prep, and submission across both stores.",
        amount: 280000,
        isActive: true,
        serviceKinds: ["mobile_app"],
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
      {
        id: "addon-data-migration",
        label: "Data migration from legacy system",
        description: "Mapping, cleaning, and migrating records from your existing platform.",
        amount: 520000,
        isActive: true,
        serviceKinds: ["custom_software", "internal_system", "ecommerce"],
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
    programmingLanguageOptions: normalizeStringList(
      record.programmingLanguageOptions,
      defaults.programmingLanguageOptions,
    ),
    frameworkOptions: normalizePricedOptions(record.frameworkOptions, defaults.frameworkOptions),
    backendOptions: normalizePricedOptions(record.backendOptions, defaults.backendOptions),
    hostingOptions: normalizeStringList(record.hostingOptions, defaults.hostingOptions),
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
