/**
 * Henry Onyx Jobs — curated launch careers catalog (the company as employer).
 *
 * This is PURE DATA: real Henry Onyx employers and real open roles with
 * concrete 2026 Nigerian-market compensation, specific scope, and
 * measurable outcomes. The seeding engine (`./seed.ts`) reads these and
 * writes them idempotently into the live `customer_activity` + `companies`
 * tables; the public read layer (`./data.ts`) surfaces them on the careers
 * board, employer pages, and detail views.
 *
 * Design intent (owner brief, 2026-06-10):
 *   - The company hires across the whole ecosystem — leadership AND
 *     frontline. A serious careers page shows both: a Head of Recruitment
 *     and a Dispatch Rider; a Senior Engineer and a Garment Care Specialist.
 *   - Every role carries real scope, real requirements, and a real salary
 *     band so the public Pay surface reads as informative, not noise.
 *   - Brand name is written explicitly ("Henry Onyx …") because the jobs
 *     read layer does NOT pass employer names through the brand normalizer;
 *     accent, support email, and the employer website come from
 *     `@henryco/config` so they can never drift from the canonical record.
 *
 * Compensation philosophy (all amounts are ANNUAL NGN, ~35-55% wide bands):
 *   - Studio roles (product/eng/design) trend top-of-market — they compete
 *     with global remote pay.
 *   - Frontline roles (rider, warehouse, care, support agent) are calibrated
 *     to strong local market rates for the role and city.
 *   - Internal Henry Onyx leadership sits at the top of the local band;
 *     cross-functional impact + verified-employer trust earns it.
 *   - Bands always honor the no-zero rule in `normalizeSalaryAmount()` — a
 *     missing min/max becomes "Up to X" / "X+", never "₦0 - ₦0".
 */

import {
  getDivisionConfig,
  getDivisionUrl,
  getHubUrl,
  type DivisionKey,
} from "@henryco/config";

/**
 * Bump this when the curated catalog content changes. The bootstrap
 * compares it against the persisted seed marker and re-applies the
 * (idempotent) upserts when they differ.
 */
export const JOBS_SEED_VERSION = "2026-06-10-henry-onyx-careers-v1";

export const JOBS_INTERNAL_EMPLOYER_SLUG = "henryco-group";
export const JOBS_SEED_CURRENCY = "NGN";

/**
 * Stable posting date so re-seeds don't churn ordering. Roles are spaced an
 * hour apart by catalog index in `./seed.ts` to keep "latest" deterministic.
 */
export const JOBS_SEED_POSTED_BASE = "2026-06-09T09:00:00.000Z";

// ─── Employers ────────────────────────────────────────────────────────────
export type SeedEmployer = {
  slug: string;
  name: string;
  category: string;
  /** Resolved from @henryco/config so it can never drift. */
  href: string;
  accent: string;
  supportEmail: string;
  tagline: string;
  description: string;
  employerType: "internal" | "external";
  industry: string;
  locations: string[];
  headcount: string;
  remotePolicy: string;
  culturePoints: string[];
  benefitsHeadline: string;
  verificationNotes: string[];
  trustScore: number;
  responseSlaHours: number;
};

/** Resolve a division's canonical accent/support/url from config. */
function division(key: DivisionKey) {
  const config = getDivisionConfig(key);
  return {
    accent: config.accent,
    supportEmail: config.supportEmail,
    href: getDivisionUrl(key),
  };
}

const jobsBrand = division("jobs");

