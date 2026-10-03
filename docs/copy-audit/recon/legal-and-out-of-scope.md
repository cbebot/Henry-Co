# Copy-reset recon — legal lines, registration numbers, out-of-scope inventories

Worktree: `C:\Users\HP VICTUS\HenryCo\.claude\worktrees\copy-reset-prep` (read-only; nothing in the repo was edited).
Date: 2026-10-03. All paths are repo-relative unless absolute.

## Summary
- **Registration and tax numbers (§1).**
  - Two real identifiers exist: the CAC RC `9594234` (`packages/config/legal.ts:286`) and the FIRS TIN `2621481857689` (`legal.ts:299`).
  - The NDPC registration and the DPO are `[OWNER-TO-CONFIRM]` placeholders, and they print verbatim on hub `/privacy`.
  - There are no licence or permit numbers. The company bank account lives only in the DB.
  - **For the owner's decision:** the RC on hub `/about` (`apps/hub/app/lib/company-pages.ts:253`, `:258`), on `/press/v3` (`page.tsx:45`), and hardcoded in the AI doctrine (`packages/ai-gateway/src/doctrine.ts:22`, `:24`).
  - **Do not delete:** the RC/TIN on `/privacy` and `/terms`, on receipts, invoices and credit notes, and in the email footer. The TIN never appears on a public page.
- **Legal lines (§2).**
  - KEEP-critical:
    - The clickwrap checkboxes: signup, marketplace checkout, studio template checkout, newsletter.
    - "© {year} Henry Onyx Limited" in the shared footer.
    - Hub `/privacy` and `/terms`, plus the studio and marketplace policies.
    - The FCCPA refund floor.
    - The agent-not-party, platform-not-employer and not-a-bank disclaimers. These live only on hub `/about`.
    - The payee entity on every `/pay` page.
  - 17 contradictions or gaps (F1–F17) are listed for legal review rather than for rewriting, e.g.:
    - "escrow" wording vs "not a bank".
    - Arbitration vs courts.
    - The 7-day return window vs "window on the listing".
    - The 18+ rule vs parental consent.
    - The `/v3` newsletter capture with no consent box.
    - The property footer © naming "Henry Onyx Property".
    - A revoked certificate still reading "active".
    - No cookie notice on the 7 division sites.
- **Emails (§3).** Heaviest: the owner report (299 words), care marketing nurture (135) and studio inquiry (125). The heaviest files are the marketplace event copy (1,741) and care templates (1,236).
- **`packages/search-ui` (§4).** About 360 user-facing words. It shows "HenryCo" to users 9 times. Owner-reserved: list only.

---

## 1. Registration & tax numbers

### 1.1 Where each identifier is DEFINED

| Identifier | Value | Defined at (file:line, exact) | Notes |
|---|---|---|---|
| CAC RC number | `9594234` | `packages/config/legal.ts:286` — `rcNumber: "9594234",` | Source comment legal.ts:282-285: taken from CAC Certificate of Incorporation + Status Report, owner-supplied 2026-06-07. |
| FIRS TIN (also printed as the VAT No.) | `2621481857689` | `packages/config/legal.ts:299` — `tin: "2621481857689",` | Mapped to `vatNumber` in `packages/config/issuer.ts:110` — `vatNumber: confirmedOrNull(LEGAL.entity.tin),`. Comment at `apps/hub/app/lib/company-pages.ts:259-261` records the decision that the TIN is "deliberately NOT published on the unauthenticated public /about page". |
| NDPC data-protection registration | **placeholder** `[OWNER-TO-CONFIRM: NDPC registration reference]` | `packages/config/legal.ts:300` | Renders literally on hub /privacy (see 1.2 b). |
| DPO | **placeholder** `[OWNER-TO-CONFIRM: DPO name + email + phone, or 'External DPO consulted on material changes']` | `packages/config/legal.ts:301` | Renders literally on hub /privacy (see 1.2 b). |
| Registered office | street `"001 Airport Road"`, city `"Emene"`, state `"Enugu State"`, country `"Nigeria"`, postalCode `""` | `packages/config/legal.ts:291-295` | CAC address per comment legal.ts:288-290. |
| Legal entity name | `"Henry Onyx Limited"` | `packages/config/company.ts:169` — `legalName: "Henry Onyx Limited",` | Re-exported as `LEGAL.entity.name` (legal.ts:280). |
| HQ location (OG card / press kit) | `"Emene, Enugu"` | `packages/config/company.ts:180` | Location, not an ID. |
| RC number — HARDCODED DUPLICATE (not config-sourced) | `RC 9594234` | `packages/ai-gateway/src/doctrine.ts:22` and `:24` | AI system prompt ("Henry Onyx Intelligence"). Test asserts it: `packages/ai-gateway/src/__tests__/doctrine.test.ts:63`. A config change to the RC would NOT reach this literal. |
| VAT rate (not an identifier) | `standardRate: 0.075` | `packages/config/tax.ts:38` | Listed only because receipts print "VAT (7.5%)". |
| Company bank account (payee) | **no value in code** | DB-sourced: `apps/marketplace/lib/marketplace/payment.ts:77-82` (`accountNumber` / `account_number` / `payment_account_number` / `company_account_number`), `apps/studio/lib/studio/settings-shared.ts:76`, `:88-89` | Rendered on the public /pay pages (1.2 c). |
| Licences / permits / other regulator numbers | **none found** | grep for `NIPOST`, `LASRERA`, `ESVARBON`, `NIESV`, `ARCON`, `SCUML`, "licence/license number", "permit number", "registration no", "regulated by" across `apps/**` + `packages/**` `*.ts(x)` → 0 relevant hits | Nothing to decide here. |

### 1.2 Where each identifier RENDERS

#### (a) PUBLIC PAGES — owner decides

| # | What renders | Route | file:line (exact) |
|---|---|---|---|
| a1 | RC in body prose: `` `Registered in Nigeria as ${LEGAL.entity.name} (RC ${LEGAL.entity.rcNumber}). Headquartered in ${LEGAL.entity.registeredOffice.city}, ${LEGAL.entity.registeredOffice.state}. Founded in ${LEGAL.entity.yearFounded} by ${LEGAL.entity.founder}. …` `` → "Registered in Nigeria as Henry Onyx Limited (RC 9594234). Headquartered in Emene, Enugu State. …" | hub `/about` | `apps/hub/app/lib/company-pages.ts:253` |
| a2 | RC as a labelled card: `{ id: "about-identity-rc", label: "CAC RC number", value: LEGAL.entity.rcNumber }` | hub `/about` | `apps/hub/app/lib/company-pages.ts:258` |
| a3 | Registered office (city/state/country only): `label: "Registered office", value: `${…city}, ${…state}, ${…country}`` → "Emene, Enugu State, Nigeria" | hub `/about` | `apps/hub/app/lib/company-pages.ts:262` |
| a4 | RC in press-kit facts: `{ label: copy.factLabels.rc, value: `RC ${LEGAL.entity.rcNumber}` }` (label = `rc: "RC number"`, `packages/i18n/src/hub-public-copy.ts:709`) | hub `/press/v3` | `apps/hub/app/(site)/press/v3/page.tsx:45` |
| a5 | AI assistant answers on public pages may state "RC 9594234" (instructed: "answer plainly and specifically: Henry Onyx Limited is a registered Nigerian company (RC 9594234)") | any page that mounts the Intelligence launcher | `packages/ai-gateway/src/doctrine.ts:24` (identity line `:22`) |

Rendering path for a1-a3: `apps/hub/app/(site)/about/page.tsx:81-84` → `localizeCompanyPage(pageData.page ?? createFallbackCompanyPage("about"), locale)` → `CompanyPageEditorial`. **Caveat:** the code fallback is only used when the `company_pages` row for `about` is absent (`getCompanyPage`, `company-pages.ts:1064-1075`). If the owner CMS row exists in production, the live page shows the DB text instead — the DB could not be checked from the repo.

TIN is NOT rendered on any public page (only on receipts/invoices/credit notes — see c).

#### (b) LEGAL PAGES — must not be deleted

| # | What renders | Route | file:line (exact) |
|---|---|---|---|
| b1 | Controller identity prose: `` `${LEGAL.entity.name} (RC ${LEGAL.entity.rcNumber}), trading as ${LEGAL.entity.tradingName}, with registered office at ${…street}, ${…city}, ${…state}, ${…country} ${…postalCode}, is the data controller … NDPC registration: ${LEGAL.entity.ndpcRegistration}. Data Protection Officer: ${LEGAL.entity.dpo}.` `` | hub `/privacy` §1 | `apps/hub/app/lib/company-pages.ts:455` |
| b2 | `{ id: "privacy-controller-rc", label: "CAC RC number", value: LEGAL.entity.rcNumber }` | hub `/privacy` §1 | `company-pages.ts:459` |
| b3 | `{ id: "privacy-controller-office", label: "Registered office", value: `${…city}, ${…state}` }` | hub `/privacy` §1 | `company-pages.ts:460` |
| b4 | `{ id: "privacy-controller-ndpc", label: "NDPC registration", value: LEGAL.entity.ndpcRegistration }` — **renders the literal placeholder** | hub `/privacy` §1 | `company-pages.ts:461` |
| b5 | `{ id: "privacy-controller-dpo", label: "DPO", value: LEGAL.entity.dpo }` — **renders the literal placeholder**; also `:636` (prose) and `:639` (`"Named DPO"`) | hub `/privacy` §1 and §14 | `company-pages.ts:462`, `:636`, `:639` |
| b6 | Registered office as courier notice address: `label: "Notice to Henry Onyx (courier)", value: `${…city}, ${…state} (registered office)`` | hub `/terms` §21 | `company-pages.ts:982` |

