# HUB — Division Rebuild Prompt (V3 PASS 21)

```
TOOL: Claude Code (Opus 4.7 · 1M context · xhigh effort)
PROJECT: HenryCo Ecosystem · henrycogroup.com
DIVISION: Henry & Co. Hub (Group Directory + Owner Workspace + Staff
          Workspace + Internal Comms + Cross-Division Search)
LIVE DOMAIN: henrycogroup.com (root) · hq.henrycogroup.com (rewrites
             /→/owner) · staffhq.henrycogroup.com (rewrites
             /→/workspace) · workspace.henrycogroup.com (legacy alias)
REPO: github.com/cbebot/Henry-Co
BRANCH: main (Vercel auto-deploy)
BACKEND: Supabase (single project, 30 hub-level migrations — most
         cross-cutting schema lives here)
PASS: V3 PASS 21 — DIVISION REBUILD · HUB
EXPECTED DURATION: Long. Hub is the most central division — marketing
                   root + owner workspace + staff workspace + internal
                   comms + cross-division search outbox cron all
                   converge here. Rebuild last (after every other
                   division's prompt has been executed) to incorporate
                   what each division's home should surface in the
                   hub directory.
```

═══════════════════════════════════════════════════════
ROLE
═══════════════════════════════════════════════════════

Principal product architect, division systems strategist, and
implementation engineer for Henry & Co. Hub. Ship code; self-verify
against V1–V13 + hub-specific gates.

═══════════════════════════════════════════════════════
SCOPE
═══════════════════════════════════════════════════════

Hub serves four distinct surfaces under one Vercel project. Rebuild
each end-to-end:

1. **Marketing root** — `henrycogroup.com` (group directory, public
   marketing, newsletter, search, terms, privacy, contact)
2. **Owner workspace** — `hq.henrycogroup.com/owner` (the existing
   "Track B" canonical surface per `DASH-8-owner-dashboard-track-b.md`)
3. **Staff workspace** — `staffhq.henrycogroup.com/workspace` and
   `workspace.henrycogroup.com` (legacy alias)
4. **Cross-cutting infrastructure** — search outbox cron, owner-reporting
   crons, internal-comms APIs, newsletter, owner-people, brand assets
   surface

Out of scope: shared shell + cross-division packages (UNIFORMITY RULES);
other divisions' homes (each is rebuilt by its own prompt — hub LINKS to
each division's home but does not re-home them).

═══════════════════════════════════════════════════════
CONTEXT — read in this order
═══════════════════════════════════════════════════════

1. `docs/v3/V3-DISCOVERY-INVENTORY.md`
2. `docs/dashboard/DASHBOARD-REBUILD-PROMPT-V2-FINAL.md`
3. `docs/dashboard/DASH-8-owner-dashboard-track-b.md` (Track B is hub's
   owner workspace — this prompt absorbs DASH-8 if not already shipped;
   if shipped, it polishes + extends)
4. `packages/config/company.ts` — `COMPANY.divisions.hub` (accent
   `#C9A227`, accentText `#8A6F00`); `COMPANY.divisions` enum is the
   master directory
5. `apps/hub/` — every existing route, lib, component, vercel.json
6. `apps/hub/proxy.ts` (host rewrites for hq, staffhq, workspace)
7. `apps/hub/supabase/migrations/*` — 30 hub-level migrations (the
   cross-cutting schema)
8. `packages/search-core/`, `packages/search-ui/` (V2-SEARCH-01 — hub
   hosts the cross-division search outbox cron and `/api/search`)
9. `packages/newsletter/` + `apps/hub/app/api/newsletter/*` (V2 newsletter
   foundation)
10. `apps/hub/components/owner/InternalTeamCommsClient.tsx` (1223-line
    client; V2-COMPOSER-02 deferred — this pass MAY refactor or leave
    alone depending on scope budget)

