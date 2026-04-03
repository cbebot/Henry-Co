import type {
  StudioCaseStudy,
  StudioDifferentiator,
  StudioPackage,
  StudioService,
  StudioTeamProfile,
  StudioValueComparison,
} from "@/lib/studio/types";

export const studioServices: StudioService[] = [
  {
    id: "service-web",
    kind: "website",
    name: "Executive Websites",
    headline: "Web experiences designed to make the company look more capable, more credible, and easier to buy from.",
    summary:
      "High-trust corporate websites, founder-led positioning platforms, campaign experiences, and premium service funnels built for sharper perception and cleaner conversion.",
    startingPrice: 1800000,
    deliveryWindow: "3 to 6 weeks",
    stack: ["Next.js", "CMS", "Analytics", "Conversion Tracking"],
    outcomes: ["Stronger buyer trust", "Cleaner premium positioning", "Higher inquiry quality"],
    scoreBoosts: ["website", "brand", "sales", "conversion"],
  },
  {
    id: "service-mobile",
    kind: "mobile_app",
    name: "Mobile Products",
    headline: "Mobile products for customer experience, operational workflows, and high-frequency business touchpoints.",
    summary:
      "Customer apps, field-team apps, logistics experiences, and mobile-first service products with polished UX and serious delivery structure.",
    startingPrice: 4200000,
    deliveryWindow: "7 to 14 weeks",
    stack: ["React Native", "Flutter", "Supabase", "Notifications"],
    outcomes: ["Faster product launch", "Higher mobile retention", "Operational mobility"],
    scoreBoosts: ["mobile", "app", "consumer", "field"],
  },
  {
    id: "service-ui",
    kind: "ui_ux",
    name: "Product UX Systems",
    headline: "Product flow architecture, interface systems, and design direction for serious digital products.",
    summary:
      "UX audits, information architecture, interface systems, onboarding flows, and production-aware design systems for software teams that need clearer product structure.",
    startingPrice: 1200000,
    deliveryWindow: "2 to 5 weeks",
    stack: ["UX Audit", "Figma", "Design Systems", "Prototype Flows"],
    outcomes: ["Better product clarity", "Cleaner engineering handoff", "Higher completion rates"],
    scoreBoosts: ["product", "ui", "ux", "system"],
  },
  {
    id: "service-brand",
    kind: "branding",
    name: "Brand Systems",
    headline: "Identity systems for businesses that need to feel premium before the first call is booked.",
    summary:
      "Verbal and visual identity, signature presentation systems, launch collateral, and premium art direction for digital-first businesses.",
    startingPrice: 950000,
    deliveryWindow: "2 to 4 weeks",
    stack: ["Brand Strategy", "Identity System", "Launch Assets", "Guidelines"],
    outcomes: ["Premium market perception", "Sharper positioning", "Consistent brand execution"],
    scoreBoosts: ["brand", "identity", "positioning", "launch"],
  },
  {
    id: "service-commerce",
    kind: "ecommerce",
    name: "Commerce Systems",
    headline: "Storefronts and campaign systems built to sell better and operate more cleanly.",
    summary:
      "Premium storefront design, merchandising architecture, conversion flows, checkout systems, and operational dashboards for modern commerce teams.",
    startingPrice: 2600000,
    deliveryWindow: "5 to 9 weeks",
    stack: ["Next.js", "Payments", "CMS", "Order Operations"],
    outcomes: ["Improved conversion", "Better merchandising clarity", "More reliable fulfillment flow"],
    scoreBoosts: ["commerce", "store", "checkout", "catalog"],
  },
  {
    id: "service-internal",
    kind: "internal_system",
    name: "Internal Control Systems",
    headline: "Dashboards, automations, and operating interfaces that replace spreadsheet chaos.",
    summary:
      "Internal admin systems for sales, support, operations, finance, logistics, and delivery teams that need one command surface instead of scattered tools.",
    startingPrice: 3200000,
    deliveryWindow: "5 to 10 weeks",
    stack: ["Next.js", "Supabase", "Automation", "Reporting"],
    outcomes: ["Operational visibility", "Role clarity", "Fewer manual handoffs"],
    scoreBoosts: ["ops", "internal", "dashboard", "admin"],
  },
  {
    id: "service-custom",
    kind: "custom_software",
    name: "Custom Software",
    headline: "Bespoke software systems for companies with unique workflows, business models, or scale goals.",
    summary:
      "Customer portals, internal platforms, revenue systems, multi-role software, and architecture-heavy products designed around commercial leverage, not template constraints.",
    startingPrice: 5200000,
    deliveryWindow: "8 to 18 weeks",
    stack: ["Architecture", "APIs", "Automation", "Cloud Systems"],
    outcomes: ["Long-term leverage", "Tailored workflow control", "Serious digital infrastructure"],
    scoreBoosts: ["custom", "software", "platform", "portal"],
  },
];

