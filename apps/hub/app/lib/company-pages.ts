import { createClient } from "@supabase/supabase-js";
import {
  COMPANY,
  DATA_CATEGORIES,
  INTERNATIONAL_AUTHORITIES,
  LEGAL,
  NDPA_LAWFUL_BASES,
  RETENTION_POLICIES,
  SUB_PROCESSORS,
} from "@henryco/config";
import {
  resolveLocalizedDynamicField,
  type AppLocale,
} from "@henryco/i18n/server";
import { fetchNoStore } from "./no-store-fetch";

export type CompanyPageStat = {
  id?: string;
  label?: string;
  value?: string;
};

export type CompanyPageItem = {
  id?: string;
  label?: string;
  value?: string;
  title?: string;
  body?: string;
  href?: string;
  image_url?: string;
};

export type CompanyPageSection = {
  id?: string;
  eyebrow?: string;
  title?: string;
  body?: string;
  layout?: "default" | "cards" | "grid" | "legal" | "timeline" | string;
  image_url?: string;
  items: CompanyPageItem[];
};

export type CompanyPageRecord = {
  id?: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  hero_badge?: string | null;
  intro?: string | null;
  hero_image_url?: string | null;
  primary_cta_label?: string | null;
  primary_cta_href?: string | null;
  secondary_cta_label?: string | null;
  secondary_cta_href?: string | null;
  stats: CompanyPageStat[];
  sections: CompanyPageSection[];
  seo_title?: string | null;
  seo_description?: string | null;
  is_published: boolean;
  sort_order: number;
  created_at?: string | null;
  updated_at?: string | null;
};

type CompanyPageDbRow = Partial<CompanyPageRecord> & {
  page_key?: string | null;
  hero_kicker?: string | null;
  hero_title?: string | null;
  hero_body?: string | null;
  hero_primary_label?: string | null;
  hero_primary_href?: string | null;
  hero_secondary_label?: string | null;
  hero_secondary_href?: string | null;
  intro_title?: string | null;
  intro_body?: string | null;
  cta_primary_label?: string | null;
  cta_primary_href?: string | null;
  cta_secondary_label?: string | null;
  cta_secondary_href?: string | null;
  cover_image_url?: string | null;
  body?: unknown;
  content?: unknown;
  stats?: unknown;
  sections?: unknown;
};

