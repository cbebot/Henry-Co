# PROPERTY — Division Rebuild Prompt (V3 PASS 21)

```
TOOL: Claude Code (Opus 4.7 · 1M context · xhigh effort)
PROJECT: HenryCo Ecosystem · henrycogroup.com
DIVISION: HenryCo Property
LIVE DOMAIN: property.henrycogroup.com
REPO: github.com/cbebot/Henry-Co
BRANCH: main (Vercel auto-deploy)
BACKEND: Supabase (single project, multi-app schema)
PASS: V3 PASS 21 — DIVISION REBUILD · PROPERTY
EXPECTED DURATION: Long. Property is mid-complexity (~14.5k LOC) with
                   listings + search + owner submission + managed-property
                   shape. The rules engine and inspection eligibility
                   model are documented but not implemented (V3 candidate).
```

═══════════════════════════════════════════════════════
ROLE
═══════════════════════════════════════════════════════

Principal product architect, division systems strategist, and
implementation engineer for HenryCo Property. You ship code, self-verify
against V1–V13 plus property-specific gates.

═══════════════════════════════════════════════════════
SCOPE
═══════════════════════════════════════════════════════

Rebuild Property end-to-end:

- Public surfaces (`property.henrycogroup.com`)
- Authenticated surfaces (account.* `?module=property`)
- Owner submission + managed listing flows
- Operator surfaces (agent, admin, moderation, operations, owner)
- Supabase tables + RLS for property
- APIs, server actions, webhooks, crons
- Property-specific components

Out of scope: shared shell + cross-division packages (UNIFORMITY RULES);
other divisions.

═══════════════════════════════════════════════════════
CONTEXT — read in this order
═══════════════════════════════════════════════════════

1. `docs/v3/V3-DISCOVERY-INVENTORY.md`
2. `docs/dashboard/DASHBOARD-REBUILD-PROMPT-V2-FINAL.md`
3. `packages/config/company.ts` — `COMPANY.divisions.property` (accent
   `#B06C3E`, accentText `#7A4924`)
4. `apps/property/` — every existing route, lib, component, vercel.json
5. `apps/property/supabase/migrations/*` — `20260402183000_property_init.sql`,
   `20260402183500_property_policies.sql`,
   `20260504135000_property_lock_owner_status_visibility.sql`
6. `docs/property-inspection-eligibility-rules.md` — owner-authored rules
   (currently documented, not implemented)
7. `docs/property-listing-governance.md` — listing lifecycle + status
8. `docs/property-storage-handoff.md` — Cloudinary + Supabase Storage split
9. `docs/property-verification-state-model.md` — verification state machine
10. `apps/property/app/api/webhooks/whatsapp/route.ts` — V5-3 §12 HMAC
    pending (V3 B1 — same family as care/studio webhooks)

═══════════════════════════════════════════════════════
AUDIT SUMMARY — current state at SHA `e5e277a`
═══════════════════════════════════════════════════════

### Routes shipped (public)
- `/`, `/area/[slug]`, `/property/[slug]`, `/search`
- `/managed`, `/submit` (owner submission), `/trust`, `/faq`
- `/login`, `/auth/callback`
- `/pay/[paymentId]`

### Routes shipped (authenticated)
- `/account/inquiries`, `/account/listings`, `/account/saved`,
  `/account/viewings`
- `/account` (overview)

### Routes shipped (operator)
- `/admin`, `/admin/listings`
- `/agent`
- `/moderation`, `/operations`, `/owner`, `/support`

### API routes
- `/api/property` (umbrella endpoint)
- `/api/cron/property-automation`
- `/api/locale`, `/api/auth/logout`
- `/api/webhooks/whatsapp` (HMAC pending — V5-3 B1)
- `/(public)/auth/confirm`, `/(public)/auth/session`

### Database
- 3 app-local migrations (init, policies, owner-status-visibility lock)
- Tables likely include: `property_listings`, `property_inquiries`,
  `property_viewings`, `property_saved`, `property_owner_submissions`,
  `property_managed_clients`, plus per-division role memberships
  (`property_role_memberships`).
- Verify exact schema via migration read; if `property_inspection_eligibility`
  or `property_rules` tables are missing, this pass adds them.

### Existing strengths
- Public discovery (search by area, listing detail) is shipped.
- Owner submission flow exists at `/submit`.
- Managed-listing surface exists at `/managed`.
- Owner submission status visibility migration locks owner-can-only-see-own
  pending submissions (`20260504135000`).

