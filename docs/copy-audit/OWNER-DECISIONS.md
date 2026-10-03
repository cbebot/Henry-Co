# COPY-RESET — decisions for the owner

Copy-only rules kept these out of the cut: each is code, data, a legal page, or a number you asked to
decide yourself. Ordered by severity.

## Security / correctness (code or data — not copy)

1. **Studio is down in production while Supabase is paused.** Every studio page renders "This page didn't
   load" (studio loaders throw when the database is unreachable; other divisions degrade gracefully).
2. **Property shows an internal risk score publicly.** `apps/property/lib/property/policy.ts:284-288`
   builds "… · risk N/100 · … path"; it is prepended to `verificationNotes`
   (`app/api/property/route.ts:1091`, `:1393`; staff notes `:1549-1551`) and rendered under
   "Verification notes" on the public listing page (`app/(public)/property/[slug]/page.tsx:303-305`) and to
   the submitter (`components/property/submit/PropertySubmissionForm.tsx:649`).
3. **Property badge logic.** `components/property/verification-badge.tsx:39` classifies "verified" by
   matching `/verif/i`, which also matches the auto-stamped "Owner verification pending"
   (`lib/property/store.ts:638`); published listings without a matching badge fall through to
   "Submission stage" (`:44`). The badge copy is now truthful ("Reviewed by Henry Onyx"); the
   classification should come from publish status.
4. **Stale internal badges render on live listings** — "Submission under review", "Owner verification
   pending", "Queued for review" (`store.ts:636-639`, `route.ts:1092-1096, 1545-1548`), on every card and
   counted in "Trust: N signals" (`ui.tsx:164`, `:672`).
5. **Placeholder phone numbers** `+2340000000000` in property agent data (`lib/property/demo.ts:79-80, 93,
   107-108`) would render on listing pages — conflicts with the number-purge rule.

## Claims the code does not back (truth map: `recon/claims-truth-map.md`)

6. **Refunds.** No customer-facing refund machinery exists; every refund window/timing claim is false or
   untraceable. Legal pages (hub /terms §4 refund rows; studio policies) were NOT edited — legal sign-off
   needed: keep, rewrite, or build the machinery.
7. **VAT.** Prices include VAT (carved out at 7.5 % by category) but no page says so; hub /terms promises
   tax shown before payment and "state consumption taxes added at checkout" — both false (legal page,
   not edited).
8. **"Fix the code or the copy" items** (truth map §C): marketplace "Escrow active" on unpaid/COD orders,
   seller labels and the "Verified sellers only" filter, COD accepted for every cart, cart/checkout
   free-delivery display, studio 14- vs 30-day warranty.

8a. **Marketplace code-vs-copy items left for a code pass** (truth map M-ids): M11 "Escrow active" / "In
   buyer protection" labels shown on unpaid and COD orders; M22 "Verified seller/vendor/store" and "Trusted
   seller" badges (a seller with a *pending* ID check is "Basic verified"); M23 "Verified sellers only"
   filter; M42 client free-delivery uses `>` while the server uses `≥` and ignores seller waivers; M56 COD
   accepted for every cart while copy says "eligible orders only"; M54 dispute timeline says "a refund has
   been issued" when no money moves (`apps/marketplace/app/api/marketplace/route.ts:2333-2358`).
8b. **Marketplace seed catalogue** (`seed-catalog.ts`) seeds untrue claims into live rows: "Henry Onyx
   verified", "Fast dispatch", "Concierge support", "Easy returns window", "Warranty included", "Tested
   before dispatch". Category quick-filter chips show raw tokens ("verified", "fast_delivery").
8c. **Hub /search** carried a real accessibility bug: under reduced motion the h1 and the search field
   stayed at `opacity:0`. Fixed in `apps/hub/app/(site)/search/HubSearchExperience.tsx` (`reveal()`) — the
   only behavioural change in this pass; keep it or split it out.
8d. **/pay pages** (all divisions) have no visible h1 — the h1 is `sr-only` inside
   `packages/payment-surface`.

## Legal / registration (your decision — nothing changed)

9. **RC 9594234 on public pages:** hub /about (`apps/hub/app/lib/company-pages.ts:253`, `:258`), /press/v3
   (`page.tsx:45`); also hardcoded in `packages/ai-gateway/src/doctrine.ts:22`, `:24`. TIN appears only on
   receipts, invoices and credit notes.
10. **/privacy prints placeholders verbatim:** `[OWNER-TO-CONFIRM: NDPC registration reference]` and the
    DPO line (`packages/config/legal.ts:300-301`).
11. **17 legal contradictions** for legal review (`recon/legal-and-out-of-scope.md` §2.12), e.g. "escrow"
    wording vs "not a bank", 18+ vs parental consent, a newsletter signup with no consent box.
12. **Property footer ©** names "Henry Onyx Property" (`components/property/site-footer.tsx:92`); no
    agent-not-party line on the property site.
12a. **Legal pages still describe mechanisms** (security vs legal call): hub /terms "so the trust-flag
    system can act", "rate-limiting and trust-flag suspension apply", "Trust-flag screening enforces this";
    /privacy "device-risk visitor ID", "Forensic support: 7-year audit trail + structured logging +
    error-tracing breadcrumbs"; marketplace policy summaries M1/M4/M29/M63/M65 (no effective date, F14).
12b. **Hub /terms claims without code** (H15–H18, H22): §4 refund rows, §16 "Taxes … disclosed before
    payment", §18 "State consumption taxes … added at checkout", FX/locale-currency lines, §8 badge inputs,
    §5 KYC before payout (only in unmerged PR #543).
12c. **Removed despite a legal KEEP:** "promoted placements always labeled as promoted" — no labelling
    exists in code (claims map: untraceable). Restore only if the labelling ships.
12d. **Consent:** the /v3 email capture has no consent checkbox (F17); the newsletter consent line
    "sends are paused during active support or billing issues" is only partly true
    (`packages/newsletter/src/segmentation.ts:159` hard-codes `activePaymentIncident = false`).
12e. **Pre-existing broken anchor:** `/#divisions` is linked from hub /about and several components; no
    element on `/` has that id.

## Copy that production overrides from the database

13. Care hero/about text (`care_settings` hero_title/subtitle, about_title/body) and the care services
    catalogue; property services/FAQ seed copy (needs a `PROPERTY_SEED_VERSION` bump, `store.ts:229`) and
    seeded listing badges/descriptions/agent bios; hub `company_pages` (about/contact/privacy/terms,
    including `seo_description` — the long meta descriptions may still be live), `company_faqs`,
    `company_divisions`, `company_people`, `service_verticals` (still says "verified providers");
    marketplace category/collection/brand/vendor/product text and `marketplace_settings`. The code
    fallbacks are cut; the stored versions must be edited where they exist.

## Out of scope — listed only

14. `packages/search-ui` (owner-reserved) shows "HenryCo" to users 9 times; ~360 user-facing words.
15. Heaviest emails: owner report (299 words), care marketing nurture (135), studio inquiry (125);
    heaviest files: marketplace `notifications.ts` (1,741), care `templates.ts` (1,236).
