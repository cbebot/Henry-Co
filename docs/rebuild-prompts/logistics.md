# LOGISTICS — Division Rebuild Prompt (V3 PASS 21)

```
TOOL: Claude Code (Opus 4.7 · 1M context · xhigh effort)
PROJECT: HenryCo Ecosystem · henrycogroup.com
DIVISION: HenryCo Logistics
LIVE DOMAIN: logistics.henrycogroup.com
REPO: github.com/cbebot/Henry-Co
BRANCH: main (deploy is Vercel auto-deploy from main)
BACKEND: Supabase (single project, multi-app schema)
PASS: V3 PASS 21 — DIVISION REBUILD · LOGISTICS
EXPECTED DURATION: Long. Logistics is the smallest division (~6.4k LOC)
                   and the right place to validate the V3 rebuild template
                   before larger divisions (marketplace, studio, hub).
```

═══════════════════════════════════════════════════════
ROLE
═══════════════════════════════════════════════════════

You are the principal product architect, division systems strategist, and
implementation engineer for HenryCo Logistics. You operate at production
grade. You ship code, not plans. You self-verify against the validation
gate before declaring complete.

═══════════════════════════════════════════════════════
SCOPE OF THIS PASS
═══════════════════════════════════════════════════════

Rebuild the Logistics division end-to-end across:

- Public surfaces (`logistics.henrycogroup.com`)
- Authenticated customer surface (the logistics portion of the unified
  account dashboard)
- Internal staff/operator surface (rider, dispatcher, manager, owner views)
- Owner / admin surfaces scoped to logistics
- All Supabase tables and RLS policies that belong to logistics
- All API endpoints, server actions, webhooks, and crons that belong to logistics
- All components specific to logistics

Out of scope (DO NOT TOUCH):
- The shared workspace shell (`@henryco/workspace-shell`,
  `@henryco/dashboard-shell`)
- Shared chrome (notifications-ui, chat-composer, address-selector,
  cart-saved-items, branded-documents, search-ui, auth, data, email, seo,
  i18n, observability, ui)
- Other divisions

Treat shared shell and shared packages as inviolate prerequisites — see
"UNIFORMITY RULES" below.

═══════════════════════════════════════════════════════
CONTEXT — read in this order BEFORE writing code
═══════════════════════════════════════════════════════

1. `docs/v3/V3-DISCOVERY-INVENTORY.md` (canonical state-of-platform — W1
   capacity inventory, W3 V2 capabilities, W7 owner decisions)
2. `docs/dashboard/DASHBOARD-REBUILD-PROMPT-V2-FINAL.md` (master §3
   verification gates V1–V13, §4 anti-patterns, §5 V2 primitive
   consumption matrix — all apply to this division verbatim)
3. `packages/config/company.ts` — `COMPANY.divisions.logistics` (canonical
   division accent, support email, public nav)
4. `apps/logistics/` — every existing route, lib, component, vercel.json
5. `apps/hub/supabase/migrations/20260405150000_logistics_customer_surface.sql`
   (the cross-cutting schema — logistics_addresses snapshots, customer
   visibility)
6. `packages/address-selector/` (V2-ADDR-01 — logistics MUST consume
   `<AddressSelector>` for pickup + dropoff; do NOT reimplement)
7. `packages/pricing/` (logistics pricing engine truth lives here)
8. `packages/branded-documents/` (V2-DOCS-01 — shipment receipt + invoice
   PDFs MUST go through this package)

═══════════════════════════════════════════════════════
AUDIT SUMMARY — current state at SHA `e5e277a` (2026-05-02)
═══════════════════════════════════════════════════════

### Routes shipped (public)
- `/` (home), `/services`, `/pricing`, `/coverage`, `/business`
- `/quote` (instant quote calculator)
- `/book` (full booking with KYC + address + payment)
- `/track` (tracking by code)
- `/customer` (post-booking customer landing)
- `/pay/[paymentId]` (payment surface)
- `/support` (contact + FAQ)
- `/login` (auth chooser entrypoint)
- `/[...slug]` (catch-all 404)

### API routes shipped
- `/api/auth/logout`
- `/api/cron/logistics-automation` (scheduled in `vercel.json`)
- `/api/locale`

