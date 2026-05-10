# CARE — Division Rebuild Prompt (V3 PASS 21)

```
TOOL: Claude Code (Opus 4.7 · 1M context · xhigh effort)
PROJECT: HenryCo Ecosystem · henrycogroup.com
DIVISION: Henry & Co. Fabric Care
LIVE DOMAIN: care.henrycogroup.com
REPO: github.com/cbebot/Henry-Co
BRANCH: main (Vercel auto-deploy)
BACKEND: Supabase (single project, multi-app schema)
PASS: V3 PASS 21 — DIVISION REBUILD · CARE
EXPECTED DURATION: Long. Care is the most operationally mature division
                   (~42k LOC, full operator ladder shipped) and the
                   reference baseline for booking + pickup + tracking
                   patterns the rest of the ecosystem inherits.
```

═══════════════════════════════════════════════════════
ROLE
═══════════════════════════════════════════════════════

You are the principal product architect, division systems strategist, and
implementation engineer for Henry & Co. Fabric Care. You ship code, not
plans. You self-verify against V1–V13 plus the care-specific gates below
before declaring complete.

═══════════════════════════════════════════════════════
SCOPE OF THIS PASS
═══════════════════════════════════════════════════════

Rebuild the Care division end-to-end across:

- Public surfaces (`care.henrycogroup.com`)
- Authenticated customer surface (the care portion of the unified account
  dashboard + standalone customer surfaces on care.*)
- Internal staff surfaces (rider, staff, support, manager, owner) — Care
  is the only division with the full operator ladder shipped today; this
  pass elevates them to production-grade premium
- All Supabase tables/RLS for care (currently uses hub-level shared schema;
  this pass adds care-local tables for per-service nuance)
- All API endpoints, server actions, webhooks, crons for care
- All care-specific components

Out of scope:
- Shared shell + cross-division packages (see UNIFORMITY RULES)
- Other divisions

═══════════════════════════════════════════════════════
CONTEXT — read in this order BEFORE writing code
═══════════════════════════════════════════════════════

1. `docs/v3/V3-DISCOVERY-INVENTORY.md`
2. `docs/dashboard/DASHBOARD-REBUILD-PROMPT-V2-FINAL.md` (master gates +
   anti-patterns)
3. `packages/config/company.ts` — `COMPANY.divisions.care` (accent
   `#6B7CFF`, accentText `#4F5BD0`)
4. `apps/care/` — every existing route, lib, component, vercel.json
5. `apps/hub/supabase/migrations/*` (care uses hub schema today; identify
   which tables are care-relevant)
6. `packages/messaging-thread/` (care support reply uses this; reuse, do
   not re-thread)
7. `packages/chat-composer/` (care/support/inbox/reply consumer)
8. `packages/branded-documents/` (care booking PDF — NEW template required
   per V2-DOCS-01 hand-off)
9. `apps/care/app/api/webhooks/whatsapp/route.ts` (V5-3 §12 — HMAC
   uncommitted; this pass MUST commit + verify)
10. `apps/care/app/api/care/contact/route.ts` (V5-3 §12 — rate-limit
    uncommitted; this pass MUST land)

═══════════════════════════════════════════════════════
AUDIT SUMMARY — current state at SHA `e5e277a` (2026-05-02)
═══════════════════════════════════════════════════════

### Routes shipped (public)
- `/`, `/about`, `/services`, `/pricing`
- `/book` (booking), `/track` (tracking)
- `/review` (post-service review collection)
- `/contact` (contact form)
- `/pay/[trackingCode]`
- `/unsubscribe`

### Routes shipped (operator — fullest ladder of any division)
- **Owner** (`/(staff)/owner/`): bookings, finance, impersonate, insights,
  notifications, pricing, records, reviews, security, settings, staff
- **Manager** (`/(staff)/manager/`): expenses, notifications, operations,
  pricing
- **Rider** (`/(staff)/rider/`): deliveries, expenses, history,
  notifications, pickups
- **Staff** (`/(staff)/staff/`): assignments, history, notifications
- **Support** (`/(staff)/support/`): inbox (assign, reply), outbox,
  archive, expenses, notifications, payments, reviews

### Routes shipped (auth chooser)
- `/login`
- `/workspace/access` (recovery, callback)

