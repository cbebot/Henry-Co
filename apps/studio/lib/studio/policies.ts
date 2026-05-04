// Real, substantive HenryCo Studio governance copy. These are the
// agreements every Studio engagement runs against. They are written
// against Nigerian operating context (NDPA, naira pricing, bank-transfer
// settlement) and the actual milestone discipline shipped in the
// platform — they are not templates copy-pasted from elsewhere.
//
// IMPORTANT: This file is the single source of truth for policy copy.
// Treat any update as a contract amendment — bump the `lastUpdated` field
// and let legal review changes before publishing.

export type PolicyClause = {
  heading: string;
  body: string[];
  bullets?: string[];
};

export type PolicyDocument = {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  intent: string;
  lastUpdated: string;
  effectiveFrom: string;
  governingLaw: string;
  clauses: PolicyClause[];
};

const COMPANY_NAME = "HenryCo Studio";
const PARENT = "Henry & Co. Group Ltd.";
const SUPPORT_EMAIL = "studio@henrycogroup.com";
const FINANCE_EMAIL = "finance@henrycogroup.com";
const PRIVACY_EMAIL = "privacy@henrycogroup.com";

export const studioPolicyIndex: PolicyDocument[] = [
  // ─────────────────────────────────────────────────────────────────
  {
    slug: "terms",
    title: "Terms of Engagement",
    shortTitle: "Terms",
    description:
      "The agreement that governs every Studio project — scope, payments, ownership, change control, and termination.",
    intent:
      "These terms describe how HenryCo Studio engages with a client across a project lifecycle. They apply to every reservation, proposal, milestone, deliverable, and final handover unless the parties sign a separate written agreement that supersedes them.",
    lastUpdated: "2026-05-03",
    effectiveFrom: "2026-05-03",
    governingLaw: "Federal Republic of Nigeria",
    clauses: [
      {
        heading: "1. Parties and scope",
        body: [
          `These Terms of Engagement (the "Terms") form a binding agreement between you, the client (the "Client"), and ${COMPANY_NAME}, a division of ${PARENT} ("HenryCo Studio", "we", "us", "our"). The Terms apply to every Studio engagement initiated through studio.henrycogroup.com — whether that engagement begins as a template reservation, an accepted proposal, or a custom brief.`,
          "By reserving a template, accepting a proposal, paying a deposit, uploading proof of payment, or otherwise instructing us to begin work, the Client confirms they have authority to enter this agreement on behalf of the named business and accepts these Terms in full.",
        ],
      },
      {
        heading: "2. Project lifecycle",
        body: [
          "Every Studio engagement runs through a defined sequence: brief or template selection, proposal acceptance, deposit, kickoff, milestone delivery, milestone approval, balance payment, and handover. Each stage is recorded in the Client's portal at studio.henrycogroup.com/client and is the canonical record of what was agreed and what has happened.",
        ],
      },
      {
        heading: "3. Pricing and currency",
        body: [
          "Pricing is quoted in Nigerian naira (NGN) and stored in kobo (1 NGN = 100 kobo) to avoid float arithmetic. Where a quote includes a foreign-currency reference, the naira figure is the authoritative price. We do not pass along bank or settlement charges — what you see on the invoice is what you pay.",
        ],
        bullets: [
          "Template reservations are fixed-price; the deposit and balance figures shown on the template page are final.",
          "Custom proposals are itemised and milestone-priced; the proposal sets the price in writing.",
          "Out-of-scope work is quoted as a written change order before any additional charge.",
        ],
      },
      {
        heading: "4. Deposits, balances, and milestone gating",
        body: [
          "A deposit confirms the engagement and reserves the build slot. Work begins after the deposit is verified. Balance payments are tied to milestones: each milestone is delivered, the Client has the review window described in clause 6 to approve or request revisions, and the milestone payment is due before the next milestone begins.",
          "Final handover — including transfer of intellectual property under clause 8 — happens only after the final balance payment is verified.",
        ],
      },
      {
        heading: "5. Payment methods",
        body: [
          `Bank transfer to the verified ${PARENT} corporate account is the active payment method. Card and online-gateway payments may be added in the future and will be announced in writing. Payment proof — bank receipt, debit alert, or statement — must be uploaded inside the Client portal so finance can verify against the invoice reference.`,
          "We do not accept cash, cheque, gift card, or cryptocurrency. We do not accept payment via personal accounts or alternative aliases of HenryCo staff. If anyone, internal or external, asks you to pay outside the verified company account, treat it as fraud and contact finance immediately.",
        ],
      },
      {
        heading: "6. Review and approval window",
        body: [
          "When a milestone is shared as ready for review, the Client has five (5) working days to approve, reject, or request specific revisions through the portal. If no response is received within the window, the milestone is treated as approved by silence and the engagement advances. Active feedback resets the window for the affected scope only — it does not pause unrelated work.",
        ],
      },
      {
        heading: "7. Change requests and revisions",
        body: [
          "Each milestone includes a fixed number of revision rounds defined in the proposal. Revisions inside that quota happen at no additional cost. Revisions beyond the quota, or requests that change scope, are handled as change orders — quoted in writing, approved before execution, and billed as a new milestone.",
        ],
      },
      {
        heading: "8. Intellectual property and licences",
        body: [
          "Until the final balance is verified, all working files, designs, code, and intermediate deliverables remain the property of HenryCo Studio under a licence to the Client to review and approve them within this engagement.",
          "On verified final payment, all custom work product (visual designs, copy, code we wrote, deliverable files) transfers to the Client. Pre-existing tools, libraries, frameworks, and any HenryCo internal components remain ours but are licensed to the Client perpetually for use within the delivered project.",
          "Third-party assets — fonts, stock imagery, plugins, hosted services — remain governed by their original licences and are listed in the handover document.",
        ],
      },
      {
        heading: "9. Confidentiality",
        body: [
          "We treat Client materials, internal documents, customer data, and unannounced product information as confidential. Studio staff are bound by internal confidentiality clauses, and we will sign a Client-issued NDA on request before commercially sensitive scope is shared.",
          "Confidentiality survives termination of this agreement.",
        ],
      },
      {
        heading: "10. Termination",
        body: [
          "Either party may terminate by written notice through the portal or by email. Termination by the Client follows the refund schedule in the Refund and Cancellation Policy. Termination by HenryCo Studio for cause (non-payment, abusive conduct, illegality) is immediate and without refund of unused deposit.",
          "On termination, all paid work is delivered; unpaid work is retained.",
        ],
      },
      {
        heading: "11. Limitation of liability",
        body: [
          "Our aggregate liability for any claim arising out of an engagement is capped at the total amount the Client has paid to us under that engagement in the twelve (12) months preceding the claim. We are not liable for indirect, consequential, or speculative losses including lost profits, lost data not under our care, or business interruption.",
          "Nothing in these Terms limits liability for fraud, wilful misconduct, or anything that cannot be limited by Nigerian law.",
        ],
      },
      {
        heading: "12. Governing law and disputes",
        body: [
          "These Terms are governed by the laws of the Federal Republic of Nigeria. Disputes are first raised through the Client portal or to studio@henrycogroup.com. If unresolved within thirty (30) days, the parties submit to mediation in Lagos. Failing mediation, disputes are referred to the courts of Lagos State.",
        ],
      },
      {
        heading: "13. Updates to these Terms",
        body: [
          "We may amend these Terms by posting an updated version on this page and updating the lastUpdated and effectiveFrom dates. Changes do not retroactively affect engagements already underway — those continue under the version of the Terms accepted at engagement start, which is logged in the Client portal.",
        ],
      },
      {
        heading: "14. Contact",
        body: [
          `Engagement questions: ${SUPPORT_EMAIL}`,
          `Billing and finance: ${FINANCE_EMAIL}`,
          `Privacy and data subject requests: ${PRIVACY_EMAIL}`,
        ],
      },
    ],
  },
  // ─────────────────────────────────────────────────────────────────
  {
    slug: "privacy",
    title: "Privacy Policy",
    shortTitle: "Privacy",
    description:
      "How HenryCo Studio collects, uses, stores, and shares personal data — written against the Nigeria Data Protection Act (NDPA) 2023.",
    intent:
      "We collect only what we need to run the engagement, store it inside controlled infrastructure, and delete it when it is no longer required. This policy explains what that means in concrete terms and how to exercise the rights the NDPA gives you.",
    lastUpdated: "2026-05-03",
    effectiveFrom: "2026-05-03",
    governingLaw: "Federal Republic of Nigeria · Nigeria Data Protection Act (NDPA) 2023",
    clauses: [
      {
        heading: "1. Who we are",
        body: [
          `${COMPANY_NAME} (a division of ${PARENT}) is the data controller for personal data processed through studio.henrycogroup.com and the linked Client portal. Our designated privacy contact is ${PRIVACY_EMAIL}.`,
        ],
      },
      {
        heading: "2. Data we collect",
        body: [
          "We collect the minimum personal data required to deliver Studio engagements:",
        ],
        bullets: [
          "Identifiers: name, business name, email address, phone or WhatsApp number.",
          "Engagement data: brief content, references, brand assets, project files, and message history.",
          "Financial data: invoice records, bank reference numbers, and payment proof images you upload. We do not store full bank account numbers beyond what appears on uploaded proof.",
          "Account data: shared HenryCo account identifiers, role memberships, sign-in events.",
          "Technical data: IP address, browser fingerprint at sign-in, device type, time-zone — used for security and abuse prevention.",
        ],
      },
      {
        heading: "3. Why we process it (legal basis under NDPA)",
        body: [
          "We process personal data on the following legal bases under the NDPA 2023:",
        ],
        bullets: [
          "Performance of contract — to deliver the engagement you reserved or commissioned.",
          "Legitimate interests — to keep the Studio platform secure, fight fraud, and improve the service. We balance these interests against your rights.",
          "Legal obligation — to keep finance records for tax and audit purposes.",
          "Consent — for optional things like marketing emails, where consent can be withdrawn at any time.",
        ],
      },
      {
        heading: "4. How we store it",
        body: [
          "Personal data is stored in Supabase (Postgres) hosted in a region appropriate to the workload, with row-level security enforcing that you only ever see your own records. File uploads (brand assets, payment proof, deliverables) are stored in Cloudinary under restricted access. Backups are encrypted at rest.",
          "We use industry-standard encryption in transit (TLS 1.2+) for every page and API call.",
        ],
      },
      {
        heading: "5. Who we share it with",
        body: [
          "We share data only with subprocessors that are contractually bound to process it on our instructions:",
        ],
        bullets: [
          "Supabase — managed Postgres, authentication, realtime.",
          "Cloudinary — encrypted media storage.",
          "Vercel — application hosting and edge delivery.",
          "Postmark / Resend — transactional email delivery.",
          "WhatsApp Cloud API — for engagement updates if you opt in.",
          "Anthropic / OpenAI — never used for personal data; only used for non-personal copy assistance with strict prompt boundaries.",
        ],
      },
      {
        heading: "6. International transfers",
        body: [
          "Some of our subprocessors operate from outside Nigeria. We rely on the NDPA's provisions for international data transfer, including standard contractual clauses where applicable, and we choose providers with strong data-protection programmes.",
        ],
      },
      {
        heading: "7. How long we keep it",
        body: [
          "Engagement records are kept for the life of the project and for seven (7) years after the final invoice — to comply with finance and tax retention requirements. Authentication logs are kept for twenty-four (24) months. Marketing-list opt-ins are kept until you withdraw consent. Once a retention period ends, we delete or fully anonymise the records.",
        ],
      },
      {
        heading: "8. Your rights under the NDPA",
        body: [
          "You have the right to:",
        ],
        bullets: [
          "Access the personal data we hold about you.",
          "Correct inaccurate or incomplete data.",
          "Erase data we no longer have a legal basis to hold (subject to retention periods above).",
          "Restrict or object to certain processing activities.",
          "Receive your data in a portable format.",
          "Withdraw consent for any consent-based processing at any time.",
          "Lodge a complaint with the Nigeria Data Protection Commission (NDPC).",
        ],
      },
      {
        heading: "9. Cookies and tracking",
        body: [
          "We use a minimal set of first-party cookies for authentication, session continuity, and theme preference. We use privacy-respecting analytics that do not assemble cross-site profiles. We do not sell or share data with advertising networks.",
        ],
      },
      {
        heading: "10. Children's data",
        body: [
          "Studio engagements are entered into by businesses, not minors. We do not knowingly process personal data of anyone under eighteen (18). If you believe we have done so by mistake, contact us and we will delete the records.",
        ],
      },
      {
        heading: "11. Security incidents",
        body: [
          "If a personal data breach occurs that is likely to affect your rights, we notify the NDPC within seventy-two (72) hours and notify the affected data subjects without undue delay.",
        ],
      },
      {
        heading: "12. Contact",
        body: [
          `Privacy enquiries and data subject requests: ${PRIVACY_EMAIL}.`,
          "We respond to verified requests within thirty (30) days.",
        ],
      },
    ],
  },
  // ─────────────────────────────────────────────────────────────────
  {
    slug: "refunds",
    title: "Refund and Cancellation Policy",
    shortTitle: "Refunds",
    description:
      "Cancellation windows, refund percentages, and how the milestone-based pipeline determines what is refundable.",
    intent:
      "Refunds protect both sides. We refund what you paid for work that has not yet been done, on a published, predictable schedule. Once work begins on a milestone, the cost of that milestone is committed.",
    lastUpdated: "2026-05-03",
    effectiveFrom: "2026-05-03",
    governingLaw: "Federal Republic of Nigeria",
    clauses: [
      {
        heading: "1. Definitions",
        body: [
          "A 'milestone' is a discrete deliverable described in the proposal and visible in your Client portal. A milestone is 'started' when the assigned team begins working on it, which is recorded as an in_progress status in your portal and emailed to you on transition.",
        ],
      },
      {
        heading: "2. Cooling-off period",
        body: [
          "If you cancel within twenty-four (24) hours of paying the deposit, and before kickoff begins, we refund 100% of the deposit. After kickoff begins (which is recorded with a timestamp on your project), the deposit becomes committed against the kickoff milestone.",
        ],
      },
      {
        heading: "3. Refund schedule for active engagements",
        body: [
          "If you cancel after kickoff has begun, the refund is calculated on a per-milestone basis:",
        ],
        bullets: [
          "Any milestone marked 'complete' or 'approved' is non-refundable.",
          "The current in-progress milestone is non-refundable up to the percentage of effort already invested, with a minimum of 50% retained.",
          "Future milestones not yet started are fully refundable.",
        ],
      },
      {
        heading: "4. Template reservations",
        body: [
          "For template reservations specifically, the deposit reserves a build slot in the team schedule. Cancelling within twenty-four (24) hours of the deposit, before kickoff, is fully refundable. After kickoff, the deposit covers the kickoff and customisation milestone and is non-refundable. Any balance not yet paid is, by definition, not owed.",
        ],
      },
      {
        heading: "5. Refunds for HenryCo-initiated cancellation",
        body: [
          "If we cancel an engagement for any reason other than your material breach, you receive a full refund of any payment made for work not yet delivered, with no per-milestone retention.",
        ],
      },
      {
        heading: "6. How refunds are issued",
        body: [
          "Refunds are paid by bank transfer to the originating account, within ten (10) working days of the cancellation being agreed. We do not refund to a different account or recipient. Currency is naira. Refunds are not paid in cash, gift card, or cryptocurrency.",
        ],
      },
      {
        heading: "7. Disputes",
        body: [
          "If you disagree with a refund calculation, raise it in writing to finance@henrycogroup.com within thirty (30) days. We review the milestone-progress record on your project and respond with a written breakdown. Disputes that cannot be resolved go to mediation as set out in the Terms of Engagement.",
        ],
      },
      {
        heading: "8. Chargebacks",
        body: [
          "Initiating a chargeback or bank dispute on a payment we are still verifying, or on a milestone you have already approved, is treated as a material breach of the Terms of Engagement and may result in immediate cancellation of the engagement with no further refund.",
        ],
      },
      {
        heading: "9. Contact",
        body: [
          `Refund requests: ${FINANCE_EMAIL}.`,
        ],
      },
    ],
  },
  // ─────────────────────────────────────────────────────────────────
  {
    slug: "intellectual-property",
    title: "Intellectual Property and Ownership",
    shortTitle: "IP",
    description:
      "Who owns what across the engagement lifecycle, and how IP transfers on final payment.",
    intent:
      "IP transfer is one of the most consequential clauses in any creative engagement. We make ours simple, in writing, and tied to verified payment.",
    lastUpdated: "2026-05-03",
    effectiveFrom: "2026-05-03",
    governingLaw: "Federal Republic of Nigeria",
    clauses: [
      {
        heading: "1. Pre-existing IP",
        body: [
          "Each party retains ownership of intellectual property they brought into the engagement. The Client owns their brand assets, copy, customer data, and prior IP. HenryCo Studio owns its internal frameworks, design systems, code libraries, tooling, and accumulated know-how.",
        ],
      },
      {
        heading: "2. Custom work product",
        body: [
          "Custom work product includes the visual designs, written copy, code, and deliverable files we produce specifically for the engagement. This work product is licensed to the Client during the engagement to review and approve. On verified final payment, custom work product transfers to the Client outright.",
        ],
      },
      {
        heading: "3. HenryCo retained components",
        body: [
          "Any HenryCo internal component — for example, our shared UI primitives, build tooling, design tokens, or analytics scaffolds — remains our property even when used inside your delivered project. We grant the Client a perpetual, worldwide, royalty-free licence to use these components inside the delivered project, but not to extract them and resell them or use them outside the project.",
        ],
      },
      {
        heading: "4. Third-party assets",
        body: [
          "Third-party assets — fonts, stock imagery, plugins, paid services — are licensed under their original terms. Their licences are listed in the project handover document. The Client is responsible for keeping any subscription-based third-party assets active after handover.",
        ],
      },
      {
        heading: "5. Portfolio rights",
        body: [
          "Unless the Client explicitly opts out in writing before kickoff, HenryCo Studio reserves the right to feature the delivered project in its portfolio, case studies, and marketing materials. Where Client confidentiality requires it, we redact sensitive figures and replace branding before publication.",
        ],
      },
      {
        heading: "6. Source code and access",
        body: [
          "Source code is delivered through a private repository — typically Git — accessible to the Client at handover. Once handover is complete, we revoke our admin access at the Client's request, while retaining a snapshot for warranty support.",
        ],
      },
      {
        heading: "7. Reuse of design ideas",
        body: [
          "Concepts, principles, and aesthetic ideas explored during an engagement remain in our heads and our portfolio of approaches. We do not promise that no future client will arrive at a similar idea — and the Terms of Engagement make clear that ideas, in the abstract, are not exclusive.",
        ],
      },
    ],
  },
  // ─────────────────────────────────────────────────────────────────
  {
    slug: "security",
    title: "Security and Data Protection",
    shortTitle: "Security",
    description:
      "How HenryCo Studio protects data — at rest, in transit, and across the team.",
    intent:
      "Security is treated as a product surface, not paperwork. Every control we describe here is implemented in code or in our operations runbook.",
    lastUpdated: "2026-05-03",
    effectiveFrom: "2026-05-03",
    governingLaw: "Federal Republic of Nigeria",
    clauses: [
      {
        heading: "1. Authentication",
        body: [
          "All access to the Client portal and Studio workspace is gated by the shared HenryCo account system. We support strong passwords and time-based one-time-password (TOTP) two-factor authentication. We log every successful and failed sign-in.",
        ],
      },
      {
        heading: "2. Authorisation",
        body: [
          "Database access is controlled by row-level security (RLS) policies inside Supabase. A client can only see and act on records that match their user identity or verified email. Studio staff have access scoped by role membership: client_success, project_manager, developer_designer, finance, sales_consultation, or studio_owner.",
        ],
      },
      {
        heading: "3. Encryption",
        body: [
          "Every page and API call uses TLS 1.2 or higher. At rest, the database is encrypted by the underlying provider. Backups are encrypted with AES-256.",
        ],
      },
      {
        heading: "4. File storage",
        body: [
          "Brand assets, payment proof, and deliverables are stored on Cloudinary under restricted access. Direct URLs are signed and short-lived where possible. We do not embed sensitive media in public folders.",
        ],
      },
      {
        heading: "5. Payment-flow integrity",
        body: [
          "Payment proof is uploaded over TLS, scanned for the expected file type (PNG, JPG, WEBP, PDF), and capped at 10 MB. The reference number is checked against existing rows to prevent accidental duplicate submissions. Verification is a finance-only action — clients cannot mark their own payment as verified.",
        ],
      },
      {
        heading: "6. Backups and recovery",
        body: [
          "We rely on Supabase's daily encrypted backups. Recovery point objective is 24 hours; recovery time objective for core records is 4 hours.",
        ],
      },
      {
        heading: "7. Access for staff",
        body: [
          "Studio staff sign in through the shared HenryCo account with the same authentication safeguards as clients. Access is scoped through role memberships; we audit role membership monthly.",
        ],
      },
      {
        heading: "8. Vendor security",
        body: [
          "Subprocessors are listed in the Privacy Policy and reviewed annually. We rotate secrets at least every ninety (90) days and on personnel transitions.",
        ],
      },
      {
        heading: "9. Reporting a vulnerability",
        body: [
          "If you find a security issue, email security@henrycogroup.com. We acknowledge within two (2) working days and aim to remediate critical issues within seven (7) days. We do not pursue legal action against good-faith researchers who follow responsible-disclosure norms.",
        ],
      },
    ],
  },
  // ─────────────────────────────────────────────────────────────────
  {
    slug: "sla",
    title: "Delivery SLA",
    shortTitle: "Delivery SLA",
    description:
      "What we commit to on delivery timing, communication response, and post-launch support.",
    intent:
      "An SLA is only useful if the numbers are achievable in practice. Ours are calibrated against the way we actually staff engagements.",
    lastUpdated: "2026-05-03",
    effectiveFrom: "2026-05-03",
    governingLaw: "Federal Republic of Nigeria",
    clauses: [
      {
        heading: "1. Kickoff",
        body: [
          "Kickoff begins within two (2) working days of verified deposit, unless a later kickoff is explicitly agreed in writing.",
        ],
      },
      {
        heading: "2. Communication response",
        body: [
          "Inside the Client portal, we respond to messages within one (1) working day during business hours (Lagos time, Monday to Friday, excluding Nigerian public holidays). Urgent issues flagged before launch are responded to same day.",
        ],
      },
      {
        heading: "3. Milestone delivery",
        body: [
          "We deliver milestones inside the date window agreed in the proposal. If a milestone slips for reasons under our control by more than two (2) working days, we proactively notify the Client through the portal with a reason and a new date.",
        ],
      },
      {
        heading: "4. Launch readiness",
        body: [
          "Before launch we run a quality pass that includes: cross-browser smoke tests, mobile-viewport checks at 375px and 768px, Lighthouse performance on the home page (target LCP under 2.5s on 4G), basic accessibility checks against WCAG 2.1 AA, and a content QA against the brief.",
        ],
      },
      {
        heading: "5. Post-launch warranty",
        body: [
          "Every engagement carries a thirty (30) day warranty from launch. During the warranty period, bugs that contradict the agreed scope are fixed at no additional cost. The warranty does not cover scope changes, new features, content updates, or third-party service failures.",
        ],
      },
      {
        heading: "6. Continued maintenance",
        body: [
          "Continued maintenance, hosting management, and content updates are available through a separate engagement scoped after launch.",
        ],
      },
    ],
  },
  // ─────────────────────────────────────────────────────────────────
  {
    slug: "acceptable-use",
    title: "Acceptable Use Policy",
    shortTitle: "Acceptable use",
    description:
      "What HenryCo Studio will and will not build, and what conduct we expect inside the platform.",
    intent:
      "We protect both the team's wellbeing and the integrity of the platform by being explicit about what falls outside what we accept.",
    lastUpdated: "2026-05-03",
    effectiveFrom: "2026-05-03",
    governingLaw: "Federal Republic of Nigeria",
    clauses: [
      {
        heading: "1. What we won't build",
        body: [
          "We do not build for the following sectors or purposes:",
        ],
        bullets: [
          "Any project that infringes on Nigerian law, including but not limited to fraudulent investment platforms, unlicensed financial products, and content that violates the Cybercrimes (Prohibition, Prevention, etc.) Act 2015.",
          "Sites or systems whose primary purpose is to harass, dox, defame, or threaten individuals.",
          "Hate speech platforms or content targeting protected groups.",
          "Content that exploits minors in any form.",
          "Tools for circumventing copyright or sanctions controls.",
        ],
      },
      {
        heading: "2. Acceptable conduct in the portal",
        body: [
          "We expect respectful conduct in the Client portal — both directions. Studio staff are bound by an internal code of conduct that requires the same. Abusive, harassing, or threatening conduct toward staff is grounds for immediate termination of the engagement under clause 10 of the Terms of Engagement.",
        ],
      },
      {
        heading: "3. Content responsibility",
        body: [
          "The Client is responsible for the legality of the content they supply — copy, imagery, customer data, third-party logos, claims about products. We can advise where something looks risky, but final responsibility rests with the Client.",
        ],
      },
      {
        heading: "4. Third-party services",
        body: [
          "If a project depends on a third-party service (payment gateway, SMS provider, email service), it is the Client's responsibility to secure their own account and credentials with those providers and to keep them in good standing. We help configure them at launch and document them in the handover, but we do not assume their responsibilities.",
        ],
      },
      {
        heading: "5. Reporting misuse",
        body: [
          "If you see something on a HenryCo-built surface that violates this policy, email abuse@henrycogroup.com. We investigate every credible report.",
        ],
      },
    ],
  },
];

export function getStudioPolicyBySlug(slug: string): PolicyDocument | null {
  const normalized = (slug || "").trim().toLowerCase();
  return studioPolicyIndex.find((policy) => policy.slug === normalized) ?? null;
}