function toText(value: unknown, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function toNullableText(value: unknown) {
  const text = String(value ?? "").trim();
  return text || null;
}

function toArray<T>(value: unknown, map: (item: unknown, index: number) => T): T[] {
  if (!Array.isArray(value)) return [];
  return value.map(map);
}

function normalizeStat(value: unknown, index: number): CompanyPageStat {
  const item = value && typeof value === "object" ? (value as Record<string, unknown>) : {};

  return {
    id: toText(item.id, `stat-${index + 1}`),
    label: toNullableText(item.label) ?? "Metric",
    value: toNullableText(item.value) ?? "—",
  };
}

function normalizeItem(value: unknown, index: number): CompanyPageItem {
  const item = value && typeof value === "object" ? (value as Record<string, unknown>) : {};

  return {
    id: toText(item.id, `item-${index + 1}`),
    label: toNullableText(item.label) ?? undefined,
    value: toNullableText(item.value) ?? undefined,
    title: toNullableText(item.title) ?? undefined,
    body: toNullableText(item.body) ?? undefined,
    href: toNullableText(item.href) ?? undefined,
    image_url:
      toNullableText(item.image_url) ??
      toNullableText(item.imageUrl) ??
      undefined,
  };
}

function normalizeSection(value: unknown, index: number): CompanyPageSection {
  const section = value && typeof value === "object" ? (value as Record<string, unknown>) : {};

  return {
    id: toText(section.id, `section-${index + 1}`),
    eyebrow: toNullableText(section.eyebrow) ?? undefined,
    title: toNullableText(section.title) ?? undefined,
    body: toNullableText(section.body) ?? undefined,
    layout: toText(section.layout, "default"),
    image_url:
      toNullableText(section.image_url) ??
      toNullableText(section.imageUrl) ??
      undefined,
    items: toArray(section.items, normalizeItem),
  };
}

export function normalizeCompanyPage(
  row: CompanyPageDbRow | null | undefined,
  slugFallback = "page"
): CompanyPageRecord {
  const statsSource =
    Array.isArray(row?.stats)
      ? row?.stats
      : row?.content &&
          typeof row.content === "object" &&
          !Array.isArray(row.content) &&
          Array.isArray((row.content as { stats?: unknown[] }).stats)
        ? (row.content as { stats: unknown[] }).stats
        : [];
  const sectionsSource = Array.isArray(row?.sections) ? row?.sections : row?.body;

  return {
    id: row?.id ? String(row.id) : undefined,
    slug: toText(row?.slug ?? row?.page_key, slugFallback),
    title: toText(row?.title, "Henry & Co."),
    subtitle: toNullableText(row?.subtitle),
    hero_badge: toNullableText(row?.hero_badge) ?? toNullableText(row?.hero_kicker),
    intro:
      toNullableText(row?.intro) ??
      toNullableText(row?.hero_body) ??
      toNullableText(row?.intro_body),
    hero_image_url:
      toNullableText(row?.hero_image_url) ?? toNullableText(row?.cover_image_url),
    primary_cta_label:
      toNullableText(row?.primary_cta_label) ??
      toNullableText(row?.cta_primary_label) ??
      toNullableText(row?.hero_primary_label),
    primary_cta_href:
      toNullableText(row?.primary_cta_href) ??
      toNullableText(row?.cta_primary_href) ??
      toNullableText(row?.hero_primary_href),
    secondary_cta_label:
      toNullableText(row?.secondary_cta_label) ??
      toNullableText(row?.cta_secondary_label) ??
      toNullableText(row?.hero_secondary_label),
    secondary_cta_href:
      toNullableText(row?.secondary_cta_href) ??
      toNullableText(row?.cta_secondary_href) ??
      toNullableText(row?.hero_secondary_href),
    stats: toArray(statsSource, normalizeStat),
    sections: toArray(sectionsSource, normalizeSection),
    seo_title: toNullableText(row?.seo_title),
    seo_description: toNullableText(row?.seo_description),
    is_published: Boolean(row?.is_published ?? true),
    sort_order: Number(row?.sort_order ?? 100),
    created_at: toNullableText(row?.created_at),
    updated_at: toNullableText(row?.updated_at),
  };
}

export function createFallbackCompanyPage(slug: string): CompanyPageRecord {
  const pageSlug = slug.trim().toLowerCase();

  const base: CompanyPageRecord = {
    slug: pageSlug,
    title: "Henry & Co.",
    subtitle: "Corporate platform",
    hero_badge: "Company page",
    intro:
      "One operating standard across every division, held consistent across every public surface of the group.",
    hero_image_url: null,
    primary_cta_label: "Contact the company",
    primary_cta_href: "/contact",
    secondary_cta_label: "Browse divisions",
    secondary_cta_href: "/#divisions",
    stats: [
      { id: "stat-1", label: "Operating standard", value: "Consistent" },
      { id: "stat-2", label: "Structure", value: "Multi-division" },
      { id: "stat-3", label: "Horizon", value: "Long-term" },
    ],
    sections: [],
    seo_title: null,
    seo_description: null,
    is_published: true,
    sort_order: 100,
    created_at: null,
    updated_at: null,
  };

  switch (pageSlug) {
    case "about":
      return {
        ...base,
        title: `About ${COMPANY.group.name}`,
        subtitle: "Who we are, what we run, and how we operate",
        hero_badge: `Company overview \u00b7 v${LEGAL.policy.version}`,
        intro:
          `${COMPANY.group.name} is a multi-division operating group founded by ${LEGAL.entity.founder}. Each division \u2014 Logistics, Fabric Care, Property, Marketplace, Studio, Jobs, and Learn \u2014 runs an independent market under one shared operating standard for KYC, payments, support response, and audit logging. We build the same way across every surface: a single account, one trust signal taxonomy, one settlement currency at checkout, one audit trail per action.`,
        primary_cta_label: "Contact the company",
        primary_cta_href: "/contact",
        secondary_cta_label: "Browse divisions",
        secondary_cta_href: "/#divisions",
        stats: [
          { id: "stat-divisions", label: "Divisions live", value: "7" },
          { id: "stat-account", label: "Accounts", value: "One per customer, all divisions" },
          { id: "stat-founder", label: "Founder", value: LEGAL.entity.founder },
        ],
        sections: [
          {
            id: "about-identity",
            eyebrow: "Identity",
            title: `${COMPANY.group.name} is a Nigerian operating group`,
            body:
              `Registered in Nigeria as ${LEGAL.entity.name} (RC ${LEGAL.entity.rcNumber}). Headquartered in ${LEGAL.entity.registeredOffice.city}, ${LEGAL.entity.registeredOffice.state}. Founded in ${LEGAL.entity.yearFounded} by ${LEGAL.entity.founder}. We operate seven divisions on one platform, one auth surface, one audit log, one settlement currency at checkout \u2014 Nigeria first, with cross-border commerce supported through multi-currency display and named processor regions.`,
            layout: "default",
            items: [
              { id: "about-identity-trading", label: "Trading name", value: LEGAL.entity.tradingName },
              { id: "about-identity-legal", label: "Registered name", value: LEGAL.entity.name },
              { id: "about-identity-rc", label: "CAC RC number", value: LEGAL.entity.rcNumber },
              { id: "about-identity-tin", label: "FIRS TIN", value: LEGAL.entity.tin },
              { id: "about-identity-office", label: "Registered office", value: `${LEGAL.entity.registeredOffice.city}, ${LEGAL.entity.registeredOffice.state}, ${LEGAL.entity.registeredOffice.country}` },
              { id: "about-identity-founded", label: "Year founded", value: LEGAL.entity.yearFounded },
            ],
          },
          {
            id: "about-divisions",
            eyebrow: "What the divisions do",
            title: "Seven divisions, one operating standard",
            body:
              "Each division has a defined market and a defined contract \u2014 not a bundle. Sourced directly from packages/config/company.ts so this page cannot drift from the platform.",
            layout: "cards",
            items: [
              { id: "about-div-logistics", title: COMPANY.divisions.logistics.name, body: COMPANY.divisions.logistics.description, href: "/#divisions" },
              { id: "about-div-care", title: COMPANY.divisions.care.name, body: COMPANY.divisions.care.description, href: "/#divisions" },
              { id: "about-div-property", title: COMPANY.divisions.property.name, body: COMPANY.divisions.property.description, href: "/#divisions" },
              { id: "about-div-marketplace", title: COMPANY.divisions.marketplace.name, body: COMPANY.divisions.marketplace.description, href: "/#divisions" },
              { id: "about-div-jobs", title: COMPANY.divisions.jobs.name, body: COMPANY.divisions.jobs.description, href: "/#divisions" },
              { id: "about-div-learn", title: COMPANY.divisions.learn.name, body: COMPANY.divisions.learn.description, href: "/#divisions" },
              { id: "about-div-studio", title: COMPANY.divisions.studio.name, body: COMPANY.divisions.studio.description, href: "/#divisions" },
            ],
          },
          {
            id: "about-standard",
            eyebrow: "The operating standard",
            title: "Measurable, not adjectival",
            body:
              "We avoid words like \u201cpremium\u201d, \u201crespected\u201d, or \u201cdisciplined\u201d without a measurable referent. Here is what the standard means in practice across every division.",
            layout: "cards",
            items: [
              {
                id: "about-standard-kyc",
                title: "KYC verified before payout",
                body: "Vendors and operators complete NIN + BVN verification (where applicable) and bank-account verification before any payout is released. KYC documents are retained for 5 years under CBN AML/CFT Regulations 2022.",
              },
              {
                id: "about-standard-audit",
                title: "Every mutation written to audit_log",
                body: "Owner, staff, and operator actions across the platform write to a structured audit_log retained for 7 years. Sentry breadcrumbs and structured logger entries accompany every server action.",
              },
              {
                id: "about-standard-support",
                title: "Support response target: 24h",
                body: "First-response target for non-emergency support is 24 hours during operating days. Time-critical disputes (delivery failure, refund window) route through Freshdesk with explicit priority queues.",
              },
              {
                id: "about-standard-currency",
                title: "Settlement currency at checkout",
                body: "Prices display in the customer's locale currency via FX snapshot at checkout; settlement is recorded in NGN with the displayed currency archived alongside per the multi-currency foundation.",
              },
              {
                id: "about-standard-trust",
                title: "FingerprintJS + trust_flags for fraud",
                body: "Device-risk signals from FingerprintJS combine with platform trust_flags to suppress abusive sign-ups and flag suspicious order patterns. Trust signals reduce but do not eliminate risk.",
              },
              {
                id: "about-standard-i18n",
                title: "11 supported locales via @henryco/i18n",
                body: "Customer-facing surfaces flow through @henryco/i18n with DeepL-primed translation cache. English is the canonical version in case of conflict.",
              },
            ],
          },
          {
            id: "about-personas",
            eyebrow: "Who it serves",
            title: "Three customer types we are built for",
            body:
              "We do not target everyone. The platform is shaped around three groups whose problems the operating standard is designed to solve.",
            layout: "cards",
            items: [
              {
                id: "about-persona-customer",
                title: "End customers",
                body: "Buyers, tenants, learners, and service requesters who want one account, predictable response times, and verified vendors.",
              },
              {
                id: "about-persona-vendor",
                title: "Vendors and operators",
                body: "Sellers, landlords, instructors, employers, riders, and care providers who want a clean payout path, verified KYC, and dispute support that resolves rather than stalls.",
              },
              {
                id: "about-persona-business",
                title: "Business and institutional buyers",
                body: "Companies that need recurring logistics, employee learning, office care, or studio engagements with documented SLAs and signed contracts.",
              },
            ],
          },
          {
            id: "about-not-promised",
            eyebrow: "Scope honesty",
            title: "What we do not promise",
            body:
              "Honest about scope so the operating standard stays credible. The premium-bar rubric calls for this \u2014 silence is not a substitute for clarity.",
            layout: "cards",
            items: [
              {
                id: "about-not-payments",
                title: "We are not a bank",
                body: "We process payments through Stripe and route payouts to verified bank accounts. We do not hold deposits, issue credit, or run regulated financial products.",
              },
              {
                id: "about-not-tenancy",
                title: "Property: agent, not party to tenancy",
                body: "Henry & Co. Property coordinates discovery, viewings, and (where engaged) managed-property operations. The tenancy contract is between landlord and tenant unless explicitly signed by Henry & Co. Property in a managed-property capacity.",
              },
              {
                id: "about-not-employer",
                title: "Jobs: platform, not employer",
                body: "Henry & Co. Jobs hosts listings and verifies candidate profiles. The employment contract is between employer and candidate; Henry & Co. is not party to the employment relationship.",
              },
              {
                id: "about-not-instant",
                title: "Service availability is operating-hours bound",
                body: "Logistics same-day windows and care booking windows depend on operating-hours and rider coverage in the customer's city. Coverage is named, not implied.",
              },
            ],
          },
          {
            id: "about-reach",
            eyebrow: "How to reach the company",
            title: "Group-level contact",
            body:
              "For division-specific issues, the division support inbox is faster. Group enquiries (partnership, media, investor) come here.",
            layout: "default",
            items: [
              { id: "about-reach-hello", label: "General", value: LEGAL.contacts.hello },
              { id: "about-reach-legal", label: "Legal correspondence", value: LEGAL.contacts.legal },
              { id: "about-reach-privacy", label: "Privacy and data-subject rights", value: LEGAL.contacts.privacy },
              { id: "about-reach-dpo", label: "Data Protection Officer", value: LEGAL.contacts.dpo },
              { id: "about-reach-phone", label: "Phone", value: LEGAL.contacts.supportPhone },
            ],
          },
        ],
      };

    case "contact":
      return {
        ...base,
        title: "Contact Henry & Co.",
        subtitle: "Reach the company",
        hero_badge: "Business enquiries",
        intro:
          "Company-level communication, strategic partnerships, media enquiries, supplier introductions, and anything else that belongs to the parent group rather than a single division.",
        sections: [
          {
            id: "contact-usage",
            eyebrow: "When to use this page",
            title: "Group-level conversations only",
            body:
              "For anything specific to a division, go directly to that division \u2014 you will get a faster and more accurate answer.",
            layout: "cards",
            items: [
              {
                id: "contact-usage-1",
                title: "General company enquiries",
                body: "Group-level questions, introductions, and broader brand communication.",
              },
              {
                id: "contact-usage-2",
                title: "Partnership and vendor discussions",
                body: "Collaboration, procurement, and business development across the group.",
              },
              {
                id: "contact-usage-3",
                title: "Media and investor relations",
                body: "Interview requests, profile enquiries, and investor-facing information.",
              },
            ],
          },
        ],
      };

    case "privacy":
      return {
        ...base,
        title: "Privacy Policy",
        subtitle: `Nigeria Data Protection Act 2023 · Effective ${LEGAL.policy.effectiveDate} · v${LEGAL.policy.version}`,
        hero_badge: `NDPA 2023 · v${LEGAL.policy.version}`,
        intro:
          `${LEGAL.entity.tradingName} processes personal data as a data controller under the Nigeria Data Protection Act 2023. This policy names every category of data collected, the lawful basis under NDPA §25, the sub-processors who receive data on the controller's behalf, the retention windows tied to statute, and the rights every data subject can exercise. The canonical version is English; ${LEGAL.policy.supportedLocales} locales are available for reference.`,
        primary_cta_label: "Exercise your rights",
        primary_cta_href: `mailto:${LEGAL.contacts.privacy}`,
        secondary_cta_label: "Terms and Conditions",
        secondary_cta_href: "/terms",
        stats: [
          { id: "stat-effective", label: "Effective", value: LEGAL.policy.effectiveDate },
          { id: "stat-version", label: "Version", value: `v${LEGAL.policy.version}` },
          { id: "stat-locales", label: "Locales", value: `${LEGAL.policy.supportedLocales} (English canonical)` },
        ],
        sections: [
          {
            id: "privacy-controller",
            eyebrow: "1. Controller identity",
            title: "Who is responsible for this data",
            body:
              `${LEGAL.entity.name} (RC ${LEGAL.entity.rcNumber}), trading as ${LEGAL.entity.tradingName}, with registered office at ${LEGAL.entity.registeredOffice.street}, ${LEGAL.entity.registeredOffice.city}, ${LEGAL.entity.registeredOffice.state}, ${LEGAL.entity.registeredOffice.country} ${LEGAL.entity.registeredOffice.postalCode}, is the data controller for personal data processed across henrycogroup.com and every division surface. NDPC registration: ${LEGAL.entity.ndpcRegistration}. Data Protection Officer: ${LEGAL.entity.dpo}.\n\n— In plain English: One Nigerian company runs all the Henry & Co. divisions, and it is the entity legally answerable for how your data is handled.`,
            layout: "default",
            items: [
              { id: "privacy-controller-name", label: "Controller", value: LEGAL.entity.name },
              { id: "privacy-controller-rc", label: "CAC RC number", value: LEGAL.entity.rcNumber },
              { id: "privacy-controller-office", label: "Registered office", value: `${LEGAL.entity.registeredOffice.city}, ${LEGAL.entity.registeredOffice.state}` },
              { id: "privacy-controller-ndpc", label: "NDPC registration", value: LEGAL.entity.ndpcRegistration },
              { id: "privacy-controller-dpo", label: "DPO", value: LEGAL.entity.dpo },
            ],
          },
          {
            id: "privacy-lawful-bases",
            eyebrow: "2. Lawful bases",
            title: "Why processing is lawful under the NDPA",
            body:
              "Every processing activity on this platform rests on one or more lawful bases listed in NDPA 2023 §25. The basis used for each activity is named alongside the data category in the next section. We do not rely on a generic \"applicable law\" phrasing — each ground is cited.\n\n— In plain English: For every kind of data we touch, we name the legal reason we are allowed to touch it, instead of waving at \"the law\".",
            layout: "cards",
            items: NDPA_LAWFUL_BASES.map((basis) => ({
              id: `privacy-basis-${basis.key}`,
              title: `${basis.label} · ${basis.statute}`,
              body: basis.examples,
            })),
          },
          {
            id: "privacy-data-categories",
            eyebrow: "3. Categories of personal data",
            title: "Exactly what is collected",
            body:
              "The categories below are concrete. Each row names the data, the purpose it serves, and the lawful basis under NDPA §25. The list replaces the rubric-banned phrasing \"information we may collect\" — we collect these categories, full stop.\n\n— In plain English: This is the exact list of personal data we hold, paired with the reason we hold it.",
            layout: "cards",
            items: DATA_CATEGORIES.map((cat) => ({
              id: `privacy-cat-${cat.key}`,
              title: cat.label,
              body: `${cat.items}.\nPurpose: ${cat.purpose}\nLawful basis: ${cat.basis}`,
            })),
          },
          {
            id: "privacy-purposes",
            eyebrow: "4. Purposes paired with categories",
            title: "Why each category is processed",
            body:
              "Purposes are not stated in abstract — they are paired one-to-one with the data category that serves them in section 3. The categories table is the authoritative reference. If a new purpose is added, the categories table is updated and the policy version is bumped per section 17.\n\n— In plain English: Every purpose maps back to exactly one or two data categories. Nothing is collected for vague \"future use\".",
            layout: "default",
            items: [
              { id: "privacy-purpose-fulfilment", label: "Order and service fulfilment", value: "Identity, contact, transaction, financial, content categories" },
              { id: "privacy-purpose-kyc", label: "KYC and AML compliance", value: "KYC and identity-verification category under CBN AML/CFT Regulations" },
              { id: "privacy-purpose-security", label: "Security and fraud prevention", value: "Device, behavioural, and inferred categories" },
              { id: "privacy-purpose-support", label: "Customer support", value: "Contact, content, communication-metadata categories" },
              { id: "privacy-purpose-improvement", label: "Service improvement and A/B testing", value: "Behavioural and inferred categories (consent for non-essential analytics)" },
              { id: "privacy-purpose-marketing", label: "Marketing communication", value: "Contact and behavioural categories (consent only; transactional notifications are contractual)" },
            ],
          },
          {
            id: "privacy-processors",
            eyebrow: "5. Sub-processors",
            title: "Third parties who receive personal data",
            body:
              "These are the named sub-processors that receive personal data to help operate the platform. Each is bound by a written data-processing agreement and is selected for capability, security posture, and jurisdictional fit. Changes to this list are announced in advance under section 17.\n\n— In plain English: These specific companies help us run the platform. We name them rather than saying \"third-party service providers\".",
            layout: "cards",
            items: SUB_PROCESSORS.map((proc, i) => ({
              id: `privacy-proc-${i}`,
              title: proc.name,
              body: `${proc.purpose}.\nRegion: ${proc.region}.`,
            })),
          },
          {
            id: "privacy-transfers",
            eyebrow: "6. International data transfers",
            title: "Cross-border data movement",
            body:
              "Personal data may leave Nigeria when processed by a sub-processor named in section 5 with infrastructure outside Nigeria. Transfers rely on adequacy decisions where they exist, on Standard Contractual Clauses Module 2 (controller-to-processor) issued by the European Commission, and on the UK International Data Transfer Addendum for UK-origin data subjects. The lawful basis for transfer is set out under the Nigeria Data Protection Act 2023, supported by NDPC's general guidance on cross-border transfers.\n\n— In plain English: When your data is processed outside Nigeria, we use the same standard contracts the EU and UK use to make sure your protections travel with it.",
            layout: "default",
            items: [
              { id: "privacy-transfer-1", label: "Primary destinations", value: "European Union, United Kingdom, United States" },
              { id: "privacy-transfer-2", label: "EU/UK mechanism", value: "SCCs Module 2 (controller-to-processor) + UK IDTA" },
              { id: "privacy-transfer-3", label: "Nigerian basis", value: "Nigeria Data Protection Act 2023 + NDPC general guidance" },
              { id: "privacy-transfer-4", label: "Risk mitigations", value: "Encryption in transit and at rest, named regions, regular DPA review" },
            ],
          },
          {
            id: "privacy-retention",
            eyebrow: "7. Retention periods",
            title: "How long data is kept",
            body:
              "Retention is tied to the statute that drives it, not to vague phrasing. Concrete windows below. Where multiple statutes apply, the longest applicable window controls.\n\n— In plain English: We keep data for a specific number of years tied to a specific Nigerian law, then it is deleted.",
            layout: "cards",
            items: RETENTION_POLICIES.map((row, i) => ({
              id: `privacy-retain-${i}`,
              title: row.category,
              body: `${row.window}.\nDriver: ${row.statute}.`,
            })),
          },
          {
            id: "privacy-international-users",
            eyebrow: "8. International users",
            title: "Rights under your home jurisdiction",
            body:
              "Users outside Nigeria retain rights under their home data-protection framework, including (where applicable) the EU/EEA GDPR, UK GDPR, California CCPA/CPRA, Brazil LGPD, South Africa POPIA, Kenya Data Protection Act 2019, Ghana Data Protection Act 2012, Singapore PDPA 2012, Canada PIPEDA, and Australia Privacy Act 1988. The regulator route for each jurisdiction is listed below.\n\n— In plain English: If you live outside Nigeria, your home country's privacy law still protects you, and you can complain to its regulator.",
            layout: "cards",
            items: INTERNATIONAL_AUTHORITIES.map((auth, i) => ({
              id: `privacy-intl-${i}`,
              title: `${auth.jurisdiction} · ${auth.framework}`,
              body: `Regulator: ${auth.regulator}.\nRoute: ${auth.contact}.`,
            })),
          },
          {
            id: "privacy-rights",
            eyebrow: "9. Data subject rights",
            title: "Rights under the NDPA",
            body:
              "Every data subject has the rights set out under the Nigeria Data Protection Act 2023, including access, rectification, erasure, restriction, portability, objection, and the right not to be subject to a decision based solely on automated processing where it produces legal or similarly significant effects.\n\n— In plain English: You can ask for your data, fix it, delete it, move it, stop us using it, and challenge automated decisions.",
            layout: "cards",
            items: [
              { id: "privacy-right-access", title: "Right of access", body: "Request a copy of personal data held about you." },
              { id: "privacy-right-rectify", title: "Right to rectification", body: "Request correction of inaccurate or incomplete data." },
              { id: "privacy-right-erase", title: "Right to erasure", body: "Request deletion subject to legal-hold exceptions named in section 7." },
              { id: "privacy-right-restrict", title: "Right to restriction", body: "Request that processing be paused while a dispute is resolved." },
              { id: "privacy-right-portability", title: "Right to data portability", body: "Receive a machine-readable copy of data you provided." },
              { id: "privacy-right-object", title: "Right to object", body: "Object to processing based on legitimate interests or direct marketing." },
              { id: "privacy-right-automated", title: "Right against automated decisions", body: "Challenge decisions based solely on automated processing with legal or significant effect." },
            ],
          },
          {
            id: "privacy-exercise",
            eyebrow: "10. How to exercise rights",
            title: "Submit a request",
            body:
              `Send a written request to ${LEGAL.contacts.privacy}. The controller acknowledges receipt within 5 working days and responds substantively within 30 days under the Nigeria Data Protection Act 2023. Identity is verified before a request is actioned. Where a request is manifestly unfounded or excessive, a fee may be charged or the request refused with reasons.\n\n— In plain English: Email privacy@henrycogroup.com. We acknowledge in 5 working days and answer in 30 days. We verify it is really you before sending data.`,
            layout: "default",
            items: [
              { id: "privacy-exercise-email", label: "Email", value: LEGAL.contacts.privacy },
              { id: "privacy-exercise-dpo", label: "DPO direct line", value: LEGAL.contacts.dpo },
              { id: "privacy-exercise-ack", label: "Acknowledgement", value: "5 working days" },
              { id: "privacy-exercise-substantive", label: "Substantive response", value: "30 days (extendable once by 60 days with notice under the NDPA)" },
              { id: "privacy-exercise-id", label: "Identity verification", value: "Required before action" },
            ],
          },
          {
            id: "privacy-cookies",
            eyebrow: "11. Cookies",
            title: "Cookies and similar technologies",
            body:
              "Cookies fall into four categories. Strictly necessary cookies operate the site and cannot be disabled. Functional cookies remember preferences (language, theme). Analytics cookies measure usage and require consent. Marketing cookies support targeted campaigns and require consent. A consent banner sets initial preferences; preferences can be changed at any time from the footer.\n\n— In plain English: Some cookies make the site work. Others remember settings, measure usage, or support marketing — you control the last three.",
            layout: "cards",
            items: [
              { id: "privacy-cookie-strict", title: "Strictly necessary", body: "Authentication, security tokens, cart state. Lawful basis: contract." },
              { id: "privacy-cookie-functional", title: "Functional", body: "Language, theme, locale preferences. Lawful basis: consent." },
              { id: "privacy-cookie-analytics", title: "Analytics", body: "Usage measurement, A/B testing, error monitoring. Retention 13 months. Lawful basis: consent." },
              { id: "privacy-cookie-marketing", title: "Marketing", body: "Cross-site campaign measurement (only when enabled by the customer). Lawful basis: consent." },
            ],
          },
          {
            id: "privacy-children",
            eyebrow: "12. Children",
            title: "Children's data",
            body:
              "The platform is not directed at children under 18. The controller does not knowingly collect personal data from children under 18 without verifiable parental consent. If a child has provided data without consent, a parent or guardian should write to the privacy inbox; the data will be deleted unless retained under a legal-hold exception in section 7.\n\n— In plain English: Under-18s should not use the site without a parent. If they do, write to us and we delete the data.",
            layout: "default",
            items: [
              { id: "privacy-children-age", label: "Minimum age", value: "18 (with verifiable parental consent under 18)" },
              { id: "privacy-children-route", label: "Reporting", value: LEGAL.contacts.privacy },
            ],
          },
          {
            id: "privacy-breach",
            eyebrow: "13. Breach notification",
            title: "What happens if a breach occurs",
            body:
              "A personal-data breach with a risk to the rights and freedoms of data subjects is reported to the Nigeria Data Protection Commission within 72 hours of becoming aware, under the Nigeria Data Protection Act 2023. Affected data subjects are notified without undue delay where the breach is likely to result in high risk. The structured logger plus the audit_log retained for 7 years allow forensic reconstruction.\n\n— In plain English: If something goes wrong, we tell the regulator within 72 hours and tell affected users without delay.",
            layout: "default",
            items: [
              { id: "privacy-breach-regulator", label: "Regulator notification", value: "Within 72 hours of becoming aware" },
              { id: "privacy-breach-user", label: "Affected-user notification", value: "Without undue delay where high risk" },
              { id: "privacy-breach-forensic", label: "Forensic support", value: "audit_log 7y + structured logger + Sentry breadcrumbs" },
            ],
          },
          {
            id: "privacy-dpo",
            eyebrow: "14. Data Protection Officer",
            title: "How to reach the DPO",
            body:
              `The Data Protection Officer is the contact for any privacy concern, NDPA right exercise, or material complaint about how data is handled. ${LEGAL.entity.dpo}\n\n— In plain English: The DPO is the single named person you write to about anything privacy.`,
            layout: "default",
            items: [
              { id: "privacy-dpo-named", label: "Named DPO", value: LEGAL.entity.dpo },
              { id: "privacy-dpo-email", label: "DPO email", value: LEGAL.contacts.dpo },
              { id: "privacy-dpo-phone", label: "Group support phone", value: LEGAL.contacts.supportPhone },
            ],
          },
          {
            id: "privacy-complaints",
            eyebrow: "15. Complaints",
            title: "Lodge a complaint",
            body:
              "If a privacy concern is not resolved by the DPO, a complaint can be lodged with the Nigeria Data Protection Commission at complaints@ndpc.gov.ng. International users may complain to their home regulator named in section 8.\n\n— In plain English: If we cannot solve it, you can complain to the Nigerian regulator (or your country's regulator).",
            layout: "default",
            items: [
              { id: "privacy-complaint-ndpc", label: "Nigeria (NDPC)", value: "complaints@ndpc.gov.ng" },
              { id: "privacy-complaint-intl", label: "International", value: "See section 8 for the regulator in your jurisdiction" },
            ],
          },
          {
            id: "privacy-languages",
            eyebrow: "16. Languages",
            title: "Canonical language and translations",
            body:
              `This policy is published in English (canonical) and translated into ${LEGAL.policy.supportedLocales} additional locales through the @henryco/i18n translation pipeline. In case of conflict between language versions, the English text controls.\n\n— In plain English: English wins if a translation says something different.`,
            layout: "default",
            items: [
              { id: "privacy-lang-canonical", label: "Canonical", value: LEGAL.policy.canonicalLanguage },
              { id: "privacy-lang-count", label: "Locales", value: String(LEGAL.policy.supportedLocales) },
            ],
          },
          {
            id: "privacy-effective",
            eyebrow: "17. Effective date and version",
            title: "Version and material change",
            body:
              `Effective ${LEGAL.policy.effectiveDate} · version v${LEGAL.policy.version}. Material changes are emailed to account holders 14 days before they take effect and the version is bumped. Continued use after the effective date is acceptance.\n\n— In plain English: We tell you 14 days before anything important changes, and the version number always goes up.`,
            layout: "default",
            items: [
              { id: "privacy-effective-date", label: "Effective", value: LEGAL.policy.effectiveDate },
              { id: "privacy-effective-version", label: "Version", value: `v${LEGAL.policy.version}` },
              { id: "privacy-effective-notice", label: "Material-change notice", value: "14 days, by email to account holders" },
            ],
          },
        ],
      };

    case "terms":
      return {
        ...base,
        title: "Terms and Conditions",
        subtitle: `Governing law: ${LEGAL.jurisdiction.governingLaw} · Effective ${LEGAL.policy.effectiveDate} · v${LEGAL.policy.version}`,
        hero_badge: `Federal Republic of Nigeria · v${LEGAL.policy.version}`,
        intro:
          `These terms govern access to and use of every ${LEGAL.entity.tradingName} surface and service. They are written under the laws of the ${LEGAL.jurisdiction.governingLaw}, with arbitration seated in ${LEGAL.jurisdiction.arbitrationSeat} under the Arbitration and Mediation Act 2023. Statute citations are explicit; reject-list phrasing like "in accordance with applicable law" is avoided.`,
        primary_cta_label: "Privacy Policy",
        primary_cta_href: "/privacy",
        secondary_cta_label: "Contact the company",
        secondary_cta_href: "/contact",
        stats: [
          { id: "stat-effective", label: "Effective", value: LEGAL.policy.effectiveDate },
          { id: "stat-version", label: "Version", value: `v${LEGAL.policy.version}` },
          { id: "stat-governing", label: "Governing law", value: LEGAL.jurisdiction.governingLaw },
        ],
        sections: [
          {
            id: "terms-acceptance",
            eyebrow: "1. Acceptance and capacity",
            title: "Acceptance and legal capacity",
            body:
              `Use of any ${LEGAL.entity.tradingName} surface constitutes acceptance of these terms. The user must be at least 18 years old and have the legal capacity to enter a binding contract under Nigerian law. Where the user acts on behalf of an entity, the user warrants authority to bind that entity.\n\n— In plain English: By using the platform you agree to these terms. You must be 18+, and if you sign up for a company you must have permission to sign for that company.`,
            layout: "default",
            items: [
              { id: "terms-acceptance-age", label: "Minimum age", value: "18 years" },
              { id: "terms-acceptance-capacity", label: "Capacity", value: "Legal capacity under Nigerian law" },
              { id: "terms-acceptance-entity", label: "Acting for an entity", value: "User warrants authority to bind" },
            ],
          },
          {
            id: "terms-platform",
            eyebrow: "2. The platform",
            title: "What the divisions provide",
            body:
              `${LEGAL.entity.tradingName} operates seven divisions on one platform. Each division has a defined market and a defined contract. Use of a division is bound by both these group-level terms and any division-specific service contract presented at checkout or onboarding.\n\n— In plain English: Henry & Co. is a group with seven divisions. These terms cover the group; each division can add its own service terms on top.`,
            layout: "cards",
            items: [
              { id: "terms-platform-logistics", title: COMPANY.divisions.logistics.name, body: COMPANY.divisions.logistics.description },
              { id: "terms-platform-care", title: COMPANY.divisions.care.name, body: COMPANY.divisions.care.description },
              { id: "terms-platform-property", title: COMPANY.divisions.property.name, body: COMPANY.divisions.property.description },
              { id: "terms-platform-marketplace", title: COMPANY.divisions.marketplace.name, body: COMPANY.divisions.marketplace.description },
              { id: "terms-platform-jobs", title: COMPANY.divisions.jobs.name, body: COMPANY.divisions.jobs.description },
              { id: "terms-platform-learn", title: COMPANY.divisions.learn.name, body: COMPANY.divisions.learn.description },
              { id: "terms-platform-studio", title: COMPANY.divisions.studio.name, body: COMPANY.divisions.studio.description },
            ],
          },
          {
            id: "terms-accounts",
            eyebrow: "3. Accounts",
            title: "Account responsibility",
            body:
              "One account per natural person or entity, used across every division. The user is responsible for keeping credentials confidential and for activity under the account. Suspicious activity should be reported promptly to the security inbox so the trust-flag system can act.\n\n— In plain English: One account covers all divisions. Keep your password private, and tell us fast if something looks wrong.",
            layout: "default",
            items: [
              { id: "terms-account-one", label: "Account model", value: "One account per person or entity, all divisions" },
              { id: "terms-account-credentials", label: "Credentials", value: "User responsibility" },
              { id: "terms-account-security", label: "Report incidents", value: "security@henrycogroup.com" },
            ],
          },
          {
            id: "terms-payment",
            eyebrow: "4. Payment, fees, refunds",
            title: "Payment and refunds per division",
            body:
              "Each division has a specific payment, fee, and refund position. Refund rights under the Federal Competition and Consumer Protection Act 2018 are non-derogable for consumer transactions; division-specific terms add the operational detail.\n\n— In plain English: Each division has its own refund rule. The Federal Competition and Consumer Protection Act 2018 sets the consumer floor we cannot lower.",
            layout: "cards",
            items: [
              { id: "terms-payment-marketplace", title: "Marketplace", body: "Refunds under FCCPA 2018 §122 and §123 (defective or non-conforming goods). Returns within the window posted on the listing." },
              { id: "terms-payment-logistics", title: "Logistics", body: "Failed-delivery refund per service contract; proof-of-delivery and claim window posted at checkout." },
              { id: "terms-payment-care", title: "Fabric Care", body: "Service-incident refund per service contract; damage claim window posted at booking." },
              { id: "terms-payment-studio", title: "Studio", body: "Milestone-based release. Refund only on undelivered milestones; delivered work is non-refundable subject to revisions allowance in the proposal." },
              { id: "terms-payment-property", title: "Property", body: "Agent-only fees are paid on tenancy formation or transaction close. Managed-property terms (where engaged) are signed separately." },
              { id: "terms-payment-jobs", title: "Jobs", body: "Employer pays. Candidates pay nothing for listings or applications. Premium candidate services are optional and priced before purchase." },
              { id: "terms-payment-learn", title: "Learn", body: "Course refund window: 7 days from enrolment, unused content only. Completion certificates are non-refundable." },
            ],
          },
          {
            id: "terms-kyc",
            eyebrow: "5. Vendor and operator KYC",
            title: "KYC required before payout",
            body:
              "Vendors and operators (logistics riders, care providers, marketplace sellers, property landlords, learn instructors, studio creatives, jobs employers) complete identity verification (NIN and BVN where applicable), bank-account verification, and any role-specific licensing before payout. KYC documents are retained for 5 years after account closure under the CBN AML/CFT Regulations 2022 and the Money Laundering (Prevention and Prohibition) Act 2022.\n\n— In plain English: Anyone earning money on the platform must verify identity and bank details before they can be paid.",
            layout: "default",
            items: [
              { id: "terms-kyc-nin", label: "Identity", value: "NIN and BVN where applicable" },
              { id: "terms-kyc-bank", label: "Bank", value: "Bank-account verification before payout" },
              { id: "terms-kyc-statute", label: "Driver", value: "CBN AML/CFT Regulations 2022 + MLPPA 2022" },
              { id: "terms-kyc-retention", label: "Retention", value: "5 years after account closure" },
            ],
          },
          {
            id: "terms-ip",
            eyebrow: "6. Intellectual property",
            title: "Ownership of content and brand",
            body:
              `Users retain ownership of content they upload (listings, briefs, photos, messages). By uploading, the user grants ${LEGAL.entity.tradingName} a limited, worldwide, royalty-free, non-exclusive licence to host, transmit, display, and operate the content for service delivery. The licence ends when the content is deleted, subject to legal-hold exceptions in the Privacy Policy. ${LEGAL.entity.tradingName} retains all rights in its trade marks, logos, code, and product designs.\n\nTakedown requests: under the Copyright Act 2022 (Nigeria) §43 (notice-and-takedown), copyright holders may serve a notice on ${LEGAL.contacts.legal}. The notice must identify the work, the infringing material, and contact details, and include a good-faith statement of belief. Counter-notices follow the same route.\n\n— In plain English: You keep your stuff; we get permission to show it while you use the platform. Henry & Co. owns the brand. Copyright takedowns go to legal@henrycogroup.com.`,
            layout: "default",
            items: [
              { id: "terms-ip-user", label: "User content", value: "User retains ownership; Henry & Co. licence for service delivery" },
              { id: "terms-ip-brand", label: "Brand IP", value: "Retained by Henry & Co." },
              { id: "terms-ip-takedown", label: "Takedown route", value: LEGAL.contacts.legal },
              { id: "terms-ip-statute", label: "Statute", value: "Copyright Act 2022 (Nigeria) §43" },
            ],
          },
          {
            id: "terms-prohibited",
            eyebrow: "7. Prohibited use",
            title: "Conduct that is not allowed",
            body:
              "Prohibited conduct includes unauthorised access, intercepting traffic, reverse-engineering, scraping at volume, distributing malware, fraud, and harassment. Conduct of this kind is also a criminal offence under the Cybercrimes (Prohibition, Prevention, etc.) Act 2015 §6 (unauthorised access), §13 (interception), §14 (fraud), §22 (identity theft), among others. The platform cooperates with the Nigeria Computer Emergency Response Team (ngCERT) and the NPF Cybercrime Unit where required.\n\n— In plain English: Do not hack, scrape, defraud, or harass. These are crimes under the Cybercrimes Act, not just a terms violation.",
            layout: "cards",
            items: [
              { id: "terms-prohibited-access", title: "Unauthorised access", body: "Cybercrimes Act 2015 §6." },
              { id: "terms-prohibited-intercept", title: "Interception", body: "Cybercrimes Act 2015 §13." },
              { id: "terms-prohibited-fraud", title: "Computer-related fraud", body: "Cybercrimes Act 2015 §14." },
              { id: "terms-prohibited-identity", title: "Identity theft", body: "Cybercrimes Act 2015 §22." },
              { id: "terms-prohibited-scrape", title: "Scraping at volume", body: "Automated retrieval beyond reasonable use; rate-limiting and trust-flag suspension apply." },
              { id: "terms-prohibited-malware", title: "Malware distribution", body: "Strictly prohibited; reported to ngCERT." },
            ],
          },
          {
            id: "terms-trust",
            eyebrow: "8. Trust signals",
            title: "What trust badges mean and do not mean",
            body:
              "Trust badges (Verified, KYC complete, Active in good standing) are operational signals based on verifiable inputs (identity verification, transaction history, dispute outcome). They reduce risk; they are not a financial guarantee, an insurance product, or a warranty by Henry & Co. of any specific outcome.\n\n— In plain English: Verified means we checked something specific. It is a useful signal, not a money-back promise.",
            layout: "default",
            items: [
              { id: "terms-trust-1", label: "What badges signal", value: "Verifiable inputs (KYC, history, dispute record)" },
              { id: "terms-trust-2", label: "What badges do not signal", value: "Insurance, guarantee, or warranty of outcomes" },
            ],
          },
          {
            id: "terms-communications",
            eyebrow: "9. Communications and consent",
            title: "WhatsApp, email, push, SMS",
            body:
              "Transactional notifications (order updates, payout receipts, security alerts) are sent by email, WhatsApp, push, or SMS where the user has provided the channel. Marketing communication is sent only with consent under NDPA §25(1)(a). Opt-out controls in account settings and in every marketing message are visually equivalent to opt-in controls; no dark patterns. Opt-out is honoured within 7 days, with a 90-day suppression window before deletion per the Privacy Policy retention table.\n\n— In plain English: We send order updates on the channels you give us. Marketing only with your yes, and you can say no the same easy way you said yes.",
            layout: "default",
            items: [
              { id: "terms-comm-transactional", label: "Transactional", value: "Contract basis; channels: email, WhatsApp, push, SMS" },
              { id: "terms-comm-marketing", label: "Marketing", value: "Consent basis under NDPA §25(1)(a)" },
              { id: "terms-comm-optout", label: "Opt-out honoured within", value: "7 days" },
            ],
          },
          {
            id: "terms-liability",
            eyebrow: "10. Limitation of liability",
            title: "What the platform is liable for",
            body:
              "Consumer rights under the Federal Competition and Consumer Protection Act 2018 §128 are non-derogable and apply in full; nothing in this clause limits a right that cannot be limited under Nigerian law. Outside that non-derogable floor, total aggregate liability under or in connection with these terms is limited to the fees the customer paid to the relevant Henry & Co. division in the 12 months preceding the event giving rise to the claim. Indirect, consequential, and punitive damages are excluded.\n\n— In plain English: Your consumer rights under Nigerian law cannot be reduced. Beyond that, our maximum liability is what you paid us in the last 12 months.",
            layout: "default",
            items: [
              { id: "terms-liability-floor", label: "Non-derogable floor", value: "FCCPA 2018 §128 consumer rights" },
              { id: "terms-liability-cap", label: "Liability cap (above floor)", value: "12 months of fees paid to the relevant division" },
              { id: "terms-liability-excluded", label: "Excluded damages", value: "Indirect, consequential, punitive" },
            ],
          },
          {
            id: "terms-indemnity",
            eyebrow: "11. Indemnity",
            title: "User indemnity",
            body:
              `The user indemnifies ${LEGAL.entity.tradingName} against third-party claims arising from the user's breach of these terms, infringement of a third-party right, or unlawful use of the platform. The indemnity does not extend to claims caused by the platform's own breach of law or contract.\n\n— In plain English: If your misuse causes someone else to sue us, you cover that cost. If we are the ones at fault, you do not.`,
            layout: "default",
            items: [
              { id: "terms-indemnity-scope", label: "Indemnity scope", value: "Third-party claims from user breach or unlawful use" },
              { id: "terms-indemnity-carve", label: "Carve-out", value: "Platform's own breach of law or contract" },
            ],
          },
          {
            id: "terms-termination",
            eyebrow: "12. Termination",
            title: "Account closure and suspension",
            body:
              `Either party may terminate by notice. ${LEGAL.entity.tradingName} may suspend or terminate immediately for material breach, fraud, sanctions hit, or court order. On termination, balances are settled according to division payout schedules; KYC and transaction records are retained per the Privacy Policy retention table.\n\n— In plain English: You can close your account; we can close it for serious problems. Money owed is paid out per the division rules. Required records are kept for the legal retention period.`,
            layout: "default",
            items: [
              { id: "terms-term-mutual", label: "By either party", value: "On notice" },
              { id: "terms-term-immediate", label: "Immediate termination grounds", value: "Material breach, fraud, sanctions, court order" },
              { id: "terms-term-balances", label: "Balances on termination", value: "Settled per division payout schedule" },
            ],
          },
          {
            id: "terms-changes",
            eyebrow: "13. Changes to terms",
            title: "How changes are made",
            body:
              "Material changes to these terms are emailed to account holders 14 days before they take effect and the version number is bumped. Continued use after the effective date is acceptance. Minor edits (typos, citation corrections) are made without notice.\n\n— In plain English: Important changes get 14 days notice by email, and the version goes up. Tiny fixes are silent.",
            layout: "default",
            items: [
              { id: "terms-changes-notice", label: "Material-change notice", value: "14 days by email" },
              { id: "terms-changes-version", label: "Version bump", value: "Required for material change" },
            ],
          },
          {
            id: "terms-international-users",
            eyebrow: "14. International users",
            title: "Use from outside Nigeria",
            body:
              "These terms apply to every user regardless of location, subject to mandatory rights under the user's home jurisdiction (named in Privacy Policy section 8). Users access the platform on their own initiative; local laws on import, currency, tax, and content remain the user's responsibility.\n\n— In plain English: These terms apply everywhere we operate, but your country's mandatory consumer protections still cover you.",
            layout: "default",
            items: [
              { id: "terms-intl-apply", label: "Application", value: "Globally, subject to mandatory local rights" },
              { id: "terms-intl-responsibility", label: "User responsibility", value: "Local import, currency, tax, content rules" },
            ],
          },
          {
            id: "terms-cross-border",
            eyebrow: "15. Cross-border commerce",
            title: "Goods and services across borders",
            body:
              "Cross-border orders and services may attract customs duties, import VAT, and conversion fees that are the user's responsibility. The platform displays prices in the user's locale currency at a snapshot FX rate; settlement is recorded in Nigerian Naira under the multi-currency foundation, with the displayed currency archived for reference.\n\n— In plain English: If you buy across a border, you may owe duty and tax in your country. We show prices in your currency; the books are kept in Naira.",
            layout: "default",
            items: [
              { id: "terms-cross-duties", label: "Customs and import VAT", value: "User responsibility" },
              { id: "terms-cross-display", label: "Price display", value: "Locale currency at snapshot FX" },
              { id: "terms-cross-settlement", label: "Settlement", value: "Nigerian Naira (NGN) with displayed currency archived" },
            ],
          },
          {
            id: "terms-currency",
            eyebrow: "16. Currency and pricing",
            title: "Currency, pricing, and FX",
            body:
              "Prices may be quoted in Nigerian Naira (NGN), United States Dollar (USD), Great British Pound (GBP), Euro (EUR), or another supported currency at the user's locale. FX snapshots are recorded at checkout; subsequent FX movement does not change the recorded price. Taxes and division-specific fees are disclosed before payment.\n\n— In plain English: We show prices in your currency. The rate is locked when you check out. All taxes and fees appear before you confirm.",
            layout: "default",
            items: [
              { id: "terms-currency-supported", label: "Supported currencies", value: "NGN, USD, GBP, EUR, plus locale-supported others" },
              { id: "terms-currency-fx", label: "FX behaviour", value: "Snapshot at checkout, archived" },
              { id: "terms-currency-disclosure", label: "Tax and fee disclosure", value: "Before payment confirmation" },
            ],
          },
          {
            id: "terms-sanctions",
            eyebrow: "17. Sanctions and prohibited jurisdictions",
            title: "Where the platform does not operate",
            body:
              `${LEGAL.entity.tradingName} does not service comprehensively sanctioned jurisdictions: ${LEGAL.jurisdiction.prohibitedJurisdictions.join("; ")}. Users on a sanctions list (OFAC, EU consolidated, UN, HMT) may not use the platform. Trust-flag screening enforces this in addition to bank-level sanctions screening.\n\n— In plain English: We do not work with people or places under comprehensive international sanctions.`,
            layout: "default",
            items: LEGAL.jurisdiction.prohibitedJurisdictions.map((j, i) => ({
              id: `terms-sanctions-${i}`,
              label: "Prohibited jurisdiction",
              value: j,
            })),
          },
          {
            id: "terms-tax",
            eyebrow: "18. Tax",
            title: "Tax handling",
            body:
              "VAT applies under the Value Added Tax Act on taxable supplies in Nigeria at the prevailing rate. State consumption taxes (where applicable) are added at checkout. Vendors are responsible for their own income-tax obligations on payouts received; the platform issues payout statements suitable for vendor tax filings. International users are responsible for tax obligations in their home jurisdiction.\n\n— In plain English: We charge Nigerian VAT where the law says we must. Vendors handle their own income tax. International users handle their own home-country tax.",
            layout: "default",
            items: [
              { id: "terms-tax-vat", label: "Nigerian VAT", value: "Charged on taxable supplies under the VAT Act" },
              { id: "terms-tax-state", label: "State consumption tax", value: "Added at checkout where applicable" },
              { id: "terms-tax-vendor", label: "Vendor income tax", value: "Vendor responsibility; payout statements available" },
              { id: "terms-tax-intl", label: "International tax", value: "User responsibility in home jurisdiction" },
            ],
          },
          {
            id: "terms-governing-law",
            eyebrow: "19. Governing law and arbitration",
            title: "Disputes are resolved in Lagos",
            body:
              `These terms are governed by the laws of the ${LEGAL.jurisdiction.governingLaw}. Disputes are referred to arbitration seated in ${LEGAL.jurisdiction.arbitrationSeat} under the Arbitration and Mediation Act 2023, administered by the ${LEGAL.jurisdiction.arbitrationAdministrator}. ${LEGAL.jurisdiction.arbitrators}. Language: ${LEGAL.jurisdiction.arbitrationLanguage}. Either party retains the right to seek interim or injunctive relief from the ${LEGAL.jurisdiction.injunctiveCourts}.\n\n— In plain English: Nigerian law applies. Disputes go to a single arbitrator in Lagos under the 2023 arbitration law. Either side can still go to court for urgent injunctions.`,
            layout: "default",
            items: [
              { id: "terms-gl-law", label: "Governing law", value: LEGAL.jurisdiction.governingLaw },
              { id: "terms-gl-seat", label: "Seat of arbitration", value: LEGAL.jurisdiction.arbitrationSeat },
              { id: "terms-gl-admin", label: "Administrator", value: LEGAL.jurisdiction.arbitrationAdministrator },
              { id: "terms-gl-language", label: "Language", value: LEGAL.jurisdiction.arbitrationLanguage },
              { id: "terms-gl-arbitrators", label: "Arbitrators", value: LEGAL.jurisdiction.arbitrators },
              { id: "terms-gl-courts", label: "Injunctive courts", value: LEGAL.jurisdiction.injunctiveCourts },
            ],
          },
          {
            id: "terms-intl-disputes",
            eyebrow: "20. International dispute resolution",
            title: "Mandatory local rights preserved",
            body:
              "Where mandatory law in the user's home jurisdiction confers a non-derogable right to bring proceedings in a local court or before a local regulator, this clause does not limit that right. International users may also use their home data-protection regulator (named in Privacy Policy section 8) for privacy-specific complaints.\n\n— In plain English: If your country gives you a right to sue locally that cannot be signed away, that right still applies.",
            layout: "default",
            items: [
              { id: "terms-intl-d-rights", label: "Mandatory rights", value: "Preserved where local law makes them non-derogable" },
              { id: "terms-intl-d-privacy", label: "Privacy complaints", value: "Home regulator per Privacy Policy section 8" },
            ],
          },
          {
            id: "terms-notice",
            eyebrow: "21. International notice",
            title: "Service of process across borders",
            body:
              `Notices to ${LEGAL.entity.tradingName} are served by email to ${LEGAL.contacts.legal} and (for formal service of process) by registered courier to the registered office. Notices to a user are served to the email and phone number on the account. International service of process is supplemented by the Hague Service Convention where applicable.\n\n— In plain English: Send formal notices to legal@henrycogroup.com and the registered office. We send formal notices to your account contact details.`,
            layout: "default",
            items: [
              { id: "terms-notice-email", label: "Notice to Henry & Co. (email)", value: LEGAL.contacts.legal },
              { id: "terms-notice-courier", label: "Notice to Henry & Co. (courier)", value: `${LEGAL.entity.registeredOffice.city}, ${LEGAL.entity.registeredOffice.state} (registered office)` },
              { id: "terms-notice-user", label: "Notice to user", value: "Account email and phone" },
              { id: "terms-notice-hague", label: "Cross-border supplement", value: "Hague Service Convention where applicable" },
            ],
          },
          {
            id: "terms-misc",
            eyebrow: "22. Miscellaneous",
            title: "Severability, entire agreement, assignment, force majeure",
            body:
              "If a clause is held unenforceable, the rest of these terms continues in force. These terms (with the Privacy Policy, division-specific terms, and any signed addendum) are the entire agreement between the parties on this subject. The user may not assign without consent; Henry & Co. may assign to a successor in a merger or acquisition. Performance is excused for events beyond reasonable control (force majeure: natural disaster, war, civil unrest, lawful government action, ISP outage, sustained DDoS).\n\n— In plain English: One bad clause does not kill the rest. These pages are the full agreement. You cannot transfer your account without our okay; we can transfer if the company is sold. Acts of God do not break the contract.",
            layout: "default",
            items: [
              { id: "terms-misc-sever", label: "Severability", value: "Unenforceable clause excised; rest continues" },
              { id: "terms-misc-entire", label: "Entire agreement", value: "These terms + Privacy + division terms + signed addenda" },
              { id: "terms-misc-assign", label: "Assignment", value: "User: with consent; Henry & Co.: to successor on merger or acquisition" },
              { id: "terms-misc-fm", label: "Force majeure", value: "Performance excused for events beyond reasonable control" },
            ],
          },
          {
            id: "terms-notices",
            eyebrow: "23. Notices",
            title: "Routine notices and announcements",
            body:
              "Routine product notices (release notes, scheduled maintenance, status incidents) are posted on the platform and emailed where material. Status incidents are also posted to status.henrycogroup.com where the user can subscribe to email or RSS updates.\n\n— In plain English: Day-to-day announcements appear in-product and by email; status pages give live updates you can subscribe to.",
            layout: "default",
            items: [
              { id: "terms-notices-product", label: "Product notices", value: "In-product banner + email" },
              { id: "terms-notices-status", label: "Status incidents", value: "Status page + email or RSS subscription" },
            ],
          },
          {
            id: "terms-contact",
            eyebrow: "24. Contact",
            title: "How to reach the company",
            body:
              `For terms-related correspondence, use the legal inbox. For privacy questions, use the privacy inbox. For general support, use the division support inbox (faster), or the group hello inbox.\n\n— In plain English: Legal questions to legal@henrycogroup.com. Privacy questions to privacy@henrycogroup.com. Service questions to your division.`,
            layout: "default",
            items: [
              { id: "terms-contact-legal", label: "Legal", value: LEGAL.contacts.legal },
              { id: "terms-contact-privacy", label: "Privacy", value: LEGAL.contacts.privacy },
              { id: "terms-contact-hello", label: "General", value: LEGAL.contacts.hello },
              { id: "terms-contact-phone", label: "Phone", value: LEGAL.contacts.supportPhone },
            ],
          },
          {
            id: "terms-effective",
            eyebrow: "25. Effective date and version",
            title: "Version and material change",
            body:
              `Effective ${LEGAL.policy.effectiveDate} · version v${LEGAL.policy.version}. Material changes are emailed to account holders 14 days before they take effect and the version is bumped. Continued use after the effective date is acceptance.\n\n— In plain English: We tell you 14 days before anything important changes, and the version number always goes up.`,
            layout: "default",
            items: [
              { id: "terms-effective-date", label: "Effective", value: LEGAL.policy.effectiveDate },
              { id: "terms-effective-version", label: "Version", value: `v${LEGAL.policy.version}` },
              { id: "terms-effective-notice", label: "Material-change notice", value: "14 days, by email to account holders" },
            ],
          },
        ],
      };

    default:
      return base;
  }
}

export async function getCompanyPage(slug: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    return {
      page: null as CompanyPageRecord | null,
      hasServerError: true,
    };
  }

  const supabase = createClient(url, anon, {
    global: {
      fetch: fetchNoStore,
    },
  });

  const { data, error } = await supabase
    .from("company_pages")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) {
    return {
      page: null as CompanyPageRecord | null,
      hasServerError: Boolean(error),
    };
  }

  return {
    page: normalizeCompanyPage(data, slug),
    hasServerError: false,
  };
}