### Database state
- **No app-local migrations.** Logistics uses hub-level shared schema:
  - `logistics_role_memberships` (operator roles)
  - `logistics_addresses` (snapshotted to logistics_*_addresses tables for
    historical fidelity)
  - `pricing_breakdowns` (V2 shared pricing governance)
  - `staff_notifications` + `customer_notifications` (V2-NOT-02-A audience
    model)
- RLS coverage on `user_addresses` confirmed; coverage on logistics-specific
  tables NOT verified end-to-end (V3 backlog A5).

### Known gaps and bugs
- **No authenticated workspace** for logistics customers beyond `/customer`.
  Booking history + address book + receipt downloads exist only via the
  unified account dashboard at `account.henrycogroup.com`. The standalone
  logistics customer surface is shallow.
- **No rider/dispatcher/manager workspace.** All operator workflows happen
  through the cross-division staff hub (`staffhq.henrycogroup.com`) — the
  logistics operator surface is **completely unbuilt** as a first-class
  product. This is the largest gap.
- **No proof-of-delivery flow** (photo + signature + GPS pin).
- **No live ETA** on `/track` — only a status string.
- **No business / B2B portal** beyond a marketing page at `/business`.
- **No fleet view** (vehicle + rider + capacity + utilization).
- **No quote-to-booking conversion** — `/quote` and `/book` are independent.
- **`/customer` exists but is functionally empty** — needs full
  authenticated home with shipments, addresses, receipts.
- **HenryCoHeroCard not consumed** on logistics home (V3 backlog J2).
- **Notifications-ui not wired** on logistics shells (V3 E1 — only account +
  hub today).
- **Search palette not mounted** on logistics shells (V3 H1).
- **Branded-documents shipping receipt PDF not yet implemented** (only
  marketplace/learn/account ship V2-DOCS-01 today).
- **No realtime spine** on `/track` (status updates require refresh).
- **No mobile-first booking** — desktop layout is scaled, not redesigned.

### Cross-division entry points
- Hub directory links to `logistics.henrycogroup.com`
- Account dashboard surfaces `logistics_*` shipment cards (carry-forward)
- Marketplace checkout COULD trigger a logistics booking but does not today
- Care pickup operations COULD route through logistics but do not today
  (these two are V3 integration gaps owner must decide on)

═══════════════════════════════════════════════════════
DEEP AUDIT FINDINGS
═══════════════════════════════════════════════════════

| Dimension | Finding |
|---|---|
| **Information architecture** | Public-only IA. No authenticated IA; everything past booking is dashboard-territory. Tracking is the strongest customer-facing surface and the weakest operator surface. |
| **User flow logic (entry → outcome)** | Quote → ❌ (handoff to /book is manual re-entry of all data). Book → ✓ (paid + tracked). Track → ✓ (code lookup). Support → ⚠ (single static page; no live thread, no severity routing). |
| **Cross-division entry points** | Hub directory ✓. Account ✓ (passive cards). Marketplace + Care to logistics ✗ (no integration). |
| **Empty / loading / error states** | Inconsistent. `/track` with no code = empty form ✓; `/track` with invalid code = 404-ish text ⚠; `/quote` partial input = no progressive feedback ✗. |
| **Competitor parity** | DHL Express / FedEx / UPS / Sendcloud / Shippo — all ship live tracking with map, push notifications, photo POD, B2B portal with bulk shipment creation, API access for integrators. Logistics today ships none of these. |
| **Trust / payment / dispute** | Pricing surface exists but no escrow. No dispute flow. No claim flow for damaged / lost packages. Receipt is post-payment-only (no invoice for B2B). |
| **Mobile parity** | Desktop layout scaled; no bottom action bar for booking flow; address autocomplete not optimized for narrow viewports. Tracking screen is the closest to acceptable. |
| **Accessibility** | Inherits PNH-04 baseline (HSTS, frame-ancestors). Per-route axe scan not yet executed (V3 N2). |
| **Performance** | Route-level p50 LCP unknown — Vercel Speed Insights enabled but no per-route budget enforced. |
| **SEO** | `@henryco/seo` JSON-LD wired for Organization. No per-service JSON-LD (Service, OfferCatalog). No FAQ JSON-LD on `/services`, `/pricing`. Sitemap entry exists. |
| **Localization** | 11 locales × foundation strings present. Logistics-specific strings (service names, pricing tiers, tracking statuses) NOT translated end-to-end. |
| **Data adequacy** | Schema models a single-leg pickup → drop-off shipment. Multi-leg, scheduled-recurring, B2B-batch, and inter-city are NOT modeled. Vehicle / rider / capacity is NOT modeled (no `fleet_vehicles`, `fleet_riders`, `rider_assignments` tables). |

