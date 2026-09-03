# V3 PASS 21 — Division Rebuild Prompts (Master Index)

**Authored:** 2026-05-10 by V3 PASS 21 (Division Audit & Rebuild Prompt
Authoring) — Claude Code · Opus 4.7 · 1M context · xhigh.
**Audit baseline:** `origin/main` HEAD `e5e277a` (V5-2, 2026-05-02
23:51 UTC across 9 of 10 web apps) — see
`docs/v3/V3-DISCOVERY-INVENTORY.md` for full state-of-platform.

This directory contains a **complete, self-contained rebuild prompt
per Henry Onyx division**. Each prompt is paste-ready: open a fresh
**Claude Opus 4.8 ultracode (max effort)** session, paste the prompt,
and it should produce a world-class rebuild without follow-up questions.

> **⭐ REQUIRED FIRST READ — the craft bar:**
> [`LAUNCH-SHOWCASE-CRAFT-STANDARD.md`](./LAUNCH-SHOWCASE-CRAFT-STANDARD.md).
> Every division prompt below INHERITS it. It defines the launch-grade
> cinematic craft (scroll-driven build, cinematic clips, film grain,
> glass cards — used with restraint, where appropriate), the page-by-page
> rebuild discipline, brand + voice, accessibility + performance budgets,
> and the **anti-shallow-work charter**. Read it in full before the
> division prompt: the division prompt says *what* to rebuild and *what to
> preserve*; the standard says *to what bar*.

> **Brand note (supersedes the older prompts below):** the brand is
> **Henry Onyx** (not the retired "Henry & Co."); render everything
> user-facing as Henry Onyx. Some prompts still embed legacy
> `henrycogroup.com` strings — treat them as the live domains of record
> per current config, but never print "Henry & Co." into any surface.

> **Note on naming.** The repo's git history already uses "PASS 21"
> labels for the design / hardcoded-status-hex polish (e.g., commit
> `f0079463 fix(design): PASS 21 — last hardcoded status hex in
> dashboard JSX`). To avoid collision, this V3 work uses the explicit
> tag **V3 PASS 21 — DIVISION REBUILD · `<DIVISION>`** in every
> prompt + branch name (`feat/v3-pass-21-<division>`).

---

## 1. The 8 division prompts

| # | Division | File | Live domain | LOC (TS+TSX) | Migrations |
|---|---|---|---|---:|---:|
| 1 | Logistics | [`logistics.md`](./logistics.md) | `logistics.henrycogroup.com` | 6,402 | 0 (uses hub schema) |
| 2 | Care | [`care.md`](./care.md) | `care.henrycogroup.com` | 42,380 | 0 (uses hub schema; this pass adds care-local) |
| 3 | Property | [`property.md`](./property.md) | `property.henrycogroup.com` | 14,493 | 3 |
| 4 | Jobs | [`jobs.md`](./jobs.md) | `jobs.henrycogroup.com` | 16,200 | 0 (uses hub schema; this pass adds jobs-local) |
| 5 | Learn | [`learn.md`](./learn.md) | `learn.henrycogroup.com` | 15,684 | 4 |
| 6 | Marketplace | [`marketplace.md`](./marketplace.md) | `marketplace.henrycogroup.com` | 23,672 | 7 |
| 7 | Studio | [`studio.md`](./studio.md) | `studio.henrycogroup.com` | 20,951 | 12 |
| 8 | Hub | [`hub.md`](./hub.md) | `henrycogroup.com` + `hq.*` + `staffhq.*` + `workspace.*` | 29,607 | 30 (hub-level cross-cutting) |

Status per division: **NOT_STARTED**.

---

## 2. Recommended execution order