export const seedEmployers: SeedEmployer[] = [
  {
    slug: JOBS_INTERNAL_EMPLOYER_SLUG,
    name: "Henry Onyx",
    category: "Internal Hiring",
    href: getHubUrl("/"),
    accent: jobsBrand.accent,
    supportEmail: jobsBrand.supportEmail,
    tagline: "Internal hiring for shared Henry Onyx teams and division leadership.",
    description:
      "Internal roles across the Henry Onyx ecosystem, from shared operations and finance to executive hiring tracks. These roles set the standards every division runs on.",
    employerType: "internal",
    industry: "Internal Hiring",
    locations: ["Enugu", "Lagos", "Remote"],
    headcount: "Group-wide",
    remotePolicy: "Hybrid by team",
    culturePoints: ["Operator-first", "Trust-heavy", "Calm systems"],
    benefitsHeadline:
      "Internal Henry Onyx roles with real ownership, cleaner operating systems, and accountable execution.",
    verificationNotes: ["Henry Onyx internal employer", "Verified by platform owner"],
    trustScore: 92,
    responseSlaHours: 12,
  },
  {
    slug: "care",
    name: "Henry Onyx Fabric Care",
    category: "Fabric Care",
    href: division("care").href,
    accent: division("care").accent,
    supportEmail: division("care").supportEmail,
    tagline: "Premium garment, home, and office care operations.",
    description:
      "Henry Onyx Fabric Care hires for service operations, frontline care specialists, customer support, and operations leadership — a premium service business with a real quality bar behind every booking.",
    employerType: "external",
    industry: "Fabric Care",
    locations: ["Enugu", "Lagos"],
    headcount: "11-50",
    remotePolicy: "Onsite for operations, hybrid for support",
    culturePoints: ["Operational precision", "Service discipline", "Clear communication"],
    benefitsHeadline:
      "Frontline service excellence with sharper operations tooling and higher standards.",
    verificationNotes: ["Henry Onyx division", "Operations reviewed"],
    trustScore: 86,
    responseSlaHours: 18,
  },
  {
    slug: "studio",
    name: "Henry Onyx Studio",
    category: "Product Studio",
    href: division("studio").href,
    accent: division("studio").accent,
    supportEmail: division("studio").supportEmail,
    tagline: "Premium digital product, brand, and software delivery.",
    description:
      "Henry Onyx Studio hires for product, design, and engineering execution with a high bar for craft and systems thinking. Work here ships to live clients, not a Figma archive.",
    employerType: "external",
    industry: "Software and Product Design",
    locations: ["Remote", "Lagos"],
    headcount: "1-10",
    remotePolicy: "Remote-first",
    culturePoints: ["Design quality", "Product rigor", "Clean shipping habits"],
    benefitsHeadline:
      "Product work with a higher design bar, real shipping pressure, and cleaner systems.",
    verificationNotes: ["Henry Onyx division", "Profile reviewed"],
    trustScore: 84,
    responseSlaHours: 16,
  },
  {
    slug: "logistics",
    name: "Henry Onyx Logistics",
    category: "Logistics & Dispatch",
    href: division("logistics").href,
    accent: division("logistics").accent,
    supportEmail: division("logistics").supportEmail,
    tagline: "Same-day dispatch, scheduled delivery, and inter-city movement.",
    description:
      "Henry Onyx Logistics moves shipments for the divisions (Care pickups, Marketplace orders) and external customers. We hire riders, dispatch leads, and operations talent who stay calm when a route slips.",
    employerType: "external",
    industry: "Logistics & Delivery",
    locations: ["Enugu", "Lagos"],
    headcount: "11-50",
    remotePolicy: "Onsite / field",
    culturePoints: ["Route discipline", "Calm under exception", "Proof-of-delivery hygiene"],
    benefitsHeadline:
      "Dependable shift discipline, fair performance pay, and a real growth track from rider to dispatch lead.",
    verificationNotes: ["Henry Onyx division", "Operations reviewed"],
    trustScore: 85,
    responseSlaHours: 18,
  },
  {
    slug: "marketplace",
    name: "Henry Onyx Marketplace",
    category: "Commerce & Retail",
    href: division("marketplace").href,
    accent: division("marketplace").accent,
    supportEmail: division("marketplace").supportEmail,
    tagline: "Curated commerce — the company's own verified store and trusted sellers.",
    description:
      "Henry Onyx Marketplace runs the company's own verified store plus a growing base of trusted sellers. We hire for fulfilment, sales & partnerships, and merchandising — the people who keep orders honest and shelves stocked.",
    employerType: "external",
    industry: "E-commerce & Retail",
    locations: ["Enugu", "Lagos"],
    headcount: "11-50",
    remotePolicy: "Onsite for fulfilment, hybrid for commercial",
    culturePoints: ["Stock accuracy", "Honest listings", "Buyer trust"],
    benefitsHeadline:
      "Real commercial ownership, clean inventory tooling, and uncapped commission on the sales track.",
    verificationNotes: ["Henry Onyx division", "Operations reviewed"],
    trustScore: 85,
    responseSlaHours: 16,
  },
  {
    slug: "learn",
    name: "Henry Onyx Learn",
    category: "Education & Training",
    href: division("learn").href,
    accent: division("learn").accent,
    supportEmail: division("learn").supportEmail,
    tagline: "Practical, outcome-driven courses taught by working operators.",
    description:
      "Henry Onyx Learn builds practical, outcome-driven courses taught by people who actually do the work. We hire instructors and curriculum talent who can turn real operating knowledge into something a learner can apply on Monday.",
    employerType: "external",
    industry: "Education & Training",
    locations: ["Remote", "Enugu"],
    headcount: "1-10",
    remotePolicy: "Remote-first",
    culturePoints: ["Teach by doing", "Outcome over theory", "Respect the learner's time"],
    benefitsHeadline:
      "Teach what you know to a serious audience, with production support and a clear royalty/retainer model.",
    verificationNotes: ["Henry Onyx division", "Profile reviewed"],
    trustScore: 83,
    responseSlaHours: 20,
  },
];

// ─── Roles ──────────────────────────────────────────────────────────────
export type SeedJob = {
  slug: string;
  title: string;
  subtitle: string;
  employerSlug: string;
  employerName: string;
  categoryName: string;
  categorySlug: string;
  location: string;
  workMode: "remote" | "hybrid" | "onsite";
  employmentType: string;
  seniority: string;
  team: string;
  summary: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  skills: string[];
  /** Annual NGN. Null becomes "Up to X" / "X+" via normalizeSalaryAmount(). */
  salaryMin: number | null;
  salaryMax: number | null;
  featured: boolean;
  internal: boolean;
};