═══════════════════════════════════════════════════════
MANDATORY REBUILD SCOPE
═══════════════════════════════════════════════════════

### A. Public surfaces (logistics.henrycogroup.com)

Rebuild every public route to premium standard:

1. **`/` (home)** — `<HenryCoHeroCard>` panel-tone with Logistics accent
   `#D06F32`. Above-the-fold: live capability evidence (today's
   on-time-delivery %, active fleet count, top served corridors). NO giant
   hero text that fills the viewport — premium = capability evidence above
   the fold, not headline size. Below: services rail, B2B CTA, trust
   markers (insurance, GPS-tracked, photo POD), live coverage map preview.
2. **`/services`** — services as `<HenryCoTactileCard>` grid (same-day,
   scheduled, inter-city, B2B fleet, last-mile fulfilment). Each card
   links to a service detail with pricing, SLA, geographic coverage.
3. **`/pricing`** — transparent pricing matrix per service × distance ×
   weight × urgency. Include B2B volume tiers. Pricing math from
   `@henryco/pricing` — no hardcoded numbers in JSX.
4. **`/coverage`** — interactive coverage map. Phase 1: render zones from a
   static GeoJSON; Phase 2 (deferred): live coverage from
   `logistics_coverage_zones`.
5. **`/business`** — B2B landing. CTAs: "Open business account",
   "Bulk-shipment API", "SLA contract". Form posts to
   `staff_notifications` audience `logistics:sales`.
6. **`/quote`** — instant quote with progressive form (origin → dest →
   service → weight → urgency). Each field updates the live total.
   "Continue to book" hands the quote payload to `/book` via signed JWT
   (do NOT re-enter address). Persist quotes to `logistics_quotes` with
   `quote_id` + 24h expiry.
7. **`/book`** — premium booking flow. Steps: (1) confirm/edit pickup
   address via `<AddressSelector>`, (2) confirm/edit dropoff via
   `<AddressSelector>`, (3) select service + slot, (4) review pricing
   from `@henryco/pricing`, (5) checkout via `@henryco/payment-surface`.
   Auth-gated; un-authed user gets a magic-link sign-up inline (no
   redirect to `/login`).
8. **`/track`** — premium tracking surface. Render a live status timeline,
   a live ETA (from `shipment_eta` view), a map showing current location
   pin (when in-transit), photo POD on completion, and a "Need help?"
   CTA that opens a support thread scoped to that shipment. Realtime via
   `@henryco/notifications` subscription on `customer_notifications` for
   that shipment.
9. **`/support`** — contact + FAQ. Replaces static page with a
   `<ContactForm>` posting to `staff_notifications` (audience
   `logistics:support`). Mount `SupportDock` from `@henryco/ui` for
   contextual search-with-assist.

### B. Authenticated customer surface (`/customer` and account integration)

The logistics module inside `account.henrycogroup.com` is the canonical
home for logistics customers. The standalone `/customer` route on
`logistics.henrycogroup.com` should:

- Detect signed-in user → redirect to `account.henrycogroup.com/?module=logistics`
- Anonymous user → render a "Sign in to see your shipments" card + recent
  tracking codes (cookie-stored `recent_tracking[]`)

Inside the account `logistics` module (separate package
`@henryco/dashboard-modules-logistics`):

- **Active shipments tile** — list of in-progress with live ETA, a "Track"
  CTA, a "Re-route" CTA (calls existing API), a "Contact rider" CTA (opens
  `@henryco/messaging-thread` to rider audience).
- **Address book** — `<AddressSelector>` list view of saved pickup/dropoff
  addresses (V2-ADDR-01 canonical).
- **Receipts + invoices** — list with "Download PDF" via
  `@henryco/branded-documents` `LogisticsShipmentReceipt` template
  (NEW — must be added to V2-DOCS-01 templates as part of this pass).
- **B2B account** (if user has `logistics_role_memberships.role =
  'business_admin'`) — bulk shipment composer, billing, monthly statement.
- **Disputes** — claim form for damaged/lost shipments. Posts to
  `logistics_claims` (NEW table) with photo evidence.