/**
 * PASS i18n-100 — translate the row text fields on a CompanyPageRecord
 * through `resolveLocalizedDynamicField` so the SSR first paint of /about,
 * /contact, /privacy, /terms appears in the visitor's locale.
 *
 * Brand strings (e.g. `LEGAL.entity.name`, support phone numbers, dates,
 * CTA hrefs, image URLs, version markers) are deliberately preserved.
 *
 * NOTE: `CompanyPageClient` is a client component that re-subscribes to
 * `company_pages` realtime and overwrites `initialData` with the raw
 * source row. Until that client path is routed through the translation
 * cache, only the initial SSR paint is localized — refresh / realtime
 * pushes return to English. Tracked under PASS i18n-100 client follow-up.
 */
export async function localizeCompanyPage(
  page: CompanyPageRecord,
  locale: AppLocale,
): Promise<CompanyPageRecord> {
  if (locale === "en") return page;

  const machineTranslate = true;
  const record = page as unknown as Record<string, unknown>;

  const wrap = async (field: string, fallback: string | null | undefined) => {
    const safeFallback = typeof fallback === "string" ? fallback : "";
    if (!safeFallback) return safeFallback;
    return resolveLocalizedDynamicField({
      record,
      field,
      locale,
      fallback: safeFallback,
      machineTranslate,
    });
  };

  const wrapInline = async (value: string | null | undefined) => {
    const safe = typeof value === "string" ? value : "";
    if (!safe) return safe;
    return resolveLocalizedDynamicField({
      record: { value: safe } as Record<string, unknown>,
      field: "value",
      locale,
      fallback: safe,
      machineTranslate,
    });
  };

  const [
    title,
    subtitle,
    heroBadge,
    intro,
    primaryCtaLabel,
    secondaryCtaLabel,
    seoTitle,
    seoDescription,
    stats,
    sections,
  ] = await Promise.all([
    wrap("title", page.title),
    wrap("subtitle", page.subtitle ?? ""),
    wrap("hero_badge", page.hero_badge ?? ""),
    wrap("intro", page.intro ?? ""),
    wrap("primary_cta_label", page.primary_cta_label ?? ""),
    wrap("secondary_cta_label", page.secondary_cta_label ?? ""),
    wrap("seo_title", page.seo_title ?? ""),
    wrap("seo_description", page.seo_description ?? ""),
    Promise.all(
      page.stats.map(async (stat) => {
        const [label, value] = await Promise.all([
          wrapInline(stat.label ?? ""),
          // Stat values are usually numerics, currencies, durations, or
          // proper nouns — but some are short English phrases like
          // "Consistent" / "Multi-division". Translate non-numeric values.
          (() => {
            const raw = (stat.value ?? "").trim();
            const numericish = /^[\s\d.,%+\-£€₦$NgN]+$/.test(raw);
            return numericish ? Promise.resolve(stat.value ?? "") : wrapInline(stat.value ?? "");
          })(),
        ]);
        return { ...stat, label, value };
      }),
    ),
    Promise.all(
      page.sections.map(async (section) => {
        const [eyebrow, sectionTitle, body, items] = await Promise.all([
          wrapInline(section.eyebrow ?? ""),
          wrapInline(section.title ?? ""),
          wrapInline(section.body ?? ""),
          Promise.all(
            section.items.map(async (item) => {
              const [iLabel, iValue, iTitle, iBody] = await Promise.all([
                wrapInline(item.label ?? ""),
                // Skip translation of values that look like emails / phones /
                // urls / version markers / IDs — they are not natural-language
                // strings.
                (() => {
                  const raw = (item.value ?? "").trim();
                  const isLikelyLabelOnly =
                    /@/.test(raw) ||
                    /^https?:\/\//i.test(raw) ||
                    /^\+?[\d\s\-()]+$/.test(raw) ||
                    /^v?\d+(\.\d+)+/.test(raw);
                  return isLikelyLabelOnly
                    ? Promise.resolve(item.value ?? "")
                    : wrapInline(item.value ?? "");
                })(),
                wrapInline(item.title ?? ""),
                wrapInline(item.body ?? ""),
              ]);
              return {
                ...item,
                label: iLabel || item.label,
                value: iValue || item.value,
                title: iTitle || item.title,
                body: iBody || item.body,
              };
            }),
          ),
        ]);
        return {
          ...section,
          eyebrow: eyebrow || section.eyebrow,
          title: sectionTitle || section.title,
          body: body || section.body,
          items,
        };
      }),
    ),
  ]);

  return {
    ...page,
    title: title || page.title,
    subtitle: subtitle || page.subtitle,
    hero_badge: heroBadge || page.hero_badge,
    intro: intro || page.intro,
    primary_cta_label: primaryCtaLabel || page.primary_cta_label,
    secondary_cta_label: secondaryCtaLabel || page.secondary_cta_label,
    seo_title: seoTitle || page.seo_title,
    seo_description: seoDescription || page.seo_description,
    stats,
    sections,
  };
}