### API routes
- `/api/care/book`, `/api/care/bookings`, `/api/care/track`
- `/api/care/contact` (rate-limit uncommitted — V5-3 B4)
- `/api/care/payments/receipt`
- `/api/care/reviews`
- `/api/care/preferences/unsubscribe`
- `/api/cron/care-automation` (scheduled)
- `/api/owner/care-media`
- `/api/owner/whatsapp/health`
- `/api/webhooks/resend` (HMAC-verified ✓)
- `/api/webhooks/whatsapp` (HMAC NOT verified — V5-3 B1, blocking)
- `/(staff)/owner/impersonate/callback` (operator impersonation)

### Database
- Care has **0 app-local migrations**. It uses hub schema:
  - `customer_notifications`, `staff_notifications` (V2-NOT-02-A)
  - `pricing_breakdowns` (V2 shared pricing)
  - `kyc_submissions`, `trust_flags`
  - `support_threads` (note: support reply uses `@henryco/messaging-thread`)
- Care domain tables (bookings, services, riders, payments) live as
  rows in shared cross-division tables. **This pass adds care-local
  tables** for booking-specific schema (service catalogue, slot inventory,
  recurring schedule).

### Existing strengths
- Most mature operator ladder (rider → staff → support → manager → owner)
- Support thread engine + chat composer integrated end-to-end
- Resend webhook HMAC-verified
- WhatsApp + email customer touch
- Pricing surface aligned to `@henryco/pricing`

### Known gaps and bugs
- **WhatsApp HMAC missing** (`/api/webhooks/whatsapp`) — V5-3 §12, V3 B1.
  Currently fails open if `WHATSAPP_APP_SECRET` not set.
- **Care contact rate limit uncommitted** — V5-3 §12, V3 B4.
- **Booking flow IA** is acceptable but not premium — reference §B.care-7
  in `DASHBOARD-AUDIT-REPORT.md` for "long-scroll picker" anti-pattern.
- **`/track`** is shallow — single status string, no live ETA, no rider
  contact, no map.
- **Recurring booking** not modeled (weekly/biweekly garment care is the
  highest-value segment).
- **Service catalogue** is hardcoded in `apps/care/lib/services.ts` (or
  similar) — NOT in DB. Owner cannot edit pricing without redeploy.
- **Booking PDF** not yet implemented — V2-DOCS-01 hand-off lists
  `CareBookingDocument` as a deferred template (V3 G1).
- **Notifications-ui** wired in account, NOT yet in care customer surfaces
  (V3 E1).
- **Search palette** not mounted on care shells (V3 H1).
- **Operator workspaces** all use a custom layout — `@henryco/workspace-shell`
  (Phase 1) MAY have been migrated; verify and complete the migration if
  any operator route still uses a bespoke shell.
- **Trust + reviews** — review collection exists but trust score writeback
  to `@henryco/trust` may be partial.
- **Impersonation** is owner-only but lacks an audit trail entry on
  enter/exit (only on actions). Needs explicit `audit_log` write.
- **HenryCoHeroCard** is consumed on care home (V2-HERO-01 ✓) but the
  copy is generic — needs editorial rewrite with capability evidence
  above the fold (no giant hero text).

### Cross-division entry points
- Hub directory → care home ✓
- Account dashboard → care module ✓ (carry-forward)
- Care booking does NOT trigger logistics pickup (V3 integration gap —
  see logistics rebuild prompt §A.5)
- Care customer review feeds `@henryco/trust` (verify writeback)

═══════════════════════════════════════════════════════
DEEP AUDIT FINDINGS
═══════════════════════════════════════════════════════