### C. Operator surface (rider, dispatcher, manager, owner)

This is the largest gap and requires the most work. Build inside
`apps/logistics/app/(staff)/`:

**Rider workspace** (`/(staff)/rider/`):
- `/rider` — today's queue: ordered list of pickups + drop-offs with map
- `/rider/active` — currently-on-leg view: navigation, customer contact,
  POD capture (photo + signature + GPS auto-pin)
- `/rider/history` — completed legs (filterable, exportable)
- `/rider/expenses` — fuel, maintenance log entries
- `/rider/notifications` — assigned shipment + dispatch alerts

**Dispatcher workspace** (`/(staff)/dispatcher/`):
- `/dispatcher` — live board: unassigned pickups, live rider locations,
  capacity heatmap, drag-to-assign
- `/dispatcher/zones` — zone configuration (per-corridor SLAs, surge
  pricing)
- `/dispatcher/exceptions` — failed/delayed shipments needing attention

**Manager workspace** (`/(staff)/manager/`):
- `/manager` — operations overview: today's volume, on-time %, exception
  count, revenue, fleet utilization
- `/manager/fleet` — vehicles + riders (CRUD), capacity, rotation
- `/manager/sla` — SLA dashboard per corridor
- `/manager/finance` — revenue, payouts, fuel, expenses

**Owner workspace** (`/(staff)/owner/`):
- `/owner` — strategic dashboard: monthly volume, growth, margin, top
  corridors, customer NPS, claim rate
- `/owner/business` — B2B account roster + monthly statements
- `/owner/staff` — operator directory + role assignment

All operator surfaces consume `@henryco/workspace-shell` (sidebar +
mobile-header + bottom-nav). All notification consumption via
`@henryco/notifications-ui`. All cross-division navigation via
`@henryco/search-ui` Cmd/Ctrl+K palette.

### D. Database

Add app-local migrations under `apps/logistics/supabase/migrations/`:

1. **`<TS>_logistics_quotes.sql`** — `logistics_quotes` table (id, payload
   jsonb, total_minor int, currency, expires_at, user_id nullable, source
   text, created_at). RLS: owner-can-read-own; staff (`is_staff_in('logistics')`)
   can read all.
2. **`<TS>_logistics_shipments.sql`** — `logistics_shipments` (id,
   tracking_code text unique, quote_id fk nullable, customer_user_id fk,
   pickup_address_snapshot jsonb, dropoff_address_snapshot jsonb,
   service_key text, slot timestamptz, price_breakdown_id fk to
   `pricing_breakdowns`, status enum, eta_at timestamptz nullable,
   created_at, updated_at). RLS: owner + staff.
3. **`<TS>_logistics_shipment_legs.sql`** — `logistics_shipment_legs` (for
   multi-leg + driver assignment). RLS: customer can SELECT own legs;
   staff can write.
4. **`<TS>_logistics_pod.sql`** — `logistics_proof_of_delivery` (photo_url,
   signature_url nullable, gps_lat, gps_lng, captured_at, captured_by_user_id).
   RLS: customer can SELECT own; rider can INSERT for assigned legs.
5. **`<TS>_logistics_claims.sql`** — `logistics_claims` (shipment_id fk,
   reason text, evidence_urls jsonb, status enum, created_at). RLS: owner +
   staff with `dispatcher` or higher.
6. **`<TS>_logistics_fleet.sql`** — `fleet_vehicles`, `fleet_riders`,
   `rider_assignments`. RLS: staff-only.
7. **`<TS>_logistics_b2b_accounts.sql`** — `logistics_b2b_accounts`
   (account_owner_user_id fk, name, billing_terms, sla_id fk). RLS: account
   admin + staff.
8. **`<TS>_logistics_realtime_publication.sql`** — add `logistics_shipments`
   + `logistics_shipment_legs` to the Supabase Realtime publication so
   `/track` and rider workspace can subscribe.

Every migration MUST:
- Run on a Supabase preview branch first (use the Supabase MCP
  `create_branch` + `apply_migration`).
- Include `down` semantics in a comment block.
- Wire RLS on every new table — RLS-off is rejected at review.
- Be tested against `is_staff_in('logistics', '<role>')` for SECURITY
  DEFINER predicates.

### E. APIs and crons

Add or refactor:

- `POST /api/logistics/quote` — accept `quote_payload`, return `quote_id`
  + total. Persist to `logistics_quotes`.
- `POST /api/logistics/book` — accept `quote_id` + payment intent, create
  `logistics_shipments` row, return tracking code.
- `GET /api/logistics/track/[code]` — public read of one shipment (no
  auth, no PII beyond status + ETA + map pin).
- `POST /api/logistics/pod` — rider-only, accept photo + signature,
  upload to Cloudinary, write `logistics_proof_of_delivery` row.
- `POST /api/logistics/dispatch/assign` — dispatcher-only, assign a leg to
  a rider.
- `POST /api/logistics/claims` — customer-only for own shipments, file a
  claim.
- Cron: extend `/api/cron/logistics-automation` to compute ETAs every 60s
  for in-transit shipments and to publish notifications on status change.
- Webhook: extend `apps/logistics/app/api/webhooks/whatsapp/route.ts`
  (NEW) — HMAC-verified per V5-3 §12. Customer can text the tracking code
  and receive status; `WHATSAPP_APP_SECRET` env required.

### F. Components

All division-specific components under
`apps/logistics/components/`. Reuse cross-division primitives — see
UNIFORMITY RULES.

Build (division-specific):
- `<QuoteCalculator>` — progressive multi-step form on `/quote`
- `<TrackingTimeline>` — vertical timeline with status badges and live
  ETA
- `<ShipmentMap>` — Leaflet/Mapbox tile with pickup/dropoff/current pin
- `<PODCapture>` — rider-only photo + signature + GPS capture (MediaDevices
  API + camera permission)
- `<DispatchBoard>` — drag-and-drop assignment (DnD-Kit)
- `<FleetMatrix>` — vehicle × time-of-day grid
- `<ServicesGrid>`, `<CoverageMap>`, `<BusinessLeadForm>` — public marketing
- `<BulkShipmentComposer>` — B2B CSV upload + validation + bulk submit

### G. External integrations

- **Cloudinary** — POD photos, signatures (use `apps/logistics/lib/cloudinary.ts`
  if it exists; otherwise reuse `@henryco/ui` upload helper)
- **Mapbox or Google Maps** — coverage map + tracking pin (env-gated;
  if env not set, render a static SVG fallback that does NOT 500)
- **WhatsApp Business** — tracking code lookup + status push
- **Resend** — booking confirmation, status updates, claim resolution

### H. Crons + observability

- `/api/cron/logistics-automation` runs every 60s; instrument with
  `@henryco/observability` structured logger; capture exceptions with
  `@sentry/nextjs`.
- ETA computation must be idempotent (run twice, write same value).

═══════════════════════════════════════════════════════
UNIFORMITY RULES — INHERIT FROM SHARED SHELL, DO NOT REINVENT
═══════════════════════════════════════════════════════

The following are GROUP STANDARDS. This division MUST consume them.
Reimplementing any of these is rejected at review.