export const studioPackages: StudioPackage[] = [
  {
    id: "pkg-executive-presence",
    serviceId: "service-web",
    name: "Executive Presence",
    summary: "A premium company website built to elevate trust, sharpen positioning, and convert serious inquiries.",
    price: 1950000,
    depositRate: 0.45,
    timelineWeeks: 4,
    bestFor: "Professional service firms, founders, and premium operators replacing an average-looking online presence.",
    includes: ["Messaging direction", "5 to 8 premium pages", "Lead routing", "Analytics and conversion setup"],
  },
  {
    id: "pkg-revenue-funnel",
    serviceId: "service-web",
    name: "Revenue Funnel System",
    summary: "A sharper offer architecture for brands that need landing pages, trust layers, and measurable conversion performance.",
    price: 2450000,
    depositRate: 0.4,
    timelineWeeks: 5,
    bestFor: "Teams selling premium services, offers, launches, or cohort-based programs.",
    includes: ["Offer-page system", "Conversion-focused page stack", "Lead and CRM wiring", "Campaign-ready analytics"],
  },
  {
    id: "pkg-commerce-growth",
    serviceId: "service-commerce",
    name: "Commerce Growth Platform",
    summary: "Storefront plus campaign and operations rails for brands that want cleaner conversion and stronger merchandising.",
    price: 3250000,
    depositRate: 0.4,
    timelineWeeks: 6,
    bestFor: "Retail and catalog brands with enough demand to justify a serious premium storefront.",
    includes: ["Storefront UX", "Checkout and payment rails", "Catalog architecture", "Ops dashboard surfaces"],
  },
  {
    id: "pkg-control-room",
    serviceId: "service-internal",
    name: "Operations Control Room",
    summary: "A multi-role internal system for leads, projects, workflow states, approvals, and management reporting.",
    price: 3900000,
    depositRate: 0.4,
    timelineWeeks: 8,
    bestFor: "Service businesses and operational teams replacing fragmented internal tooling.",
    includes: ["Role-based dashboards", "Workflow states", "Reporting view", "Automation handoffs"],
  },
  {
    id: "pkg-client-portal",
    serviceId: "service-custom",
    name: "Client Portal Accelerator",
    summary: "A secure client-facing portal with onboarding, updates, files, approvals, and payment-aware workflow.",
    price: 4650000,
    depositRate: 0.4,
    timelineWeeks: 9,
    bestFor: "Businesses that need a stronger digital client experience than email threads and manual follow-up.",
    includes: ["Secure portal surface", "Client activity flows", "Files and approvals", "Payment checkpoint logic"],
  },
  {
    id: "pkg-brand-interface",
    serviceId: "service-brand",
    name: "Brand and Interface System",
    summary: "Identity direction plus interface language for businesses that need premium brand consistency across web and product surfaces.",
    price: 1450000,
    depositRate: 0.5,
    timelineWeeks: 4,
    bestFor: "Companies repositioning into a more premium category before a launch or growth phase.",
    includes: ["Brand system", "Typography and color system", "UI style direction", "Guideline deck"],
  },
];