═══════════════════════════════════════════════════════
AUDIT SUMMARY — current state at SHA `e5e277a`
═══════════════════════════════════════════════════════

### Routes shipped (marketing — `henrycogroup.com`)
- `/` (root home → `(site)/page.tsx`)
- `/(site)/about`, `/(site)/contact`
- `/(site)/newsletter`, `/(site)/newsletter/preferences`,
  `/(site)/newsletter/unsubscribe`
- `/(site)/preferences`, `/(site)/privacy`, `/(site)/terms`
- `/(site)/search`

### Routes shipped (owner workspace — `hq.henrycogroup.com/owner`)
- `/owner/(command)/page.tsx` (overview)
- `/owner/(command)/ai/page.tsx`, `/ai/insights`, `/ai/signals`
- `/owner/(command)/brand/page.tsx`, `/brand/pages`, `/brand/settings`,
  `/brand/subdomains`
- `/owner/(command)/divisions/page.tsx`, `/divisions/performance`,
  `/divisions/[slug]`
- `/owner/(command)/finance/page.tsx`, `/finance/expenses`,
  `/finance/invoices`, `/finance/revenue`
- `/owner/(command)/messaging/page.tsx`, `/messaging/alerts`,
  `/messaging/queues`, `/messaging/team`
- `/owner/(command)/operations/page.tsx`, `/operations/alerts`,
  `/operations/analytics`, `/operations/approvals`, `/operations/queues`
- `/owner/(command)/settings/page.tsx`, `/settings/audit`,
  `/settings/comms`, `/settings/security`
- `/owner/(command)/staff/page.tsx`, `/staff/directory`, `/staff/invite`,
  `/staff/roles`, `/staff/tree`, `/staff/users/[id]`
- `/owner/login`, `/owner/no-access`

### Routes shipped (staff workspace — `staffhq.henrycogroup.com/workspace`)
- `/workspace/[[...slug]]` (catch-all)

This is currently a redirect/host-rewrite stub per audit §A.4-1 (suspected
redirect-loop). DASH-8 plans to make this a permanent 308 to
`account.henrycogroup.com/?role=staff`.

### API routes (hub)
- `/api/auth/logout`, `/api/locale`, `/api/profile/update`
- `/api/search` (V2-SEARCH-01 cross-division search)
- `/api/cron/search-index-worker` (every-minute outbox drain)
- `/api/cron/owner-reporting/monthly`, `/owner-reporting/weekly`,
  `/cron/owner-reports`
- `/api/newsletter/subscribe`, `/preferences`, `/unsubscribe`
- `/api/owner/divisions`, `/owner/people`, `/owner/pages`,
  `/owner/settings`, `/owner/upload`
- `/api/owner/internal-comms/threads`, `/messages`, `/members`,
  `/dm`, `/read`, `/pin`, `/search`, `/health`, `/attachments/register`,
  `/attachments/signed`

### Database (hub-level — 30 migrations)
The most cross-cutting schema in the repo:

- Auth + profiles + role tables: `profiles`, `owner_profiles`,
  `<division>_role_memberships`
- KYC: `kyc_submissions`, `kyc_match_scores`
- Trust: `trust_flags`, OCR scaffold
- Currency: V2 multi-currency foundation
- Pricing: `pricing_breakdowns` (V2 governance)
- Notifications: `customer_notifications`, `staff_notifications`,
  `staff_notification_states`, `notification_delivery_log`,
  `notification_signal_preferences`, realtime publication
- Addresses: `user_addresses` (V2-ADDR-01 canonical)
- Cart: `saved_items`, `user_engagement_events`, `cart_recovery_state`,
  `recently_viewed_items` (V2-CART-01)