| Concern | Source of truth | Notes |
|---|---|---|
| Workspace chrome (sidebar, mobile header, bottom nav) | `@henryco/workspace-shell` | All authenticated routes mount this |
| Dashboard primitives (Panel, MetricCard, ActionButton, EmptyState, LoadingSkeleton, ErrorBoundary, DivisionImage, Drawer, BottomSheet) | `@henryco/dashboard-shell` | Plain `<div className="bg-white rounded-lg shadow">` is rejected |
| Notifications (bell, popover, toast viewport, severity, icons, motion, swipe) | `@henryco/notifications-ui` | Wire on every authenticated route |
| Chat composer | `@henryco/chat-composer` | Use for any messaging surface (rider/customer, dispatcher/rider, customer/support) |
| Messaging thread engine | `@henryco/messaging-thread` | Use for any thread surface |
| Address inputs (pickup, dropoff, billing) | `@henryco/address-selector` | Always — no `<input type="text">` for addresses |
| Save-for-later, recently-viewed, recovery | `@henryco/cart-saved-items` | If applicable to B2B bulk composer |
| PDF / document exports | `@henryco/branded-documents` | All receipts, invoices, statements, claim docs go through this — add a new `LogisticsShipmentReceipt` + `LogisticsB2BStatement` template |
| Cmd/Ctrl+K palette | `@henryco/search-ui` | Mount on every authenticated shell |
| Cross-division search core | `@henryco/search-core` | Index `logistics_shipments` (operator-scope) and `logistics_b2b_accounts` (B2B admin scope) into Typesense via `search_index_outbox_v2_search_01` |
| Auth + viewer + role | `@henryco/auth` | Use `requireUnifiedViewer`, `getViewerRoles`, `is_staff_in('logistics', <role>)` |
| Cross-division data helpers | `@henryco/data` | Read shared user data through here, not direct Supabase from each module |
| Email send | `@henryco/email` | All sends via `sendEmail({ purpose, to })`. NEVER instantiate `Resend` or `Brevo` directly |
| Locale + i18n | `@henryco/i18n` | Use `translateSurfaceLabel`; surface every customer-visible string under a translation key |
| SEO (JSON-LD, OG, sitemap) | `@henryco/seo` | Use typed builders for Organization, Service, FAQ, BreadcrumbList |
| Observability (logger + Sentry) | `@henryco/observability` | Wrap every API handler |
| Hero / tactile / proof rail / spotlight cards | `@henryco/ui` `public-shell/` | Public marketing surfaces |
| SupportDock concierge | `@henryco/ui` | Mount on public + authenticated shells |
| Trust scoring | `@henryco/trust` | Trust badges on completed shipments + rider profile |
| Pricing engine | `@henryco/pricing` | All money math goes through here; no hardcoded amounts in JSX |
| Payment surface | `@henryco/payment-surface` | Single payment integration — `pay/[id]` reuses this component |

### Anti-patterns (from `DASHBOARD-REBUILD-PROMPT-V2-FINAL.md` §4)

ALL §4.1 + §4.2 apply to this rebuild. Specifically forbidden:

- Emoji-as-icon (no 🚚 📦 ⏱ in JSX — use the icon set in
  `@henryco/notifications-ui/src/icons.tsx`)
- Default Tailwind / shadcn cards with no design opinion
- Primary color = blue (use logistics accent `#D06F32` and accentText
  `#9D4F1F`)
- Friendly cartoon empty-state illustrations (typographic minimalism only)
- "Welcome to your dashboard!" patronizing copy
- Metrics without context (every metric needs comparison or trend)
- Mobile = desktop scaled down (mobile is a different layout)
- Long-scroll picker (use `<TypeaheadGrid>`)
- Raw `<img>` (use `<DivisionImage>`)
- Buttons without idle/pending/disabled/spinner/success-lock states
- Decorative tiles (every CTA must be LIVE — verified file:line trace)
- Direct Brevo / Resend instantiation
- Per-widget Supabase Realtime subscription (use `SupabaseRealtimeProvider`
  at shell root)
- Reimplemented role helpers in TypeScript (call SQL `is_staff_in()`)

═══════════════════════════════════════════════════════
DISTINCTIVE RULES — WHAT LOGISTICS MUST BUILD THAT NO OTHER DIVISION HAS
═══════════════════════════════════════════════════════

These are the irreducible logistics-specific surfaces. Owner-facing
products like Linear / Stripe do NOT have these:

1. **Live shipment tracking with map + ETA** — first-class. Realtime via
   Supabase Realtime publication on `logistics_shipments`.
2. **Proof-of-delivery capture** — photo + signature + GPS, captured on
   the rider's mobile device. Writes to `logistics_proof_of_delivery`,
   archived to Cloudinary.
3. **Dispatch board** — drag-to-assign live ops surface; not modeled by
   any other division.
4. **Fleet capacity model** — vehicle × rider × time-of-day; only
   logistics needs this shape.
5. **B2B bulk shipment composer** — CSV upload, validation, bulk submit;
   only logistics today (marketplace seller flow is similar but distinct).
6. **Multi-leg shipments** — pickup → hub → dropoff modelled in
   `logistics_shipment_legs`.
7. **Geographic coverage modelling** — `logistics_coverage_zones` with
   GeoJSON polygons.

═══════════════════════════════════════════════════════
COMPETITOR BENCHMARK
═══════════════════════════════════════════════════════

Outclass on customer experience and operational density:

- **DHL Express** — best-in-class tracking (timeline + map + push). Match.
- **Sendcloud** — best-in-class B2B portal (bulk upload, label print, API,
  carrier comparison). Match the bulk + API; carrier comparison is
  out-of-scope.