export const studioTeams: StudioTeamProfile[] = [
  {
    id: "team-orbit",
    name: "Orbit Executive Web",
    label: "Positioning and Revenue Web Team",
    summary:
      "Focused on premium websites, offer architecture, landing systems, and sales surfaces that need to make the business feel more credible immediately.",
    availability: "open",
    focus: ["Executive websites", "Sales funnels", "Premium storytelling", "Lead systems"],
    industries: ["Professional services", "Hospitality", "Real estate", "Healthcare and wellness"],
    stack: ["Next.js", "CMS", "Analytics", "Campaign pages"],
    highlights: ["Sharp positioning work", "High-trust information architecture", "Premium conversion polish"],
    scoreBiases: ["website", "conversion", "brand", "sales", "landing"],
  },
  {
    id: "team-axis",
    name: "Axis Product Systems",
    label: "Software and Internal Systems Team",
    summary:
      "Best suited to admin systems, portals, multi-role products, and workflow-heavy software that needs architecture discipline as much as interface quality.",
    availability: "open",
    focus: ["Internal systems", "Client portals", "Custom software", "Business workflows"],
    industries: ["Operations", "Services", "Logistics", "B2B software"],
    stack: ["Next.js", "Supabase", "Node.js", "Automation"],
    highlights: ["Serious architecture", "Role-aware system design", "Clean operational reporting"],
    scoreBiases: ["dashboard", "custom", "internal", "portal", "software", "ops"],
  },
  {
    id: "team-nova",
    name: "Nova Commerce",
    label: "Commerce and Retention Team",
    summary:
      "Specializes in storefront UX, merchandising systems, campaign landing surfaces, and the operational structure around premium e-commerce.",
    availability: "limited",
    focus: ["Storefronts", "Checkout systems", "Campaign commerce", "Catalog experiences"],
    industries: ["Retail", "Beauty", "Lifestyle", "Luxury goods"],
    stack: ["Next.js", "Payments", "CMS", "Analytics"],
    highlights: ["Trust-led commerce design", "Conversion architecture", "Cleaner purchasing flow"],
    scoreBiases: ["commerce", "store", "checkout", "catalog", "campaign"],
  },
  {
    id: "team-vector",
    name: "Vector Mobile",
    label: "Mobile Product Team",
    summary:
      "Handles customer apps, field workflows, service apps, and cross-platform mobile experiences where polish and clarity matter.",
    availability: "open",
    focus: ["Mobile apps", "Operational apps", "Customer apps", "Retention flows"],
    industries: ["Logistics", "Consumer services", "Marketplaces", "Field operations"],
    stack: ["React Native", "Flutter", "Supabase", "Push"],
    highlights: ["Fast mobile delivery", "Role-aware UX", "Reliable cross-platform execution"],
    scoreBiases: ["mobile", "app", "consumer", "field", "retention"],
  },
];

export const studioCaseStudies: StudioCaseStudy[] = [
  {
    id: "case-command-center",
    name: "Service Command Center",
    type: "Internal Control System",
    challenge:
      "A multi-service operator was running leads, project states, approvals, and finance checkpoints across spreadsheets, chat, and manual reminders.",
    impact:
      "Studio replaced the operational sprawl with one command surface that leadership and delivery teams could actually trust.",
    metrics: ["4 roles unified", "Lead-to-delivery visibility created", "Manual follow-up pressure reduced"],
  },
  {
    id: "case-premium-launch",
    name: "Premium Reposition Launch",
    type: "Executive Website",
    challenge:
      "The company had strong delivery quality, but the public website looked too generic to support bigger contracts and higher confidence inbound sales.",
    impact:
      "Studio reframed the company as a premium operator with clearer offers, a more deliberate narrative, and a sharper inquiry path.",
    metrics: ["Perceived quality upgraded", "Offer clarity improved", "Sales conversation quality increased"],
  },
  {
    id: "case-client-portal",
    name: "Client Portal Rollout",
    type: "Custom Software",
    challenge:
      "A service business needed clients to stop relying on email threads for updates, approvals, files, and payment checkpoints.",
    impact:
      "Studio introduced a client portal model that made delivery status, assets, and next actions visibly structured.",
    metrics: ["Client visibility improved", "Approval friction reduced", "File delivery centralized"],
  },
];

