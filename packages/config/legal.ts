/**
 * LEGAL — single typed source of truth for every entity identity, contact, and
 * jurisdictional fact rendered into HenryCo's public-facing legal surfaces
 * (/about, /privacy, /terms, branded-documents legal blocks). V3 PASS 21 polish
 * layer (A0c §"grounded company") centralized these so a CAC re-registration,
 * RC number change, or registered office move is one edit — not a hunt across
 * three pages, six branded documents, and a dozen seed migrations.
 *
 * Owner-confirmable values are intentionally marked `[OWNER-TO-CONFIRM: ...]`
 * so anyone reading the rendered page knows it is awaiting verification rather
 * than treating a placeholder as a published fact. The premium-bar rubric
 * forbids inventing entity facts.
 *
 * Sources of truth:
 *   - Group support phone, base domain, group mission: `packages/config/company.ts`
 *   - Group inboxes (privacy, legal, dpo, hello): `packages/config/brand-emails.ts`
 *   - Governing law + arbitration seat: this file (Federal Republic of Nigeria
 *     / Lagos / Arbitration and Mediation Act 2023 / ICAMA).
 */

import { BRAND_EMAILS } from "./brand-emails";
import { COMPANY } from "./company";

export type LegalAddress = {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
};

export type LegalEntity = {
  /** Registered company name per Corporate Affairs Commission (CAC). */
  name: string;
  /** Trading / brand name used on consumer-facing surfaces. */
  tradingName: string;
  /** CAC Registration Certificate number (RC number). */
  rcNumber: string;
  /** Registered office address used for CAMA service of process. */
  registeredOffice: LegalAddress;
  /** Year the entity was incorporated (used in About + footer copy). */
  yearFounded: string;
  /** Named founder, used on /about and in editorial copy. */
  founder: string;
  /** FIRS Tax Identification Number. */
  tin: string;
  /** Nigeria Data Protection Commission registration reference. */
  ndpcRegistration: string;
  /** Data Protection Officer (named, or "external DPO consulted on material changes"). */
  dpo: string;
};

export type LegalContacts = {
  /** Legal correspondence (notices, IP takedowns, service of process). */
  legal: string;
  /** Privacy / NDPA data-subject-rights requests. */
  privacy: string;
  /** Data Protection Officer direct line. */
  dpo: string;
  /** General hello/support inbox. */
  hello: string;
  /** Group support phone (E.164). */
  supportPhone: string;
};

export type LegalJurisdiction = {
  /** Governing law for the platform terms. */
  governingLaw: string;
  /** Seat of arbitration under Arbitration and Mediation Act 2023. */
  arbitrationSeat: string;
  /** Arbitration administrator / institution. */
  arbitrationAdministrator: string;
  /** Arbitration language. */
  arbitrationLanguage: string;
  /** Number of arbitrators. */
  arbitrators: string;
  /** Courts retaining injunctive-relief jurisdiction. */
  injunctiveCourts: string;
  /**
   * Comprehensively-sanctioned jurisdictions HenryCo does not service.
   * The list mirrors current OFAC + EU + UNSC comprehensive sanctions. Updated
   * by editorial review, not by code.
   */
  prohibitedJurisdictions: readonly string[];
};

/**
 * NDPA 2023 lawful bases mapped to typical HenryCo data flows. Used by /privacy
 * §"lawful bases" so each user-facing claim cites the basis explicitly rather
 * than the rubric-banned "in accordance with applicable law".
 */
export const NDPA_LAWFUL_BASES = [
  {
    key: "consent",
    label: "Consent",
    statute: "NDPA 2023 §25(1)(a)",
    examples: "Newsletter signup, WhatsApp opt-in, marketing push notifications, optional analytics cookies.",
  },
  {
    key: "contract",
    label: "Performance of a contract",
    statute: "NDPA 2023 §25(1)(b)",
    examples: "Order fulfilment, logistics pickup, care booking, studio milestones, learn enrolment, property viewing coordination.",
  },
  {
    key: "legal-obligation",
    label: "Compliance with a legal obligation",
    statute: "NDPA 2023 §25(1)(c)",
    examples: "KYC under CBN AML/CFT Regulations, transaction records under CITN/CAMA, audit-log retention under CBN guidance.",
  },
  {
    key: "vital-interests",
    label: "Vital interests of the data subject or another person",
    statute: "NDPA 2023 §25(1)(d)",
    examples: "Emergency contact in safety-critical incidents during logistics dispatch or care home visits.",
  },
  {
    key: "public-interest",
    label: "Task carried out in the public interest",
    statute: "NDPA 2023 §25(1)(e)",
    examples: "Fraud-prevention signals shared with FCCPC or NDPC on lawful request.",
  },
  {
    key: "legitimate-interests",
    label: "Legitimate interests pursued by HenryCo or a third party",
    statute: "NDPA 2023 §25(1)(f)",
    examples: "Trust scoring, device-risk signals, abuse prevention, service security — each balanced against the data subject's rights.",
  },
] as const;