- **Shippo** — best-in-class developer API + dashboard. Match the dashboard
  density; API is V3+ scope.
- **Bolt / In-Drive (regional reference)** — best-in-class rider experience
  (one-tap accept, in-app navigation, POD-on-completion). Match.

The bar: a customer signing in from `account.henrycogroup.com/?module=logistics`
should feel they are using the same calibre of product as DHL's portal,
not a generic SaaS template.

═══════════════════════════════════════════════════════
TRUST, PAYMENT, COMPLIANCE
═══════════════════════════════════════════════════════

- **Payment** — every booking writes a `pricing_breakdowns` row before
  payment. Payment via `@henryco/payment-surface` only. PCI scope stays
  with the payment provider. Idempotency via `idempotency_and_nonce_scope`
  table (V2 hub-level migration).
- **Insurance / claim** — claim flow writes `logistics_claims`; resolution
  by manager-or-higher staff; payout via wallet adjustment writing to
  `wallet_withdrawals` after approval.
- **KYC** — B2B account creation triggers `kyc_submissions` requirement
  for the account admin. Use `kyc_sensitive_action_gating.md` rules.
- **GDPR / data retention** — POD photos and signatures retained per
  `data-retention-and-delete-readiness.md`. Customer "delete shipment
  history" only soft-deletes (financial regulation requires retention).
- **Audit log** — every operator action that mutates a shipment writes
  `audit_log` via `@henryco/observability`.
- **Webhook HMAC** — WhatsApp webhook MUST verify `X-Hub-Signature-256`
  with `WHATSAPP_APP_SECRET`. Fail closed if env missing (V5-3 B1).

═══════════════════════════════════════════════════════
MOBILE AND DESKTOP REQUIREMENTS
═══════════════════════════════════════════════════════

- Test at **320, 375, 390, 430, 768, 1024 px** (mandatory).
- Mobile rider workspace uses bottom action bar (4 anchors: Today,
  Active leg, History, Profile).
- Customer `/track` mobile: full-bleed map + sticky bottom card with
  status, ETA, "Contact rider" CTA.
- Booking flow on mobile: full-screen step transitions, sticky-bottom
  "Continue" CTA inside thumb zone, address typeahead surfaces as
  full-screen sheet.
- No CSS-media-query-only responsiveness — use `<BottomSheet>` and
  `<Drawer>` from `@henryco/dashboard-shell`.

═══════════════════════════════════════════════════════
LOCALIZATION REQUIREMENT
═══════════════════════════════════════════════════════

- MUST use the existing `@henryco/i18n` foundation. Do NOT add new
  languages this pass. Existing locales: en/fr/ar/es/pt/de/it (+ 4
  additional Tier B locales — see `docs/v3/I18N-PASS-18C-FULL-CLOSURE.md`).
- All user-visible strings (services, pricing tiers, status labels, error
  messages, empty-state copy, CTAs) under translation keys.
- Pricing display: use `@henryco/pricing` currency formatting (V2
  multi-currency foundation).
- Date / time / number formatting: `Intl.DateTimeFormat` /
  `Intl.NumberFormat` honoring user locale.
- RTL support: Arabic locale must render correctly (mirror layout via
  `dir="rtl"` on `<html>`).

═══════════════════════════════════════════════════════
VALIDATION GATE — V1 through V13 (from master §3)
═══════════════════════════════════════════════════════

Each gate must be PASS / FAIL / N/A in the final report. N/A only with
explicit justification.

| # | Gate | What it checks |
|---|---|---|
| V1 | Build + typecheck + lint | `pnpm -r typecheck && pnpm -r lint && pnpm -r build` clean. Zero new warnings. |
| V2 | Auth-continuity matrix | Customer + operator (rider, dispatcher, manager, owner) sign in and hop subdomains without re-auth |
| V3 | RLS verification | Cross-tenant SELECT/UPDATE/DELETE on every new table returns 0 rows / 0 mutations for non-owner |
| V4 | Realtime smoke | New shipment status row → `/track` updates within 2s; rider notification arrives within 2s |
| V5 | Mobile parity | Visual regression at 320/375/390/430/768/1024; CLS < 0.1; no clipped CTAs |
| V6 | Lighthouse + Core Web Vitals | Each touched route ≥ 90 Performance, ≥ 95 A11y/BP/SEO; LCP < 2.5s; CLS < 0.1; INP < 200ms |
| V7 | WCAG AA | axe-core 0 violations on shell + ≥ 3 modules |
| V8 | Sender identity | grep -r "new Brevo\|new Resend" outside documented receivers = 0 hits |
| V9 | CTA reality | Every clickable LIVE with file:line trace |
| V10 | Empty/loading/error/success | All four states tested via Playwright |
| V11 | No console errors | DevTools Console clean across role × page matrix |
| V12 | No 4xx/5xx | DevTools Network clean on happy path |
| V13 | Role × division coverage | Customer + rider + dispatcher + manager + owner all render without errors |

