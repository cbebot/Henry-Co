# V3 Discovery Inventory — State of the HenryCo Platform

**Pass:** V5-5 V3 Discovery Framework
**Audited:** 2026-05-03
**Tool:** Claude Code · Opus 4.7 (1M context) · xhigh
**Audit baseline:** `origin/main` HEAD `e5e277a` (V5-2 SupportDock fix #22, deployed 2026-05-02 23:51 UTC across 9 of 10 web apps)

This is the canonical state-of-the-platform document. The V3 prompt-fusion turn will read this end-to-end before integrating the owner's saved V3 prompts.

---

## W0 · Production state inventory

### Repo state

| Attribute | Value |
|---|---|
| GitHub repo | `https://github.com/cbebot/Henry-Co.git` |
| `origin/main` HEAD | `e5e277a724bb8a9b6a180edaaebec90a487cfbbc` |
| Total commits on main | 178 |
| Tags | 1 (no semver releases yet) |
| Total branches (local + remote) | ~166 (mostly `claude/*` and `codex/*` work-tracks) |
| Active feature branches eligible for cleanup | 17 (enumerated in V2 closure certificate §C8) |
| Working-tree state at audit | dirty — V5-3 deep sweep + V5-4 P0 hero pivot (uncommitted; V3 backlog §B1–B12) |
| Workspace | pnpm 9.15.5 · node 24.x · 32 workspace projects (10 Next apps + 2 Expo + 19 packages + meta) |

### Vercel production deploy state

| App | Project ID | Latest production SHA | Date (UTC) | State |
|---|---|---|---|---|
| account | `prj_oADXXXOhrio50OSFw0utEJF7vYpB` | `e5e277a` | 2026-05-02 23:51 | READY ✓ |
| hub | `prj_maRA6vv8USk7qYhPCpsRHVOeadyV` | `e5e277a` | 2026-05-02 23:51 | READY ✓ |
| care | `prj_Ub6m7yriWBoapZypp9wo0n8ixnRL` | `e5e277a` | 2026-05-02 23:51 | READY ✓ |
| jobs | `prj_Z47ZPsl5DMRBxcewwXuclyn9CXYP` | `e5e277a` | 2026-05-02 23:51 | READY ✓ |
| learn | `prj_gBEBCABUqH5fxz4essFHKdNSbavT` | `e5e277a` | 2026-05-02 23:51 | READY ✓ |
| logistics | `prj_HgTqlsA8HmkdDTe0VhvGbwGjPo74` | `e5e277a` | 2026-05-02 23:51 | READY ✓ |
| marketplace | `prj_EpRExSk7T2YLeQLBfSxDw1adIbz8` | `e5e277a` | 2026-05-02 23:51 | READY ✓ |
| property | `prj_pwraexib4Iclika0dqlasmRw7L7V` | `e5e277a` | 2026-05-02 23:51 | READY ✓ |
| studio | `prj_IRs9Cj3vm26obEctzNxyApjE0V8U` | `e5e277a` | 2026-05-02 23:51 | READY ✓ |
| **staff** | `prj_frEwPNZMvSTLtnrJR67DRCApEA19` | **`8508f75`** | **2026-04-30 22:52** | **STALE — see V3 backlog C1** |

Three stale fork projects exist (tender-pare-284d43, session-destruction-fix, staff-support-prod) — preview-only.

### Canonical domains served

```
henrycogroup.com         → hub (marketing root)
care.henrycogroup.com    → care
marketplace.henrycogroup.com → marketplace
account.henrycogroup.com → account (auth-gated)
learn.henrycogroup.com   → learn
jobs.henrycogroup.com    → jobs
logistics.henrycogroup.com → logistics
property.henrycogroup.com → property
studio.henrycogroup.com  → studio
hq.henrycogroup.com      → hub (rewrites / → /owner)
staffhq.henrycogroup.com → hub (rewrites / → /workspace)
workspace.henrycogroup.com → hub (legacy alias of staffhq)
```

All 11 verified responding 200 with V2-PNH-04 baseline headers (HSTS preload, frame-ancestors none, X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy locked) — see `.codex-temp/v5-4-v2-closure/live-walk.tsv`. Hub + staffhq ship full CSP; the other 8 ship `frame-ancestors 'none'` only (V3 backlog D2).

### Database state (Supabase, single project)

- **Hub-level migrations:** 30 files in `apps/hub/supabase/migrations/` (cross-cutting: auth, profiles, role tables, KYC, trust scoring, currency, notifications, addresses, cart, search outbox, idempotency, governance)
- **Per-app migrations:** learn (4), marketplace (6), property (2), studio (4) — division-scoped schema lives in app-local migrations
- **Latest migration applied (per V5-1 audit):** `20260502180000_search_index_outbox_v2_search_01.sql`
- **Untracked + unapplied:** `20260502161000_user_addresses_legacy_backfill.sql` (V2-ADDR-01 owner gate, V3 backlog F1)
- **RLS coverage:** unknown — V5-3 §8 deferred verification (V3 backlog A5). Spot checks confirm RLS on `user_addresses`, `staff_notifications*`, `customer_notifications`, `saved_items`, `support_threads`. Comprehensive coverage report needs `pg_dump` via Supabase admin.
- **Edge Functions:** none deployed (`apps/*/supabase/functions/` empty across all apps). Supabase advisors not queried this pass.

### Storage state

- **Cloudinary:** primary asset store. Used by marketplace product images, property listing photos, KYC document uploads, profile avatars, branded-documents PDFs intermediates. Per-app Cloudinary upload routes wrap `/api/upload`. Asset count not enumerated this pass (would need Cloudinary API call).
- **Supabase Storage:** secondary — used for KYC document originals, support-thread attachments. Bucket inventory not enumerated.
- **Public assets:** per-app `public/` directories — `apps/hub/public/OneSignalSDKWorker.js` is untracked (V3 backlog B10).

### Email state

- **Resend:** primary provider for transactional + auth confirmation. `@henryco/email` package wraps `sendEmail({ purpose, to, ... })` with per-purpose sender identity.
- **Brevo:** auth SMTP fallback (V2-PNH-04 wired). Used when Resend hits rate limits or the auth-email path needs a backup.
- **Sender identity inventory:** `notifications@henrycogroup.com`, `support@henrycogroup.com`, plus per-division domains `care@`, `marketplace@`, `studio@` (sandbox creds per division — V3 backlog A7 for live walk).
- **Webhook receivers:** `apps/care/api/webhooks/resend`, `apps/studio/api/webhooks/resend`, `apps/account/api/webhooks/account`, `apps/account/api/auth/email-hook` — all HMAC-verified (Svix or custom HMAC-SHA256).

### Search state (V2-SEARCH-01)

- **Typesense:** integration shipped in `packages/search-core` + `packages/search-ui`. 15 collection definitions in `collections.ts`.
- **Production state:** env vars (`TYPESENSE_HOST`, `TYPESENSE_ADMIN_API_KEY`, `TYPESENSE_SEARCH_API_KEY`) **not provisioned**. The hub `/api/search` endpoint returns degraded JSON 200 (empty results, no 500) — confirmed in V5-4 live walk.
- **Outbox cron:** `apps/hub/vercel.json` registers `* * * * *` worker. Runs against `search_index_outbox_v2_search_01` table — outbox is empty until backfill runs.
- **Backfill script:** `scripts/search-backfill.mjs` (`--dry-run` / `--apply`, idempotent) — not yet run against production (V3 backlog H3).

### Realtime state

- **Supabase Realtime:** enabled on `customer_notifications`, `staff_notifications`, `staff_notification_states` tables (publication migration `20260501130000`). LiveNotificationProvider in account + per-division shells subscribes via `usePresenceChannel`.
- **WebSocket channel inventory:** account + care + marketplace + jobs + studio mount realtime listeners. Hub owner workspace MISSING `notifications-ui` realtime (V3 backlog E1).
- **Cross-tab broadcasts:** marketplace cart-saved-items uses `BroadcastChannel` for `saved_items` cross-tab sync (V2-CART-01).

---

## W1 · Codebase inventory

### Apps (10 web + 2 mobile + meta)

| App | LOC (TS+TSX) | Framework | Deploy target | Purpose |
|---|---:|---|---|---|
| account | 39,601 | Next 16 | Vercel | Customer dashboard, auth chooser, settings, KYC, support, notifications, addresses, saved items, branded-document downloads |
| care | 42,380 | Next 16 | Vercel | Care division — booking, pickup, tracking, public homepage, support, reviews |
| hub | 29,607 | Next 16 | Vercel (also serves `henrycogroup.com`, `hq.`, `staffhq.`, `workspace.`) | Marketing root + owner workspace + staff workspace + internal comms + cross-division search outbox cron |
| marketplace | 23,672 | Next 16 | Vercel | Multi-vendor commerce — catalog, cart, checkout, vendor stores, deals, help |
| studio | 20,951 | Next 16 | Vercel | Custom-website services — pricing, packages, work, teams, /pick template browser, /request brief builder, /pay |
| jobs | 16,200 | Next 16 | Vercel | Job board — public listings, employer console, candidate apply, hiring messages |
| learn | 15,684 | Next 16 | Vercel | Courses, paths, certifications, teacher applications |
| property | 14,493 | Next 16 | Vercel | Property listings, search, owner submission, managed listings |
| staff | 8,945 | Next 16 | Vercel | Internal staff workspace (search catalog) — **deploy lag at `8508f75`** |
| logistics | 6,402 | Next 16 | Vercel | Quote, book, track shipments, customer surface (logistics_addresses snapshots) |
| super-app | 3,145 | Expo / React Native | EAS (mobile builds) | Customer mobile app — early stage |
| company-hub | 3,735 | Expo / React Native | EAS | Owner mobile app — early stage |
| apps | 0 | — | — | Empty placeholder directory |

**Total:** ~74,337 lines TypeScript across web apps; ~6,880 lines mobile.

### Packages (19 workspace packages)

| Package | Purpose | Major consumers |
|---|---|---|
| `@henryco/ui` | Design system primitives — buttons, hero card, tactile card, footer, nav, providers, support dock, brand monogram | every web app |
| `@henryco/config` | Security headers, env helpers, division config, COMPANY constants | every web app |
| `@henryco/brand` | Brand assets registry — wordmark, monogram, lockup SVGs (Cloudinary URL-pulled) | hub, marketing surfaces |
| `@henryco/notifications` | Notification publisher, severity, division guards, email-fallback | account, care, marketplace, hub, jobs |
| `@henryco/notifications-ui` | Bell, feed, swipe gestures, severity-style, icons, motion, deep-link | account (others pending — V3 E1) |
| `@henryco/chat-composer` (V2-COMPOSER-01) | Premium chat input — autosize textarea, attachments, draft storage, mobile full-screen | account/support, care/support, jobs/hiring, studio/support |
| `@henryco/address-selector` (V2-ADDR-01) | Address autocomplete + KYC matcher + canonical user_addresses client | account, care, logistics, marketplace |
| `@henryco/cart-saved-items` (V2-CART-01) | Save-for-later, recently-viewed, cart-recovery primitives | account, marketplace |
| `@henryco/branded-documents` (V2-DOCS-01) | React-PDF templates: invoice, receipt, KYC, learn certificate, support thread, care booking, property listing, jobs application | account, learn (5 surfaces shipped, 3 deferred) |
| `@henryco/search-core` (V2-SEARCH-01) | Typesense client, role-aware ranking, scoped key issuance, outbox drain | hub, account |
| `@henryco/search-ui` (V2-SEARCH-01) | Command palette (Cmd/Ctrl+K), search-results page | hub, account (others pending — V3 H1) |
| `@henryco/seo` (V2-SEO-01) | JSON-LD generators, OG image helpers, manifest builders, robots/sitemap utilities | every public-facing app |
| `@henryco/email` | sendEmail({ purpose, to }) — Resend primary, Brevo fallback | every app |
| `@henryco/i18n` | Locale resolution, translation surfaces, `translateSurfaceLabel` | every public app |
| `@henryco/intelligence` | Cross-division catalogs, search type system, scoring, account search experience | account, hub, staff |
| `@henryco/lifecycle` | Continue-where-you-left-off panel | account |
| `@henryco/newsletter` | Newsletter subscribe + transactional templates | hub, marketing |
| `@henryco/pricing` | Pricing engine, governance tables, breakdown persistence | studio, marketplace, property |
| `@henryco/trust` | Trust scoring + review safety helpers | care, marketplace, property |

### Migration inventory

**Hub-level (cross-cutting) — 30 migrations**, dated 2026-04-02 → 2026-05-02:

```
20260402235500_workspace_staff_platform.sql           — DEAD schema (workspace_staff_memberships, workspace_notifications)
20260403183000_account_integration_hardening.sql     — account ↔ shared-ledger plumbing
20260405120000_hq_internal_communications.sql        — internal comms threads
20260405123000_hq_internal_comm_members.sql
20260405150000_logistics_customer_surface.sql        — logistics shared-account
20260406140000_wallet_withdrawals.sql                 — wallet rails
20260407150000_hq_internal_comm_thread_touch.sql
20260407160000_staff_navigation_audit_prep.sql
20260407190000_account_webhook_receipts.sql           — webhook idempotency
20260407193000_idempotency_and_nonce_scope.sql        — global idempotency
20260408120000_hq_internal_comms_attachments_visibility_rls.sql
20260410120000_referral_fraud_hardening.sql
20260410130000_kyc_verification_infra.sql             — KYC submissions table
20260416120000_trust_scoring_infra.sql                — trust_flags, OCR scaffold
20260417170000_shared_pricing_governance.sql          — pricing breakdowns
20260419120000_multi_currency_schema_foundation.sql   — currency truth
20260419150000_notification_delivery_log.sql
20260420160000_notification_signal_preferences.sql
20260420193000_profiles_role_customer_constraint.sql
20260421191500_handle_new_customer_search_path.sql
20260423143000_data_governance_foundation.sql
20260424140000_customer_lifecycle_snapshot.sql
20260424160000_newsletter_foundation.sql
20260501120000_notification_signal_foundation_extensions.sql
20260501130000_notification_realtime_publication.sql  — Realtime publication on notification tables
20260502120000_staff_notifications_audience.sql       — V2-NOT-02-A (staff_notifications + is_staff_in())
20260502160000_user_addresses_canonical.sql           — V2-ADDR-01 (user_addresses canonical)
20260502161000_user_addresses_legacy_backfill.sql     — V2-ADDR-01 (UNAPPLIED — owner gate, V3 F1)
20260502170000_v2_cart_01_saved_items_engagement.sql  — V2-CART-01 (saved_items, user_engagement_events, cart_recovery_state, recently_viewed_items)
20260502180000_search_index_outbox_v2_search_01.sql   — V2-SEARCH-01 (search_index_outbox + worker tracker)
```

**Per-app migrations:**
- `apps/learn/`: 4 (init, policies, teacher applications, unlock policy)
- `apps/marketplace/`: 6 (init, policies, events + application state, pricing breakdowns, deals curation, seller tiers)
- `apps/property/`: 2 (init, policies)
- `apps/studio/`: 4 (init, policies, extensions, brief domain intent)
- `apps/care/`: 0 (uses hub schema)
- `apps/jobs/`: 0 (uses hub schema)
- `apps/logistics/`: 0 (uses hub schema)

### API surface (142 route.ts files across 10 web apps)

Routes split across:

- **Customer-facing public APIs:** `/api/care/*`, `/api/marketplace/*`, `/api/property/*`, `/api/learn/*`, `/api/jobs/*`, `/api/logistics/*`, `/api/studio/*`, `/api/search` (hub + account)
- **Auth APIs:** `/api/auth/{callback,confirm,resolve,logout,choose,email-hook,resend}` in account
- **Webhook receivers:** `/api/webhooks/{resend,whatsapp}` per division (HMAC-verified except WhatsApp ×3 — V3 B1)
- **Cron handlers:** `/api/cron/{notification-purge,engagement-sweep,search-index-worker,email-fallback}` registered in `vercel.json`
- **Document downloads:** `/api/documents/[type]/[id]` (account), `/api/certificates/[code]/pdf` (learn) — V2-DOCS-01
- **Support:** `/api/marketplace?intent=support_thread_create`, `/api/care/contact`, `/api/account/support/*`
- **Saved items:** `/api/saved-items` (account + marketplace) — V2-CART-01
- **Addresses:** `/api/addresses/*` (account, including Google Places proxy) — V2-ADDR-01
- **Notifications:** `/api/notifications/*` (account; staff-notifications endpoints per-division for PR-β rollout)
- **Profile + KYC:** `/api/profile/*`, `/api/verification/*`, `/api/wallet/*`

### Component primitive inventory (`@henryco/ui/src/`)

```
src/
  brand/      — HenryCoMonogram, HenryCoWordmark, HenryCoLockup
  a11y/       — useReducedMotion, useFocusTrap, SkipLink, focus utilities
  footer/     — PublicFooter
  lib/        — cn, classnames helpers
  live/       — LiveNotificationProvider, presence
  loading/    — premium loading states
  nav/        — PublicShell nav primitives
  providers/  — theme provider, locale provider
  public/     — older shared public components
  public-shell/ — HenryCoHeroCard, HenryCoTactileCard, PublicProofRail, PublicSpotlight (V2-HERO-01)
  search/     — CrossDivisionSearchExperience
  support/    — SupportDock (premium concierge dock, V5-2)
  theme/      — design tokens
  cn.ts, index.ts
```

### Dependency inventory (key external services)

| Service | Role | Status |
|---|---|---|
| **Supabase** | DB + Auth + Realtime + Storage | live, single project |
| **Vercel** | Web app hosting + analytics + speed insights | live, 10 projects |
| **Cloudinary** | Image + video storage + transforms | live, primary asset store |
| **Resend** | Transactional + auth email | live, primary email provider |
| **Brevo** | Auth SMTP fallback | live, fallback |
| **Typesense** | Search backend | env not provisioned (V2-SEARCH-01 deferred owner action) |
| **Google Places** | Address autocomplete | env not provisioned (V2-ADDR-01 deferred owner action) |
| **WhatsApp Business / Meta** | Conversational webhook (care/property/studio) | webhook receivers exist, HMAC unsigned — V3 B1+B2 |
| **GitHub** | Code + CI (Lint, typecheck, test, build, PNH-04 baseline) | live |
| **EAS (Expo)** | Mobile build + dist | super-app dist/ exists; no production submission yet |

---

## W2 · User and role model

### Identity model

The platform uses Supabase Auth as the identity source. Every signed-in user is an `auth.users` row. On top of that, multiple role planes coexist:

```
auth.users
  └─ profiles (canonical customer + role flag)
       ├─ owner_profiles (owner | admin)
       ├─ jobs_role_memberships (per-division operator roles)
       ├─ learn_role_memberships
       ├─ logistics_role_memberships
       ├─ marketplace_role_memberships
       ├─ property_role_memberships
       └─ studio_role_memberships
       (care has no dedicated role table; operators identified via legacy profiles.role fallback)
```

### Role types in production

| Role | Identifier | Where it lives | Redirect target on login |
|---|---|---|---|
| **Customer** (default) | `profiles.role = 'customer'`, no owner_profile, no staff membership | profiles | `account.henrycogroup.com/` |
| **Division operator** | row in `<division>_role_memberships` with `role` column | per-division table | `staffhq.henrycogroup.com/` |
| **Care operator** (legacy) | `profiles.role` set to `care_*` | profiles (legacy fallback) | `staffhq.henrycogroup.com/` |
| **Staff (cross-division)** | `is_staff_in(division, role?)` returns true for hub/staff/account/security/system | composite via SECURITY DEFINER | `staffhq.henrycogroup.com/` |
| **Owner** | `owner_profiles.role IN ('owner', 'admin')` | owner_profiles | `hq.henrycogroup.com/owner` |
| **Super admin / Founder** | not modeled separately yet — owner_profiles 'admin' is closest | (gap — V3 architecture decision) | n/a |

### Permission matrix (which role can do what in which division)

| Capability | Customer | Division operator | Cross-division staff | Owner |
|---|---|---|---|---|
| Browse public surfaces | ✓ | ✓ | ✓ | ✓ |
| Place an order / book / apply | ✓ | (in scope of own division only) | ✓ | ✓ |
| View own data (orders, bookings, applications) | ✓ | ✓ | ✓ | ✓ |
| Review division operations | ✗ | ✓ (own division) | ✓ (any division) | ✓ |
| Approve KYC submissions | ✗ | ✗ | ✓ (security/admin) | ✓ |
| Adjust pricing governance | ✗ | ✗ | ✓ (account/admin) | ✓ |
| Read internal comms | ✗ | (visibility-RLS gated) | ✓ | ✓ |
| Trigger notification broadcasts | ✗ | ✓ (own division audience) | ✓ (any audience) | ✓ |
| Manage staff memberships | ✗ | ✗ | ✗ | ✓ |
| Read raw audit log | ✗ | ✗ | ✗ | ✓ |

### Audience model (V2-NOT-02-A)

Staff notifications use a content/state split:

- `staff_notifications` (content + targeting selectors: `recipient_user_id` | `recipient_role` | `recipient_division`)
- `staff_notification_states` (per-recipient lifecycle: read, archived, deleted, restored — created lazily)

Customer notifications continue to use `customer_notifications` (single per-recipient row).

---

## W3 · V2 capability inventory

What V2 actually delivered, organized by user-facing capability:

### 1. Authentication and identity

- Auth chooser screen (`/auth/choose`) with role-aware redirect (V2-AUTH-RT-01)
- `hc_dash_pref` cookie persists user preference across sessions
- Cross-subdomain SSO via `domain=.henrycogroup.com` cookies (pre-V2 carry-forward)
- Resend auth email path with Brevo SMTP fallback (PR #5)
- API-layer signup rate limit (PNH-04)
- Auth email hook HMAC-verified (PR #5 + email-hook route)

### 2. Notifications (customer + staff)

- Customer notifications with `is_read`/`read_at` lifecycle (pre-V2 carry-forward + V2-NOT-01 polish)
- Cross-division notification signal foundation: schema, publisher (`publishCustomerNotification`), per-division bridges (V2-NOT-01-A through D)
- Premium notification UI: severity-style, icons, motion, swipe gestures (V2-NOT-02-A)
- Realtime push channel via Supabase Realtime publication (V2-NOT-01-B-2)
- Email fallback cron worker (V2-NOT-01-C)
- Notification preferences UI (V2-NOT-01-D)
- Staff audience model: `publishStaffNotification`, `is_staff_in()` SECURITY DEFINER, audience-generic primitives (V2-NOT-02-A)
- Recently-deleted feed + 30-day purge cron (V2-NOT-02-A)

### 3. Cross-division search (V2-SEARCH-01)

- `@henryco/search-core` package — Typesense wrapper, role-resolution, filter clause builder, ranking formula, rate limiter (60/min, 600/hr), outbox drain, scoped key issuance
- `@henryco/search-ui` package — Cmd/Ctrl+K command palette, search-results page
- Hub `/api/search` and account `/api/search` — public + auth-gated query endpoints
- Search-index outbox table + every-minute cron worker
- 15 Typesense collection definitions (one per indexed entity)
- Backfill script (`scripts/search-backfill.mjs` — `--dry-run` / `--apply`)
- Wired in: hub + account. **Pending in: care, jobs, learn, logistics, marketplace, property, studio (V3 H1)**
- **Production env not provisioned** (Typesense host + keys absent — degrades to empty results)

### 4. Address management (V2-ADDR-01)

- Canonical `user_addresses` table with label enum (home, office, shop, warehouse, alternative_1/2, legacy_imported_1..4)
- `UNIQUE(user_id, label)` — at most one of each label per user
- KYC alignment via `kyc_match_score` + faceted weighted scorer (country/state/city/street with country-mismatch hard cap)
- `is_default` enforcement triggers
- `@henryco/address-selector` — autocomplete + form + KYC matcher + Google Places proxy
- Consumed in: account, care, logistics, marketplace
- Owner-only RLS + platform-staff SELECT via `is_platform_staff()`
- **Legacy backfill migration unapplied** (V3 F1)

### 5. Cart and checkout (V2-CART-01)

- `saved_items` table with 7-day expiry sweep + about-to-expire signal
- `user_engagement_events` table (saved/restored/expired/cart_abandoned/checkout_started/kyc_incomplete)
- `cart_recovery_state` + `recently_viewed_items` tables
- Bespoke marketplace 3-step checkout (replaces flat 3-section page)
- Save-for-later + bulk restore in account
- Welcome-back surface on account overview (cart resume + saved expiring + recently viewed)
- Hourly engagement-sweep cron on account
- `@henryco/cart-saved-items` package consumed in marketplace + account

### 6. Document export (V2-DOCS-01)

- `@henryco/branded-documents` — React-PDF templates: invoice, receipt, KYC summary, transaction history, learn certificate, support thread, care booking, property listing, jobs application
- Live download endpoints in account (`/api/documents/[type]/[id]`) — invoice, receipt, KYC, transaction history, wallet statement, support thread (6 of 9)
- Live download endpoint in learn (`/api/certificates/[code]/pdf`) with QR + verification (1)
- **Pending download endpoints:** care booking, property listing, jobs application (V3 G1–G3)

### 7. Chat and support (V2-COMPOSER-01)

- `@henryco/chat-composer` — autosize textarea, attachments (IndexedDB drafts + localStorage fallback), full-screen mobile mode, Cmd/Ctrl+Enter, viewport-keyboard awareness, reduced-motion support
- Consumed in 5 surfaces: account/support new + reply, care/support reply, jobs/hiring messages, studio/support reply
- **Pending consumer:** hub internal comms (`InternalTeamCommsClient.tsx` 1223-line component — V2-COMPOSER-02)
- SupportDock concierge — brand-aware trigger, smart context detection, search-with-assist-CTA, focus trap, mobile sheet, lazy-mounted (V5-2)

### 8. SEO and discoverability (V2-SEO-01 PR-A)

- `@henryco/seo` package — typed JSON-LD generators (Organization, BreadcrumbList, FAQ, Product), Open Graph + Twitter Card helpers, manifest + favicon utilities, robots.txt + sitemap.xml builders
- Wired across 8 public apps + hub
- Vercel Analytics + Speed Insights enabled platform-wide (default-on)
- robots.txt + sitemap.xml live on `henrycogroup.com` (verified 200 in V5-4 walk)
- **Deferred to PR-B:** master sitemap-index aggregator (V3 M1)
- **Deferred to PR-C:** hreflang + i18n meta (V3 M2)

### 9. Accessibility primitives (V2-A11Y-01)

- `scripts/a11y/{audit,contrast-matrix,headers-scan,aggregate,gate,diff}.mjs` — full a11y pipeline
- `accentText` token added to COMPANY config for every division (contrast-AA enforced)
- SkipLink primitive in `@henryco/ui/a11y`
- Reduced-motion + focus-trap hooks
- PNH-04 baseline contrast/headers gate enforced on every PR
- 11 critical / 63 serious / 42 moderate axe findings catalogued; primitives addressed; per-route remediation **deferred to V3 N2**

### 10. Premium UI components (V2-HERO-01 + V5-2)

- `HenryCoHeroCard` (panel/spotlight/contrast/ink tones, mount-flip entry, reduced-motion respect, hover-isolation for fine pointers)
- `HenryCoTactileCard` (touch-friendly, no sticky-hover, scoped lift)
- Consumed in hub, care, property, studio homes
- **Pending:** jobs, learn, marketplace, logistics homes (V3 J2)
- SupportDock concierge premium replacement of AssistDock (V5-2)
- Brand monogram wired across all 8 division shells (V5-2)

### 11. Hub homepage

- Premium hero rebuild with mobile clipping fix (V2-HERO-01)
- Server-error hardening (V2-HERO-01)
- Studio `/pay` route (V2-HERO-01)

### 12. Hardening (security headers, rate limits, info-disclosure fixes)

- V2-PNH-04 baseline: HSTS preload, frame-ancestors none, XFO DENY, CTO nosniff, Referrer strict-origin-when-cross-origin, Permissions-Policy locked (camera/microphone/geolocation/interest-cohort/browsing-topics/payment)
- Full CSP on hub + staff (8 other apps run frame-ancestors only — V3 D2)
- Signup rate limit at API layer (PNH-04)
- Info-disclosure fixes (PNH-04)
- Image performance (`next/image` migration on hub Logo)
- KYC sensitive-action gating (per `docs/kyc-sensitive-action-gating.md`)
- **Deferred V5-3 §12 fixes (uncommitted):** WhatsApp HMAC ×3, jobs IDOR, care contact rate limit, marketplace `.env.*.pulled` cleanup

### 13. Other shipped primitives (carry-forward)

- `@henryco/email` purpose-aware sender (Resend + Brevo)
- `@henryco/lifecycle` continue-where-you-left-off
- `@henryco/i18n` 7 locales (en/fr/ar/es/pt/de/it) — strings present, dynamic content + payment localization deferred (V3 if owner authorizes international)
- `@henryco/pricing` shared truth across studio/marketplace/property
- `@henryco/trust` trust-flag writeback + OCR scaffold + review safety
- 14 Studio templates with real prices/timelines/packages (V5-3 — uncommitted)
- 8 forged DASH prompts ready for V6 dashboard rebuild (V2-DASH-PROMPT-HARDEN-01)

---

## W4 · V3 backlog reconciliation

Reading `docs/v3/V3-BACKLOG-FROM-V2.md` (17 sections, ~70 items). Classified:

| Class | Count | Detail |
|---|---|---|
| **Operational** (env setup, migration applies, deploys, branch hygiene) | 14 | A1–A8, B2 (env), B9 (git rm), B10, C1, F1, F2, H3, M1 |
| **Platform** (infra, observability, scaling) | 10 | A1 (Playwright), A2 (Lighthouse CI), A3 (axe runner), A5 (RLS), A6 (cross-tenant probe), A7 (email walk), A8 (notification matrix), D2 (full CSP soak), E3 (notification timing), O3 (studio analytics) |
| **Polish** (small fixes, follow-ups) | 18 | B7, B8, B11, B12, D3, D4, D5, E2, G1, G2, G3, H1, H2, J1, J2, J3, K1, M3, N1, Q1, Q2, Q3 |
| **Feature work** (new user-visible capability) | 10 | E1 (hub owner notifications), E4 (audience model edge cases), I1 (multi-role chooser badges), L1 (cross-division saved model), N2 (per-route a11y remediation), N3 (super-app a11y), O1 (template demo URLs), O2 (real headshots), O4 (template traffic check), Q4 (feature flag audit) |
| **Architecture** (decisions requiring owner input) | 8 | B1 (WhatsApp HMAC commit decision), B3 (jobs IDOR fix commit), B4 (care contact rate limit commit), B5 (Studio templates rebuild commit), B6 (Studio scope-step rebuild commit), D1 (Next 16.1.6 → 16.2.3 monorepo bump), D6 (Expo build deps), D7 (jobs messages conversation membership) |
| **V6 prereq** (DASH-1 through DASH-8 prompts) | 8 | P1–P8 — explicitly NOT V3 unless owner moves them here |

Total: 68 items. The classification is approximate — some items span categories (e.g. B1 is both architecture and operational).

---

## W5 · V3 roadmap recommendation summary

Full rationale in `docs/v3/V3-RECOMMENDED-ROADMAP.md`. One-paragraph summary:

V3 should run as **3 parallel tracks** over ~10 weeks: **(T1) the V5-3+P0 closure PR** (1 week, lands all uncommitted V5 polish + the WhatsApp HMAC + the jobs IDOR fix + the marketplace hero rework + the brand-package typecheck unblock); **(T2) live verification infra provisioning** (2 weeks, Playwright + Lighthouse CI + axe route walker + Mozilla Observatory + RLS verifier — this unblocks every future closure audit); **(T3) the owner-authorized V3 feature track** (~7 weeks, depending on which of the 6 candidate V3 directions the owner prioritizes). The dashboard rebuild (V6) runs **after V3** in series, not in parallel — DASH-1 → DASH-8 cannot be safely staged without T2's infra.

The 6 candidate V3 feature directions, in priority order based on what V2 left half-done:

1. **Marketplace expansion** (T3.A) — discovery + ranking + density variants for scale (V5-2 hand-off §1 already specified A→E phasing)
2. **Notification + search closure** (T3.B) — wire notifications-ui to all shells + palette host to remaining 6 division shells (V3 E1 + H1)
3. **Property rules engine + jobs interview room** (T3.C) — the two named-but-not-built features from PRODUCT-GAP-LEDGER
4. **International expansion** (T3.D) — i18n dynamic content + localized payment + localized auth (only if owner authorizes geographic ambition)
5. **Mobile super-app ramp** (T3.E) — only if owner moves from "early stage" to production
6. **AI/intelligence layer** (T3.F) — only if owner explicitly authorizes (DASH-PROMPT-HARDEN-01 explicitly excluded "AI agents in V2 shell")

These map directly to the W7 owner decisions list.

---

## W6 · Owner prompt integration template

See `docs/v3/V3-PROMPT-FUSION-TEMPLATE.md`.

The template defines the spine for the next Claude Pro turn (V3 forging) once the owner's saved V3 prompts arrive. It specifies where the owner's prompt enters verbatim, where Claude's discovery findings expand each directive with citations, where Claude recommends modifications with explicit "owner asked X, Claude recommends X+Y because Z" framing, and where the inventory surfaces critical gaps the owner may not have anticipated.

---

## W7 · Owner decisions before V3 starts

See `docs/v3/V3-RECOMMENDED-ROADMAP.md` §"Decisions the owner must make."

Headline questions:

1. Dashboard rebuild — V2.5 independent track, V3 sequenced with features, or V6 (post-V3 series)?
2. Which V3 feature track(s) — marketplace expansion, notification+search closure, property+jobs feature build-out, international, mobile, AI?
3. Live verification infra — V3 prerequisite (block V3 features) or V3 in-scope (run alongside)?
4. Staff app deploy lag — fix before V3 or accept as V3 entry condition?
5. Branch cleanup — owner-authorize bulk delete of 17 enumerated merged branches?
6. WhatsApp HMAC env (`WHATSAPP_APP_SECRET`) — provision before V5-3+P0 PR merge so receivers don't fail closed silently?
7. V2-ADDR-01 legacy backfill — authorize migration apply with `OWNER_OK` token?
8. Trust-as-product surfaces (transparency reports, security posture page, bug bounty) — V3 or later?
9. Per-division abuse models (V3 hardening per division) — included in T1 closure PR or separate V3 hardening pass?

---

## W8 · V3 readiness gate

| Gate | Status |
|---|---|
| V2 closure certificate signed (V5-4) | ✗ unsigned (V5-4 returned NOT-CLOSURE-READY) |
| Discovery inventory complete (this pass) | ✓ — this document |
| Owner has reviewed recommended roadmap | ⏳ pending owner review of `docs/v3/V3-RECOMMENDED-ROADMAP.md` |
| Owner has answered W7 decisions | ⏳ pending |

**V3 cannot begin forging until all four are ✓.** The path is fully documented; the gate is owner action.

---

## Self-verification

- [x] Repo HEAD captured + workspace meta enumerated
- [x] All 10 web apps + 2 mobile apps + 19 packages line-counted and described
- [x] All 30 hub-level migrations enumerated with purpose
- [x] Per-app migrations enumerated
- [x] Vercel project map captured with deploy SHAs (incl. staff lag)
- [x] V2 capabilities organized by user-facing surface (13 buckets)
- [x] Role model documented (5 role types + permission matrix)
- [x] V3 backlog reconciled and classified (68 items into 6 classes)
- [x] V3 roadmap summarized with 3 tracks + 6 candidate feature directions
- [x] Owner-decision list named (9 questions)
- [x] V3 readiness gate stated explicitly
- [x] No V3 prompts authored in this pass
- [x] No claims about scope without owner authorization
- [x] Citations to V2/V5 source reports throughout

End of inventory.