/**
 * Categories of personal data collected, paired one-to-one with their purposes
 * and lawful bases. The /privacy page renders this list verbatim so the
 * rubric's reject-list phrases ("may collect", "we take privacy seriously")
 * stay out of the published copy.
 */
export const DATA_CATEGORIES = [
  {
    key: "identity",
    label: "Identity",
    items: "Full name, date of birth, nationality, photograph",
    purpose: "Account creation, KYC verification, signed-document attribution.",
    basis: "Contract (§25(1)(b)); legal obligation for KYC (§25(1)(c)).",
  },
  {
    key: "contact",
    label: "Contact",
    items: "Email address, phone number, postal address",
    purpose: "Order updates, support correspondence, delivery, statutory notices.",
    basis: "Contract (§25(1)(b)); legitimate interests for security-critical notifications (§25(1)(f)).",
  },
  {
    key: "kyc",
    label: "KYC and identity verification",
    items: "NIN, BVN, government-ID image, selfie liveness, address proof",
    purpose: "AML/CFT screening, payout eligibility, fraud prevention.",
    basis: "Legal obligation under CBN AML/CFT Regulations and Money Laundering (Prevention and Prohibition) Act 2022 (§25(1)(c)).",
  },
  {
    key: "financial",
    label: "Financial",
    items: "Bank account, payment-method token (processed by our PCI-compliant payment processor; HenryCo does not store full card numbers), payout history, wallet balance, invoices",
    purpose: "Order settlement, vendor payout, refund processing, tax reporting.",
    basis: "Contract (§25(1)(b)); legal obligation for tax records (§25(1)(c)).",
  },
  {
    key: "transaction",
    label: "Transaction",
    items: "Order content, line items, shipping addresses, dispatch and proof-of-delivery records, ratings",
    purpose: "Fulfilment, dispute resolution, performance analytics within a tenant.",
    basis: "Contract (§25(1)(b)); legitimate interests for analytics (§25(1)(f)).",
  },
  {
    key: "content",
    label: "User content",
    items: "Support messages, hiring messages, studio briefs and assets, listing photos, proof-of-delivery photos, claim evidence, audio and video from booked sessions (recorded only with explicit consent screen)",
    purpose: "Service delivery, dispute evidence, training data only with explicit opt-in.",
    basis: "Contract (§25(1)(b)); consent for recordings (§25(1)(a)); legitimate interests for dispute evidence (§25(1)(f)).",
  },
  {
    key: "behavioural",
    label: "Behavioural and engagement",
    items: "Page views, search queries, click paths, time-on-task, conversion events",
    purpose: "Service improvement, A/B testing, fraud signals.",
    basis: "Legitimate interests (§25(1)(f)); consent where analytics cookies are non-essential (§25(1)(a)).",
  },
  {
    key: "device",
    label: "Device and technical",
    items: "IP address, browser, OS, device identifier, device-risk visitor ID, locale",
    purpose: "Session security, abuse prevention, trust scoring.",
    basis: "Legitimate interests (§25(1)(f)).",
  },
  {
    key: "communication-metadata",
    label: "Communication metadata",
    items: "Email open/click events, WhatsApp delivery receipts, push-notification delivery, support-ticket timestamps",
    purpose: "Deliverability, SLA tracking, opt-out enforcement.",
    basis: "Legitimate interests (§25(1)(f)); contract for transactional notifications (§25(1)(b)).",
  },
  {
    key: "inferred",
    label: "Inferred",
    items: "Trust score, risk flags, vendor performance bands, learner skill maps",
    purpose: "Fraud prevention, marketplace ranking, certification eligibility.",
    basis: "Legitimate interests (§25(1)(f)); contract for ranking (§25(1)(b)).",
  },
] as const;