Additional logistics-specific gates:

- **L1** — POD capture works on iOS Safari + Chrome Android with camera
  permission denied AND granted (degrades gracefully on denied).
- **L2** — Tracking by code does NOT leak PII (full address, customer
  name) to anonymous viewers; only city + status + ETA + sanitized name
  initials.
- **L3** — Multi-currency: book in NGN, pay in USD via FX rate snapshot.
  Receipt PDF shows both amounts.
- **L4** — WhatsApp tracking code lookup returns within 3s; HMAC verified.

═══════════════════════════════════════════════════════
DEPLOYMENT
═══════════════════════════════════════════════════════

1. Branch off `main`: `feat/v3-pass-21-logistics`.
2. Land migrations on a Supabase preview branch first
   (`mcp__claude_ai_Supabase__create_branch` + `apply_migration`). Run
   the V3 RLS verification on the preview branch before merging.
3. Open PR to `main` with the V1–V13 + L1–L4 PASS table in the body.
4. Vercel preview auto-deploys; run live checks against the preview URL.
5. Merge → Vercel auto-deploys to `logistics.henrycogroup.com`.
6. Persist a final report at `.codex-temp/v3-pass-21-logistics/report.md`
   (H0 recon, SHAs, files modified, V1–V13 + L1–L4 PASS table, hand-off).
7. Do NOT manually trigger production deploys outside the merge — Vercel
   handles it.

═══════════════════════════════════════════════════════
FINAL REPORT — REQUIRED OUTPUT BEFORE DECLARING COMPLETE
═══════════════════════════════════════════════════════

Return a single report at `.codex-temp/v3-pass-21-logistics/report.md`
with these sections:

1. **H0 — Recon SHAs** — base SHA, working SHA, Vercel preview URL,
   Supabase branch ID
2. **Files modified** — full list with line counts
3. **Migrations applied** — list with table + RLS summary per migration
4. **V1–V13 + L1–L4 gate table** — PASS / FAIL / N/A with brief evidence
5. **Anti-pattern audit** — confirm §4.1 + §4.2 zero hits
6. **Mobile parity report** — screenshots at 320/375/390/430/768/1024
7. **Lighthouse + CWV** — per-route scores
8. **a11y audit** — axe report attached
9. **Hand-off** — what's deferred, what's owner-blocked, next pass
10. **Final classification** — `LOGISTICS-COMPLETE` / `LOGISTICS-PARTIAL` /
    `LOGISTICS-BLOCKED` (use the standard ladder)

═══════════════════════════════════════════════════════
SELF-VERIFICATION CHECKLIST BEFORE YOU DECLARE COMPLETE
═══════════════════════════════════════════════════════

- [ ] Every public route in §A rebuilt and live on Vercel preview
- [ ] Every authenticated route in §B + §C rebuilt
- [ ] Every migration in §D applied to preview branch with RLS verified
- [ ] Every API route in §E shipped with idempotency + observability
- [ ] Every component in §F built and consuming uniformity rules
- [ ] Every external integration in §G wired (with graceful env-missing
      degradation — no 500s)
- [ ] Cron + webhooks in §H instrumented + HMAC-verified
- [ ] Uniformity rules: zero reimplementation of shared primitives
- [ ] Distinctive surfaces: tracking, POD, dispatch, fleet, B2B all live
- [ ] Mobile parity at 6 breakpoints
- [ ] i18n: every string under a key; RTL renders
- [ ] V1–V13 + L1–L4 all PASS or N/A with justification
- [ ] Final report persisted
- [ ] Branch committed and pushed; PR opened; PASS table in body

If any item is unchecked, classification is PARTIAL or BLOCKED — not
COMPLETE. Be honest in the report.
