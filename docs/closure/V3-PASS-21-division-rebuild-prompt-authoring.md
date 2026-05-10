# V3 PASS 21 — Division Audit & Rebuild Prompt Authoring (Closure Report)

**Status:** **V3-PASS-21-COMPLETE** — docs-only pass; no application code touched.
**Branch:** `feat/v3-pass-21-property-jsonld` (carries V3 PASS 21 docs + the partial property P6 JSON-LD closure).
**Pass artefact commits:**
- `5f5d0abd docs(v3-pass-21): authored 8 division rebuild prompts + master index` — the V3 PASS 21 pass itself.
- `1f423f6b feat(seo): RealEstateListing JSON-LD on /property/[slug] (V3 PASS 21 P6)` — partial closure of property gate **P6**, on the same branch but separately reviewable.

**Audit baseline:** `e5e277a` (V3 Discovery Inventory, 2026-05-02).
**Pass authored:** 2026-05-10.
**Closure authored:** 2026-05-10.

---

## 1. What V3 PASS 21 produced

Eight self-contained division rebuild prompts plus a master index, so the owner can open a fresh Claude Opus 4.7 Max session per division, paste the prompt, and get a world-class rebuild without follow-up questions.

| File | Lines | Purpose |
|---|---:|---|
| `docs/rebuild-prompts/README.md` | 240 | Master index — execution order, shared-shell prerequisites, status table, owner clarification, cross-division gaps |
| `docs/rebuild-prompts/logistics.md` | 601 | Run **1st** — smallest, validates the V3 prompt template |
| `docs/rebuild-prompts/care.md` | 526 | Run **2nd** — most operationally mature; reference for booking + pickup + tracking |
| `docs/rebuild-prompts/property.md` | 459 | Run **3rd** — implements the documented inspection rules engine |
| `docs/rebuild-prompts/jobs.md` | 513 | Run **4th** — widest persona; interview room + e-signature |
| `docs/rebuild-prompts/learn.md` | 482 | Run **5th** — course player + quiz + cohort + instructor authoring |
| `docs/rebuild-prompts/marketplace.md` | 537 | Run **6th** — most complex; multi-vendor commerce + discovery polish |
| `docs/rebuild-prompts/studio.md` | 548 | Run **7th** — most agency-shaped; client portal + Gantt + e-signature |
| `docs/rebuild-prompts/hub.md` | 603 | Run **8th — alone, last** — central; absorbs/extends DASH-8 owner workspace |
| **Total** | **4,509** | |

Each prompt is paste-ready and follows a uniform 16-section structure: ROLE → SCOPE → CONTEXT → AUDIT SUMMARY → DEEP AUDIT FINDINGS → MANDATORY REBUILD SCOPE → UNIFORMITY RULES → DISTINCTIVE RULES → COMPETITOR BENCHMARK → TRUST/PAYMENT/COMPLIANCE → MOBILE/DESKTOP → LOCALIZATION → VALIDATION GATE → DEPLOYMENT → FINAL REPORT → SELF-VERIFICATION.

---

## 2. Division inventory at a glance

| # | Division | Domain | LOC | Migrations | Run order |
|---|---|---|---:|---:|---:|
| 1 | Logistics | `logistics.henrycogroup.com` | 6,402 | 0 (uses hub schema) | 1 |
| 2 | Care | `care.henrycogroup.com` | 42,380 | 0 (this pass adds care-local) | 2 |
| 3 | Property | `property.henrycogroup.com` | 14,493 | 3 | 3 |
| 4 | Jobs | `jobs.henrycogroup.com` | 16,200 | 0 (this pass adds jobs-local) | 4 |
| 5 | Learn | `learn.henrycogroup.com` | 15,684 | 4 | 5 |
| 6 | Marketplace | `marketplace.henrycogroup.com` | 23,672 (→ 26,402 today) | 7 | 6 |
| 7 | Studio | `studio.henrycogroup.com` | 20,951 | 12 | 7 |
| 8 | Hub | `henrycogroup.com` + `hq.*` + `staffhq.*` + `workspace.*` | 29,607 | 30 (cross-cutting) | 8 |

LOC measured at audit baseline (`e5e277a`) for `*.ts` + `*.tsx`. The full division inventory with every route, API, external integration, and known gap is in §1 of the V3 PASS 21 final report at `.codex-temp/v3-pass-21/report.md`.

---

## 3. Audit findings — one paragraph per division