/**
 * Sub-processors who receive personal data on HenryCo's behalf. The list is
 * named in /privacy so the rubric-banned "third-party service providers"
 * never appears in published copy. Editorial review owns updates here.
 *
 * SECURITY STANDARD (V3-PUBLIC-HARDENING-01): name + functional purpose +
 * country/continent-level region ONLY. Never re-add architecture detail —
 * no data-centre zones (us-east, Frankfurt), no infra topology (serverless,
 * edge, CDN, realtime, self-hosted), no security-posture brags (PCI DSS
 * Level 1). Coarse region is kept for cross-border transfer transparency;
 * the reconnaissance detail is not. Vendor names live ONLY here, never on
 * marketing surfaces. See docs/v3/public-voice-and-security.md.
 */
export const SUB_PROCESSORS = [
  { name: "Supabase", purpose: "Database, authentication, and file storage", region: "European Union and United States" },
  { name: "Vercel", purpose: "Application hosting", region: "European Union and United States" },
  { name: "Cloudinary", purpose: "Image storage and delivery", region: "Global" },
  { name: "Stripe", purpose: "Card and bank payment processing", region: "United States" },
  { name: "Resend", purpose: "Transactional email delivery", region: "United States" },
  { name: "Brevo", purpose: "Editorial and newsletter email delivery", region: "European Union" },
  { name: "Sentry", purpose: "Application error monitoring", region: "United States" },
  { name: "OneSignal", purpose: "Push notification delivery", region: "United States" },
  { name: "Daily.co", purpose: "Video and voice calls for studio and jobs interviews", region: "United States" },
  { name: "SignWell", purpose: "Electronic signature for contracts and proposals", region: "United States" },
  { name: "FingerprintJS", purpose: "Device-risk and abuse signals", region: "United States and European Union" },
  { name: "DeepL", purpose: "Translation services", region: "European Union" },
  { name: "Twilio", purpose: "SMS notifications", region: "United States" },
  { name: "Mapbox", purpose: "Mapping and routing for logistics and property", region: "United States" },
  { name: "Typesense", purpose: "Search index", region: "European Union" },
  { name: "Meta WhatsApp Business", purpose: "WhatsApp messaging for support and order updates", region: "Global" },
  { name: "Google Places + Calendar", purpose: "Address autocomplete and booking calendar sync", region: "United States and European Union" },
  { name: "Freshdesk and inbound email", purpose: "Support-ticket intake and routing", region: "United States and India" },
] as const;

/**
 * Retention windows tied to the statute that drives them. Concrete numbers
 * only — the rubric rejects "from time to time" and "as long as necessary"
 * as evasions.
 */
export const RETENTION_POLICIES = [
  { category: "KYC documents (NIN, BVN, ID images, selfie)", window: "5 years after account closure", statute: "CBN AML/CFT Regulations 2022" },
  { category: "Transaction records (orders, invoices, payouts)", window: "7 years after transaction close", statute: "CAMA 2020 and CITN guidance" },
  { category: "Support correspondence", window: "3 years after ticket close", statute: "FCCPA 2018 dispute window" },
  { category: "Audit log (admin and staff actions)", window: "7 years", statute: "CBN cyber-resilience guidance" },
  { category: "Cookies (analytics)", window: "13 months", statute: "NDPA 2023 cookie guidance + GDPR e-Privacy alignment" },
  { category: "Marketing engagement data after consent withdrawal", window: "90 days suppression only, then deleted", statute: "NDPA 2023 §37" },
  { category: "Account profile after deletion request", window: "30 days soft-delete window, then permanent erasure subject to legal-hold exceptions", statute: "NDPA 2023 §36" },
] as const;

/**
 * International data-protection authorities recognized for cross-border data
 * subjects. Used in /privacy §"international users" and /terms §"international
 * dispute resolution". Each row pairs the regulator with the right route.
 */