| Dimension | Finding |
|---|---|
| **Information architecture** | Public + operator ladder both well-shaped. Customer authenticated IA is split between care.* `/track` and account.*/?module=care — needs unification (account is canonical home; care.* is service-discovery + booking-only). |
| **User flow logic (entry → outcome)** | Discover → Book → ✓; Track → ⚠ (status-only); Review → ✓; Recurring → ✗ (not modelled). Operator: Inbox → Assign → Pickup → Service → Delivery → Review — fully shipped but each step needs premium polish. |
| **Cross-division entry points** | Care → logistics pickup integration is the highest-leverage gap. Care → account dashboard surfaces is solid. |
| **Empty / loading / error states** | Inconsistent across operator surfaces. The `<EmptyState>` primitive from `@henryco/dashboard-shell` is not consistently used. |
| **Competitor parity** | The Laundress (US), Zipjet (EU), Lavanda (regional) — all ship live tracking with photo POD, recurring auto-book, care preferences (starch, fragrance, fold style). Care today ships none of those preferences. |
| **Trust / payment / dispute** | Pricing transparent ✓; no dispute flow for damaged garments; no insurance or "guaranteed-return" promise; no claim flow. |
| **Mobile parity** | Booking is acceptable on mobile; tracking and operator surfaces are weak on mobile (rider is mobile-first by definition — verify the rider workspace works one-handed). |
| **Accessibility** | PNH-04 baseline inherited. Per-route axe scan deferred (V3 N2). Operator surfaces have likely violations (not audited). |
| **Performance** | No per-route budget. Vercel Speed Insights enabled. |
| **SEO** | Organization JSON-LD ✓. Service JSON-LD on `/services` MISSING. Local-business JSON-LD missing. |
| **Localization** | Foundation strings translated. Service names + status labels likely English-only in DB. |
| **Data adequacy** | Schema doesn't model: care preferences (per garment type), recurring schedule, garment-level photo capture (pre/post), damage report, dry-cleaning vs wash-fold pricing nuance. |

═══════════════════════════════════════════════════════
MANDATORY REBUILD SCOPE
═══════════════════════════════════════════════════════

### A. Public surfaces (care.henrycogroup.com)

1. **`/` (home)** — `<HenryCoHeroCard>` panel-tone with care accent.
   Above-the-fold capability evidence: today's pickups, average turnaround,
   reviews snippet, "Book in 60 seconds" CTA. NO giant hero text.
2. **`/services`** — services as `<HenryCoTactileCard>` grid with
   per-service detail pages. Wash & fold, dry cleaning, ironing, stain
   removal, leather, suede, home cleaning, office cleaning. Each card
   includes turnaround SLA + price-from + premium guarantee chip.
3. **`/pricing`** — premium price matrix per service × garment type ×
   urgency (rush vs standard). All money math from `@henryco/pricing`.
4. **`/book`** — premium booking flow (replaces existing). Steps:
   (1) Service + garment count, (2) Pickup address (`<AddressSelector>`),
   (3) Pickup window (`<TypeaheadGrid>`, NOT long-scroll), (4) Delivery
   window or "Pickup-only", (5) Care preferences (starch, fragrance,
   fold style — per garment type), (6) Review price from `@henryco/pricing`,
   (7) Checkout via `@henryco/payment-surface`. Auth-gated; magic-link
   inline if anonymous.
5. **`/track`** — premium tracking. Status timeline + photo of garments at
   each stage (intake, washed, pressed, packed, dispatched, delivered).
   Live ETA. "Contact rider" via `@henryco/messaging-thread`. Realtime
   subscription for status changes.
6. **`/review`** — post-service review with photo upload, star rating, free
   text. Writes to `customer_notifications` + `@henryco/trust` writeback.
7. **`/about`, `/contact`** — editorial premium pages with capability
   evidence + `<ContactForm>` posting to `staff_notifications` audience
   `care:support`.
8. **`/pay/[trackingCode]`, `/unsubscribe`** — keep existing; ensure
   shared `@henryco/payment-surface` integration.

### B. Authenticated customer surface

Inside `account.henrycogroup.com/?module=care` (separate package
`@henryco/dashboard-modules-care`):

- **Active orders tile** — list with status, ETA, "Track", "Contact rider"
- **Care book** — saved garments, care preferences per garment, "Re-book"
  one-tap from history
- **Recurring schedule** — weekly/biweekly auto-book with skip + reschedule
- **Receipts + invoices** — `@henryco/branded-documents` `CareBookingDocument`
  template (NEW per V2-DOCS-01 hand-off)
- **Damage / claim** — claim form for damaged/lost garments with photo
  evidence; writes to `care_claims` (NEW table)
- **Review history**

The standalone `care.henrycogroup.com/customer` (if it exists) should
redirect signed-in users to account.* `?module=care`. If only `/track`
needs to remain on care.* (it does — public anonymous tracking), keep
that and nothing else.

### C. Operator surfaces

Care has the most mature operator ladder. This pass elevates each to
premium standard. All operator surfaces consume `@henryco/workspace-shell`.

**Rider** (`/(staff)/rider/`):
- `/rider` — today's queue (pickups + drop-offs combined, ordered by
  optimal route)
- `/rider/active` — current leg with navigation, customer contact, POD
  capture (photo + signature + GPS)