- Search: `search_index_outbox_v2_search_01` (V2-SEARCH-01)
- Idempotency: `idempotency_and_nonce_scope`
- Governance: `data_governance_foundation`
- Lifecycle: `customer_lifecycle_snapshot`
- Newsletter: `newsletter_foundation`
- Internal comms: `hq_internal_communications`, `hq_internal_comm_members`,
  `hq_internal_comm_thread_touch`, `hq_internal_comms_attachments_visibility_rls`
- Wallet: `wallet_withdrawals`
- Account: `account_integration_hardening`, `account_webhook_receipts`
- Logistics: `logistics_customer_surface`
- Referral: `referral_fraud_hardening`
- Workspace: `workspace_staff_platform` (DEAD schema per discovery)
- Staff navigation: `staff_navigation_audit_prep`
- Customer constraint: `profiles_role_customer_constraint`,
  `handle_new_customer_search_path`

### Existing strengths
- Owner workspace covers the broadest functional area (AI, brand, divisions,
  finance, messaging, operations, settings, staff)
- Internal comms (`InternalTeamCommsClient.tsx`) is fully functional
- V2-SEARCH-01 outbox + worker cron live
- Owner-reporting weekly + monthly cron live
- Newsletter foundation
- Brand monogram + lockup wired across shells (V5-2)
- Premium hero on root home (V2-HERO-01)
- Site footer + nav primitives in `@henryco/ui`

### Known gaps and bugs
- **Hub owner notifications** — V3 E1 — `notifications-ui` not yet wired
  on owner workspace shell.
- **Search palette** — V3 H1 — palette host not on owner/staff shells
  (only on account + hub root).
- **Workspace redirect-loop** — audit §A.4-1 — `apps/hub/app/workspace/[[...slug]]/page.tsx`
  suspected loop. DASH-8 plans permanent 308 to account.* `?role=staff`.
- **Internal comms composer** — V2-COMPOSER-02 deferred — `InternalTeamCommsClient.tsx`
  (1223 lines) does not yet consume `@henryco/chat-composer`. This pass
  decides: fold V2-COMPOSER-02 in (yes if scope budget permits — strongly
  recommended) or leave for follow-up.
- **Sender identity walk** — V3 A7 — verify per-division sender identities
  on every transactional email.
- **Notification matrix** — V3 A8 — verify every audience reaches every
  recipient.
- **Owner-reporting** — exists but render quality (PDF + email) likely
  needs premium polish via `@henryco/branded-documents`.
- **Newsletter UI** — `/newsletter`, `/preferences`, `/unsubscribe`
  exist but design quality varies; needs editorial polish.
- **Search results** — `/(site)/search` is the search-results page;
  needs premium polish + real division facets.
- **Privacy + Terms** — editorial pages; verify currency + legal review
  cadence.
- **Cross-division entry points from hub** — every division's home is
  linked from `/(site)/page.tsx` directory but the directory presentation
  needs editorial premium polish (the V2-HERO-01 root rebuild improved
  this; verify).
- **HenryCoHeroCard** consumed (V2-HERO-01 ✓ on root home).
- **Suspected typecheck blocker** — `@henryco/brand` package may need
  the V5-3 unblock per V3 backlog.
- **OneSignalSDKWorker.js** in `public/` is untracked (V3 B10).
- **Stale staff project deploy** — `prj_frEwPNZMvSTLtnrJR67DRCApEA19`
  at `8508f75` (2026-04-30) — V3 backlog C1; not directly hub but
  related (staff app vs hub-served staff workspace surface).

### Cross-division
- Hub root directory is the entry point for every division
- `/api/search` aggregates indexed entities across divisions
- Owner workspace surfaces `/divisions/[slug]` for per-division operator
  health
- Internal comms is staff-cross-division
- Owner-reporting cron consumes data from every division

═══════════════════════════════════════════════════════
DEEP AUDIT FINDINGS
═══════════════════════════════════════════════════════