### Known gaps and bugs
- **WhatsApp HMAC** missing (V5-3 B1).
- **Inspection eligibility rules engine** is documented but not implemented
  (per `property-inspection-eligibility-rules.md`). Decisions like
  "tenant has paid 3-of-3 inspection-required steps before booking" live in
  the doc, not in code.
- **Search** is functional but no map view; faceted filters likely
  incomplete; saved searches not modeled.
- **Listing detail** has photos but no virtual tour, no floorplan, no
  "neighborhood signal" (transport, schools, amenities), no comparable
  pricing.
- **Viewings** are scheduled but no reminder + confirmation cycle, no
  calendar integration, no waitlist for popular listings.
- **Inquiries** are emailed/posted but no thread continuity (consider
  `@henryco/messaging-thread`).
- **Owner submission** flow — needs photo uploader with multi-file +
  reorder + caption, KYC gating before active listing, pricing recommendation.
- **Managed-property** surface — needs operator dashboard for managed
  clients (rent collection, maintenance tickets, financial statements).
- **Notifications-ui** not wired on property shells (V3 E1).
- **Search palette** not mounted (V3 H1).
- **Branded-documents** — `PropertyListingDocument` template deferred
  (V3 G2).
- **Trust + verification** — verification state model documented but not
  surfaced visually on listings.
- **HenryCoHeroCard** consumed on home (V2-HERO-01 ✓); copy needs
  editorial rework with capability evidence above the fold.
- **Mobile** — search results page not optimized for one-thumb scroll.

### Cross-division entry points
- Hub directory → property home ✓
- Account `?module=property` exists (carry-forward); needs upgrade
- Property → logistics for moving services (V3 integration gap)
- Property → care for "move-in cleaning" upsell (V3 integration gap)

═══════════════════════════════════════════════════════
DEEP AUDIT FINDINGS
═══════════════════════════════════════════════════════

| Dimension | Finding |
|---|---|
| **IA** | Discovery → detail → inquiry → viewing → application — public flow shipped. Owner submission → moderation → active is shipped. Managed-client operator surface is the largest gap. |
| **Flow logic** | Discover ✓; Inquire ⚠ (no thread continuity); Schedule viewing ⚠ (no reminder cycle); Apply / rent ⚠ (rules engine missing); Manage (managed-property) ✗. |
| **Cross-division** | Property → care (move-in cleaning) and property → logistics (moving) are valuable upsells, neither implemented. |
| **Empty / loading / error** | Not consistently using `<EmptyState>`. |
| **Competitor parity** | Zillow / Rightmove / Idealista / PropertyGuru — all ship: map view, saved search alerts, photo galleries with virtual tour, neighborhood signals, comparable pricing, mortgage/rent affordability calculator, agent ratings, viewing scheduler with calendar sync. Property today ships none of those calculators or alerts. |
| **Trust / payment / dispute** | No payment escrow for rent. No dispute flow. Verification state model documented but not surfaced. |
| **Mobile** | Listing detail acceptable; search results need one-thumb-scroll polish; map view absent. |
| **Accessibility** | Per-route axe pending. |
| **Performance** | Image-heavy listing detail — verify Next/Image consumption end-to-end. |
| **SEO** | Listing-level Product/RealEstateListing JSON-LD likely missing. |
| **Localization** | Locale strings ✓; per-listing description likely English-only. |
| **Data adequacy** | Schema likely lacks: `property_amenities`, `property_floorplans`, `property_virtual_tours`, `property_neighborhood_signals`, `property_comparable_pricing`, `property_saved_searches`, `property_rent_payments`, `property_maintenance_tickets`, `property_inspection_rules`. |

═══════════════════════════════════════════════════════
MANDATORY REBUILD SCOPE
═══════════════════════════════════════════════════════

### A. Public surfaces

1. **`/` (home)** — `<HenryCoHeroCard>` with property accent. Above-the-fold:
   featured listings rail (Cloudinary-optimized photos), search bar with
   area autocomplete + price + bedrooms, capability evidence (active
   listings count, average response time, verified-listings %).
2. **`/search`** — premium search results with: map view (Mapbox/Google),
   list view, faceted filters (price, beds, baths, type, area, amenities,
   verification status), sort (price asc/desc, recent, relevance), saved
   search button (writes `property_saved_searches`), pagination.