- `/rider/pickups`, `/rider/deliveries`, `/rider/history`
- `/rider/expenses` — fuel + maintenance log
- `/rider/notifications`

Mobile-first: bottom action bar (Today, Active, History, Profile).

**Staff** (`/(staff)/staff/` — service operators in the depot):
- `/staff` — depot view: today's intake, in-progress, ready-for-pickup
- `/staff/assignments` — garment-level assignment + status update
- `/staff/history`
- `/staff/notifications`

Each garment row supports photo capture at intake and at completion
(insurance + dispute defense).

**Support** (`/(staff)/support/`):
- `/support/inbox` (assign, reply) — uses `@henryco/messaging-thread` +
  `@henryco/chat-composer` (already integrated; verify still wired)
- `/support/outbox`, `/support/archive`
- `/support/payments`, `/support/expenses`
- `/support/reviews` — moderation
- `/support/notifications`

**Manager** (`/(staff)/manager/`):
- `/manager` — operations overview: today's volume, on-time %, exception
  count, revenue, fleet utilization
- `/manager/operations` — exceptions, late, cancelled, refunded
- `/manager/expenses`, `/manager/pricing` — pricing tier overrides
- `/manager/notifications`

**Owner** (`/(staff)/owner/`):
- `/owner` — strategic dashboard: monthly volume, growth, margin, NPS,
  claim rate, top services
- `/owner/bookings`, `/owner/finance`, `/owner/insights`
- `/owner/pricing` — global pricing governance
- `/owner/records`, `/owner/reviews`, `/owner/security`, `/owner/settings`,
  `/owner/staff`
- `/owner/impersonate` — operator impersonation (audit-logged on enter
  AND exit)

### D. Database

Add app-local migrations under `apps/care/supabase/migrations/`:

1. **`<TS>_care_services.sql`** — `care_services` (id, key text unique,
   name jsonb i18n, description jsonb, base_price_minor int, currency,
   turnaround_minutes int, category enum, sort int). Replaces hardcoded
   service catalogue.
2. **`<TS>_care_garment_types.sql`** — `care_garment_types` (id, name jsonb,
   default_care_options jsonb).
3. **`<TS>_care_preferences.sql`** — `care_user_preferences` (user_id fk,
   garment_type_id fk, options jsonb — starch/fragrance/fold/etc).
4. **`<TS>_care_bookings.sql`** — `care_bookings` (id, tracking_code unique,
   customer_user_id fk, pickup_address_snapshot jsonb, delivery_address_snapshot
   jsonb, pickup_at timestamptz, delivery_at timestamptz nullable, service
   keys jsonb[], garment_count int, price_breakdown_id fk, status enum,
   recurring_schedule_id fk nullable). RLS owner + staff.
5. **`<TS>_care_garments.sql`** — `care_booking_garments` (booking_id,
   garment_type_id, count, intake_photo_url, completion_photo_url,
   damage_report_id nullable).
6. **`<TS>_care_recurring.sql`** — `care_recurring_schedules` (user_id,
   cadence enum, day_of_week, time_of_day, services jsonb[], paused_until
   nullable). Cron-triggered auto-book.
7. **`<TS>_care_claims.sql`** — `care_claims` (booking_id, garment_id
   nullable, reason text, evidence_urls jsonb, status enum). RLS owner +
   staff.
8. **`<TS>_care_pod.sql`** — `care_proof_of_delivery` (photo_url,
   signature_url nullable, gps_lat, gps_lng).
9. **`<TS>_care_realtime_publication.sql`** — add `care_bookings` to
   Supabase Realtime publication for `/track`.

All migrations on Supabase preview branch first; RLS verified.

### E. APIs and crons

- Audit + extend existing care APIs (`/api/care/book`, `/bookings`,
  `/track`, `/contact`, `/payments/receipt`, `/reviews`,
  `/preferences/unsubscribe`).
- **MUST land** the V5-3 §12 fixes:
  - `/api/webhooks/whatsapp` HMAC verification (V3 B1)
  - `/api/care/contact` rate limit (V3 B4)
- New: `POST /api/care/recurring` — manage recurring schedule
- New: `POST /api/care/claims` — file a damage claim
- New: `POST /api/care/pod` — rider POD capture
- Cron: extend `/api/cron/care-automation` to:
  - Compute and publish ETAs on in-progress bookings
  - Auto-book recurring schedules 24h ahead
  - Send next-day reminder push + email
  - Send "rate your service" 4h after delivery