| Dimension | Finding |
|---|---|
| **IA** | Marketing root + owner workspace + staff workspace + internal comms — four distinct products under one Vercel project. The IA boundaries are clear (different hosts) but the workspace stub IA is problematic (audit §A.4-1). |
| **Flow logic** | Marketing → Discover divisions → ✓ (directory). Owner sign-in → Workspace → ✓ (full surfaces). Staff → ⚠ (redirect ambiguity). Internal comms → ✓. |
| **Cross-division** | Hub IS the cross-division surface; every division's home is linked + searchable. Cross-division search outbox + worker is hub-owned. |
| **Empty / loading / error** | Owner workspace surfaces have inconsistent EmptyState consumption. |
| **Competitor parity** | For owner workspace: Linear / Stripe Dashboard / Vercel / Plaid Admin (master DASH-8 §1). For marketing root: any premium group/portfolio site (Bain, McKinsey have organizational hub surfaces). For internal comms: Slack / Notion comms surfaces. |
| **Trust / payment / compliance** | Owner workspace audit log + reconcilable metrics is the trust standard (DASH-8 §1). |
| **Mobile** | Marketing root mobile ✓ (V2-HERO-01). Owner workspace mobile is the largest gap; DASH-8 explicitly defers polish. |
| **Accessibility** | Per-route axe pending for owner workspace surfaces. |
| **Performance** | Owner-reporting cron may stress Vercel; verify within budget. |
| **SEO** | Root home has full `Organization` JSON-LD ✓. Sitemap aggregator (V3 M1) deferred. |
| **Localization** | Foundation strings ✓; hreflang + i18n meta deferred (V3 M2). |
| **Data adequacy** | Most cross-cutting schema present. Audit log table present (verify completeness). |

═══════════════════════════════════════════════════════
MANDATORY REBUILD SCOPE
═══════════════════════════════════════════════════════

### A. Marketing root (`henrycogroup.com`)

1. **`/` (root home — `(site)/page.tsx`)** — premium group directory.
   `<HenryCoHeroCard>` panel-tone with hub accent. Above-the-fold:
   capability evidence (active divisions, customers served, transactions
   this month). Below: division grid with `<HenryCoTactileCard>` per
   division (accent + tagline + "Visit X" CTA), trust + group promise,
   join newsletter CTA. NO giant hero text.
2. **`/(site)/about`** — editorial group story.
3. **`/(site)/contact`** — `<ContactForm>` posting to staff_notifications
   (audience `hub:support`).
4. **`/(site)/newsletter`** — newsletter sign-up landing.
5. **`/(site)/newsletter/preferences`** — preferences editor (signed-in
   only).
6. **`/(site)/newsletter/unsubscribe`** — one-click unsubscribe (signed
   token).
7. **`/(site)/preferences`** — global preferences (locale, theme,
   notifications).
8. **`/(site)/privacy`, `/(site)/terms`** — editorial legal pages with
   "Last updated" + version history.
9. **`/(site)/search`** — premium cross-division search results page
   (already shipped via V2-SEARCH-01). Polish: real facets per division,
   editorial empty state, "Search tip" guidance.

### B. Owner workspace (`hq.henrycogroup.com/owner`)

This absorbs `DASH-8-owner-dashboard-track-b.md` if not already shipped.
If DASH-8 has shipped, this is a polish-and-extend pass.

Reference standard per DASH-8 §1: Linear / Stripe / Vercel / Plaid admin.
Density (12+ tiles, table-first), Trust (audit-logged + reconcilable),
Speed (sub-200ms perceived, INP < 200ms), Power (bulk ops, advanced
filters, exports via DOCS-01).

Surfaces per existing route tree (rebuild each to premium):

- **`/owner/(command)`** — overview: executive situation room (briefing,
  comms-health 4-tile, next-best actions), division control center
  (cross-division metric + alert grid), helper recommendations,
  sensitive activity panel (audit log), executive digest, urgent
  signals, finance summary