Run the prompts in this sequence. Each session should commit + push +
report before the next session begins, so executors observe each
division's outcome before starting the next. The order maximizes
template validation (start small) and dependency safety (hub last,
since hub's owner workspace surfaces every other division).

| Order | Division | Why this position |
|---:|---|---|
| 1 | **Logistics** | Smallest division (6.4k LOC); validates the V3 prompt template. Operator surface is the largest greenfield piece — exercises every uniformity rule. Lowest cross-division dependency. |
| 2 | **Care** | Most operationally mature (full operator ladder shipped). Reference standard for booking + pickup + tracking + support patterns the rest of the ecosystem inherits. Closes 2 V5-3 §12 holds (WhatsApp HMAC, contact rate limit). |
| 3 | **Property** | Mid-complexity. Surfaces map view + verification + owner-submission + managed-property — implements the documented inspection rules engine. Closes 1 V5-3 §12 hold (WhatsApp HMAC). |
| 4 | **Jobs** | Mid-complexity with widest persona surface (candidate + employer + recruiter). Closes 2 V5-3 §12 holds (D7 conversation membership, B3 flag IDOR). Introduces e-signature + interview room. |
| 5 | **Learn** | Mid-complexity. Course player + quiz engine + assignment + cohort + instructor authoring suite. Verified-certificate already shipped — keeps that quality. |
| 6 | **Marketplace** | High-complexity. Multi-vendor commerce with the largest V3 backlog (V5-2 hand-off named marketplace expansion as highest-priority candidate). Uses every V2 primitive (cart-saved-items, pricing, branded-documents, payment-surface, search-core, address-selector). |
| 7 | **Studio** | High-complexity. Most agency-shaped (broadest persona: client + sales + PM + delivery + finance + owner). Uses messaging-thread + chat-composer end-to-end. Closes 1 V5-3 §12 hold (WhatsApp HMAC). |
| 8 | **Hub** | Most central. Marketing root + owner workspace + staff workspace + cross-division search + internal comms + owner-reporting all converge. Owner workspace is density-first (DASH-8 reference) and absorbs/extends DASH-8 if not already shipped. **Run last so the owner workspace can surface what each division actually exposes** (the hub directory + division control center references every division's operator metrics, search-indexed entities, and cross-division alerts). |

### Parallelism

- **Sequential is the default.** Each prompt assumes the previous
  prompt has merged.
- **Logistics + Care + Property + Jobs + Learn MAY run in parallel**
  IF executors coordinate Supabase preview branches (one branch per
  division to avoid migration race) AND if each PR independently
  passes the V1–V13 gate.
- **Marketplace + Studio MAY run in parallel** with the above five
  IF the executor is comfortable with merge conflicts in shared
  packages (`@henryco/branded-documents` template additions —
  resolve by importing template at end-of-list per file).
- **Hub MUST run last and alone.** It depends on knowing what each
  division surfaces.

---

## 3. Shared-shell prerequisites — MUST exist before any division rebuild begins

These cross-division packages are the "uniformity layer." Every division
prompt assumes they are in production at the quality level shipped in
V2 + V5. Verify each at the executor's pre-flight before starting any
division.

| Package | Purpose | Status (audit baseline) |
|---|---|---|
| `@henryco/workspace-shell` | Sidebar + mobile-header + bottom-nav (authenticated chrome) | ✓ shipped (Phase 1+) |
| `@henryco/dashboard-shell` | `<Panel>`, `<MetricCard>`, `<ActionButton>`, `<EmptyState>`, `<LoadingSkeleton>`, `<ErrorBoundary>`, `<DivisionImage>`, `<TypeaheadGrid>`, `<BottomSheet>`, `<Drawer>`, `<FocusRing>`, `<SignalCard>`, `<QuickLink>`, `<Chip>`, `<Badge>`, `<Section>` | ⚠ DASH-1 deliverable; verify each primitive is present or add as needed |
| `@henryco/notifications-ui` | Bell + popover + toast viewport + severity + icons + motion + swipe + deep-link | ✓ shipped (V2-NOT-02-A); needs broader rollout (V3 E1) |
| `@henryco/chat-composer` | Premium chat input (autosize textarea, attachments, drafts, mobile full-screen) | ✓ shipped (V2-COMPOSER-01); 5 surfaces consume |
| `@henryco/messaging-thread` | Shared thread engine (Phase 3a) | ✓ shipped; studio + jobs migrated |
| `@henryco/address-selector` | Address autocomplete + KYC matcher + canonical user_addresses | ✓ shipped (V2-ADDR-01); 4 divisions consume |
| `@henryco/cart-saved-items` | Save-for-later, recently-viewed, cart-recovery primitives | ✓ shipped (V2-CART-01); marketplace + account consume |
| `@henryco/branded-documents` | React-PDF templates (invoice, receipt, KYC, certificate, support thread, etc.) | ✓ shipped (V2-DOCS-01); divisions add their own templates |
| `@henryco/search-core` | Typesense client + ranking + outbox drain + scoped key issuance | ✓ shipped (V2-SEARCH-01); env not provisioned (Typesense host + keys) |
| `@henryco/search-ui` | Cmd/Ctrl+K command palette + search-results page | ✓ shipped (V2-SEARCH-01); needs mounting on remaining 6 division shells (V3 H1) |
| `@henryco/auth` | `requireUnifiedViewer`, `getViewerRoles`, SQL `is_staff_in()` | ⚠ DASH-1 deliverable; verify package exists or extract from existing app-local helpers |
| `@henryco/data` | Cross-division data helpers | ⚠ DASH-1 deliverable; verify or extract |
| `@henryco/email` | Purpose-aware sender (Resend primary, Brevo fallback) | ✓ shipped |
| `@henryco/i18n` | Locale resolution + translation surfaces + `translateSurfaceLabel` | ✓ shipped (11 locales) |
| `@henryco/seo` | JSON-LD + OG + manifest + robots/sitemap utilities | ✓ shipped (V2-SEO-01 PR-A) |
| `@henryco/observability` | Sentry + structured logger | ⚠ DASH-1 deliverable; add `@sentry/nextjs` if not present |
| `@henryco/ui` | HenryCoMonogram, HenryCoWordmark, HenryCoLockup, HenryCoHeroCard, HenryCoTactileCard, PublicProofRail, PublicSpotlight, SupportDock, Live primitives | ✓ shipped |
| `@henryco/trust` | Trust scoring + review safety helpers | ✓ shipped |
| `@henryco/pricing` | Pricing engine, governance tables, breakdown persistence | ✓ shipped |
| `@henryco/payment-surface` | Single payment integration component | ✓ shipped |
| `@henryco/lifecycle` | Continue-where-you-left-off panel | ✓ shipped (V2) |
| `@henryco/intelligence` | Cross-division catalogs, search type system | ✓ shipped (V2) |
| `@henryco/newsletter` | Subscribe + transactional templates | ✓ shipped |

### Pre-flight ops checklist (must clear before V3 PASS 21 begins)

1. **Brevo Auth SMTP proof received by ops** (audit §D.1-1) — `edf363f V2-PNH-04`
   on main; SMTP proof is an ops/Brevo confirmation, not code. Without
   it, division rebuilds risk repeating the production-signup outage.
2. **`WHATSAPP_APP_SECRET` env provisioned** in Vercel for each app
   that has a WhatsApp webhook (care, property, studio). Without it,
   the V5-3 §12 HMAC fixes that each division prompt mandates will
   fail closed (intentional fail-closed) — but ops needs to be ready.
3. **Typesense env decision** — owner authorizes provisioning
   (`TYPESENSE_HOST`, `TYPESENSE_ADMIN_API_KEY`, `TYPESENSE_SEARCH_API_KEY`)
   OR confirms division rebuilds proceed with degraded search
   (returns 200 empty, no 500). Either is acceptable; decision must
   be explicit so each division's "search palette mounted" gate is
   meaningful.
4. **Google Places env decision** — `GOOGLE_PLACES_API_KEY` provisioned
   for full address autocomplete OR address-selector falls back to
   manual entry. Each division using `<AddressSelector>` must work
   in either mode.
5. **Mapbox or Google Maps env decision** — for divisions with map
   surfaces (logistics tracking, property search, marketplace store
   locator). Env set OR SVG-fallback rendered without 500.
6. **Vercel preview build budget** — confirm each division rebuild
   will produce ~3-5 preview deploys. ~30 deploys total across the
   8-division cycle.
7. **Supabase preview branches** — each division's executor creates
   one preview branch; verify branch quota.
8. **CI green on `main`** — `pnpm -r typecheck && pnpm -r lint &&
   pnpm -r build` clean.

---

## 4. What each prompt assumes you'll do BEFORE coding

Every prompt is structured identically. Before writing any code, the
executor MUST:

1. **Read the master master files** in the order listed in the prompt's
   "CONTEXT" section. Specifically:
   - `docs/v3/V3-DISCOVERY-INVENTORY.md` (state of platform)
   - `docs/dashboard/DASHBOARD-REBUILD-PROMPT-V2-FINAL.md` (verification
     gates V1–V13, anti-patterns, primitive consumption matrix)
   - `packages/config/company.ts` (canonical division config)
   - The division's own existing routes + migrations + lib + components
2. **Land migrations on a Supabase preview branch first** — every
   division prompt mandates this. Use the Supabase MCP
   `create_branch` + `apply_migration`, run RLS verification on the
   preview branch, then merge.
3. **Run the V1–V13 + division-specific gates** before opening the PR;
   include the PASS/FAIL/N/A table in the PR body.
4. **Persist the final report** at `.codex-temp/v3-pass-21-<division>/report.md`.

---

## 5. Cross-division integration gaps (deferred to V3+ feature passes)

These are integrations between divisions that the per-division prompts
acknowledge but do NOT build (because they cross division boundaries
and require owner authorization on scope):

| Integration | Owner decision needed |
|---|---|
| Marketplace checkout → Logistics pickup | Authorize logistics as default fulfilment for marketplace? Pricing model? |
| Property → Logistics moving | Cross-sell flow shape? |
| Property → Care move-in cleaning | Cross-sell flow shape? |
| Care booking → Logistics pickup | Already conceptually overlapping; consolidate? |
| Studio → Marketplace storefront design | Productize as a service tier? |
| Jobs candidate verification → Care/Property/Marketplace trust signal | Authorize cross-division trust propagation? |
| Studio team pages → Jobs employer verification | Same trust-propagation question |
| Learn certificate → Jobs candidate verification | Authorize automatic skill-verification from completed certificate? |

Each is mentioned in the relevant division's prompt as "V3 integration
gap — owner decision." None are in V3 PASS 21 scope.

---

## 6. Prompts that require owner clarification BEFORE rebuild

Every division prompt is self-contained and runnable without owner
input — but two divisions surface decisions that, if owner has a
preference, should be answered before the division's executor begins:

| Division | Open question | Default if no answer |
|---|---|---|
| **Hub** | Internal comms — fold V2-COMPOSER-02 in (refactor `InternalTeamCommsClient.tsx` to consume chat-composer + messaging-thread) OR defer? | Default: **fold in** (strongly recommended; reduces 1223-line component to ~400). |
| **Hub** | Owner workspace AI surfaces (`/owner/(command)/ai/*`) — V3-authorized to ship live, OR gate behind feature flag? | Default: **gate behind feature flag** until owner explicitly authorizes. (V3 W7 #2.) |
| **Jobs** | Interview room provider — Daily.co default, Jitsi fallback, OR Google Meet / Zoom? | Default: **Daily.co primary, Jitsi fallback** (no-account requirement makes Jitsi the right second-best). |
| **Studio** + **Jobs** | E-signature provider — DocuSign, Dropbox Sign, OR typed-name fallback only? | Default: **DocuSign if env set, typed-name fallback otherwise** (with audit_log). |
| **Marketplace** | Wholesale (B2B) expansion — in scope this pass? | Default: **out of scope** (consumer marketplace only; wholesale is a future pass). |
| **Learn** | Video provider — Mux primary, Cloudinary fallback? | Default: **Mux primary, Cloudinary fallback**. |

---

## 7. Mandatory validation before declaring V3 PASS 21 COMPLETE

V3 PASS 21 is COMPLETE when:

- [ ] All 8 prompt files exist in `docs/rebuild-prompts/`
- [ ] This README exists with execution order + status per division
- [ ] Repo `pnpm -r typecheck && pnpm -r lint && pnpm -r build` clean
      (no code change was required for V3 PASS 21 itself; only docs)
- [ ] Branch committed and pushed (PR optional; may direct-commit since
      it is docs-only)
- [ ] No deploy required (no application code changed)

V3 PASS 21 does NOT require any division to have been rebuilt. That is
follow-up work, executed via the prompts in this directory.

---

## 8. Status per division

Update this table as each division's prompt is executed.

| Division | Status | Branch | PR | Report |
|---|---|---|---|---|
| Logistics | NOT_STARTED | — | — | — |
| Care | NOT_STARTED | — | — | — |
| Property | NOT_STARTED | — | — | — |
| Jobs | NOT_STARTED | — | — | — |
| Learn | NOT_STARTED | — | — | — |
| Marketplace | NOT_STARTED | — | — | — |
| Studio | NOT_STARTED | — | — | — |
| Hub | NOT_STARTED | — | — | — |

Allowed status values: `NOT_STARTED`, `IN_PROGRESS`, `BLOCKED`,
`PARTIAL`, `COMPLETE`.