FLAG for owner: b4/b5 print `[OWNER-TO-CONFIRM: …]` text verbatim on the public privacy page. `CompanyPageEditorial` renders `item.body || item.value` with no placeholder guard (`apps/hub/app/components/CompanyPageEditorial.tsx:196-199`), unlike receipts, which drop unconfirmed values via `isConfirmedLegalValue` (`packages/config/issuer.ts:57-61`). Don't delete these lines. Fill the values in `legal.ts:300-301` instead.

#### (c) RECEIPTS / INVOICES / PAYMENT DOCUMENTS — must not be deleted

| # | Document | What renders | file:line (exact) |
|---|---|---|---|
| c1 | Receipt PDF | `{issuer.name}` ("Henry Onyx Limited") `:193`; registered-office lines `:195-199`; `` {`${labels.rc} ${issuer.rcNumber}`} `` → "RC 9594234" `:202`; `` {`${labels.vatId} ${issuer.vatNumber}`} `` → "VAT No. (TIN) 2621481857689" `:203`; legal footer `receiptLegal1/2` `:233-234` | `packages/branded-documents/src/templates/receipt.tsx` |
| c2 | Invoice PDF | issuer `:183`; office `:185-189`; RC `:192`; VAT/TIN `:193`; footer `invoiceLegal1/2` `:253-254` | `packages/branded-documents/src/templates/invoice.tsx` |
| c3 | Credit-note PDF | issuer `:192`; office `:194-198`; RC `:201`; VAT/TIN `:202`; footer `creditNoteLegal1/2` `:221-222` | `packages/branded-documents/src/templates/credit-note.tsx` |
| c4 | Labels for c1-c3 | `rc: "RC",` `:130`; `vatId: "VAT No. (TIN)",` `:131`; receipt/invoice/credit-note legal lines `:187-194`, `:204-207` | `packages/i18n/src/payment-document-copy.ts` |
| c5 | Issuer builder (single source for c1-c3) | `rcNumber: confirmedOrNull(LEGAL.entity.rcNumber),` `:109`; `vatNumber: confirmedOrNull(LEGAL.entity.tin),` `:110`; `addressLines: buildRegisteredOfficeLines(),` `:108` | `packages/config/issuer.ts` |
| c6 | Where c1-c3 are served | `issuer: buildDocumentIssuer(division),` | `apps/account/app/api/documents/[type]/[id]/route.ts:191`; `apps/account/lib/payment-documents.ts:258`, `:338`, `:426` |
| c7 | Studio invoice / proposal PDF templates (dormant) | `RC: {studio.rcNumber}` / `VAT: {studio.vatNumber}` (caller-supplied) | `packages/branded-documents/src/templates/studio-invoice.tsx:205-206`; `studio-proposal.tsx:229`. No app imports these templates (grep of `apps/**` found no use). |
| c8 | Vendor payout statement / vendor tax document | `"Tax ID"`. This is the **vendor's** own tax ID, not Henry Onyx's. | `packages/branded-documents/src/templates/vendor-payout-statement.tsx:221`; `vendor-tax-document.tsx:202` |
| c9 | Public /pay pages (payment surface) — legal-entity payee + company bank account (DB value) | `Secured payment` … `to` `{COMPANY.group.legalName}` `payment-surface.tsx:188-192`; `Transfer only to the {legalEntity} company account shown below.` `payment-guide.tsx:91`; `"Bank"`, `"Account name"`, `"Account number"` rows `payment-guide.tsx:96-98`; post-payment `{legalEntity}` + `` {`© ${receiptYear} ${legalEntity}`} `` `payment-receipt.tsx:84-85` | `packages/payment-surface/src/*`. Routes: care `/pay/[trackingCode]`, jobs `/pay/[paymentId]`, logistics `/pay/[paymentId]`, marketplace `/pay/[orderNo]`, property `/pay/[paymentId]`, studio `/pay/[paymentId]` (all six import `PaymentSurface`). |

#### (d) EMAIL

| # | What renders | file:line (exact) |
|---|---|---|
| d1 | HTML footer on every shared-layout email: `${escapeHtml(LEGAL_ENTITY)} &middot; RC ${escapeHtml(LEGAL_RC)} &middot; ${escapeHtml(REGISTERED_OFFICE)}` → "Henry Onyx Limited · RC 9594234 · 001 Airport Road, Emene, Enugu State, Nigeria" | `packages/email/layout.ts:402` (constants `:42-53`) |
| d2 | HTML copyright: `&copy; ${year} ${escapeHtml(LEGAL_ENTITY)}. All rights reserved.` | `packages/email/layout.ts:408` |
| d3 | Plain-text footer: `` `— ${BRAND_NAME} · ${LEGAL_ENTITY} · RC ${LEGAL_RC} · ${REGISTERED_OFFICE}` `` | `packages/email/layout.ts:571` |
| d4 | Consumers of the shared layout, which inherit d1-d3 | `apps/{account,care,learn,marketplace,property,studio}/lib/**/email*`, `apps/account/lib/security/security-email.ts`, `apps/account/lib/business-email.ts`, `apps/logistics/lib/logistics/notify-customer.ts`, `apps/account/app/api/cron/notification-email-fallback/route.ts`, `packages/email/auth-hook-templates.ts` (grep `renderHenryCoEmail(`) |

### 1.3 Owner decision list (category a only)
1. hub `/about`: keep or remove the RC number in the identity prose (`company-pages.ts:253`) and the "CAC RC number" card (`:258`).
2. hub `/press/v3`: keep or remove the "RC number" fact (`press/v3/page.tsx:45`).
3. AI doctrine: keep or remove the hardcoded "RC 9594234" in `packages/ai-gateway/src/doctrine.ts:22,24`. It is a chat answer, not a page. It is also a duplicate literal outside config.
4. Do **not** touch b1-b6, c1-c9, d1-d3. Separate decision for the owner: fill or hide the NDPC/DPO placeholders that render on `/privacy` (b4/b5).

---

## 2. Legally-required / legally-sensitive lines on the public routes

**Verdicts.** KEEP means the line's meaning must survive. It may be re-keyed or re-ordered, but not softened, merged away or dropped. MAY-TIGHTEN means the wording can shrink, but the obligation or claim it carries must survive and stay true. Where I was unsure I marked KEEP, per `docs/v3/public-voice-and-security.md:71-75` ("Removing too much is worse than flagging").
**Legal pages** in this list are hub `/privacy`, `/terms` and the `/about` identity block, marketplace `/policies/[slug]`, and studio `/policies` + `/policies/[slug]`.
**CMS caveat.** Hub `/about`, `/privacy` and `/terms` render the code fallback in `apps/hub/app/lib/company-pages.ts` only when no `company_pages` DB row exists for that slug (`company-pages.ts:1064-1075`). A live CMS row would override the text quoted here.
**Long lines.** For long lines the quote is an exact substring, with the decisive sentence kept intact.

### 2.1 Copyright, legal-entity naming, payee identity