- **`/owner/(command)/ai`, `/ai/insights`, `/ai/signals`** — AI insights
  + signals; gated by feature flag if AI is V3-not-yet-authorized
  (owner decision per V3 W7 #2)
- **`/owner/(command)/brand`, `/brand/pages`, `/brand/settings`,
  `/brand/subdomains`** — brand center: brand asset registry, page
  builder for static pages, brand settings (logo, colors, voice),
  subdomain config
- **`/owner/(command)/divisions`, `/divisions/performance`,
  `/divisions/[slug]`** — division center: cross-division performance
  grid; per-division drill-down with health, revenue, NPS, exception
  count, recent activity
- **`/owner/(command)/finance`, `/finance/expenses`, `/finance/invoices`,
  `/finance/revenue`** — finance center: revenue trend, AR aging,
  expense ledger, invoice management, multi-currency consolidation
- **`/owner/(command)/messaging`, `/messaging/alerts`,
  `/messaging/queues`, `/messaging/team`** — messaging center: cross-
  division messaging health, alert queues, team messaging surface
- **`/owner/(command)/operations`, `/operations/alerts`,
  `/operations/analytics`, `/operations/approvals`,
  `/operations/queues`** — operations center: cross-division ops
  alerts, analytics dashboard, approvals queue (KYC + sensitive
  actions), exception queues
- **`/owner/(command)/settings`, `/settings/audit`, `/settings/comms`,
  `/settings/security`** — settings: audit log explorer, comms
  preferences, security (sessions, devices, MFA, recovery)
- **`/owner/(command)/staff`, `/staff/directory`, `/staff/invite`,
  `/staff/roles`, `/staff/tree`, `/staff/users/[id]`** — staff center:
  directory, invite + onboard, role management, org tree, user detail
  with role + activity + impersonation

All consume `@henryco/workspace-shell` (density variant per DASH-8).
Notifications-ui WIRED (V3 E1 closure).
Search palette MOUNTED (V3 H1 closure).
Bulk operations + advanced filters + exports via DOCS-01 — primitive
landing per DASH-8 G5/G6/G7.

### C. Staff workspace (`staffhq.henrycogroup.com/workspace`)

Per DASH-8 §G9: `apps/hub/app/workspace/[[...slug]]/page.tsx` becomes
**permanent 308 to `account.henrycogroup.com/?role=staff`**. Active
staff users land in the consumer Track A shell with `role=staff` cookie
preference applied.

`workspace.henrycogroup.com` → 308 to `staffhq.henrycogroup.com` →
308 to `account.henrycogroup.com/?role=staff`.

The old hub workspace stub is DELETED 30 days after the redirect
lands and is verified to route correctly (DASH-8 G12).

`apps/hub/proxy.ts` + `apps/hub/vercel.json` updated.

### D. Internal comms (`apps/hub/components/owner/InternalTeamCommsClient.tsx`)

Decision per scope budget:
- **Recommended**: fold V2-COMPOSER-02 in — refactor
  `InternalTeamCommsClient.tsx` to consume `@henryco/chat-composer` +
  `@henryco/messaging-thread`. The component is 1223 lines today;
  refactor reduces to ~400 lines + reuses the proven chat primitives.
- **Alternative**: leave as-is and track V2-COMPOSER-02 as follow-up.

If folded: API routes `/api/owner/internal-comms/*` may need minor
adjustment to align with thread engine shape; verify each endpoint
still behaves.

### E. Cross-cutting infrastructure

- **Search outbox cron** (`/api/cron/search-index-worker`) — verify
  every-minute drain healthy; alert on backlog > 100 rows.
- **Owner-reporting cron** (`/api/cron/owner-reporting/monthly`,
  `/owner-reporting/weekly`, `/api/cron/owner-reports`) — render
  premium PDF reports via `@henryco/branded-documents`
  `OwnerReportDocument` template (NEW).
- **Newsletter** (`/api/newsletter/subscribe`, `/preferences`,
  `/unsubscribe`) — verify Brevo integration health (newsletter uses
  Brevo per V2 newsletter foundation); polish UI.
- **Owner APIs** (`/api/owner/*`) — RLS + audit log on every mutation.
- **OneSignalSDKWorker.js** (`apps/hub/public/`) — V3 B10. Decide:
  commit (if intentional) or remove (if accidental).
- **`@henryco/brand` typecheck** — V5-3 unblock; if not yet landed,
  fix as part of this pass.

### F. Database

Most schema is hub-level migrations already applied. This pass adds:

1. **Audit log completeness** — verify `audit_log` table exists with
   adequate columns (actor_user_id, actor_role, action, target_table,
   target_id, before jsonb, after jsonb, ip, user_agent, occurred_at).
   If missing, add via `<TS>_audit_log_foundation.sql`.
2. **Owner-reporting snapshot tables** — `owner_report_snapshots`
   (period, division, metric_type, metric_value, generated_at) for
   PDF generation.
3. **Realtime publication** — verify owner workspace tables publish to
   Realtime for live dashboard updates.

### G. APIs and crons

- Audit + extend every `/api/owner/*` endpoint with structured logger +
  Sentry + audit_log row on mutation.
- Verify `/api/search` returns degraded (200 empty) when Typesense env
  not provisioned (V2-SEARCH-01 hand-off).
- Add `POST /api/owner/exports/[type]` — bulk export endpoint via
  DOCS-01 (DASH-8 G7).
- Verify all crons within Vercel cron budget.

### H. Components

Reuse cross-division primitives. Build (hub-specific):
- `<DirectoryGrid>` — division directory cards with accent + tagline
- `<DivisionAccentChip>` per division
- `<NewsletterSubscribe>`, `<NewsletterPreferences>`,
  `<NewsletterUnsubscribe>`
- `<OwnerSituationRoom>` (executive briefing + comms-health 4-tile +
  next-best actions)
- `<DivisionControlCenter>` (cross-division metric + alert grid)
- `<HelperRecommendationsPanel>`
- `<SensitiveActivityPanel>` (audit log table)
- `<ExecutiveDigestPanel>`, `<UrgentSignalsPanel>`
- `<OwnerFinanceCenter>` (revenue, AR, expenses, invoices)
- `<OwnerMessagingCenter>` (alerts, queues, team)
- `<OwnerOperationsCenter>` (alerts, analytics, approvals, queues)
- `<OwnerSettingsCenter>` (audit, comms, security)
- `<OwnerStaffCenter>` (directory, invite, roles, tree, user detail)
- `<BulkActionBar>`, `<AdvancedFilterBar>`, `<BulkExportButton>`
  (DASH-8 primitives — land in shared `@henryco/dashboard-shell` if
  not already there)
- `<MetricTraceDrawer>` (DASH-8 trust requirement: every metric has a
  "trace" link revealing underlying SQL filter + result + timestamp)

### I. External integrations

- **Brevo** — newsletter (existing)
- **Resend** — owner reports + transactional (existing)
- **Typesense** — search (env-gated; if unset, /api/search returns
  empty 200; verify graceful)
- **Cloudinary** — owner asset uploads, brand assets

### J. Crons + observability

- Search index worker, owner reporting weekly + monthly, all crons
  instrumented + Sentry. Idempotent.
- Audit log on every owner action.
- Site SLO dashboard surface (operations/analytics) — pull from Vercel
  Speed Insights API.

═══════════════════════════════════════════════════════
UNIFORMITY RULES
═══════════════════════════════════════════════════════

(Same matrix; see `docs/rebuild-prompts/logistics.md` § "UNIFORMITY
RULES". Hub-specific: `OwnerReportDocument` + `AuditLogExport`
templates added to `@henryco/branded-documents`.)

ALL master `DASHBOARD-REBUILD-PROMPT-V2-FINAL.md` §4.1 + §4.2
anti-patterns apply. Hub-specific call-outs:

- Owner workspace = **density-first** (anti-pattern #19): NOT consumer
  shell. 12+ tiles, table-first, keyboard-driven, sub-200ms.
- Marketing root = **clarity-first**: 4-6 metric cards, calm typography,
  capability evidence above the fold (no giant hero text).
- Use hub accent `#C9A227`; never default blue.

═══════════════════════════════════════════════════════
DISTINCTIVE RULES — WHAT HUB MUST BUILD
═══════════════════════════════════════════════════════

1. **Group directory** — first-class division landing grid; only hub
   has this shape.
2. **Owner workspace** as density-first (different product than consumer
   dashboard) — DASH-8 reference; only hub.
3. **Staff workspace 308 redirect** to consumer shell with role=staff —
   only hub.
4. **Cross-division search** with outbox cron + Typesense aggregation —
   only hub hosts.
5. **Internal team comms** — only hub.
6. **Newsletter foundation** — only hub.
7. **Owner-reporting weekly + monthly cron** — only hub.
8. **Brand asset registry + page builder** — only hub.
9. **Audit log explorer** — only hub.
10. **Cross-division metric aggregation** — only hub computes platform-
    wide metrics.

═══════════════════════════════════════════════════════
COMPETITOR BENCHMARK
═══════════════════════════════════════════════════════

For marketing root + group directory:
- **Berkshire Hathaway / Bain / McKinsey portfolios** — best-in-class
  for premium group/portfolio presentation
- **Stripe homepage** — best-in-class for premium SaaS marketing
- **Linear marketing** — best-in-class for editorial product marketing

For owner workspace (per DASH-8 §1):
- **Linear** — best-in-class for keyboard-driven density
- **Stripe Dashboard** — best-in-class for finance + reconcilable
  metrics + audit
- **Vercel** — best-in-class for ops + deploy + alerts
- **Plaid admin** — best-in-class for compliance + audit + KYC

For internal comms:
- **Slack canvases / Notion comms / Discord servers** — best-in-class
  for team communication

The bar: visiting `henrycogroup.com` should feel premium-portfolio
calibre. Signing in to `hq.henrycogroup.com/owner` should feel like
you're using the same calibre product as Stripe Dashboard.

═══════════════════════════════════════════════════════
TRUST, PAYMENT, COMPLIANCE
═══════════════════════════════════════════════════════

- Audit log on every owner mutation (DASH-8 G8).
- Reconcilable metrics: every metric on the owner home has a "trace"
  link that opens a drawer showing the underlying SQL filter + result
  set + timestamp (DASH-8).
- Owner-only RLS on most owner_* tables; `is_staff_in('hub', 'admin')`
  for staff with hub admin scope.
- KYC gating on staff invitation + role assignment.
- Newsletter compliance: GDPR opt-in, one-click unsubscribe, sender
  identity per `@henryco/email`.
- Privacy + Terms version history (every publication writes a
  `legal_document_versions` row).
- Audit log explorer is owner-only (RLS enforced).

═══════════════════════════════════════════════════════
MOBILE AND DESKTOP
═══════════════════════════════════════════════════════

- 320/375/390/430/768/1024 px.
- Marketing root mobile ✓ (V2-HERO-01 baseline).
- Owner workspace mobile: density-first means tablet-and-up is the
  primary experience; on phones, gate complex tables to "Open on
  tablet/desktop for full view" but allow read-only metric cards +
  alerts + approvals.
- Internal comms mobile: full-screen thread view with bottom-sheet
  composer.

═══════════════════════════════════════════════════════
LOCALIZATION
═══════════════════════════════════════════════════════

- `@henryco/i18n` foundation only.
- Marketing root: every string under translation key.
- Owner workspace: operator-facing copy in English by default; ensure
  i18n-ready for future. Surface user-facing names of divisions/
  customers in their respective locales.
- Newsletter content: per-locale template rendering.
- RTL verified for marketing root and owner workspace.

═══════════════════════════════════════════════════════
VALIDATION GATE — V1 through V13 + hub-specific
═══════════════════════════════════════════════════════

V1–V13 from master §3 + DASH-8 owner-specific gate additions.
Hub-specific:

- **H1** — Workspace stub redirects to account.* `?role=staff` with
  308; cookie preserved; no redirect loop (audit §A.4-1 closure).
- **H2** — Owner workspace mounts notifications-ui (V3 E1 closure).
- **H3** — Owner workspace mounts search palette (V3 H1 closure).
- **H4** — Every owner mutation writes audit_log + structured log
  + Sentry breadcrumb.
- **H5** — Every metric card has a trace drawer (DASH-8 trust gate).
- **H6** — Owner-reporting weekly + monthly run idempotent; PDF render
  via `@henryco/branded-documents`.
- **H7** — Search index worker drain stays under 100 backlog rows
  (alert if exceeds).
- **H8** — `/api/search` returns 200 empty when Typesense env unset
  (no 500).
- **H9** — Newsletter subscribe/preferences/unsubscribe end-to-end via
  Brevo + signed token.
- **H10** — `apps/hub/public/OneSignalSDKWorker.js` decision committed
  (V3 B10).
- **H11** — V5-3 §12 hub-side fixes (if any) landed.
- **H12** — `@henryco/brand` typecheck unblock landed.
- **H13** — Internal comms decision committed (refactor to chat-composer
  OR explicit deferral note in V3 backlog).

═══════════════════════════════════════════════════════
DEPLOYMENT
═══════════════════════════════════════════════════════

1. Branch `feat/v3-pass-21-hub`.
2. Migrations on Supabase preview branch first.
3. PR with V1–V13 + DASH-8 G1–G13 (where applicable) + H1–H13 PASS table.
4. Vercel preview live-checked across henrycogroup.com,
   hq.henrycogroup.com, staffhq.henrycogroup.com.
5. Merge → auto-deploys all hub host rewrites.
6. Persist report at `.codex-temp/v3-pass-21-hub/report.md`.

═══════════════════════════════════════════════════════
FINAL REPORT
═══════════════════════════════════════════════════════

Sections same shape as logistics: H0 recon, files modified, migrations,
V1–V13 + H1–H13 (+ DASH-8 gates) gate table, anti-pattern audit,
mobile parity, Lighthouse + CWV, a11y audit, hand-off, final
classification.

═══════════════════════════════════════════════════════
SELF-VERIFICATION CHECKLIST
═══════════════════════════════════════════════════════

- [ ] Marketing root in §A rebuilt — directory + newsletter + search +
      legal pages
- [ ] Owner workspace in §B premium density (every command surface
      polished, notifications-ui + search palette wired, bulk ops +
      filters + exports primitives live)
- [ ] Staff workspace stub in §C: 308 → account.* `?role=staff`;
      cookie preserved; no loop
- [ ] Internal comms in §D: decision committed (refactor recommended)
- [ ] Cross-cutting infra in §E: crons healthy, OneSignalSDKWorker
      decision, brand typecheck unblock
- [ ] Audit log + reconcilable-metric trace primitives live (DASH-8
      trust foundation)
- [ ] Migrations in §F applied with RLS verified
- [ ] APIs in §G shipped with audit_log + structured logger + Sentry
- [ ] Components in §H built reusing primitives
- [ ] OwnerReportDocument template added to `@henryco/branded-documents`
- [ ] Mobile parity at 6 breakpoints (owner workspace gates phone to
      read-only)
- [ ] i18n: every marketing string under a key; RTL renders
- [ ] V1–V13 + H1–H13 + applicable DASH-8 gates PASS or N/A with
      justification
- [ ] Final report persisted
- [ ] PR opened with PASS table in body