3. **`/property/[slug]`** — premium listing detail. Sections: hero photo
   gallery (with full-screen viewer + virtual-tour embed if present),
   key specs (price, beds, baths, sqm, type, parking), description,
   amenities, floorplan tab, neighborhood signals (transport, schools,
   amenities — pull from a static neighborhoods JSON or a live
   `property_neighborhood_signals` table), comparable pricing rail (3-5
   similar listings with price), agent card (with verification badge +
   rating), inquiry form (writes `property_inquiries` + creates
   `messaging_thread` if user signed in), schedule-viewing CTA opens
   `<ViewingScheduler>`, share + save CTAs.
4. **`/area/[slug]`** — premium area page with hero, area-level stats,
   listings rail, neighborhood guide.
5. **`/managed`** — managed-property landing for owners. CTAs: "Submit
   property" → `/submit`, "Talk to managed-team" → contact.
6. **`/submit`** — premium owner submission flow. Steps: (1) Property type
   + address (`<AddressSelector>`), (2) Specs (beds, baths, sqm, year),
   (3) Photos (multi-file upload to Cloudinary, reorder, caption),
   (4) Floorplan (optional), (5) Amenities, (6) Pricing recommendation
   (from `@henryco/pricing` + comparable analysis), (7) Verification
   docs (deed, ID — KYC), (8) Submit. Auth-gated.
7. **`/trust`** — verification state explained, what each badge means,
   how to get verified.
8. **`/faq`** — editorial Q&A.
9. **`/login`, `/auth/callback`, `/pay/[paymentId]`** — keep; ensure
   shared `@henryco/payment-surface` integration.

### B. Authenticated surface

`account.henrycogroup.com/?module=property` (separate package
`@henryco/dashboard-modules-property`):

- **Saved listings** — grid + list toggle, "Notify on price drop", remove
- **Saved searches** — list with edit + delete + "Pause alerts"
- **Inquiries** — threaded with `@henryco/messaging-thread`
- **Viewings** — upcoming + past, "Reschedule", "Cancel", calendar export
- **My listings** (owner role) — owned listings with status, edit, photo
  upload, view inquiries, withdraw
- **Managed properties** (managed-client role) — rent statement, maintenance
  tickets, financial statements (PDF via `@henryco/branded-documents`
  `PropertyManagedStatement` template — NEW)
- **Pricing alerts** — "Price drop on saved", "Price increase on saved",
  "New listing in saved area"

The standalone property.* `/account/*` routes either redirect to account.*
or remain as thin shells (decide per-route; if redundant, redirect).

### C. Operator surfaces

- **Agent** (`/agent`) — agent's own listings, inquiries assigned,
  viewings scheduled
- **Moderation** (`/moderation`) — submission queue with verification
  checklist, approve/reject/request-more, photo review, content moderation
- **Operations** (`/operations`) — exception listings (stale, flagged,
  withdrawn), inquiry-without-response queue, viewing-no-show queue
- **Admin** (`/admin`, `/admin/listings`) — listing CRUD, area + amenity
  taxonomy, agent invite + role
- **Owner** (`/owner`) — strategic dashboard: monthly listing count,
  monthly inquiry count, conversion %, managed-portfolio value, agent
  performance leaderboard
- **Support** (`/support`) — `@henryco/messaging-thread` + composer

All consume `@henryco/workspace-shell`.

### D. Database

Add app-local migrations under `apps/property/supabase/migrations/`:

1. `<TS>_property_amenities.sql` — `property_amenities` (id, key, name jsonb,
   icon enum, category) + `property_listing_amenities` join.
2. `<TS>_property_floorplans.sql` — `property_floorplans` (listing_id,
   image_url, label).
3. `<TS>_property_virtual_tours.sql` — `property_virtual_tours` (listing_id,
   provider enum [matterport|kuula|video], external_url).
4. `<TS>_property_neighborhood_signals.sql` — `property_neighborhood_signals`
   (area_slug, signal_type enum [transport|school|amenity], name, distance_m,
   metadata jsonb).
5. `<TS>_property_saved_searches.sql` — `property_saved_searches` (user_id,
   name, criteria jsonb, alert_cadence enum, last_alert_at).
6. `<TS>_property_inspection_rules.sql` — implement rules engine per
   `property-inspection-eligibility-rules.md`. Tables: `property_inspection_rules`,
   `property_inspection_rule_evaluations`.
7. `<TS>_property_rent_payments.sql` — `property_rent_payments` (managed
   client rent ledger). RLS: managed-client + staff.
8. `<TS>_property_maintenance_tickets.sql` — `property_maintenance_tickets`
   (managed client ticket flow). RLS: managed-client + staff.