| ID | Exact quote | file:line | Route(s) | Why it matters | Verdict |
|---|---|---|---|---|---|
| L1 | `© {year} {legalName}. {copy.rightsReserved}` → "© 2026 Henry Onyx Limited. All rights reserved." (`legalName = COMPANY.group.legalName`, `:152`) | `packages/ui/src/public-design/site-footer.tsx:260` | every hub, care, jobs, learn, logistics, marketplace and studio route (shared `LivePublicSiteFooter`/`PublicSiteFooter`) | Copyright notice naming the legal owner and operating entity | KEEP |
| L2 | `&copy; {new Date().getFullYear()} {t(property.name)}. {t("All rights reserved.")}` → "© 2026 Henry Onyx Property. All rights reserved." | `apps/property/components/property/site-footer.tsx:95` | all 11 property routes | Copyright line names a trading division, not the legal entity (see F10) | KEEP (owner/legal decision whether to switch it to Henry Onyx Limited) |
| L3 | "All rights reserved." — the `rightsReserved` inputs to L1 | `packages/i18n/src/hub-public-copy.ts:317`, `:423`; `apps/care/components/public/CarePublicShell.tsx:89`; `apps/jobs/components/public-shell.tsx:161`; `apps/learn/app/(public)/layout.tsx:31`; `apps/logistics/app/(public)/layout.tsx:76`; `apps/marketplace/components/marketplace/shell.tsx:88`; `apps/studio/app/(public)/layout.tsx:130` | as L1 | Part of the copyright notice | KEEP |
| L4 | "It is operated by Henry Onyx Limited, a private company registered in Nigeria, and built on a simple rule — the page and the product are the same thing." | `packages/i18n/src/hub-public-copy.ts:705` | hub `/press/v3` | Entity identification | KEEP the entity clause; MAY-TIGHTEN the rest |
| L5 | "Write the brand as Henry Onyx; the legal entity is Henry Onyx Limited." | `hub-public-copy.ts:727` | hub `/press/v3` | Entity naming rule | KEEP |
| L6 | `{ label: copy.factLabels.legalName, value: LEGAL.entity.name }` (label "Legal entity", `hub-public-copy.ts:708`) | `apps/hub/app/(site)/press/v3/page.tsx:44` | hub `/press/v3` | Entity identity (the RC on `:45` is the owner's call — §1) | KEEP |
| L7 | "Registered in Nigeria as ${LEGAL.entity.name} (RC …). Headquartered in …" plus items "Trading name" / "Registered name" / "Registered office" | `apps/hub/app/lib/company-pages.ts:253`, `:256-257`, `:262` | hub `/about` | Entity identification | KEEP entity and office (RC: owner decides, §1) |
| L8 | `Secured payment` … `to` `{COMPANY.group.legalName}` | `packages/payment-surface/src/payment-surface.tsx:188-192` | all six `/pay/*` routes | Names the payee legal entity; the merchant entity must match CAC/processor records | KEEP |
| L9 | "Transfer only to the {legalEntity} company account shown below." | `packages/payment-surface/src/payment-guide.tsx:91` | `/pay/*` (bank-transfer state) | Payee identity + anti-fraud | KEEP |
| L10 | `{legalEntity}` and `` {`© ${receiptYear} ${legalEntity}`} `` | `packages/payment-surface/src/payment-receipt.tsx:84-85` | `/pay/*` once paid | Receipt panel names the issuer | KEEP |
| L11 | `const PARENT = "Henry Onyx Limited";` → "…${COMPANY_NAME}, a division of ${PARENT} ("Henry Onyx Studio", "we", "us", "our")." | `apps/studio/lib/studio/policies.ts:32`, `:56` | studio `/policies/terms` | Names the contracting party | KEEP |
| L12 | `Always to <strong>{`Henry Onyx Limited`}</strong> If anyone, internal or external, asks you to pay anywhere else, treat it as fraud and contact finance.` | `apps/studio/app/(public)/policies/page.tsx:98-99` | studio `/policies` | Payee identity + anti-fraud (note the missing full stop after "Limited") | KEEP |

### 2.2 Terms / privacy acceptance and consent lines on forms

| ID | Exact quote | file:line | Route(s) | Why | Verdict |
|---|---|---|---|---|---|
| A1 | Required checkbox: "I agree to the Henry Onyx" [Terms of Service] "and" [Privacy Policy]; submit is blocked with "Please accept the terms and privacy policy." | Render `apps/account/components/auth/SignupForm.tsx:403-420`; gate `:118`; copy `packages/i18n/src/surface-copy.ts:353`, `:356-359` | account `/signup`. Every division `/signup` redirects here (e.g. `apps/jobs/app/signup/page.tsx:10`, `apps/marketplace/app/signup/page.tsx:12`, `apps/learn/app/signup/page.tsx:18`) | Clickwrap: forms the contract and gives the NDPA transparency notice | KEEP |
| A2 | "By continuing, you accept our Terms and Privacy Notice." | `packages/i18n/src/auth-copy.ts:76` | **none.** Key defined, never rendered (grep finds no consumer) | Dead key | n/a: leave as-is; don't count it as coverage |
| A3 | "I agree to the" [Henry Onyx marketplace policies] "and confirm the delivery address and payment method are correct." Checkbox; order blocked without it (`if (!agreed) return;` `:602`) | `apps/marketplace/components/marketplace/checkout-experience.tsx:1785-1799` | marketplace `/checkout` | Clickwrap at purchase | KEEP |
| A4 | "I have read and agree to the" [Henry Onyx Studio Terms of Engagement], [Privacy Policy], "and" [Refund & Cancellation Policy]. "I understand the deposit reserves my build slot and is non-refundable once kickoff begins, per the refund schedule." Error: "Tick the engagement-terms checkbox to continue. We need your agreement before we can issue an invoice." | `apps/studio/app/checkout/template/[slug]/page.tsx:355-377`; error `:31` | studio `/checkout/template/[slug]` | Clickwrap; non-refundability disclosed before payment (consumer protection) | KEEP |
| A5 | "Reserving a template, accepting a proposal, or paying a deposit is acceptance of the current Terms. The version you accepted is logged in your Client portal." | `apps/studio/app/(public)/policies/page.tsx:78-79` | studio `/policies` | Acceptance mechanics | KEEP |
| A6 | "By reserving a template, accepting a proposal, paying a deposit, uploading proof of payment, or otherwise instructing us to begin work, the Client confirms they have authority to enter this agreement on behalf of the named business and accepts these Terms in full." | `apps/studio/lib/studio/policies.ts:57` | studio `/policies/terms` | Acceptance + authority | KEEP |
| A7 | "Use of any ${LEGAL.entity.tradingName} surface constitutes acceptance of these terms. The user must be at least 18 years old and have the legal capacity to enter a binding contract under Nigerian law." | `company-pages.ts:706` (items `:709-711`) | hub `/terms` §1 | Browsewrap acceptance, capacity, age | KEEP |
| A8 | Newsletter consent checkbox: "I agree to receive these newsletters from Henry Onyx I can unsubscribe any time, and sends are paused during active support or billing issues." Rendered `apps/hub/app/(site)/newsletter/NewsletterSignupClient.tsx:211-215`; submit gated on consent (`:49`) | `packages/i18n/src/hub-public-copy.ts:294` | hub `/newsletter` only. The `/v3` email capture does **not** render this checkbox (see D7 and F17). | NDPA §25(1)(a) marketing consent: must be specific and withdrawable | KEEP meaning; MAY-TIGHTEN wording (the missing "." after "Henry Onyx" is a typo) |
| A9 | "I have read and agree to the proposal scope, investment, deposit, and timeline." | `packages/i18n/src/studio-copy.ts:234` (rendered `apps/studio/components/studio/proposal-accept-flow.tsx:145`) | studio `/proposals/[id]` — **outside** the 139 routes, listed for completeness | Clickwrap | KEEP |
| A10 | "Henry Onyx Intelligence drafts a starting point from your idea — review and edit every field before you publish." and `t("Henry Onyx Intelligence · {price} (incl. {vat} VAT) · {tier}")` | `apps/property/app/(public)/submit/page.tsx:252`, `:257` (template `surface-copy.ts:167`) | property `/submit` (flag `PROPERTY_AI_LISTING_ASSIST`) | AI-output responsibility; VAT-inclusive price shown | MAY-TIGHTEN (keep "review before you publish" and "incl. VAT") |

### 2.3 Cookie and consent notices

| ID | Exact quote | file:line | Route(s) | Why | Verdict |
|---|---|---|---|---|---|
| C1 | Banner body: "Essential storage keeps security, navigation, and core flows reliable. Optional categories help remember language and interface choices, measure quality, and support carefully scoped outreach when programs are enabled." Buttons `en: { gotIt: "Continue", reviewSettings: "Review settings", … }` | `packages/i18n/src/consent-copy.ts:42`; rendered `packages/ui/src/public-shell/consent-notice.tsx:110`; labels `:39` | **Mounted only** in hub (`apps/hub/app/layout.tsx:67`) and account (`apps/account/app/layout.tsx:120`). Care, jobs, learn, logistics, marketplace, property and studio layouts mount no consent notice (gap F11). | Notice before optional storage (NDPA cookie guidance) | KEEP meaning; MAY-TIGHTEN wording |
| C2 | Category purposes: "Required for security, session integrity, checkout flows, and core navigation." plus Preferences, Personalized experience, Analytics, Marketing descriptions | `consent-copy.ts:54-74` | hub `/preferences` and the hub-wide privacy panel (`apps/hub/app/(site)/layout.tsx:280`) | Granular, withdrawable consent | KEEP (every category and its purpose) |
| C3 | "Cookies fall into four categories. Strictly necessary cookies operate the site and cannot be disabled. … Analytics cookies measure usage and require consent. Marketing cookies support targeted campaigns and require consent. A consent banner sets initial preferences; preferences can be changed at any time from the footer." (+ items) | `company-pages.ts:597`, `:600-603` | hub `/privacy` §11 | Cookie disclosure | KEEP |
| C4 | "We use a minimal set of first-party cookies for authentication, session continuity, and theme preference. We use privacy-respecting analytics that do not assemble cross-site profiles. We do not sell or share data with advertising networks." | `apps/studio/lib/studio/policies.ts:249` | studio `/policies/privacy` §9 | Cookie disclosure | KEEP |
| C5 | Footer "Preferences" link to hub `/preferences` | `CarePublicShell.tsx:115`; `apps/logistics/app/(public)/layout.tsx:102` | care, logistics | Route for withdrawing consent | KEEP |

### 2.4 NDPA / GDPR disclosures (privacy policies and notices at collection)

**Hub `/privacy`** (`apps/hub/app/lib/company-pages.ts`). All KEEP.

| ID | Section | Exact quote (decisive part) | file:line |
|---|---|---|---|
| P1 | Header | `` `Nigeria Data Protection Act 2023 · Effective ${LEGAL.policy.effectiveDate} · v${LEGAL.policy.version}` `` | `:436-437` |
| P2 | Intro | "${LEGAL.entity.tradingName} processes personal data as a data controller under the Nigeria Data Protection Act 2023." | `:439` |
| P3 | §1 Controller | see §1 b1-b5 | `:455-462` |
| P4 | §2 Lawful bases | "Every processing activity on this platform rests on one or more lawful bases listed in NDPA 2023 §25." + `NDPA_LAWFUL_BASES` | `:470`, `:472-476`; data `packages/config/legal.ts:92-129` |
| P5 | §3 Categories | "The categories below are concrete." + `DATA_CATEGORIES`, incl. "processed by our PCI-compliant payment processor; Henry Onyx does not store full card numbers" | `:483`, `:485-489`; data `legal.ts:137-208` (card line `:162`) |
| P6 | §4 Purposes | items | `:496-505` |
| P7 | §5 **Sub-processors** | "These are the named sub-processors that receive personal data to help operate the platform. Each is bound by a written data-processing agreement …" + `SUB_PROCESSORS` | `:512`, `:514-518`; data `legal.ts:223-242`. Per `docs/v3/public-voice-and-security.md:49-52`, `:64-65` this is the **only** place vendor names may appear. |
| P8 | §6 Transfers | "Transfers rely on adequacy decisions where they exist, on Standard Contractual Clauses Module 2 …" | `:525`, `:528-531` |
| P9 | §7 Retention | "Retention is tied to the statute that drives it …" + `RETENTION_POLICIES` | `:539`, `:541-545`; data `legal.ts:249-257` |
| P10 | §8 International users | + `INTERNATIONAL_AUTHORITIES` | `:552`, `:554-558`; data `legal.ts:264-276` |
| P11 | §9 Rights | access, rectification, erasure, restriction, portability, objection, automated decisions | `:565`, `:568-574` |
| P12 | §10 Exercise | "Send a written request to ${LEGAL.contacts.privacy}. The controller acknowledges receipt within 5 working days and responds substantively within 30 days under the Nigeria Data Protection Act 2023." | `:582`, `:585-589` |
| P13 | §11 Cookies | = C3 | `:597-603` |
| P14 | §12 Children | "The platform is not directed at children under 18." + "Minimum age: 18 (with verifiable parental consent under 18)" | `:611`, `:614-615` |
| P15 | §13 Breach | "…is reported to the Nigeria Data Protection Commission within 72 hours of becoming aware …" | `:623`, `:626-628` |
| P16 | §14 DPO | DPO text + "Named DPO" / "DPO email" (placeholder renders: §1 b5) | `:636`, `:639-640` |
| P17 | §15 Complaints | "…a complaint can be lodged with the Nigeria Data Protection Commission at complaints@ndpc.gov.ng." | `:648`, `:651-652` |
| P18 | §16 Language | "In case of conflict between language versions, the English text controls." | `:660`, `:663-664` |
| P19 | §17 Version | "Material changes are emailed to account holders 14 days before they take effect and the version is bumped. Continued use after the effective date is acceptance." | `:672`, `:675-677` |
| P20 | All sections | The "— In plain English: …" restatement paragraph appended to each section body (e.g. `:455`, `:470`, `:483`, `:512`) | MAY-TIGHTEN (summary only; the obligation sits in the preceding sentence) |

**Studio `/policies/privacy`** (`apps/studio/lib/studio/policies.ts`). All KEEP: description `:160`; controller "(a division of ${PARENT}) is the data controller for personal data processed through studio.henryonyx.com and the linked Client portal. Our designated privacy contact is ${PRIVACY_EMAIL}." `:170`; data `:176-184`; bases `:189-196`; storage `:201-202`; **sub-processors** `:208-216` (divergence: F7); transfers `:222`; retention `:228`; rights incl. "Lodge a complaint with the Nigeria Data Protection Commission (NDPC)." `:234-243`; cookies `:249`; children `:255`; breach `:261`; contact "We respond to verified requests within thirty (30) days." `:267-268`.

**Notices at the point of collection, opt-out and data handling**

| ID | Exact quote | file:line | Route(s) | Verdict |
|---|---|---|---|---|
| D1 | "Phone numbers are used to authorise tracking lookups and surface milestones — not shared with third parties. Both sides can revoke updates from their thread." | `packages/i18n/src/logistics-book-copy.ts:111-112` | logistics `/book` | KEEP meaning (accuracy flag F8) |
| D2 | "Your name, email, phone, and addresses are visible to you and the platform. Sellers see only what is needed to fulfil an order — name, delivery address, and phone for the courier — and never see your card or payment details." | `apps/marketplace/lib/marketplace/help-faqs.ts:230` | marketplace `/help` | KEEP meaning |
| D3 | "Account → Privacy → Delete account. Deletion is permanent and removes your orders, addresses, saved items, and reviews. We retain anonymised purchase records as required by tax and dispute-resolution law." | `help-faqs.ts:199` | marketplace `/help` | KEEP meaning (conflicts with retention table, F6) |
| D4 | "Saving and applying require a Henry Onyx account so your shortlist and applications are not floating in a cookie somewhere. You control your profile, documents, and what you send with each application." | `apps/jobs/app/trust/page.tsx:29` | jobs `/trust` | MAY-TIGHTEN |
| D5 | "{{email}} won’t receive Henry Onyx newsletters. Transactional messages (receipts, shipping, verification, security) still send because we have to." | `hub-public-copy.ts:443` | hub `/newsletter/unsubscribe` | KEEP meaning (discloses the transactional carve-out) |
| D6 | "If your link has expired, contact us and we’ll honor it manually." / "…reply “unsubscribe” to any Henry Onyx email and our team will honor it manually." | `hub-public-copy.ts:435`, `:440` | hub `/newsletter/unsubscribe` | KEEP meaning (manual opt-out route); MAY-TIGHTEN |
| D7 | "We send less, so it matters. Choose your topics — change or unsubscribe any time." / "Only topics you opted into." / "A working unsubscribe link in every email." | `hub-public-copy.ts:278`, `:281`, `:284` | hub `/newsletter`. `:278` is also the **only** disclosure on the `/v3` email capture (`apps/hub/app/(site)/v3/page.tsx:125-133` passes `valueStatement: newsletterCopy.intro`; `story-newsletter.tsx` has no consent checkbox) | `:278`: KEEP meaning (it is the sole opt-in/unsubscribe line on `/v3`). `:281`, `:284`: MAY-TIGHTEN. |
| D8 | "Henry Onyx Fabric Care will stop sending reminder and outreach messages tied to this customer contact. Transactional updates like active booking progress can still continue when required." | `apps/care/app/(public)/unsubscribe/page.tsx:68` (+ `:60-61`, `:67`, `:69`) | care `/unsubscribe` | KEEP meaning |
| D9 | "Unsubscribe any time." (metadata) / "…pause promotional sends, or unsubscribe entirely." | `apps/hub/app/(site)/newsletter/page.tsx:12`; `apps/hub/app/(site)/newsletter/preferences/page.tsx:12` | hub `/newsletter`, `/newsletter/preferences` | MAY-TIGHTEN |

### 2.5 Data-protection, DPO and legal contact lines (all KEEP)

- Hub `/about` "How to reach the company": `"Legal correspondence"`, `"Privacy and data-subject rights"`, `"Data Protection Officer"` → `company-pages.ts:387-389`.
- Hub `/privacy`: email and DPO lines `:585-586`; DPO `:639-640`; NDPC complaint `:651`.
- Hub `/terms` §6, takedown: "Takedown requests: under the Copyright Act 2022 (Nigeria) §43 (notice-and-takedown), copyright holders may serve a notice on ${LEGAL.contacts.legal}." → `:780`, item `:785`.
- Hub `/terms` §21 notices: "Notices to ${LEGAL.entity.tradingName} are served by email to ${LEGAL.contacts.legal} and (for formal service of process) by registered courier to the registered office." → `:978`, items `:981-984`.
- Hub `/terms` §24 contacts: `:1018`, `:1021-1023`.
- Studio policies:
  - Terms §14 contacts: `policies.ts:147-149`.
  - Refunds §7 and §9: `:330`, `:342`.
  - Security §9, "We do not pursue legal action against good-faith researchers who follow responsible-disclosure norms.": `:468`.
  - AUP §5, abuse inbox: `:571`.

### 2.6 Consumer protection: refunds, returns, pricing, fees

| ID | Exact quote (decisive part) | file:line | Route(s) | Verdict |
|---|---|---|---|---|
| T1 | "Refund rights under the Federal Competition and Consumer Protection Act 2018 are non-derogable for consumer transactions; division-specific terms add the operational detail." + per-division items (Marketplace `:752` "Refunds under FCCPA 2018 §122 and §123 …"; Logistics `:753`; Fabric Care `:754` "…damage claim window posted at booking."; Studio `:755`; Property `:756`; Jobs `:757`; Learn `:758` "Course refund window: 7 days from enrolment, unused content only. Completion certificates are non-refundable.") | `company-pages.ts:749`, `:752-758` | hub `/terms` §4 | KEEP |
| T2 | "Consumer rights under the Federal Competition and Consumer Protection Act 2018 §128 are non-derogable and apply in full; …limited to the fees the customer paid to the relevant Henry Onyx division in the 12 months preceding the event …" | `:835`, `:838-840` | hub `/terms` §10 | KEEP |
| T3 | "Taxes and division-specific fees are disclosed before payment." | `:910`, `:915` | hub `/terms` §16 | KEEP |
| T4 | "VAT applies under the Value Added Tax Act on taxable supplies in Nigeria at the prevailing rate." | `:936`, `:939-942` | hub `/terms` §18 | KEEP |
| T5 | Customs and import VAT are the user's responsibility | `:897`, `:900-902` | hub `/terms` §15 | KEEP |
| M1 | Buyer Protection Policy: "Henry Onyx receives your payment first, holds it through fulfillment, and can hold the seller's payout when delivery proof is missing or a dispute is open." / "Henry Onyx holds your payment until your order is delivered and confirmed." / "An open dispute holds the seller's payout on the affected order until it is resolved." / "Verified delivery plus timeout can trigger payout release when buyers do not confirm promptly and no dispute exists." | `apps/marketplace/lib/marketplace/policy.ts:65-69` | marketplace `/policies/buyer-protection` | KEEP (F1) |
| M2 | Return & Refund Policy summary + bullets ("Refund and return outcomes must align with order evidence, payout state, and dispute review." …) | `policy.ts:106-114` | `/policies/returns-refunds` | KEEP (states no return window, F4) |
| M3 | Dispute Resolution, Prohibited Goods, Seller, Payout, Seller Verification, Trust & Safety, Referral, Featured Listing ("Featured placement is a paid privilege …") policies | `policy.ts:73-81`, `:95-103`, `:117-125`, `:128-136`, `:139-147`, `:150-158`, `:161-169`, `:172-180`; seller tier payout windows `:4-30` | `/policies/[slug]` | KEEP |
| M4 | Marketplace `/help` FAQ. Payment held: "Yes. Your payment sits in a held state until the seller confirms shipment and the carrier confirms hand-off." (`:70`). Refund timings (`:76`). "Most items can be returned within 7 days of delivery. Some categories — perishables, intimate-wear, custom-made — are not return-eligible and the product page makes that clear before checkout." (`:101`). Return start (`:107`). Condition and partial refund (`:113`). Return shipping (`:119`). Exchange (`:125`). Seller payout schedule (`:150`). "A flat platform commission applies per sold item; the rate appears in your seller dashboard before you confirm a listing. Payment processing is included in the commission — no separate gateway fees." (`:156`). Buyer protection (`:224`). | `apps/marketplace/lib/marketplace/help-faqs.ts` (lines as given) | marketplace `/help` | KEEP meaning; MAY-TIGHTEN wording |
| M5 | Checkout payment-step disclosures: "On confirm, your wallet debits and the order is held in escrow until the vendor accepts and dispatches." / bank-transfer review / card / COD (`:826-831`); "Your wallet is debited and the payment is held securely in escrow until the seller fulfils your order." (`:1296`) | `checkout-experience.tsx:826-831`, `:1296` | marketplace `/checkout` | KEEP meaning (F1 wording) |
| M6 | `/pay`: "Payment confirmed. Your order is in escrow until fulfillment lands." (`:126`); "Send the order total to the verified company account below. …" (`:130`); "Confirmed on {date}.{proof} Your payment is protected and the seller is preparing dispatch." (`:138`) | `apps/marketplace/app/(public)/pay/[orderNo]/page.tsx` | marketplace `/pay/[orderNo]` | KEEP meaning |
| M7 | Post-order acknowledgement: "Paid from your Henry Onyx balance. Held in escrow." (`:22`); "…Funds release to the seller after delivery confirms — neither side carries the risk in between." (`:24`); "Buyer protection on by default" (`:28-29`); "Escrow lifts after fulfillment" (`:59-60`); "If the seller can't fulfill, the order cancels cleanly with no charge." (`:81`); "Escrow stays on" (`:105-106`) | `apps/marketplace/components/marketplace/placement-acknowledgement.tsx` (rendered `apps/marketplace/app/(public)/track/[orderNo]/page.tsx:124`) | marketplace `/track/[orderNo]` | MAY-TIGHTEN (keep: funds held until delivery confirms; disputes freeze funds; failed acceptance = no charge) |
| M8 | Track copy: "Henry Onyx only releases seller payout after delivery is confirmed or the order qualifies for auto-release." (`:695`); "Escrow stays on until delivery confirms." (`:656`); "Escrow active" (`:666`); "Wallet balance was debited and the order is held in escrow for fulfillment." (`:670`) | `apps/marketplace/lib/public-copy.ts` | marketplace `/track`, `/track/[orderNo]` | MAY-TIGHTEN |
| M9 | Trust page: "Buyer funds are held by Henry Onyx first, then move into releasable payout only after delivery and trust checks clear." (`:974`); "Escrowed, released after checks" (`:960`); metadata/hero `:953`, `:958` | `public-copy.ts` | marketplace `/trust` | KEEP meaning (F1) |
| M10 | "Clear economics. No hidden fees." / "Plan fees, listing fees, featured-slot fees, transaction commission, and payout processing are all stated up front — before you publish inventory, not after." | `public-copy.ts:880`, `:884-885`; `apps/marketplace/app/(public)/sell/pricing/page.tsx:66` | marketplace `/sell/pricing` | MAY-TIGHTEN (the claim must stay true) |
| M11 | "Approval unlocks vendor onboarding. Pricing, posting fees, and payout windows are visible before you publish — no contract surprises later." | `public-copy.ts:871` (also `:847`) | marketplace `/sell` | MAY-TIGHTEN |
| M12 | "Buyer protection" / "Escrowed checkout" labels | `public-copy.ts:763-764`, `:1014-1015` | marketplace `/brand/[slug]`, `/collections/[slug]` | MAY-TIGHTEN (F1 wording) |
| E1 | How-we-earn. "No hidden fees, no surprise charges. If a fee applies, it's a named line item before you commit." (`:510`). "no fee turns on before its row appears here" (`:523`). "A commission on completed orders, and promoted placements always labeled as promoted." (`:529`). "A platform fee on completed bookings, itemized at checkout." (`:535`). Studio "A shared workspace, milestone clarity, and payment held until delivery." (`:548`). "Employer-side tools and postings. Candidates never pay to apply." (`:553`). "A margin on each shipment, quoted up front — the price you see is the price." (`:559`). "…verification, dispute resolution, and 24/7 support." (`:572`). | `packages/i18n/src/hub-public-copy.ts` | hub `/v3/how-we-earn` | `:529` (ad labelling) and `:553` (no candidate fee): KEEP. The rest: MAY-TIGHTEN, but every claim must stay true (F3, F5). |
| E2 | "No hidden fees — the fee line is a feature, not a confession." (`:484`); "The price is shown before you commit, in your currency, with any platform fee itemized and named." (`:663`) | `hub-public-copy.ts` | hub `/v3`, `/v3/try` | MAY-TIGHTEN |
| CR1 | "You see the price before you book." / "Garment pricing, home and office packages, and service add-ons — stated before the request is placed, not after." | `packages/i18n/src/care-pricing-copy.ts:58-60` | care `/pricing` | MAY-TIGHTEN (claim) |
| CR2 | "Every review is tied to a completed booking. We publish what you write — unedited — and nothing from a booking that never completed." | `apps/care/app/(public)/review/page.tsx:73-74` | care `/review` | KEEP meaning (review-authenticity representation) |
| LG1 | "…Final pricing may be confirmed for genuinely exceptional shipments." / "Amounts are combined with zone base fees during booking. Values shown in NGN." | `packages/i18n/src/logistics-pricing-copy.ts:53`, `:63` | logistics `/pricing` | KEEP meaning (price qualifier) |
| LG2 | "Hazardous-materials shipments — not available through online booking. Contact the business desk to discuss options." | `packages/i18n/src/logistics-business-copy.ts:140` | logistics `/business` | KEEP meaning |
| PS1 | "Bank transfer is the active payment method. Proof can be a debit alert screenshot, bank receipt, or PDF — anything showing amount, date, and destination." (`:39-40`); status bodies incl. "Refund issued. The transfer was returned to the source account." (`:28-36`) | `packages/payment-surface/src/payment-surface.tsx` | all `/pay/*` | MAY-TIGHTEN |
| PS2 | "Reference this exact amount and your record name when you send proof of payment." (`:74`); "Upload your receipt or proof below — we review and confirm it within one business day." (`:131`) | `packages/payment-surface/src/payment-guide.tsx` | all `/pay/*` | MAY-TIGHTEN |
| S1 | Studio Terms: price in NGN, "We do not pass along bank or transfer charges" (`:69-74`); deposits and milestone gating (`:80-81`); payment methods + "If anyone, internal or external, asks you to pay outside the verified company account, treat it as fraud and contact finance immediately." (`:87-88`); review window, approval by silence after 5 working days (`:94`); revisions (`:100`); IP (`:106-108`); confidentiality (`:114-115`); termination (`:121-122`); liability cap "…capped at the total amount the Client has paid to us under that engagement in the twelve (12) months preceding the claim." + "Nothing in these Terms limits liability for fraud, wilful misconduct, or anything that cannot be limited by Nigerian law." (`:128-129`); updates (`:141`) | `apps/studio/lib/studio/policies.ts` | studio `/policies/terms` | KEEP |
| S2 | Refund & Cancellation Policy: 24h cooling-off "we refund 100% of the deposit" (`:295`); schedule incl. "Any milestone marked 'complete' or 'approved' is non-refundable." / "…with a minimum of 50% retained." (`:301-307`); template reservations (`:312`); Henry Onyx-initiated cancellation (`:318`); "Refunds are paid by bank transfer to the originating account, within ten (10) working days …" (`:324`); disputes (`:330`); chargebacks (`:336`) | `policies.ts:281-343` | studio `/policies/refunds` | KEEP |
| S3 | IP and portfolio rights, incl. "Unless the Client explicitly opts out in writing before kickoff, Henry Onyx Studio reserves the right to feature the delivered project in its portfolio …" | `policies.ts:363-399` (`:387`) | studio `/policies/intellectual-property` | KEEP |
| S4 | SLA, incl. "Every engagement carries a thirty (30) day warranty from launch. … The warranty does not cover scope changes, new features, content updates, or third-party service failures." | `policies.ts:489-519` (`:513`) | studio `/policies/sla` | KEEP |
| S5 | Acceptable Use, incl. "Any project that infringes on Nigerian law, including … the Cybercrimes (Prohibition, Prevention, etc.) Act 2015." | `policies.ts:540-571` | studio `/policies/acceptable-use` | KEEP |
| S6 | Security policy (TLS, RLS, AES-256, RPO/RTO, vulnerability reporting) | `policies.ts:420-468` | studio `/policies/security` | KEEP. It is a legal page, so the A1 marketing-surface stack rule does not apply. Do not move these lines to marketing pages. |
| S7 | Checkout sidebar: "Deposit secured by milestone discipline; refundable on the published schedule." / "Encrypted in transit; private data covered by our NDPA-aligned privacy policy." | `apps/studio/app/checkout/template/[slug]/page.tsx:459`, `:463` | studio `/checkout/template/[slug]` | MAY-TIGHTEN |
| S8 | "Pay {n}% deposit & start" (`:96`); "Deposit on accept" (`:198`); "…start work the moment your deposit clears." (`:310`); pricing "Deposit" `{depositRate}%` (`pricing/page.tsx:81-84`) | `apps/studio/app/(public)/pick/[slug]/page.tsx`; `apps/studio/app/(public)/pricing/page.tsx` | studio `/pick/[slug]`, `/pricing` | MAY-TIGHTEN (the deposit % must stay visible before commitment) |
| J1 | "Posting live roles requires an active employer subscription. Candidates always browse for free; the subscription pays for moderation, anti-scam review, and candidate trust signals." | `packages/i18n/src/jobs-copy.ts:1186` | jobs `/hire` | KEEP (fee disclosure + candidate no-fee) |
| J2 | "No throwaway emails, no hidden fees, no black-hole applications — the differences add up." / "Browse for free. Sign in when you want to save or apply." | `apps/jobs/lib/public-copy.ts:218`, `:221` | jobs `/` | MAY-TIGHTEN |
| LN1 | Teach. "Henry Onyx never charges instructors to submit, review, or appeal an application. We earn when learners pay — not before." (`:179`). "Commission is deducted at sale and disclosed in the instructor agreement before publishing opens." (`:203`). Commission label `${commissionRate}% platform commission` / "Set by operator — disclosed before any approved instructor publishes" (`:66-69`). "…Terms are agreed in writing after approval—they are not promised on this page and vary by program. We never ask for payment to review your application." (`:115`). | `apps/learn/app/(public)/teach/page.tsx` | learn `/teach` | KEEP meaning |
| LN2 | "Commercial terms, including any revenue share, are discussed only after approval." | `apps/learn/app/(public)/academy/page.tsx:169` | learn `/academy` | MAY-TIGHTEN |

### 2.7 Payment-processor, "not a bank" and anti-fraud disclosures

| ID | Exact quote | file:line | Route(s) | Verdict |
|---|---|---|---|---|
| PP1 | "We are not a bank" / "We process payments through a PCI-compliant payment processor and route payouts to verified bank accounts. We do not hold deposits, issue credit, or run regulated financial products." | `company-pages.ts:358-359` | hub `/about` | KEEP (financial-regulatory disclaimer; see F1) |
| PP2 | "Bank transfer to the verified ${PARENT} corporate account is the active payment method. …" + "We do not accept cash, cheque, gift card, or cryptocurrency. …" | `apps/studio/lib/studio/policies.ts:87-88` | studio `/policies/terms` | KEEP |
| PP3 | "Bank transfer to the verified company account." | `apps/studio/app/(public)/policies/page.tsx:95` (+ L12 `:98-99`) | studio `/policies` | KEEP |
| PP4 | "Don't pay them. Off-platform payments lose all buyer protection and are usually a scam. Report the message from the chat thread; …" | `apps/marketplace/lib/marketplace/help-faqs.ts:236` (question `:234`) | marketplace `/help` | KEEP |
| PP5 | "Listings asking buyers to pay directly on WhatsApp, Telegram, crypto, or outside Henry Onyx checkout can be blocked automatically." / "Off-platform payment steering, duplicate spam listings, and suspicious media reuse can block submission or trigger moderation cases." | `policy.ts:101`, `:79` | marketplace `/policies/*` | KEEP |
| PP6 | "Encrypted · session bound · audit-logged" | `checkout-experience.tsx:819` | marketplace `/checkout` | MAY-TIGHTEN (security claim must stay true) |
| PP7 | Payee entity on `/pay` | = L8, L9, L10 | `/pay/*` | KEEP |

### 2.8 Regulatory disclaimers per division

| ID | Exact quote | file:line | Route(s) | Why | Verdict |
|---|---|---|---|---|---|
| PR1 | "Property: agent, not party to tenancy" / "Henry Onyx Property coordinates discovery, viewings, and (where engaged) managed-property operations. The tenancy contract is between landlord and tenant unless explicitly signed by Henry Onyx Property in a managed-property capacity." | `company-pages.ts:363-364` | hub `/about` **only**; the property site carries no equivalent (F12) | Agency / non-party disclaimer | KEEP |
| PR2 | "Agent-only fees are paid on tenancy formation or transaction close. Managed-property terms (where engaged) are signed separately." | `company-pages.ts:756` | hub `/terms` §4 | Fee basis | KEEP |
| PR3 | Listing trust copy. "Managed by Henry Onyx" … "Managed properties can still require documents or extra checks before the next step moves forward." (`:56-63`). "Reviewed before publication" … "Publication does not remove the possibility of later document or access verification." (`:70-78`). "Serious-listing standard" … "Higher-risk listings can move through extra checks even after they appear live." (`:83-90`). Viewing flow "…Henry Onyx may request identity, affordability, or company documents before the next approval step." (`:99-112`). | `apps/property/app/(public)/property/[slug]/page.tsx` | property `/property/[slug]` | Verification representations and their limiting qualifiers | KEEP the qualifiers; MAY-TIGHTEN the rest |
| PR4 | "A listing does not go live just because somebody filled a form. Henry Onyx holds every submission privately first, then decides whether the documents, authority, identity, and property reality are strong enough for public release." (+ inspection `:46`, `:64`) | `apps/property/app/(public)/trust/page.tsx:34` | property `/trust` | Listing-governance representation | MAY-TIGHTEN |
| PR5 | Post-submit guidance bullets, e.g. "Your submission is private until Henry Onyx approves it for publication." / "Authority proof: broker or agent-led submissions stay held until Henry Onyx can see a mandate or equivalent approval." | `apps/property/lib/property/policy.ts:291`, `:304` (+ `:309`, `:313`, `:316`, `:319`) | property `/submit` (after submit) | Mandate / authority requirement | MAY-TIGHTEN |
| JB1 | "Jobs: platform, not employer" / "Henry Onyx Jobs hosts listings and verifies candidate profiles. The employment contract is between employer and candidate; Henry Onyx is not party to the employment relationship." | `company-pages.ts:368-369` | hub `/about` **only**; jobs site has no equivalent (F12) | Non-employer disclaimer | KEEP |
| JB2 | "Employer pays. Candidates pay nothing for listings or applications. Premium candidate services are optional and priced before purchase." | `company-pages.ts:757` | hub `/terms` §4 | No-fee-to-candidates | KEEP |
| JB3 | "Candidates never pay to apply." / J1 shield notice | `hub-public-copy.ts:553`; `jobs-copy.ts:1186` | hub `/v3/how-we-earn`; jobs `/hire` | No-fee-to-candidates | KEEP |
| JB4 | Employer verification and anti-scam. `/trust`: "Before we call an employer verified, we look at who they are, how they show up publicly, and whether their story matches the roles they post. Pending does not always mean “bad” — it can simply mean “still in review.”" (`apps/jobs/app/trust/page.tsx:19`) and "New and edited job posts can be checked for scams, unclear pay, or misleading titles. …" (`:24`). `/help`: "Verified employers have passed a review of identity and intent—not just a paid badge. … We still moderate individual posts so a verified label is not a free pass to post anything." (`apps/jobs/app/help/page.tsx:35`, also `:41`). `/hire`: "Manual review — no pay-to-play" (`jobs-copy.ts:1192`), and see `:1204`, `:1211`, `:1215`. `/`: "Employer verification and post review cut down scam listings before they waste anyone's week." (`apps/jobs/lib/public-copy.ts:197`). | as listed | jobs `/trust`, `/help`, `/hire`, `/` | Anti-fraud + verification scope | MAY-TIGHTEN (keep: verification is a human review, not paid, not a guarantee) |
| JB5 | "…They reduce risk; they are not a financial guarantee, an insurance product, or a warranty by Henry Onyx of any specific outcome." (+ items) | `company-pages.ts:810`, `:813-814` | hub `/terms` §8 | Limits all trust badges | KEEP |
| LC1 | Status `t("Revoked")` / `t("Valid")` (`:120-122`), `t("Passed")` (`:200`); "has satisfied the learning and assessment requirements for" (`:164`); "Enter or follow a verification code to see the official record: learner name, course, issue date, and status. This is the same check employers and partners use—no login required." (`:129`); trust checks `:216-218` | `apps/learn/app/(public)/certifications/verify/[code]/page.tsx` | learn `/certifications/verify/[code]` | Certificate validity representation | KEEP meaning (bug F9) |
| LC2 | "Certificate-eligible courses carry a badge. Finish the required lessons, pass any assessments, and Henry Onyx Learn records the completion. …" / "You’ll see whether Henry Onyx Learn has a matching, active record — no account required to check." | `packages/i18n/src/learn-certifications-copy.ts:65`, `:89` | learn `/certifications`, `/certifications/verify` | Validity / eligibility | MAY-TIGHTEN |
| LC3 | "Enrollments, progress, quizzes, and certificates are recorded and enforced by Henry Onyx — not something a browser can fake. …" (+ `:69`, `:75`, `:81`) | `packages/i18n/src/learn-trust-copy.ts:55` | learn `/trust` | Record-integrity claim | MAY-TIGHTEN |
| LC4 | "Eligible learners receive a downloadable certificate and a verification code employers or partners can check online." | `apps/learn/app/(public)/courses/[slug]/page.tsx:485` | learn `/courses/[slug]` | Eligibility claim | MAY-TIGHTEN |
| LC5 | Learn refund rule exists only in hub terms (T1 `:758`); no learn page states a refund window | — | — | — | Note only |
| G1 | "Logistics same-day windows and care booking windows depend on operating-hours and rider coverage in the customer's city. Coverage is named, not implied." | `company-pages.ts:373-374` | hub `/about` | Service-availability limitation | KEEP meaning |
| G2 | "Device-risk signals combine with platform trust flags … Trust signals reduce but do not eliminate risk." | `company-pages.ts:313-314` | hub `/about` | Limitation sentence | KEEP the last sentence; MAY-TIGHTEN the rest |

There is no "not an accredited / government-recognised qualification" disclaimer for Learn anywhere. A grep for `accredit` finds only a sample brief in `apps/studio/components/studio/brief-copilot-panel.tsx:35`. That is a gap to flag; adding text is out of scope here.

### 2.9 Age limits (all KEEP)
- Hub `/terms` §1: "The user must be at least 18 years old …" (`company-pages.ts:706`); item "Minimum age" / "18 years" (`:709`).
- Hub `/privacy` §12: "The platform is not directed at children under 18. …" (`:611`); item "18 (with verifiable parental consent under 18)" (`:614`). This conflicts with terms §1 (F13).
- Studio privacy §10: "Studio engagements are entered into by businesses, not minors. We do not knowingly process personal data of anyone under eighteen (18). …" (`policies.ts:255`).
- Studio AUP: "Content that exploits minors in any form." (`policies.ts:546`).

### 2.10 Governing law and jurisdiction (all KEEP)
- Hub `/terms`:
  - Header: subtitle `` `Governing law: ${LEGAL.jurisdiction.governingLaw} · Effective …` `` and badge (`company-pages.ts:687-688`).
  - Intro (`:690`) and stat (`:698`).
  - §19: "These terms are governed by the laws of the ${LEGAL.jurisdiction.governingLaw}. Disputes are referred to arbitration seated in ${LEGAL.jurisdiction.arbitrationSeat} under the Arbitration and Mediation Act 2023 …" (`:950`); items `:953-958`.
  - §14 international users (`:885`), §20 mandatory local rights (`:966`), §17 sanctions (`:923-929`).
  - Values: `packages/config/legal.ts:312-326`.
- Studio:
  - `governingLaw` fields at `policies.ts:51`, `:165`, `:284`, `:358`, `:415`, `:484`, `:535`, rendered by `apps/studio/app/(public)/policies/[slug]/page.tsx:84`.
  - Terms §12: "…the parties submit to mediation in Lagos. Failing mediation, disputes are referred to the courts of Lagos State." (`policies.ts:135`). See F2.
  - Index: "Last reviewed {…} · Governed by Nigerian law" (`apps/studio/app/(public)/policies/page.tsx:37`).

### 2.11 Contact address / registered office (all KEEP)
- Hub `/privacy` §1: full registered office in prose (`company-pages.ts:455`) and item `:460`.
- Hub `/about`: `:253`, `:262`.
- Hub `/terms` §21: "…by registered courier to the registered office" (`:978`), item `:982`.
- No other public page shows a postal address. Footers show email + a masked WhatsApp link only (`site-footer.tsx:204-229`). The hub `/contact` page has no address.

### 2.12 Contradictions and gaps — flag them, do NOT "fix" them in a copy pass

| # | Finding | Evidence |
|---|---|---|
| F1 | "Not a bank / we do not hold deposits" sits against "Henry Onyx holds your payment" and repeated **escrow** wording. Escrow is a regulated term in Nigeria. Legal review needed. | `company-pages.ts:359` vs `policy.ts:65`, `:67`; `public-copy.ts:974`; `checkout-experience.tsx:826`, `:1296`; `pay/[orderNo]/page.tsx:126` |
| F2 | Dispute forum differs. Hub terms: arbitration seated in Lagos (LCA / Multi-Door). Studio terms: mediation, then the courts of Lagos State. | `company-pages.ts:950` + `legal.ts:314-315` vs `policies.ts:135` |
| F3 | Studio payment timing differs. How-we-earn says "payment held until delivery". Studio terms say the deposit comes before work and each milestone payment before the next. | `hub-public-copy.ts:548` vs `policies.ts:80` |
| F4 | Marketplace return window differs. Help says 7 days of delivery. Terms say "the window posted on the listing". The Return & Refund Policy page states no window. | `help-faqs.ts:101` vs `company-pages.ts:752` vs `policy.ts:106-114` |
| F5 | Support availability differs: "24/7 support" vs a "24h first-response target during operating days". | `hub-public-copy.ts:572` vs `company-pages.ts:303-304` |
| F6 | Account deletion differs. Help says deletion is "permanent and removes your orders…". Privacy says a 30-day soft delete, 7-year transaction retention and a manual deletion review. | `help-faqs.ts:199` vs `legal.ts:251`, `:256`; `surface-copy.ts:312` |
| F7 | Studio's sub-processor list diverges from the canonical `SUB_PROCESSORS`. Studio names "WhatsApp Cloud API" and "Anthropic / OpenAI". Canonical names "Meta WhatsApp Business" and lists 18 vendors. | `policies.ts:211-216` vs `legal.ts:223-242` |
| F8 | "Not shared with third parties" (recipient phone numbers) while SMS/WhatsApp sub-processors are listed. | `logistics-book-copy.ts:112` vs `legal.ts:236`, `:239` |
| F9 | The Learn verify page's static trust check "The verification code matches an active certificate issued by Henry Onyx Learn." also renders for **revoked** certificates. | `certifications/verify/[code]/page.tsx:215-218` vs `:119-122` |
| F10 | The property footer copyright names "Henry Onyx Property". Every other footer names "Henry Onyx Limited". | `property/components/property/site-footer.tsx:95` vs `site-footer.tsx:260` |
| F11 | The cookie consent notice is mounted only on hub + account. Seven division sites have none; care and logistics link to hub `/preferences`. | `apps/hub/app/layout.tsx:67`, `apps/account/app/layout.tsx:120`; footers `CarePublicShell.tsx:115`, `logistics (public)/layout.tsx:102` |
| F12 | Footer legal links are missing on jobs, learn, studio, property and marketplace. Marketplace links only its own policies. Present on hub, care and logistics. The agent-not-party (property) and platform-not-employer (jobs) disclaimers live only on hub `/about`. | `apps/hub/app/lib/site-footer.ts:62-66`; `CarePublicShell.tsx:116-117`; `logistics (public)/layout.tsx:103-104`; jobs `public-shell.tsx:164-191`; learn `layout.tsx:34-56`; studio `layout.tsx:55-82`; property `site-footer.tsx:13-42`; marketplace `public-copy.ts:600-613` |
| F13 | Age rule differs. Terms say users must be 18+. Privacy says "18 (with verifiable parental consent under 18)". | `company-pages.ts:706`, `:709` vs `:614` |
| F14 | Marketplace policy pages carry no effective date or version. The "Updated" field reads "On payment + dispute revisions". | `public-copy.ts:1050-1054`; `policies/[slug]/page.tsx:138-145` |
| F15 | NDPC registration and DPO render as `[OWNER-TO-CONFIRM …]` on `/privacy`. | §1 b4/b5 |
| F17 | The `/v3` newsletter capture subscribes an email with no consent checkbox (marketing consent under NDPA §25(1)(a)). Its only disclosure is `newsletterCopy.intro`. | `apps/hub/app/(site)/v3/story-newsletter.tsx:77-108`; `v3/page.tsx:125-133`; `hub-public-copy.ts:278` |
| F16 | Dead legal copy (not rendered), for awareness. `authCopy.signup.consentLine` (`auth-copy.ts:76`). Marketplace legacy `PublicFooter()` with "© … Henry Onyx Marketplace" and Privacy/Terms links (`apps/marketplace/components/marketplace/shell.tsx:99-199`, `:173`), never mounted. Care tour help with "Package prices are starting rates — actual cost may vary based on property size and extras" (`apps/care/lib/tour/help-content.ts:40`, `:45`); `HelpButton` is never mounted. | as cited |

---

## 3. Heavy email + notification templates (out of scope — list only)

**Counting method.** I count alphabetic words in the English string and template literals inside each template's code unit (its `case` clause, `if` branch, or build/send function). `${…}` values, markup, CSS, URLs, identifiers and log/error strings are stripped. Every channel and variant inside the unit is summed (email + WhatsApp + in-app, client + owner, status variants). The shared footer is excluded. Script: TypeScript-AST pass `recon/email-wordcount.mjs`.

| rank | template | file | approx EN words | division | note |
|---|---|---|---|---|---|
| 1 | Owner report email (monthly / weekly / morning brief) `renderOwnerReportEmail` | `apps/hub/lib/owner-reporting.ts:318-556` | 299 | hub (owner) | 3 variants combined |
| 2 | Care marketing nurture (service reminder + re-engagement) `sendMarketingNurture` | `apps/care/lib/automation/care-automation.ts:675-881` | 135 | care | email + WhatsApp; opt-out "Reply STOP by email if you want outreach paused." (`:834`, `:843`) |
| 3 | Studio inquiry received `sendInquiryNotifications` | `apps/studio/lib/studio/email/send.ts:338-410` | 125 | studio | client ack + owner alert + WhatsApp |
| 4 | Studio payment instructions `sendPaymentInstructionsNotifications` | `send.ts:472-548` | 112 | studio | carries bank details |
| 5 | Care booking received `buildLayout:booking_confirmation` | `apps/care/lib/email/templates.ts:454-483` | 110 | care | |
| 6 | Care payment details `payment_request` | `templates.ts:575-603` | 105 | care | carries bank details |
| 7 | Studio payment reminder `sendPaymentReminderNotification` | `send.ts:825-877` | 95 | studio | |
| 8 | Marketplace buyer welcome `buildEventCopy:buyer_welcome` | `apps/marketplace/lib/marketplace/notifications.ts:242-263` | 94 | marketplace | email + WhatsApp + in-app |
| 9 | Care customer re-engagement `customer_reengagement` | `templates.ts:822-842` | 93 | care | marketing |
| 10 | Learn instructor-application decision `sendTeacherApplicationStatusNotification` | `apps/learn/lib/email/learn-templates.ts:780-855` | 93 | learn | approved / changes / declined |
| 11 | Care staff invitation `staff_invitation` | `templates.ts:529-552` | 91 | care (staff) | |
| 12 | Care staff password recovery `password_recovery` | `templates.ts:553-574` | 91 | care (staff) | |
| 13 | Marketplace order lifecycle (placed / payment reminder / verified / shipped / delivered / delayed) | `notifications.ts:508-576` | 90 | marketplace | one builder, 6 events |
| 14 | Marketplace product review outcome (approved / changes / rejected) | `notifications.ts:472-507` | 89 | marketplace (seller) | 3 events |
| 15 | Care service reminder `service_reminder` | `templates.ts:800-821` | 86 | care | |
| 16 | Studio proposal decision `sendProposalDecisionNotifications` | `send.ts:550-584` | 85 | studio | |
| 17 | Logistics request created `notifyLogisticsRequestCreated` | `apps/logistics/lib/logistics/notify-customer.ts:68-220` | 82 | logistics | email + WhatsApp |
| 18 | Care payment receipt received `payment_receipt_received` | `templates.ts:626-650` | 81 | care | |
| 19 | Marketplace abandoned cart | `notifications.ts:697-713` | 81 | marketplace | marketing |
| 20 | Marketplace payment instructions | `notifications.ts:304-322` | 80 | marketplace | |
| 21 | Care payment reminder `payment_reminder` | `templates.ts:774-799` | 76 | care | |
| 22 | Marketplace vendor application submitted | `notifications.ts:359-378` | 76 | marketplace (seller) | |
| 23 | Care contact confirmation | `templates.ts:694-719` | 74 | care | |
| 24 | Care owner monthly summary | `templates.ts:743-773` | 74 | care (owner) | |
| 25 | Care support-desk alerts `createSupportThread` | `apps/care/lib/support/data.ts:877-997` | 73 | care (staff) | new-contact + thread-opened alerts |
| 26 | Studio aftercare check-in `sendAftercareCheckin` | `apps/studio/lib/studio/email/agency.ts:177-199` | 69 | studio | |
| 27 | Care review request `review_request` | `templates.ts:675-693` | 68 | care | |
| 28 | Care support reply `support_reply` | `templates.ts:720-742` | 65 | care | |
| 29 | Learn academy welcome `sendAcademyWelcomeNotification` | `learn-templates.ts:446-470` | 65 | learn | |
| 30 | Marketplace seller onboarding complete | `notifications.ts:431-451` | 65 | marketplace (seller) | |

- **Just below the cut:**
  - Studio review reminder, 63 (`agency.ts:152-172`).
  - Care payment-reminder automation, 63 (`care-automation.ts:550-673`).
  - Account welcome, 62 (`apps/account/lib/email/templates.ts:411-427`).
  - Marketplace vendor application rejected / changes requested, 62 each (`notifications.ts:395-430`).
  - Abandoned-journey recovery email, about 60 (`packages/i18n/src/recovery-copy.ts:121-130`).
  - Auth signup confirmation, 59 (`packages/email/auth-hook-templates.ts:110-124`).
- **Excluded (not templates despite high literal counts):**
  - Jobs `createJobPost` 180 and `createEmployerProfile` 112 (`apps/jobs/lib/jobs/write.ts`): server actions that mix validation errors with in-app payloads.
  - Care `projectThreads` 106: timeline mapper.
  - Marketplace `sendMarketplaceEvent` 94: dispatcher.
  - Hub `buildOwnerReportProps` 88: PDF report props.
  - Newsletter bodies: CMS-authored.
- **File totals (all units):**

  | File | Words |
  |---|---|
  | `apps/marketplace/lib/marketplace/notifications.ts` | 1,741 |
  | `apps/care/lib/email/templates.ts` | 1,236 |
  | `apps/studio/lib/studio/email/send.ts` | 878 |
  | `apps/learn/lib/email/learn-templates.ts` | 526 |
  | `apps/hub/lib/owner-reporting.ts` | 469 |
  | `apps/property/lib/property/notifications.ts` | 428 |
  | `apps/studio/lib/studio/email/agency.ts` | 341 |
  | `packages/email/auth-hook-templates.ts` | 303 |
  | `apps/account/lib/email/templates.ts` | 290 |
  | `apps/care/lib/automation/care-automation.ts` | 243 |

- **Shared footer** on every shared-layout email: `packages/email/layout.ts:375-413`. It holds the RC, registered office and © line (§1 d1-d3), so it must survive any future email pass.

---

## 4. packages/search-ui heavy copy (owner-reserved — list only, never modify)

**Total: about 360 words of user-facing English across ~150 strings.** The raw literal scan finds 547 words; the rest are CSS keywords, `"use client"` directives and event names, which I excluded. Heaviest first:

| words | file:line | exact string |
|---|---|---|
| 10 | `packages/search-ui/src/palette/CommandPalette.tsx:422` | "Try a single word like “orders”, “support”, “track”, or “wallet”." |
| 10 | `packages/search-ui/src/palette/KeyboardCheatSheet.tsx:45` | "Jump to a module on the rail by its position" |
| 9 | `packages/search-ui/src/palette/DashboardCommandPalette.tsx:1037` | "Try a single keyword like “orders”, “withdraw”, or “support”." |
| 9 | `packages/search-ui/src/results/SearchResultsPage.tsx:210` | "No matches. Try a different scope or shorter query." |
| 8 | `DashboardCommandPalette.tsx:1033` | "Search across orders, support, wallet, listings, and more." |
| 7 | `packages/search-ui/src/palette/error-copy.ts:31` | "Too many searches — slow down a moment." |
| 6 | `DashboardCommandPalette.tsx:94` | "Try “withdraw to my Access bank”" |
| 6 | `error-copy.ts:30` | "Your session expired. Refresh the page." |
| 6 | `KeyboardCheatSheet.tsx:34` | "Close the palette or this sheet" |
| 6 | `SearchResultsPage.tsx:187` | placeholder "Search HenryCo: orders, listings, jobs, courses…" |
| 5 | `CommandPalette.tsx:267`, `:387` | "Type to search across HenryCo" |
| 5 | `DashboardCommandPalette.tsx:98` | "Try “resume my care booking”" |
| 5 | `error-copy.ts:24`, `:33` | "Try again in a moment." |
| 5 | `error-copy.ts:27` | "Check your connection, then retry." |
| 5 | `error-copy.ts:32` | "Our search service is reconnecting." |
| 5 | `KeyboardCheatSheet.tsx:32`, `:33`, `:46` | scope "Anywhere (not inside an input)" |
| 5 | `KeyboardCheatSheet.tsx:33` | "Open this keyboard cheat sheet" |
| 5 | `KeyboardCheatSheet.tsx:130` | "On Windows / Linux, ⌘ is Ctrl." |
| 4 | `DashboardCommandPalette.tsx:93`, `:96`, `:99` | "Try “orders awaiting confirmation”" / "Try “download last invoice”" / "Try “message Studio team”" |
| 4 | `DashboardCommandPalette.tsx:454` | "Idle. Type to search." |
| 4 | `DashboardCommandPalette.tsx:1008` | "Opening that for you…" |
| 4 | `DashboardCommandPalette.tsx:1038` | "Press ? for keyboard shortcuts." |
| 4 | `KeyboardCheatSheet.tsx:31`, `:32`; `:36`; `:37`; `:38` | "Open the command palette" (×2) / "Cycle to next group" / "Cycle to previous group" / "Open the highlighted row" |
| 3–4 | `CommandPalette.tsx:420`; `DashboardCommandPalette.tsx:1032` | "No matches for "{q}"." / "No results for "{q}"" |
| 3 | `CommandPalette.tsx:412`; `DashboardCommandPalette.tsx:1022` | "Searching across HenryCo…" |
| 3 | `CommandPalette.tsx:390`, `:393`; `:589` | "Care booking confirm", "Property near me"; "esc to close" |
| 3 | `DashboardCommandPalette.tsx:95`, `:97` | "Try “verify identity”", "Try “support ticket #4382”" |
| 3 | `error-copy.ts:25`; `KeyboardCheatSheet.tsx:35` | "Cancelled. Try again."; "Move between rows" |
| 2 each | `CommandPalette.tsx`: `:171`, `:279`, `:284`, `:389`, `:391`, `:392`, `:453`, `:587`, `:588`, `:45`. `DashboardCommandPalette.tsx`: `:512`, `:513`, `:770`, `:842`, `:870`, `:909`, `:1029`, `:1050`, `:1126`. `SearchResultsPage.tsx:190`. `KeyboardCheatSheet.tsx:34-38` (scope "Palette open"). | "Search HenryCo" (×5), "Close search", "Resume cart", "Wallet withdrawal", "Marketplace orders", "Search results", "↑↓ to move", "↵ to open", "Staff HQ", "Find anything", "Couldn’t load.", "Close palette", "Search scope", "No matches", "Start typing", "Palette results", "cycle group" |
| 1 each (~85) | `aggregator.ts:35-51`, `:63-113`, `:175-180`; `CommandPalette.tsx:36-54`, `:318`, `:400`, `:430`; `DashboardCommandPalette.tsx:77-84`, `:786`, `:921`, `:1124-1128`; `KeyboardCheatSheet.tsx:31`, `:51`; `recents.ts:81`, `:86`; `SearchResultsPage.tsx:23-36`, `:104`, `:121`, `:154`, `:201` | Division and group labels ("Marketplace", "Commands", "Suggestions", "Recents"), "All", "Retry", "Keyboard"/"Shortcuts", "Relevance"/"Recent"/"Urgency", "Filters", "Division", "Sort", "Searching…" |

By file: DashboardCommandPalette ≈150, CommandPalette ≈95, KeyboardCheatSheet ≈90, SearchResultsPage ≈35, error-copy 36, aggregator/recents ≈35.

**Flags for the owner (no edit).**
- The retired code shorthand **"HenryCo"** is shown to users 9 times: `CommandPalette.tsx:171`, `:279`, `:387`, `:412`; `DashboardCommandPalette.tsx:512`, `:842`, `:1022`; `SearchResultsPage.tsx:187`, `:190`. This breaks the brand rule in `packages/config/company.ts:557-566`.
- `SearchResultsPage.tsx:203-206` renders `{error}` raw. That can surface "Search failed: {status}" (`packages/search-ui/src/hooks/useSearchQuery.ts:66`, `:72`).