### F. Components

Reuse cross-division primitives. Build (care-specific):
- `<BookingFlow>` — multi-step booking with progressive total
- `<TrackingTimeline>` — status timeline with photos per stage
- `<GarmentList>` — depot operator garment-by-garment view
- `<RecurringScheduler>` — calendar + cadence picker
- `<CarePreferenceForm>` — per garment-type preferences
- `<DamageClaimForm>` — claim with photo evidence
- `<PODCapture>` — rider photo + signature + GPS (shared shape with
  logistics; consider extracting to a future `@henryco/pod-capture`
  package — not in this pass scope, just a TODO)

### G. External integrations

- **Cloudinary** — garment photos, POD, claim evidence
- **Resend** — booking confirmation, status updates, ratings request
- **WhatsApp Business** — booking + tracking via WhatsApp; HMAC required
- **Mapbox / Google Maps** — tracking pin (env-gated SVG fallback)

### H. Crons + observability

- `/api/cron/care-automation`: ETA, recurring auto-book, reminders,
  ratings request. Idempotent. Sentry + structured logger.
- Audit log on every owner/manager mutation.

═══════════════════════════════════════════════════════
UNIFORMITY RULES — INHERIT FROM SHARED SHELL
═══════════════════════════════════════════════════════

(Same matrix as logistics — see `docs/rebuild-prompts/logistics.md` §
"UNIFORMITY RULES" — applies verbatim. Reproduced here in summary; consult
master for full table.)

| Concern | Source |
|---|---|
| Workspace chrome | `@henryco/workspace-shell` |
| Dashboard primitives | `@henryco/dashboard-shell` |
| Notifications | `@henryco/notifications-ui` |
| Chat composer | `@henryco/chat-composer` |
| Messaging thread | `@henryco/messaging-thread` |
| Address inputs | `@henryco/address-selector` |
| PDF / document exports | `@henryco/branded-documents` (add `CareBookingDocument` template) |
| Cmd/Ctrl+K palette | `@henryco/search-ui` |
| Search indexing | `@henryco/search-core` (index `care_bookings` operator-scope) |
| Auth | `@henryco/auth` |
| Cross-division data | `@henryco/data` |
| Email | `@henryco/email` (NEVER instantiate Resend/Brevo directly) |
| Locale | `@henryco/i18n` |
| SEO | `@henryco/seo` |
| Observability | `@henryco/observability` |
| Hero / cards | `@henryco/ui` `public-shell/` |
| SupportDock | `@henryco/ui` |
| Trust scoring | `@henryco/trust` |
| Pricing | `@henryco/pricing` |
| Payment | `@henryco/payment-surface` |

### Anti-patterns

ALL master `DASHBOARD-REBUILD-PROMPT-V2-FINAL.md` §4.1 + §4.2 apply.
Highlights for care:

- No emoji-as-icon (no 🧺 👔 🧼)
- Primary blue = forbidden (use care accent `#6B7CFF` / accentText `#4F5BD0`)
- No long-scroll service or slot picker — `<TypeaheadGrid>` mandatory
- No raw `<img>` for garment photos — `<DivisionImage>` mandatory
- Buttons must show idle/pending/disabled/spinner/success-lock
- No "Welcome to your dashboard!" patronizing copy
- Mobile is a different layout (bottom bar + sheets), NOT desktop scaled

═══════════════════════════════════════════════════════
DISTINCTIVE RULES — WHAT CARE MUST BUILD THAT NO OTHER DIVISION HAS
═══════════════════════════════════════════════════════

1. **Per-garment care preferences** — starch, fragrance, fold style,
   stain treatment per garment type. Persisted to `care_user_preferences`.
2. **Pre + post photos per garment** — insurance + claim defense.
3. **Recurring auto-book** — weekly/biweekly cadence with pause/skip.
4. **Damage claim flow** — first-class; only care + property + logistics
   need this shape, but care's claim is tightly coupled to garment-level
   evidence.
5. **Depot operator workflow** — intake → wash → press → pack → dispatch,
   with garment-by-garment status (no other division has the per-item
   state machine).
6. **Multi-leg pickup + delivery scheduling** — pickup window + delivery
   window are independent (often different days); models should reflect.

═══════════════════════════════════════════════════════
COMPETITOR BENCHMARK
═══════════════════════════════════════════════════════

- **The Laundress / Tide Cleaners (US)** — best-in-class booking flow
  with care-preference persistence