export const INTERNATIONAL_AUTHORITIES = [
  { jurisdiction: "Nigeria", framework: "NDPA 2023", regulator: "Nigeria Data Protection Commission (NDPC)", contact: "complaints@ndpc.gov.ng" },
  { jurisdiction: "European Union and EEA", framework: "GDPR (Regulation 2016/679)", regulator: "Your national supervisory authority", contact: "https://edpb.europa.eu/about-edpb/about-edpb/members_en" },
  { jurisdiction: "United Kingdom", framework: "UK GDPR + Data Protection Act 2018", regulator: "Information Commissioner's Office (ICO)", contact: "https://ico.org.uk/make-a-complaint/" },
  { jurisdiction: "California, United States", framework: "CCPA/CPRA", regulator: "California Privacy Protection Agency (CPPA)", contact: "https://cppa.ca.gov/" },
  { jurisdiction: "Brazil", framework: "LGPD (Lei nº 13.709/2018)", regulator: "Autoridade Nacional de Proteção de Dados (ANPD)", contact: "https://www.gov.br/anpd/" },
  { jurisdiction: "South Africa", framework: "POPIA", regulator: "Information Regulator (South Africa)", contact: "complaints.IR@justice.gov.za" },
  { jurisdiction: "Kenya", framework: "Data Protection Act 2019", regulator: "Office of the Data Protection Commissioner (ODPC)", contact: "info@odpc.go.ke" },
  { jurisdiction: "Ghana", framework: "Data Protection Act 2012", regulator: "Data Protection Commission Ghana", contact: "info@dataprotection.org.gh" },
  { jurisdiction: "Singapore", framework: "PDPA 2012", regulator: "Personal Data Protection Commission (PDPC)", contact: "https://www.pdpc.gov.sg/" },
  { jurisdiction: "Canada", framework: "PIPEDA", regulator: "Office of the Privacy Commissioner of Canada (OPC)", contact: "https://www.priv.gc.ca/" },
  { jurisdiction: "Australia", framework: "Privacy Act 1988", regulator: "Office of the Australian Information Commissioner (OAIC)", contact: "https://www.oaic.gov.au/" },
] as const;

export const LEGAL = {
  entity: {
    name: COMPANY.group.legalName,
    tradingName: COMPANY.group.name,
    // All entity facts below are taken from the official CAC records for HENRY
    // ONYX LIMITED (Certificate of Incorporation + Status Report, dated
    // 2026-06-05; owner-supplied 2026-06-07, V3-18). Incorporated under CAMA 2020
    // as a private company limited by shares.
    rcNumber: "9594234",
    registeredOffice: {
      // CAC Status Report registered address: "001, AIRPORT ROAD, EMENE, ENUGU
      // STATE, NIGERIA" (Post Code: NIL). The document template adds the "RC "
      // prefix etc.; these stay the bare registry values.
      street: "001 Airport Road",
      city: "Emene",
      state: "Enugu State",
      country: "Nigeria",
      postalCode: "",
    },
    yearFounded: "2026",
    founder: "Henry Chukwuemeka",
    tin: "2621481857689",
    ndpcRegistration: "[OWNER-TO-CONFIRM: NDPC registration reference]",
    dpo: "[OWNER-TO-CONFIRM: DPO name + email + phone, or 'External DPO consulted on material changes']",
  } satisfies LegalEntity,

  contacts: {
    legal: BRAND_EMAILS.legal,
    privacy: BRAND_EMAILS.privacy,
    dpo: BRAND_EMAILS.dpo,
    hello: BRAND_EMAILS.hello,
    supportPhone: COMPANY.group.supportPhone,
  } satisfies LegalContacts,

  jurisdiction: {
    governingLaw: "Federal Republic of Nigeria",
    arbitrationSeat: "Lagos, Nigeria",
    arbitrationAdministrator: "Lagos Court of Arbitration (LCA) or Lagos Multi-Door Courthouse",
    arbitrationLanguage: "English",
    arbitrators: "One (single arbitrator)",
    injunctiveCourts: "Courts of Lagos State and the Federal High Court of Nigeria",
    prohibitedJurisdictions: [
      "Cuba",
      "Iran",
      "North Korea (DPRK)",
      "Syria",
      "Non-government-controlled areas of Ukraine (Crimea, Donetsk, Luhansk, Kherson, Zaporizhzhia)",
    ],
  } satisfies LegalJurisdiction,

  /**
   * Effective date and version pill rendered into hero metadata of /privacy
   * and /terms. Bump `version` on material change; the rubric requires the
   * material-change email + continued-use acceptance flow on bump.
   */
  policy: {
    effectiveDate: "2026-05-14",
    version: "1.0",
    canonicalLanguage: "English",
    supportedLocales: 11,
  },
} as const;

export type LegalRegistry = typeof LEGAL;