export const studioDifferentiators: StudioDifferentiator[] = [
  {
    id: "diff-brief-builder",
    name: "Commercial Brief Builder",
    description: "The inquiry system collects the actual commercial and delivery detail required to scope serious work correctly.",
    pros: ["Higher-quality leads", "Faster proposal drafting", "Less ambiguity"],
    cons: ["Longer than a shallow contact form"],
    difficulty: "medium",
    innovationScore: 8,
  },
  {
    id: "diff-custom-path",
    name: "First-Class Custom Project Path",
    description: "Custom websites, apps, and software are scoped directly instead of being squeezed into a package that never fit.",
    pros: ["Supports real buyer intent", "Handles complex projects", "Feels consultative"],
    cons: ["Requires stronger intake UX"],
    difficulty: "high",
    innovationScore: 9,
  },
  {
    id: "diff-match-layer",
    name: "Expert Match Layer",
    description: "Projects can be routed to the best-fit HenryCo team based on delivery style, scope complexity, and business context.",
    pros: ["Improves trust", "Makes the platform feel premium", "Routes work cleanly"],
    cons: ["Needs good scoring logic"],
    difficulty: "high",
    innovationScore: 8,
  },
  {
    id: "diff-readiness",
    name: "Project Readiness Score",
    description: "The platform shows how execution-ready the brief is so sales, PM, and the client know what needs more clarity.",
    pros: ["Better triage", "Smarter follow-up", "Useful internal signal"],
    cons: ["Heuristic, not absolute"],
    difficulty: "medium",
    innovationScore: 7,
  },
  {
    id: "diff-milestone",
    name: "Milestone Transparency",
    description: "Clients can see phases, owners, approvals, and payment checkpoints instead of relying on scattered updates.",
    pros: ["Higher trust", "Lower support load", "More professional delivery feel"],
    cons: ["Requires disciplined ops"],
    difficulty: "medium",
    innovationScore: 8,
  },
  {
    id: "diff-revision",
    name: "Revision Governance",
    description: "Changes are tracked as formal delivery items, not buried in chat or forgotten in feedback threads.",
    pros: ["Less scope drift", "Clear accountability", "Better handoff history"],
    cons: ["Adds process discipline"],
    difficulty: "medium",
    innovationScore: 8,
  },
  {
    id: "diff-vault",
    name: "Delivery Vault",
    description: "Reference files, proofs, and deliverables live inside one controlled file layer tied to the project timeline.",
    pros: ["Cleaner delivery", "Higher trust", "Better auditability"],
    cons: ["Needs file hygiene"],
    difficulty: "high",
    innovationScore: 8,
  },
  {
    id: "diff-proposal",
    name: "Proposal Comparison Experience",
    description: "Packages, scope choices, and trade-offs are explained like a premium buying interface instead of a PDF sent into an inbox.",
    pros: ["Faster decisions", "Premium sales feel", "Less back-and-forth"],
    cons: ["Needs disciplined packaging"],
    difficulty: "medium",
    innovationScore: 7,
  },
];