- **Zipjet (EU, defunct but reference)** — best-in-class status timeline
  with photo per stage
- **Lavanda / Pressto (regional reference)** — best-in-class rider/depot
  workflow

The bar: a customer signing in from `account.henrycogroup.com/?module=care`
should feel they are using a premium concierge service, not a generic
booking SaaS.

═══════════════════════════════════════════════════════
TRUST, PAYMENT, COMPLIANCE
═══════════════════════════════════════════════════════

- Payment via `@henryco/payment-surface` only; pricing breakdown row
  written before payment.
- Insurance: garment intake photo + completion photo are the claim
  evidence baseline. Claim resolution by manager-or-higher; payout via
  wallet adjustment.
- KYC: not required for customers; required for operators (rider, staff,
  manager) — gate by `kyc_sensitive_action_gating.md`.
- Customer "delete history" soft-deletes (regulatory retention).
- Audit log: every operator state change + impersonation enter/exit.
- WhatsApp webhook HMAC mandatory (V5-3 B1) — fail closed if env missing.

═══════════════════════════════════════════════════════
MOBILE AND DESKTOP REQUIREMENTS
═══════════════════════════════════════════════════════

- Test at 320/375/390/430/768/1024 px.
- Rider workspace MUST be one-handed-usable on mobile.
- Customer `/track` mobile: full-bleed status + sticky bottom card.
- Booking: full-screen step transitions, sticky-bottom CTA.
- Depot operator (staff): tablet-optimized — most depots use tablets.

═══════════════════════════════════════════════════════
LOCALIZATION REQUIREMENT
═══════════════════════════════════════════════════════

- `@henryco/i18n` foundation only; no new languages this pass.
- Service names + garment types from DB jsonb i18n columns
  (`name jsonb` resolved via locale).
- All UI strings under translation keys.
- RTL support (Arabic) verified.

═══════════════════════════════════════════════════════
VALIDATION GATE — V1 through V13 + care-specific
═══════════════════════════════════════════════════════

V1–V13 from master §3. Care-specific additions:

- **C1** — WhatsApp HMAC verified end-to-end with test payload.
- **C2** — Care contact rate limit caps at 5/min per IP.
- **C3** — Recurring auto-book respects timezone + skip + paused state.
- **C4** — POD capture works on iOS + Android with camera permission
  denied AND granted.
- **C5** — Operator impersonation writes audit_log on enter AND exit;
  exit happens on tab close (beforeunload).
- **C6** — Damage claim photo upload caps at 10 MB per file, 5 files per
  claim; rejects non-image MIME.

═══════════════════════════════════════════════════════
DEPLOYMENT
═══════════════════════════════════════════════════════

1. Branch `feat/v3-pass-21-care`.
2. Migrations on Supabase preview branch first.
3. PR with V1–V13 + C1–C6 PASS table.
4. Vercel preview live-checked.
5. Merge → auto-deploy to `care.henrycogroup.com`.
6. Persist report at `.codex-temp/v3-pass-21-care/report.md`.

═══════════════════════════════════════════════════════
FINAL REPORT — REQUIRED OUTPUT
═══════════════════════════════════════════════════════

Sections (same shape as logistics): H0 recon, files modified, migrations
applied, V1–V13 + C1–C6 gate table, anti-pattern audit, mobile parity,
Lighthouse + CWV, a11y audit, hand-off, final classification.

═══════════════════════════════════════════════════════
SELF-VERIFICATION CHECKLIST
═══════════════════════════════════════════════════════

- [ ] Public surfaces in §A rebuilt (with editorial copy, no giant text)
- [ ] Customer surface in §B unified through account.* `?module=care`
- [ ] Operator ladder in §C polished — rider/staff/support/manager/owner
      all consume workspace-shell + dashboard-shell + notifications-ui
- [ ] Migrations in §D applied with RLS verified
- [ ] V5-3 §12 WhatsApp HMAC + contact rate-limit landed
- [ ] APIs in §E shipped with idempotency + observability
- [ ] Components in §F built reusing primitives
- [ ] Care-specific schema (services, garments, preferences, recurring,
      claims, POD) live and tested
- [ ] Mobile parity at 6 breakpoints
- [ ] i18n: every string under a key; RTL renders
- [ ] V1–V13 + C1–C6 PASS or N/A with justification
- [ ] Final report persisted
- [ ] PR opened with PASS table in body