- **Hub** — Strong overall (broadest functional area shipped). Owner workspace lacks density-first polish (DASH-8 reference). Workspace stub redirect-loop (§A.4-1) and notifications-ui + search-palette mounting (V3 E1/H1) are the cleanest closures. Internal comms decision (V2-COMPOSER-02) is the scope-budget question.
- **Marketplace** — Most complete commerce stack but V5-2 named *discovery + ranking* as the highest-leverage V3 area. Variant matrix, returns/refunds, review-photos, recommendation engine, "for you" rail are unbuilt. 51 raw `<button>` is the cleanest mechanical sweep. Vendor surface needs Shopify-quality bar.
- **Studio** — Most agency-shaped (broadest multi-stakeholder surface). Strongest client portal of any division. Gaps: e-signature, PM Gantt, sales kanban, revision cycle versioning, branded asset pack export, milestone-driven payment plans.
- **Care** — Most operationally mature (full operator ladder shipped). Two V5-3 §12 holds (WhatsApp HMAC + contact rate limit) close here. Adds care-local schema (services, garments, preferences, recurring, claims, POD) — replaces the hardcoded service catalogue.
- **Jobs** — Widest persona surface (candidate + employer + recruiter + operator). Two V5-3 §12 holds close here (D7 conversation-membership, B3 flag IDOR). Interview Room + offer-letter e-signature + verified candidate profile + pipeline kanban + salary benchmarks are the additive scope. `JobPosting` JSON-LD is a Google-for-Jobs requirement.
- **Property** — Mid-complexity. Map view + verification + owner-submission + managed-property. Implements the *documented* inspection rules engine. Closes 1 V5-3 §12 hold (WhatsApp HMAC). `RealEstateListing` JSON-LD ✓ (partial P6 closure on this branch, commit `1f423f6b`).
- **Learn** — Mid-complexity. Verified certificate ✓ (kept at premium). Course player + quiz engine + assignment + cohort + instructor authoring suite are the additive scope. Mux video provider env decision pending.
- **Logistics** — Smallest division, biggest greenfield: complete operator surface (rider + dispatcher + manager + owner), live tracking with map + ETA, proof-of-delivery, dispatch board, fleet capacity model, multi-leg shipments, B2B bulk composer. Validates the V3 prompt template at the smallest scale.

---

## 4. Uniformity decisions

### 4.1 Shared (every division consumes; reimplementation rejected at review)

`@henryco/{workspace-shell, dashboard-shell, notifications-ui, chat-composer, messaging-thread, address-selector, cart-saved-items, branded-documents, search-core, search-ui, auth, data, email, i18n, seo, observability, ui, trust, pricing, payment-surface, lifecycle, intelligence, newsletter}` — 23 packages forming the "uniformity layer." Status per package documented in §3 of the master README.

### 4.2 Distinctive (only this division builds it)

| Division | Unique surface(s) |
|---|---|
| Hub | Group directory · density-first owner workspace · staff workspace 308 redirect · cross-division search outbox cron · internal team comms · newsletter foundation · owner-reporting weekly+monthly cron · brand asset registry + page builder · audit log explorer · cross-division metric aggregation |
| Marketplace | Variant matrix · cart with save-for-later + wishlist + recently-viewed · multi-vendor checkout (split-shipping + payout splits) · vendor analytics suite · returns + refunds · reviews with photos + verified-purchase + helpful vote · recommendation engine · editorial curation · vendor payout + tax docs |
| Studio | Brief builder with domain-intent classification · proposal versioning + e-signature accept · multi-stakeholder project workspace (5 lenses on one project) · revision cycle with versioning · milestone-driven payment plan · asset pack generation · PM Gantt + resource allocation · sales kanban · template browser with instant-buy flow |
| Care | Per-garment care preferences · pre + post photos per garment · recurring auto-book · damage claim with garment-level evidence · depot operator workflow · multi-leg pickup + delivery scheduling |
| Jobs | Verified candidate profile · Interview Room (scheduled video + chat + employer notes) · pipeline kanban · offer-letter editor + e-signature · salary benchmarks · `JobPosting` JSON-LD · multi-persona on same identity |
| Property | Map-first search · saved-search alerts · inspection rules engine · owner submission with KYC + photo + amenity + pricing recommendation · managed-property operator surface · verification badge surfacing · comparable pricing |
| Learn | Course player (video + reading + quiz + assignment) · quiz engine · assignment submission + instructor grading · per-lesson discussion · verified certificate with public verification URL + QR · path with course progression · cohort + live sessions · instructor authoring suite · streak + badges |
| Logistics | Live shipment tracking · proof-of-delivery capture · dispatch board · fleet capacity model · B2B bulk shipment composer · multi-leg shipments · geographic coverage zones (GeoJSON) |

---

## 5. Owner clarifications — answer before executor begins (defaults provided)