export const seedJobs: SeedJob[] = [
  // ── Internal leadership / shared teams ────────────────────────────────
  {
    slug: "head-of-recruitment-operations",
    title: "Head of Recruitment Operations",
    subtitle: "Build the Henry Onyx hiring operating system",
    employerSlug: JOBS_INTERNAL_EMPLOYER_SLUG,
    employerName: "Henry Onyx",
    categoryName: "Recruitment",
    categorySlug: "recruitment",
    location: "Remote",
    workMode: "hybrid",
    employmentType: "Full-time",
    seniority: "Leadership",
    team: "People Operations",
    summary:
      "Own the operating cadence for internal and external hiring across Henry Onyx — pipeline standards, recruiter tooling, and verified-employer policy.",
    description:
      "You inherit a working hiring system and a verified-employer trust layer. Your job is to lift it from working to industry-leading: tighter pipeline-stage hygiene, sharper recruiter tooling, and a moderation policy that protects candidates without slowing employers down. You'll partner with division heads on senior hiring and report into the platform owner.",
    responsibilities: [
      "Set pipeline-stage definitions and time-in-stage SLAs across all open roles",
      "Lead a team of 3 recruiters and 1 talent-ops specialist; run weekly calibration",
      "Own the verified-employer trust layer: policy, audit cadence, escalation",
      "Drive recruiter tooling roadmap with the engineering partner — what to build, what to buy",
      "Run the senior-hiring partnership for division leadership (Studio, Care, Logistics, future)",
    ],
    requirements: [
      "8+ years in hiring operations, the last 3 leading recruiter teams",
      "Demonstrated ATS/tooling redesign that materially moved time-to-fill",
      "Track record running structured interview design at scale",
      "Comfort with measurable discipline — you instrument before you ship",
    ],
    benefits: [
      "Leadership scope across the entire Henry Onyx employer ecosystem",
      "Performance bonus tied to time-to-fill + offer-acceptance rate",
      "Remote-first with quarterly Lagos onsite for division-leader sessions",
      "Direct line to the platform owner on policy decisions",
    ],
    skills: [
      "Recruitment Operations",
      "Pipeline Design",
      "Structured Interviewing",
      "ATS Tooling",
      "Team Leadership",
      "Trust & Moderation",
    ],
    salaryMin: 25_000_000,
    salaryMax: 42_000_000,
    featured: true,
    internal: true,
  },
  {
    slug: "talent-acquisition-specialist",
    title: "Talent Acquisition Specialist",
    subtitle: "Own pipelines for 3-5 concurrent roles across Henry Onyx",
    employerSlug: JOBS_INTERNAL_EMPLOYER_SLUG,
    employerName: "Henry Onyx",
    categoryName: "Recruitment",
    categorySlug: "recruitment",
    location: "Remote",
    workMode: "remote",
    employmentType: "Full-time",
    seniority: "Mid-level",
    team: "People Operations",
    summary:
      "Own end-to-end pipelines for 3-5 concurrent Henry Onyx roles — calibration, sourcing, structured interviewing, and offer execution.",
    description:
      "You'll work directly under the Head of Recruitment Operations on live pipelines for Henry Onyx internal and verified external employers. Real role ownership, not a coordinator function — calibration meetings with hiring managers, sourcing strategy, structured interview design, offer negotiation.",
    responsibilities: [
      "Own 3-5 concurrent role pipelines end-to-end",
      "Run calibration meetings with hiring managers; align on must-haves vs. nice-to-haves",
      "Source through targeted channels — referrals, LinkedIn, niche communities",
      "Design and run structured interview loops; instrument for fairness",
      "Drive offer negotiation with realistic, market-anchored expectations",
    ],
    requirements: [
      "3+ years in-house or agency recruiting",
      "Track record on technical or operational role hiring",
      "Strong calibration discipline — you push back on hiring-manager wishlists",
      "Comfort with structured interview design and rubrics",
    ],
    benefits: [
      "Cross-division exposure (Studio, Care, Logistics, future divisions)",
      "Methodology coaching from the Head of Recruitment Operations",
      "Remote-first with quarterly Lagos onsite",
    ],
    skills: [
      "Full-Cycle Recruiting",
      "Pipeline Management",
      "Structured Interviewing",
      "Offer Negotiation",
      "Sourcing",
    ],
    salaryMin: 6_000_000,
    salaryMax: 12_000_000,
    featured: false,
    internal: true,
  },
  {
    slug: "finance-operations-analyst",
    title: "Finance Operations Analyst",
    subtitle: "Invoice cadence, account reconciliation, and vendor compliance",
    employerSlug: JOBS_INTERNAL_EMPLOYER_SLUG,
    employerName: "Henry Onyx",
    categoryName: "Finance",
    categorySlug: "finance",
    location: "Remote",
    workMode: "hybrid",
    employmentType: "Full-time",
    seniority: "Mid-level",
    team: "Finance Operations",
    summary:
      "Own the cross-division invoice cadence, account reconciliation, and vendor compliance review for Henry Onyx's shared finance function.",
    description:
      "Henry Onyx runs multiple divisions on a shared finance backbone — invoices, payouts, vendor compliance. You'll own the cadence: invoice review, account reconciliation, vendor onboarding, and the monthly close partnership with the platform finance lead.",
    responsibilities: [
      "Run weekly invoice review across all divisions; flag anomalies before they ship",
      "Reconcile cross-division accounts monthly — clean books at month-end",
      "Onboard and review vendors — KYB, compliance attestation, payment terms",
      "Partner with the finance lead on the monthly close",
      "Own the receipt + proof-of-payment audit trail in the shared system",
    ],
    requirements: [
      "3+ years finance ops, accounting, or audit",
      "ICAN/ACCA in progress or completed (preferred, not strictly required)",
      "Comfort with multi-entity reconciliation",
      "Spreadsheet fluency; willingness to learn the BI / SQL side",
    ],
    benefits: [
      "Hybrid (2 days Lagos office)",
      "Health insurance + 18 days paid leave",
      "ICAN/ACCA exam fee reimbursement",
      "Career path into Finance Lead",
    ],
    skills: [
      "Finance Operations",
      "Account Reconciliation",
      "Vendor Compliance",
      "Invoice Review",
      "Multi-Entity Accounting",
    ],
    salaryMin: 7_000_000,
    salaryMax: 14_000_000,
    featured: false,
    internal: true,
  },

  // ── Henry Onyx Studio ─────────────────────────────────────────────────
  {
    slug: "product-designer-studio-systems",
    title: "Product Designer, Studio Systems",
    subtitle: "Design the workflow surfaces that ship to premium clients",
    employerSlug: "studio",
    employerName: "Henry Onyx Studio",
    categoryName: "Design",
    categorySlug: "design",
    location: "Remote",
    workMode: "remote",
    employmentType: "Contract",
    seniority: "Mid-level",
    team: "Product Design",
    summary:
      "Design multi-step product workflows across Henry Onyx Studio's delivery surfaces and premium client systems — partnering directly with engineering on production fidelity.",
    description:
      "This is a senior-leaning mid-level contract role with a full design partnership. You'll work on navigation, workflow UX, and premium interaction patterns that ship to live clients. Tight pairing with engineering — your work hits production, not just Figma archives.",
    responsibilities: [
      "Design complex multi-step workflows (briefing, payments, deliverables) end-to-end",
      "Maintain and extend the Studio design-token system in lockstep with engineering",
      "Pair with engineering on production fidelity — pixel + interaction + accessibility",
      "Run design critique on a weekly cadence; raise the craft bar across the surface",
    ],
    requirements: [
      "4+ years shipping production product UI in a high-bar org",
      "Portfolio with at least two multi-surface SaaS or workflow products",
      "Strong systems thinking — you design tokens before you design screens",
      "Comfort reading the engineering side: TypeScript, React component contracts",
    ],
    benefits: [
      "Top-of-market remote contract rate",
      "Real shipping pressure with calm operating culture",
      "Direct engineering partnership — no design-handoff theatre",
    ],
    skills: [
      "Product Design",
      "Design Systems",
      "Workflow UX",
      "Prototyping",
      "Tailwind / CSS Variables",
      "Accessibility",
    ],
    salaryMin: 15_000_000,
    salaryMax: 26_000_000,
    featured: true,
    internal: false,
  },
  {
    slug: "senior-backend-engineer-studio",
    title: "Senior Backend Engineer",
    subtitle: "Service architecture, data models, and shipping discipline",
    employerSlug: "studio",
    employerName: "Henry Onyx Studio",
    categoryName: "Engineering",
    categorySlug: "engineering",
    location: "Remote",
    workMode: "remote",
    employmentType: "Full-time",
    seniority: "Senior",
    team: "Engineering",
    summary:
      "Own service architecture, data-model design, and engineering discipline across the Studio platform. Mentor mid-level engineers and drive testing standards.",
    description:
      "You lead the engineering bar from inside the team — not from a director seat. You'll own service architecture decisions across the Studio platform, design durable data models, and set the testing/observability standard. Direct line to product on what we ship next.",
    responsibilities: [
      "Own service architecture and data-model design across Studio platform services",
      "Mentor 2-3 mid-level engineers — code review, design pairing, weekly 1:1s",
      "Set the testing + observability standard the team operates against",
      "Drive incident postmortems with measurable follow-through, not blame",
      "Partner with the product designer on what's feasible and how to phase it",
    ],
    requirements: [
      "6+ years shipping production services in TypeScript/Node, Go, or Elixir",
      "Strong PostgreSQL fluency — schema design, query plans, RLS",
      "Distributed-systems literacy — queues, retries, idempotency, fan-out",
      "API design discipline — versioning, contracts, deprecation",
      "Demonstrated mentorship of mid-level engineers",
    ],
    benefits: [
      "Top-of-market remote pay calibrated against global benchmarks",
      "Clear technical-leadership career path (no forced people-manager pivot)",
      "Async-first culture; meeting hygiene matches the role's seniority",
      "Conference + learning budget",
    ],
    skills: [
      "TypeScript / Node",
      "PostgreSQL",
      "Distributed Systems",
      "API Design",
      "Observability",
      "Mentorship",
    ],
    salaryMin: 18_000_000,
    salaryMax: 35_000_000,
    featured: true,
    internal: false,
  },
  {
    slug: "frontend-engineer-studio",
    title: "Frontend Engineer (Mid-level)",
    subtitle: "Ship product surfaces in Next.js with design-system rigor",
    employerSlug: "studio",
    employerName: "Henry Onyx Studio",
    categoryName: "Engineering",
    categorySlug: "engineering",
    location: "Remote",
    workMode: "remote",
    employmentType: "Full-time",
    seniority: "Mid-level",
    team: "Engineering",
    summary:
      "Build production frontend across Henry Onyx Studio's product surfaces. Strong design-system pairing, real performance budgets, and accessibility as a daily habit.",
    description:
      "Build the surfaces customers actually use. You'll work in Next.js (App Router), TypeScript, and Tailwind, with a design-token system instead of hand-rolled colors. Performance budgets are real (LCP, CLS); accessibility is a habit, not a checklist.",
    responsibilities: [
      "Ship product surfaces in Next.js App Router + TypeScript + Tailwind",
      "Pair with the product designer on workflow UX — you'll catch what Figma hides",
      "Maintain accessibility (WCAG 2.2 AA) and performance (LCP < 2.5s) as default",
      "Write integration tests that catch user-visible regressions, not just unit drift",
    ],
    requirements: [
      "3+ years shipping production React (Next.js or similar)",
      "TypeScript fluency — you read complex generic types without flinching",
      "Tailwind / CSS-variable token systems",
      "Accessibility default — keyboard nav, focus management, ARIA where needed",
    ],
    benefits: [
      "Real design partnership — no fight to ship craft",
      "Async-first, predictable shipping cadence",
      "Career growth into senior with a documented competency ladder",
    ],
    skills: [
      "Next.js / React",
      "TypeScript",
      "Tailwind",
      "Accessibility",
      "Design Systems",
      "Performance",
    ],
    salaryMin: 10_000_000,
    salaryMax: 20_000_000,
    featured: false,
    internal: false,
  },
  {
    slug: "brand-designer-studio",
    title: "Brand Designer (Contract)",
    subtitle: "Brand systems, identity, and editorial design for premium clients",
    employerSlug: "studio",
    employerName: "Henry Onyx Studio",
    categoryName: "Design",
    categorySlug: "design",
    location: "Remote",
    workMode: "remote",
    employmentType: "Contract",
    seniority: "Mid-level",
    team: "Brand & Editorial",
    summary:
      "Design brand systems and editorial identity for Henry Onyx Studio's premium client engagements — multi-surface, system-grade, photography-aware.",
    description:
      "Studio's brand work is editorial-grade: type, color, photography direction, and a brand system that survives a real product roadmap. You'll lead 2-3 concurrent brand engagements with full creative ownership, partnering with the product designer where the brand meets the product surface.",
    responsibilities: [
      "Lead 2-3 concurrent brand engagements end-to-end",
      "Design brand systems with type scale, color tokens, and photography direction",
      "Partner with the product designer where brand meets product surface",
      "Document handoff for client teams — they keep the system after we leave",
    ],
    requirements: [
      "4+ years shipped brand work, portfolio with multiple identities",
      "Editorial sensibility — your work doesn't read as generic 'tech startup'",
      "Comfortable owning photography direction, not just illustration",
      "Documentation discipline — brand systems must survive their designer",
    ],
    benefits: [
      "Top-of-market remote contract rate",
      "Real creative ownership — Studio briefs trust the designer",
      "Cross-pollination with product design on hybrid engagements",
    ],
    skills: [
      "Brand Systems",
      "Editorial Design",
      "Photography Direction",
      "Type Systems",
      "Identity Documentation",
    ],
    salaryMin: 8_000_000,
    salaryMax: 16_000_000,
    featured: false,
    internal: false,
  },

  // ── Henry Onyx Fabric Care ────────────────────────────────────────────
  {
    slug: "senior-fabric-care-operations-manager",
    title: "Senior Fabric Care Operations Manager",
    subtitle: "Frontline execution, dispatch handoffs, and service NPS",
    employerSlug: "care",
    employerName: "Henry Onyx Fabric Care",
    categoryName: "Operations",
    categorySlug: "operations",
    location: "Enugu",
    workMode: "onsite",
    employmentType: "Full-time",
    seniority: "Senior",
    team: "Operations",
    summary:
      "Lead the daily fulfillment loop across garment care, home cleaning, and pickup-delivery — 12-20 frontline staff, measurable quality bar, clear handoffs.",
    description:
      "Henry Onyx Care runs a premium service operation with a real customer expectation behind every booking. You'll own the daily loop end-to-end: morning dispatch, in-shift quality audits, exception management, and the recovery flow when something slips. Direct ownership of NPS and on-time delivery rate.",
    responsibilities: [
      "Run the morning dispatch and end-of-day reconciliation cadence",
      "Lead a frontline team of 12-20 across garment care, home cleaning, and pickup",
      "Audit service quality on a sampled basis — minimum 3 jobs per shift, written notes",
      "Coordinate the dispatch handoff with the logistics rider pool — pickup windows, recovery if missed",
      "Own NPS and on-time-delivery KPIs; review weekly with the Care division lead",
    ],
    requirements: [
      "5+ years operations leadership in a service or hospitality business",
      "Demonstrated improvement of a measurable service KPI (NPS, on-time rate, rework rate)",
      "Comfort running a frontline team in person — coaching, scheduling, performance",
      "Calm under exception — you reroute the dispatch when a rider drops, not panic",
    ],
    benefits: [
      "Performance bonus tied to NPS and on-time delivery",
      "Operational ownership with direct leverage over your tools and process",
      "Growth track to Care Division Operations lead",
      "Health insurance + 18 days paid leave",
    ],
    skills: [
      "Service Operations",
      "Frontline Team Leadership",
      "Quality Audit",
      "Dispatch Coordination",
      "NPS & SLA Management",
    ],
    salaryMin: 8_000_000,
    salaryMax: 14_000_000,
    featured: true,
    internal: false,
  },
  {
    slug: "customer-support-lead-care",
    title: "Customer Support Lead",
    subtitle: "Thread quality, agent coaching, and SLA discipline",
    employerSlug: "care",
    employerName: "Henry Onyx Fabric Care",
    categoryName: "Customer Support",
    categorySlug: "customer-support",
    location: "Lagos",
    workMode: "hybrid",
    employmentType: "Full-time",
    seniority: "Mid-level",
    team: "Customer Experience",
    summary:
      "Own the support-thread quality bar across Henry Onyx Care customers. Lead 4-6 agents, instrument response-time SLAs, and run a weekly review cadence with operations.",
    description:
      "Care customers reach us through a shared Henry Onyx support thread. You'll own the quality and tone of every reply, lead a small support team, and partner with operations on the recovery loop when something goes wrong on the service side.",
    responsibilities: [
      "Audit a sample of support threads weekly — written feedback to each agent",
      "Manage a team of 4-6 support agents; coach against the response-time SLA",
      "Run the weekly review with the Operations Manager — what broke, what we changed",
      "Own escalation paths and refund policy execution",
      "Maintain the response-template library; deprecate stale macros",
    ],
    requirements: [
      "4+ years in customer support, last 1+ year leading agents",
      "Demonstrated SLA improvement (median response time, FCR rate)",
      "Calm tone under complaint — recovery is your craft",
      "Comfort instrumenting your own work in a spreadsheet or BI tool",
    ],
    benefits: [
      "Hybrid (3 days Lagos office)",
      "Performance bonus on response-time + CSAT",
      "Health insurance + 18 days paid leave",
    ],
    skills: [
      "Customer Support Leadership",
      "SLA Management",
      "Agent Coaching",
      "Conflict Resolution",
      "Operational Reporting",
    ],
    salaryMin: 5_000_000,
    salaryMax: 10_000_000,
    featured: false,
    internal: false,
  },
  {
    slug: "customer-support-agent-care",
    title: "Customer Support Agent",
    subtitle: "First-response care for every Henry Onyx customer",
    employerSlug: "care",
    employerName: "Henry Onyx Fabric Care",
    categoryName: "Customer Support",
    categorySlug: "customer-support",
    location: "Lagos",
    workMode: "hybrid",
    employmentType: "Full-time",
    seniority: "Entry-level",
    team: "Customer Experience",
    summary:
      "Be the calm, fast first response for Henry Onyx customers — answer questions, track bookings, and resolve issues before they become complaints. A real entry point into the company.",
    description:
      "This is where many great Henry Onyx careers start. You'll handle the day-to-day customer threads — booking questions, status updates, small problems solved before they grow. You don't need years of experience; you need a clear head, good written English, and genuine care for getting someone's day back on track. We'll train you on the rest.",
    responsibilities: [
      "Respond to customer messages within the response-time SLA, with a warm, clear tone",
      "Track active bookings and proactively update customers when something changes",
      "Resolve common issues end-to-end; escalate the rest with a clean summary",
      "Log every interaction so the team can spot patterns and fix root causes",
      "Keep your saved replies accurate — flag any macro that's gone stale",
    ],
    requirements: [
      "Strong written English and a calm, friendly phone manner",
      "Reliable, punctual, and comfortable on a shift schedule",
      "Basic computer literacy — you can learn a support tool quickly",
      "Customer-service experience is a plus, not a requirement — attitude matters most",
    ],
    benefits: [
      "Paid onboarding and on-the-job coaching from the Support Lead",
      "Clear growth path to Senior Agent and Support Lead",
      "Hybrid schedule (Lagos) with predictable shifts",
      "Health cover + paid leave",
    ],
    skills: [
      "Written Communication",
      "Customer Care",
      "Problem Solving",
      "Attention to Detail",
      "Time Management",
    ],
    salaryMin: 1_440_000,
    salaryMax: 2_160_000,
    featured: false,
    internal: false,
  },
  {
    slug: "garment-care-specialist",
    title: "Garment Care Specialist",
    subtitle: "Premium fabric care, done right the first time",
    employerSlug: "care",
    employerName: "Henry Onyx Fabric Care",
    categoryName: "Operations",
    categorySlug: "operations",
    location: "Enugu",
    workMode: "onsite",
    employmentType: "Full-time",
    seniority: "Entry-level",
    team: "Care Floor",
    summary:
      "Handle premium garments with the care they deserve — inspect, treat, clean, and finish to a standard customers notice. Skilled, hands-on, and genuinely valued work.",
    description:
      "Every Henry Onyx Care customer trusts us with clothes that matter to them. As a Garment Care Specialist you own the craft on the floor: inspecting fabrics, choosing the right treatment, handling stains and delicate items, and finishing to a standard that keeps people coming back. Experience helps, but we train for skill and reward the people who take pride in the work.",
    responsibilities: [
      "Inspect incoming garments; flag damage or special-care items before treatment",
      "Select and apply the right cleaning and stain-treatment method per fabric",
      "Press, finish, and quality-check items against the Henry Onyx care standard",
      "Keep your station clean, stocked, and safe; follow chemical-handling rules",
      "Hit the daily throughput target without cutting the quality bar",
    ],
    requirements: [
      "Care, dry-cleaning, laundry, or tailoring experience is a strong plus",
      "Good hands and an eye for detail — you notice the small finish that others miss",
      "Reliable and onsite in Enugu; comfortable on your feet through a shift",
      "Willingness to learn the Henry Onyx care method and follow it exactly",
    ],
    benefits: [
      "Paid skills training and a clear path to Senior Specialist / Floor Lead",
      "Performance bonus tied to quality scores and throughput",
      "Health cover + paid leave",
      "Stable, respected work in a premium service brand",
    ],
    skills: [
      "Fabric Care",
      "Stain Treatment",
      "Garment Finishing",
      "Quality Control",
      "Attention to Detail",
    ],
    salaryMin: 960_000,
    salaryMax: 1_560_000,
    featured: false,
    internal: false,
  },

  // ── Henry Onyx Logistics ──────────────────────────────────────────────
  {
    slug: "logistics-dispatch-operations-lead",
    title: "Logistics Dispatch Operations Lead",
    subtitle: "Route discipline, rider performance, and exception recovery",
    employerSlug: "logistics",
    employerName: "Henry Onyx Logistics",
    categoryName: "Logistics",
    categorySlug: "logistics",
    location: "Lagos",
    workMode: "onsite",
    employmentType: "Full-time",
    seniority: "Senior",
    team: "Logistics Dispatch",
    summary:
      "Run the daily dispatch board across Henry Onyx Logistics — route assignment, rider performance, exception recovery, and proof-of-delivery hygiene.",
    description:
      "Henry Onyx Logistics moves shipments for both internal divisions (Care pickups, Marketplace orders) and external customers. You're the calm in the dispatch room: route assignment, rider coaching, and recovery when something slips. Direct partnership with the dispatch tooling team on what to build next.",
    responsibilities: [
      "Run the morning dispatch board; assign routes against rider performance",
      "Lead a rider pool of 8-15 across same-day, scheduled, and inter-city",
      "Manage exceptions in real time — failed pickup, attempted delivery, address miss",
      "Audit proof-of-delivery hygiene; reject sloppy captures, coach corrections",
      "Partner with engineering on dispatch tooling roadmap (what to build, what to buy)",
    ],
    requirements: [
      "4+ years dispatch or logistics operations leadership",
      "Comfort with rider performance metrics — utilization, on-time rate, exception rate",
      "Demonstrated calm under exception — you reroute, you don't escalate first",
      "Lagos-based; willing to spend mornings in dispatch through the rush window",
    ],
    benefits: [
      "Onsite Lagos with predictable shift discipline",
      "Performance bonus on on-time rate + exception recovery",
      "Career path into Logistics Division Operations lead",
    ],
    skills: [
      "Dispatch Operations",
      "Rider Performance",
      "Exception Management",
      "Route Optimization",
      "Proof-of-Delivery Workflow",
    ],
    salaryMin: 8_000_000,
    salaryMax: 15_000_000,
    featured: false,
    internal: false,
  },
  {
    slug: "dispatch-rider",
    title: "Dispatch Rider",
    subtitle: "Move Henry Onyx deliveries on time, every time",
    employerSlug: "logistics",
    employerName: "Henry Onyx Logistics",
    categoryName: "Logistics",
    categorySlug: "logistics",
    location: "Enugu / Lagos",
    workMode: "onsite",
    employmentType: "Full-time",
    seniority: "Entry-level",
    team: "Rider Pool",
    summary:
      "Ride for Henry Onyx — pick up, deliver, and capture clean proof-of-delivery across the city. Fair base pay, performance bonus, and a real path to dispatch lead.",
    description:
      "Riders are the face of Henry Onyx on the road. You'll run assigned routes for Care pickups, Marketplace orders, and customer deliveries — on time, handled with care, and logged properly. We pay fairly, we don't strand you with impossible routes, and the riders who show up well move up to senior rider and dispatch roles.",
    responsibilities: [
      "Complete assigned pickups and deliveries within the promised window",
      "Handle every parcel with care — nothing damaged, nothing lost",
      "Capture clean proof-of-delivery (photo + confirmation) on every drop",
      "Report exceptions early — wrong address, customer unreachable — so dispatch can recover",
      "Keep your bike serviced and follow road-safety and helmet rules without exception",
    ],
    requirements: [
      "Valid rider's licence and confident city riding",
      "Knowledge of Enugu or Lagos routes (or fast to learn them)",
      "A working smartphone and comfort using a delivery app",
      "Reliable, honest, and punctual — customers are trusting you with their goods",
    ],
    benefits: [
      "Fair monthly base plus per-delivery performance bonus",
      "Fuel/maintenance support and company-branded gear",
      "Clear growth path to Senior Rider and Dispatch Operations",
      "Paid training on safe riding and the Henry Onyx delivery standard",
    ],
    skills: [
      "Safe Riding",
      "Route Navigation",
      "Proof-of-Delivery",
      "Time Management",
      "Customer Courtesy",
    ],
    salaryMin: 1_020_000,
    salaryMax: 1_560_000,
    featured: false,
    internal: false,
  },

  // ── Henry Onyx Marketplace ────────────────────────────────────────────
  {
    slug: "sales-partnerships-associate",
    title: "Sales & Partnerships Associate",
    subtitle: "Grow the marketplace — sellers, accounts, and revenue",
    employerSlug: "marketplace",
    employerName: "Henry Onyx Marketplace",
    categoryName: "Sales",
    categorySlug: "sales",
    location: "Lagos",
    workMode: "hybrid",
    employmentType: "Full-time",
    seniority: "Mid-level",
    team: "Commercial",
    summary:
      "Bring trusted sellers and business accounts onto Henry Onyx Marketplace and grow the orders that follow. Real commercial ownership with uncapped commission.",
    description:
      "You own the commercial growth of the marketplace: sourcing trusted sellers, onboarding business buyers, and closing the partnerships that put more honest goods in front of more customers. This is a builder's sales role — you'll shape the playbook, not just run someone else's script — with uncapped commission on top of a solid base.",
    responsibilities: [
      "Source and close trusted sellers; guide them through verification and onboarding",
      "Build a pipeline of business/bulk buyers and grow their repeat order value",
      "Negotiate partnership terms that protect buyer trust and unit economics",
      "Work with operations to make sure what you sell can actually be fulfilled",
      "Own your number — forecast, report, and hit monthly revenue targets",
    ],
    requirements: [
      "2+ years in sales, account management, or partnerships (retail/e-commerce a plus)",
      "Confident communicator who can open and close without being pushy",
      "Comfort owning a target and reporting against it honestly",
      "Lagos-based with willingness to meet sellers and accounts in person",
    ],
    benefits: [
      "Competitive base + uncapped commission on closed revenue",
      "Hybrid Lagos schedule with real autonomy over your pipeline",
      "Build the commercial playbook for a growing marketplace",
      "Health cover + paid leave",
    ],
    skills: [
      "B2B Sales",
      "Partnerships",
      "Account Management",
      "Negotiation",
      "Pipeline Management",
    ],
    salaryMin: 1_560_000,
    salaryMax: 2_400_000,
    featured: true,
    internal: false,
  },
  {
    slug: "warehouse-fulfilment-officer",
    title: "Warehouse & Fulfilment Officer",
    subtitle: "Accurate stock, clean picks, on-time dispatch",
    employerSlug: "marketplace",
    employerName: "Henry Onyx Marketplace",
    categoryName: "Operations",
    categorySlug: "operations",
    location: "Enugu",
    workMode: "onsite",
    employmentType: "Full-time",
    seniority: "Entry-level",
    team: "Fulfilment",
    summary:
      "Keep the Henry Onyx Marketplace store honest — receive stock, pick and pack orders accurately, and hand off to dispatch on time. The backbone of buyer trust.",
    description:
      "Every promise the marketplace makes a buyer is kept (or broken) in the warehouse. As a Fulfilment Officer you receive and check incoming stock, keep counts accurate, pick and pack orders without errors, and hand them to dispatch on schedule. It's organized, active, important work — and a strong first step into operations at Henry Onyx.",
    responsibilities: [
      "Receive incoming stock; check quantity and condition against the order",
      "Keep inventory counts accurate — flag discrepancies the same day",
      "Pick and pack customer orders correctly, with the right packaging",
      "Stage orders for dispatch and confirm the handoff to riders",
      "Keep the warehouse clean, organized, and safe to work in",
    ],
    requirements: [
      "Reliable, organized, and comfortable on your feet through a shift",
      "Basic numeracy and care with counts — accuracy is the whole job",
      "Warehouse, stock, or retail experience is a plus, not required",
      "Onsite in Enugu and able to lift/move stock safely",
    ],
    benefits: [
      "Paid training on the inventory system and fulfilment standard",
      "Clear growth path to Fulfilment Lead and Operations",
      "Performance recognition tied to accuracy and on-time dispatch",
      "Health cover + paid leave",
    ],
    skills: [
      "Inventory Accuracy",
      "Order Picking & Packing",
      "Stock Receiving",
      "Organization",
      "Warehouse Safety",
    ],
    salaryMin: 1_200_000,
    salaryMax: 1_800_000,
    featured: false,
    internal: false,
  },

  // ── Henry Onyx Learn ──────────────────────────────────────────────────
  {
    slug: "academy-instructor",
    title: "Academy Instructor / Course Tutor",
    subtitle: "Teach what you do — to a serious, paying audience",
    employerSlug: "learn",
    employerName: "Henry Onyx Learn",
    categoryName: "Teaching & Curriculum",
    categorySlug: "teaching",
    location: "Remote",
    workMode: "remote",
    employmentType: "Contract",
    seniority: "Mid-level",
    team: "Curriculum",
    summary:
      "Turn your real operating skill — design, code, operations, finance, trade — into a practical Henry Onyx Learn course, and teach learners who actually want to apply it.",
    description:
      "Henry Onyx Learn courses are taught by people who do the work, not career lecturers. As an instructor you'll design a focused, outcome-driven course in your area of expertise, record and deliver the lessons with our production support, and mentor learners through to a real result. Flexible, remote, and well-supported — with a clear retainer-plus-royalty model.",
    responsibilities: [
      "Design a focused course outline with clear, assessable learning outcomes",
      "Record and deliver lessons (with Henry Onyx production and editing support)",
      "Write practical exercises and projects learners can put in a portfolio",
      "Answer learner questions and run periodic live sessions or office hours",
      "Iterate the course from learner feedback and completion data",
    ],
    requirements: [
      "Genuine, current expertise in a teachable skill (design, engineering, ops, finance, trade, etc.)",
      "The rare ability to explain hard things simply",
      "Reliable enough to keep a content and response schedule",
      "Comfort on camera and with a basic recording setup (we help with the rest)",
    ],
    benefits: [
      "Retainer plus royalty share on course revenue",
      "Full production, editing, and platform support — you focus on teaching",
      "Remote and flexible around your main work",
      "Build your reputation with a serious, paying audience",
    ],
    skills: [
      "Curriculum Design",
      "Teaching & Mentoring",
      "Content Creation",
      "Subject-Matter Expertise",
      "Communication",
    ],
    salaryMin: 2_400_000,
    salaryMax: 4_200_000,
    featured: true,
    internal: false,
  },
];