export const studioFaqs = [
  {
    question: "Do I have to choose one of the listed packages?",
    answer:
      "No. Packages are there for fast-fit buying paths. If you need something more tailored, the custom project path lets you describe the exact website, app, portal, or software system you want built.",
  },
  {
    question: "Can you handle both design and software delivery?",
    answer:
      "Yes. HenryCo Studio covers brand systems, websites, e-commerce, internal platforms, client portals, and mobile products. The brief flow is built to route the work to the right combination of strategy, design, and engineering.",
  },
  {
    question: "How are projects priced?",
    answer:
      "Smaller and more repeatable work can fit a package. Complex products are quoted based on scope, complexity, timeline pressure, and delivery model. Proposals are milestone-based so pricing logic stays visible.",
  },
  {
    question: "How will I receive updates?",
    answer:
      "Studio sends email updates for inquiry receipt, proposals, payment checkpoints, milestone readiness, revisions, and final delivery. WhatsApp updates can also be used when the shared HenryCo messaging setup supports the contact path cleanly.",
  },
  {
    question: "Will this later connect to the HenryCo account dashboard?",
    answer:
      "Yes. Studio activity is being persisted with future account-level history in mind, using authenticated user identity when available and normalized email as the secondary mapping key.",
  },
];

export const studioTestimonials = [
  {
    name: "Managing Director, Professional Services Firm",
    quote:
      "Studio made us look like the level of company we were already trying to become. The difference in trust and sales confidence was immediate.",
  },
  {
    name: "Operations Lead, Multi-Service Business",
    quote:
      "The internal system work mattered just as much as the front-end polish. We finally had one place to track what was happening across the business.",
  },
  {
    name: "Founder, Premium Commerce Brand",
    quote:
      "The storefront felt more deliberate, more expensive, and much easier for customers to buy from. That changed how the business was perceived.",
  },
];

export const studioProcess = [
  "Define whether the request is package-fit or custom from the start.",
  "Capture commercial goals, delivery constraints, features, references, and buyer context.",
  "Route the project to the best-fit HenryCo team or team mix.",
  "Send a proposal with scope logic, milestone pricing, and next-step clarity.",
  "Activate the workspace after deposit confirmation and manage delivery through milestones, updates, files, and revisions.",
];

export function studioServiceSlug(service: StudioService) {
  return service.kind.replaceAll("_", "-");
}

export function studioPackageSlug(pkg: StudioPackage) {
  return pkg.id.replace(/^pkg-/, "");
}

export function studioTeamSlug(team: StudioTeamProfile) {
  return team.id.replace(/^team-/, "");
}

export function studioCaseStudySlug(caseStudy: StudioCaseStudy) {
  return caseStudy.id.replace(/^case-/, "");
}

export function getStudioServiceBySlug(slug: string) {
  return studioServices.find((service) => studioServiceSlug(service) === slug) ?? null;
}

export function getStudioTeamBySlug(slug: string) {
  return studioTeams.find((team) => studioTeamSlug(team) === slug) ?? null;
}

export function getStudioCaseStudyBySlug(slug: string) {
  return studioCaseStudies.find((item) => studioCaseStudySlug(item) === slug) ?? null;
}

export const studioTrustSignals = [
  "Real project requests are captured with structured business and scope detail, not a shallow lead form.",
  "Proposals show investment, milestones, delivery logic, and deposit structure in a visible workflow.",
  "Files, revisions, messages, and approvals can live inside the same delivery surface instead of being scattered.",
  "Privileged workflow actions remain server-side while client-facing access is handled through secure links and account-aware checks.",
  "The data model is being aligned so future HenryCo account history can show proposals, projects, payments, documents, and support context in one place.",
];

export const studioValueComparisons: StudioValueComparison[] = [
  {
    title: "Typical agency flow",
    points: [
      "A vague inquiry form with almost no commercial context.",
      "Pricing hidden inside a private conversation after too much back-and-forth.",
      "Project status scattered across WhatsApp, email, and disconnected files.",
    ],
  },
  {
    title: "HenryCo Studio flow",
    points: [
      "A structured buying path for both packages and serious custom work.",
      "Proposal, milestones, updates, and payment checkpoints visible in one system.",
      "A cleaner operating model for client, sales, PM, finance, support, and delivery teams.",
    ],
  },
];