9. `<TS>_property_viewings.sql` — extend or refactor existing viewings
   table to include reminder + confirmation cycle + waitlist position.
10. `<TS>_property_realtime_publication.sql` — add listings + inquiries +
    viewings to Realtime publication.

All migrations on Supabase preview branch first; RLS verified.

### E. APIs and crons

- `POST /api/property/listings` — create/update listing (owner + agent)
- `POST /api/property/inquiries` — create inquiry, optionally open
  messaging thread
- `POST /api/property/viewings` — schedule viewing
- `POST /api/property/saved-searches` — manage saved searches
- `POST /api/property/rent/payment` — managed-client rent payment via
  `@henryco/payment-surface`
- `POST /api/property/maintenance` — file maintenance ticket
- `POST /api/property/inspection/eligibility` — rules engine evaluation
- **MUST land** WhatsApp HMAC on `/api/webhooks/whatsapp` (V3 B1)
- Cron: extend `/api/cron/property-automation`:
  - Send saved-search alerts (price drop, new listing)
  - Send viewing reminders (24h, 1h before)
  - Send inquiry-no-response alerts to agents (24h)
  - Mark stale listings (60 days no inquiry) for owner notification

### F. Components

Reuse cross-division primitives. Build (property-specific):
- `<ListingCard>`, `<ListingGrid>`, `<ListingDetail>`
- `<PropertySearchBar>` with area autocomplete
- `<PropertyMapView>` (Mapbox/Google) with cluster + listing pin
- `<PhotoGallery>` (full-screen viewer, swipe, keyboard nav)
- `<FloorplanViewer>` with zoom
- `<VirtualTourEmbed>` (Matterport/Kuula iframe with allowed-domain CSP)
- `<NeighborhoodSignals>` (transport, schools, amenities)
- `<ComparablePricingRail>`
- `<ViewingScheduler>` (calendar + slot grid + waitlist)
- `<OwnerSubmissionFlow>` (multi-step submission)
- `<RulesEngineDecision>` (renders inspection eligibility result)
- `<RentLedger>` (managed-client rent statement)
- `<MaintenanceTicketForm>`

### G. External integrations

- **Cloudinary** — listing photos, floorplans, owner-submission docs
- **Mapbox / Google Maps** — search map view, listing pin (env-gated SVG
  fallback)
- **Matterport / Kuula** — virtual tour iframes (CSP allow-list)
- **Resend** — inquiry confirmations, viewing reminders, saved-search
  alerts
- **WhatsApp** — listing inquiry inbound

### H. Crons + observability

- `/api/cron/property-automation` instrumented with structured logger +
  Sentry. Idempotent.

═══════════════════════════════════════════════════════
UNIFORMITY RULES
═══════════════════════════════════════════════════════

(Same as logistics + care — see `docs/rebuild-prompts/logistics.md` §
"UNIFORMITY RULES". Property-specific note: `@henryco/branded-documents`
adds `PropertyListingDocument` and `PropertyManagedStatement` templates.)

ALL master `DASHBOARD-REBUILD-PROMPT-V2-FINAL.md` §4.1 + §4.2
anti-patterns apply.

Property-specific anti-pattern call-outs:
- No raw `<img>` for listing photos — `<DivisionImage>` mandatory (audit
  §B.property-7 explicit finding)
- No long-scroll area picker — `<TypeaheadGrid>`
- Buttons must show idle/pending/disabled/spinner/success-lock (audit
  §B.property-7 explicit finding)
- No "Welcome back!" copy
- Use property accent `#B06C3E`; never default blue

═══════════════════════════════════════════════════════
DISTINCTIVE RULES — WHAT PROPERTY MUST BUILD
═══════════════════════════════════════════════════════

1. **Map-first search** — first-class map view alongside list view.
2. **Saved-search alerts** — only property has the cadence-based "tell me
   when..." alert primitive. Other divisions have notifications, but
   not search-criteria-based.
3. **Inspection rules engine** — per documented eligibility rules; SQL
   table + evaluation API. Unique to property.
4. **Owner submission flow** with KYC gating + photo capture + amenity +
   pricing recommendation.
5. **Managed-property operator surface** — rent ledger, maintenance
   tickets, financial statement; only property has this shape.
6. **Verification badge surfacing** — verification state model is property-
   specific; surface visually with explanation + link to `/trust`.
7. **Comparable pricing** — analytics surface only property needs.

═══════════════════════════════════════════════════════
COMPETITOR BENCHMARK
═══════════════════════════════════════════════════════