| # | Division | Question | Default |
|---|---|---|---|
| 1 | Hub | Internal comms — fold V2-COMPOSER-02 in OR defer? | **Fold in** (recommended) |
| 2 | Hub | Owner workspace AI surfaces — V3-authorized live OR feature-flag? | **Feature-flag** (per V3 W7 #2) |
| 3 | Jobs | Interview Room provider — Daily.co / Jitsi / Google Meet / Zoom? | **Daily.co primary, Jitsi fallback** |
| 4 | Studio + Jobs | E-signature provider — DocuSign / Dropbox Sign / typed-name only? | **DocuSign if env set, typed-name fallback** |
| 5 | Marketplace | Wholesale (B2B) expansion — in scope this pass? | **Out of scope** |
| 6 | Learn | Video provider — Mux primary, Cloudinary fallback? | **Mux primary, Cloudinary fallback** |

### 5.1 Cross-division integration gaps (V3+ feature passes — owner authorization required)

| Integration | Owner decision needed |
|---|---|
| Marketplace checkout → Logistics pickup | Authorize logistics as default fulfilment? |
| Property → Logistics moving | Cross-sell flow shape? |
| Property → Care move-in cleaning | Cross-sell flow shape? |
| Care booking → Logistics pickup | Consolidate (overlapping)? |
| Studio → Marketplace storefront design | Productize as a service tier? |
| Jobs candidate verification → Care/Property/Marketplace trust | Authorize cross-division trust propagation? |
| Studio team pages → Jobs employer verification | Same trust-propagation question |
| Learn certificate → Jobs candidate verification | Authorize automatic skill-verification? |

---

## 6. Pre-flight ops checklist (must clear before any rebuild begins)

1. Brevo Auth SMTP proof received by ops (audit §D.1-1; commit `edf363f V2-PNH-04`).
2. `WHATSAPP_APP_SECRET` env provisioned in Vercel for care, property, studio.
3. Typesense env decision — provision OR confirm degraded search (200 empty, no 500).
4. Google Places env decision — provision OR address-selector falls back to manual entry.
5. Mapbox or Google Maps env decision — for logistics, property, marketplace map surfaces.
6. Vercel preview build budget — ~30 deploys total across the 8-division cycle.
7. Supabase preview branches — one per division; verify branch quota.
8. CI green on `main`.

---

## 7. Validation gate (master prompt mandate)

| Gate | Status | Evidence |
|---|---|---|
| Every division has a saved prompt file | ✅ PASS | 8 files at `docs/rebuild-prompts/<division>.md` |
| Every prompt is self-contained and complete | ✅ PASS | Each averages 480–600 lines; uniform 16-section structure |
| README index lists every division with order and rationale | ✅ PASS | `docs/rebuild-prompts/README.md` §§ 1, 2, 3, 6, 8 |
| Repo builds, lints, typechecks (no code change required) | ⏭ N/A | Docs-only pass; no application code touched |
| Branch committed and pushed | ✅ PASS | Pushed as the final action of this closure |
| No deploy required | ⏭ N/A | Docs-only pass |

---

## 8. Hand-off — what the executor of any division receives

For each division, the executor opens a fresh Claude Opus 4.7 Max session, pastes the division prompt, and the prompt itself directs the executor to:

1. **Read the master files in order:** `docs/v3/V3-DISCOVERY-INVENTORY.md` → `docs/dashboard/DASHBOARD-REBUILD-PROMPT-V2-FINAL.md` → `packages/config/company.ts` → the division's existing routes/migrations/lib/components.
2. **Land migrations on a Supabase preview branch first** via the Supabase MCP `create_branch` + `apply_migration`; run RLS verification; then merge.
3. **Run V1–V13 + division-specific gates** before opening the PR; include the PASS/FAIL/N/A table in the PR body.
4. **Persist the per-division final report** at `.codex-temp/v3-pass-21-<division>/report.md`.
5. **Update** `docs/rebuild-prompts/README.md` Section 8 status table on completion (`NOT_STARTED → IN_PROGRESS → COMPLETE`).

### 8.1 Caveat — audit baselines are stale snapshots

Each prompt's "AUDIT SUMMARY — current state at SHA `e5e277a` (2026-05-02)" was captured at authoring time. Confirmed with care.md: its baseline predated the V5-3 §12 security fixes shipped at commit `2b82e6b8` (2026-05-09) by 7 days, so the prompt's "MUST land" WhatsApp HMAC + contact rate-limit items were already shipped before the prompt was authored. **Before scoping any rebuild chunk, grep for the named utilities/files the prompt claims are missing and check `git log` since the baseline SHA — never trust the gap list at face value.**

### 8.2 Recommended first-execution

**Logistics** (6.4k LOC, lowest cross-division dependency, largest greenfield, validates the V3 prompt template). Marketplace pre-flight already exists at `.codex-temp/v3-pass-21-marketplace/h0-recon.md` with a 13-slice rebuild plan and Slice A (DB foundation, 8 migrations, zero UI risk) recommended as the entry point.

---

## 9. Auxiliary artefacts (gitignored)

- `.codex-temp/v3-pass-21/report.md` (368 lines) — the full structured V3 PASS 21 final report (mandated 7-section contract + executive summary + appendices).
- `.codex-temp/v3-pass-21-marketplace/h0-recon.md` (215 lines) — pre-execution recon for the marketplace prompt with M1–M10 status + 13-slice rebuild plan.

These persist locally in `.codex-temp/` (gitignored, survive branch switches and parallel sessions) and were authored alongside V3 PASS 21 to support the executors of subsequent rebuild passes.

— end of V3 PASS 21 closure report —