- **Zillow (US)** — best-in-class map + Zestimate + saved searches
- **Rightmove (UK)** — best-in-class agent + listing surface
- **Idealista (ES)** — best-in-class neighborhood signals + photo galleries
- **PropertyGuru (SEA)** — best-in-class verified-listing badge surfacing

The bar: a customer at `property.henrycogroup.com/search` should feel
the same calibre as Zillow, with stronger trust surfacing and editorial
photo presentation.

═══════════════════════════════════════════════════════
TRUST, PAYMENT, COMPLIANCE
═══════════════════════════════════════════════════════

- Verification state machine per `property-verification-state-model.md`.
  Surface badges visibly on listings.
- Owner submission gated by KYC (`kyc_sensitive_action_gating.md`).
- Rent payments (managed) via `@henryco/payment-surface`; pricing
  breakdown row pre-payment.
- Listing edits write to `audit_log` via `@henryco/observability`.
- Anti-fraud: photo de-duplication (perceptual hash) on submission.
- WhatsApp webhook HMAC mandatory.
- Data retention: managed-client financial statements per regulation.

═══════════════════════════════════════════════════════
MOBILE AND DESKTOP
═══════════════════════════════════════════════════════

- 320/375/390/430/768/1024 px.
- Search results: list mode mobile-default; map mode toggle; map mode
  uses bottom sheet for selected pin.
- Listing detail mobile: full-bleed photo carousel, sticky-bottom CTA bar
  (Inquire, Schedule, Save).
- Owner submission: full-screen step transitions, photo uploader native
  picker.

═══════════════════════════════════════════════════════
LOCALIZATION
═══════════════════════════════════════════════════════

- `@henryco/i18n` foundation only.
- Listing descriptions stored in jsonb i18n columns where editable; for
  user-submitted descriptions, store as raw text + render with locale
  hint (no auto-translate this pass).
- Currency display via `@henryco/pricing`.
- Date/time/number via `Intl.*`.
- RTL verified.

═══════════════════════════════════════════════════════
VALIDATION GATE — V1 through V13 + property-specific
═══════════════════════════════════════════════════════

V1–V13 from master §3. Property-specific:

- **P1** — WhatsApp HMAC verified.
- **P2** — Inspection rules engine returns deterministic results across
  ≥ 6 documented rule scenarios.
- **P3** — Owner-submission status RLS: owner sees own submission;
  others get 0 rows (per `20260504135000` migration).
- **P4** — Saved-search alert cron sends ≤ 1 notification per
  saved-search per cadence cycle.
- **P5** — Cloudinary photo upload caps at 30 MB per file, 25 photos
  per listing; rejects non-image MIME.
- **P6** — Listing JSON-LD validates against schema.org `RealEstateListing`.

═══════════════════════════════════════════════════════
DEPLOYMENT
═══════════════════════════════════════════════════════

1. Branch `feat/v3-pass-21-property`.
2. Migrations on Supabase preview branch first.
3. PR with V1–V13 + P1–P6 PASS table.
4. Vercel preview live-checked.
5. Merge → `property.henrycogroup.com`.
6. Persist report at `.codex-temp/v3-pass-21-property/report.md`.

═══════════════════════════════════════════════════════
FINAL REPORT
═══════════════════════════════════════════════════════

Sections same shape as logistics: H0 recon, files modified, migrations,
V1–V13 + P1–P6 gate table, anti-pattern audit, mobile parity, Lighthouse
+ CWV, a11y audit, hand-off, final classification.

═══════════════════════════════════════════════════════
SELF-VERIFICATION CHECKLIST
═══════════════════════════════════════════════════════

- [ ] Public surfaces in §A rebuilt with editorial premium copy
- [ ] Authenticated surface in §B unified through account.* `?module=property`
- [ ] Operator ladder in §C polished
- [ ] Migrations in §D applied with RLS verified; rules engine implemented
- [ ] WhatsApp HMAC landed
- [ ] APIs in §E shipped with idempotency + observability
- [ ] Components in §F built reusing primitives
- [ ] Map view live with cluster + pin
- [ ] Saved-search alerts working with cadence enforcement
- [ ] Verification badges surfaced visibly on listings
- [ ] Mobile parity at 6 breakpoints
- [ ] i18n: every string under a key; RTL renders
- [ ] V1–V13 + P1–P6 PASS or N/A with justification
- [ ] Final report persisted
- [ ] PR opened with PASS table in body
