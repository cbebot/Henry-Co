# HenryCo Dashboard + Service Portals — V3 Rebuild Cycle Audit (Phase 0)

**Authored:** 2026-05-14 by the supreme conductor (Claude Opus 4.7, 1M-context session).
**Scope:** Phase 0 of the V3 dashboard + service-portals rebuild — 4 waves, 9 sub-agents, worktree-isolated.
**Status:** Authoritative for THIS rebuild cycle. Cross-references — does not supersede — the prior `docs/dashboard/DASHBOARD-AUDIT-REPORT.md` (§-anchored ground truth for the pre-V3 code state) and `docs/dashboard/DASHBOARD-REBUILD-PROMPT-V2-FINAL.md` (V1–V13 verification gates, anti-patterns).

---

## 0. Preface — what this audit is, what it isn't

This document is the **conductor's working contract** for the V3 dashboard + service-portals rebuild. It does eight things and stops:

1. Reconciles the conductor prompt's `apps/dashboard/**` paths with the repo's actual per-portal-app topology.
2. Tells every sub-agent what's already shipped (so they don't rebuild it).
3. Canonicalises the design token sources (so no agent invents a new palette).
4. Inventories shared primitives Wave-B agents must consume.
5. Locks the env-var canonical table — no agent introduces a new SaaS or env var without updating this table first.
6. Maps the Supabase schema state and the gaps each wave must close.
7. Locks per-portal keep / replace / delete route decisions for Wave B/C scope-setting.
8. Defines wave ordering, gates, and the spawn protocol the conductor follows.

It is **not** a re-derivation of `DASHBOARD-AUDIT-REPORT.md`'s 45k-token Phase 0 (which captured the pre-V3 code state with citation density that no rewrite would improve on). When this audit and that one disagree on a fact, the older audit's file-line citations win for code-truth claims and this audit's wave plan wins for execution.

**Truth hierarchy enforced:** CODE TRUTH (file:line) → DEPLOYMENT TRUTH (vercel.json + deploy logs) → LIVE TRUTH (production with real data). Every assertion below cites the relevant source. Anything I could not verify in this pass is marked `UNVERIFIED — REQUIRES OWNER CONFIRMATION`.

---

## 1. Path reconciliation — "apps/dashboard/" does not exist

The conductor prompt repeatedly references `apps/dashboard/**`. **There is no `apps/dashboard/` directory in this repository** (`ls apps` returns: `account, apps, care, company-hub, hub, jobs, learn, logistics, marketplace, property, staff, studio, super-app`). The "dashboard" surface is **the authenticated shell inside each portal app**, composed against shared packages.

### 1.1 Portal ↔ app mapping (authoritative for the cycle)

| Conductor portal name | Real Next.js app | Production host | Wave |
|---|---|---|---|
| **Care** | `apps/care` | `care.henrycogroup.com` | B1 |
| **Marketplace** | `apps/marketplace` | `marketplace.henrycogroup.com` | B2 |
| **Logistics** | `apps/logistics` | `logistics.henrycogroup.com` | B3 |
| **Studio** | `apps/studio` | `studio.henrycogroup.com` | B4 |
| **Academy** | `apps/learn` | `learn.henrycogroup.com` | B5 |
| **Property** | `apps/property` | `property.henrycogroup.com` | B6 |
| **Jobs** | `apps/jobs` | `jobs.henrycogroup.com` | C1 (solo, heaviest) |

Cross-cutting surfaces (Wave A1) live in:
- `apps/account` (`account.henrycogroup.com`) — customer-facing unified shell host; owns `/messages`, `/notifications`, `/calendar`, `/search`, `/dashboard` (308 → `/`)
- `apps/hub` (`hq.henrycogroup.com`) — owner shell host (Track B, separate product per master orchestration §2)
- `apps/staff` (`staff.henrycogroup.com`) — staff workspace host (functional today per prior audit §A.16; not torn down)
- `packages/dashboard-shell`, `packages/workspace-shell`, `packages/dashboard-modules-*`, `packages/auth`, `packages/data`, `packages/observability`, `packages/search-core`, `packages/search-ui`, `packages/notifications-ui`

Per `docs/vercel-project-map.md:1-26`, each portal is its own Vercel project. The rebuild **does not consolidate hosts**; it consolidates the *design language*, the *primitive vocabulary*, and the *cross-portal cap­abilities* (messages, signal feed, command palette, rooms) into shared packages, then each portal app consumes them.

### 1.2 What "/dashboard root" means in this cycle

`/dashboard` is the authenticated landing inside `apps/account` (`account.henrycogroup.com/dashboard`), with a permanent 308 from `/dashboard` to `/` per the master orchestration. The seven service-portal entries listed in the conductor prompt — `/dashboard/care`, `/dashboard/marketplace`, etc. — are **portal index pages inside their own apps** (e.g. `apps/care/app/page.tsx` for the public face, `apps/care/app/(authenticated)/page.tsx` for the dashboard face). Cross-portal navigation rides on the shared `.henrycogroup.com` cookie and the per-app `proxy.ts` cookie-domain resolver already in place (`packages/config/supabase-cookies.ts:182-273`).

### 1.3 Wave A1 ownership clarified

Wave A1 ("Shell + Cross-cutting") owns:
- `apps/account/app/(account)/layout.tsx` — shell chrome composition (uses `@henryco/dashboard-shell/shell` primitives: `IdentityBar`, `WorkspaceRail`, `WorkspaceSlot`, `ContextDrawer`, `SupabaseRealtimeProvider`, `BottomActionBar`)
- `apps/account/app/(account)/messages/**` — unified inbox aggregating support + portal threads
- `apps/account/app/(account)/notifications/**` — already in place; promote to first-class shell concern
- `apps/account/app/(account)/calendar/**` — net-new cross-portal calendar (Wave A1 deliverable)
- `apps/account/app/(account)/search/**` — exists; rewire to mount `@henryco/search-ui` palette + `@henryco/search-core` ranker
- `packages/dashboard-shell/src/shell/identity-bar.tsx` — extend with cross-portal global search trigger if missing
- 308 redirect `/dashboard → /` (master §A.4 + §A.15.1)
- Error/loading shells per portal — verify each app's `error.tsx` and `loading.tsx` use the shared `@henryco/ui/public-shell/error-fallback` and `PublicRouteLoader` (per memory `project_henryco_perf01_loading.md`)

Wave A1 does **not** own portal pages, portal data layers, or division-specific modules. Those belong to Wave B/C.

---

## 2. What's already shipped — Wave-A inheritance (do NOT rebuild)

Before the conductor spawns Wave A, every agent must consume the existing infrastructure. The following packages and migrations are in `origin/main` at audit time and pass V1 (build/typecheck/lint clean) as of the most recent commits:

### 2.1 Shared packages — already shipped (Wave A1 inheritance)

| Package | Path | Status | Notes |
|---|---|---|---|
| `@henryco/auth` | `packages/auth/src/{server,owner,staff,viewer,cookies,types}.ts` + `_internal/admin-supabase.ts` | **SHIPPED** | `requireUnifiedViewer`, `getViewerRoles`, owner/staff helpers, shared cookie wiring. Wraps Supabase + SQL `is_staff_in()`. Closes prior audit §A.3-2 / §C.1-1. |
| `@henryco/data` | `packages/data/src/{client,dashboard-summary,signal-feed,cross-division-activity,support-summary,database.types}.ts` | **SHIPPED** | Cross-division typed helpers + workspace-root Supabase typegen. Closes prior audit §A.3-3 / §C.3-1. |
| `@henryco/observability` | `packages/observability/src/{logger,events,audit-log,redaction,sentry/}` | **SHIPPED** | Sentry client/server/instrumentation, structured logger with PII redaction, event-taxonomy emitter, audit log helper. Closes prior audit §C.8-1. |
| `@henryco/dashboard-shell` | `packages/dashboard-shell/src/{components,shell,tokens,register,owner-register,staff-register,home-widget,command-palette,command-aggregator,notification-categories,role-gate}.ts` | **SHIPPED** | All Wave-A1 primitives — see §3.1 below. |
| `@henryco/workspace-shell` | `packages/workspace-shell/src/{shell,sidebar,mobile-header,bottom-nav,primitives,skeletons,error-boundary,types}.{ts,tsx}` | **SHIPPED** | Authenticated chrome wrapper (sidebar + mobile-header + bottom-nav). |
| `@henryco/dashboard-modules-account` | `packages/dashboard-modules-account/src/{module,data,format,widgets/}` | **SHIPPED** | Customer-overview module registered against `@henryco/dashboard-shell/register`. |
| `@henryco/dashboard-modules-marketplace` | `packages/dashboard-modules-marketplace/src/{module,data,format,widgets/}` | **SHIPPED** | Reference division module. |
| `@henryco/dashboard-modules-wallet` | `packages/dashboard-modules-wallet/src/{module,data,format,widgets/}` | **SHIPPED** | Cross-cutting customer wallet module. |
| `@henryco/dashboard-modules-owner` | `packages/dashboard-modules-owner/src/{modules.ts,owner-{ai,brand,divisions,finance,messaging,operations,overview,settings}/}` | **SHIPPED** | Owner shell modules (Track B per master §2). |
| `@henryco/dashboard-modules-staff` | `packages/dashboard-modules-staff/src/{modules.ts,shared,staff-{care,finance-operator,jobs,learn,logistics,marketplace,moderation}/}` | **SHIPPED** | Staff workspace modules. |
| `@henryco/dashboard-modules-building`, `-hotel` | `packages/dashboard-modules-{building,hotel}/src/{index,module}.tsx` | **SHIPPED (stub)** | Future divisions; `getRoleGate` returns `hidden` until owner flips the flag. Extensibility proof. |
| `@henryco/search-core` | `packages/search-core/src/{client,query,collections,ranking,palette-ranker,outbox,rate-limit,role}.ts` | **SHIPPED** | Typesense client + ranking + outbox drain + scoped key issuance (V2-SEARCH-01). |
| `@henryco/search-ui` | `packages/search-ui/src/{palette,results,hooks,motion}` | **SHIPPED** | Cmd/Ctrl+K palette + results page. **Not yet mounted on all portal shells** — Wave A1 residual + Wave B coverage. |
| `@henryco/notifications-ui` | `packages/notifications-ui/src/{tokens,severity,icons,motion,gestures,deep-link,types}` | **SHIPPED** | Bell + popover + toast + severity. **Sole consumer = `apps/account`** per prior audit §A.3-1 — Wave A1 residual is broader rollout. |
| `@henryco/chat-composer` | `packages/chat-composer/` | **SHIPPED** | V2-COMPOSER-01 — 5 surfaces consume (account, care, jobs, studio, support). |
| `@henryco/messaging-thread` | `packages/messaging-thread/` | **SHIPPED** | Phase 3a shared thread engine — studio + jobs already migrated. |
| `@henryco/address-selector` | `packages/address-selector/server/geocode.ts` + UI | **SHIPPED** | V2-ADDR-01; 4 divisions consume. |
| `@henryco/cart-saved-items` | `packages/cart-saved-items/` | **SHIPPED** | V2-CART-01; marketplace + account consume. |
| `@henryco/branded-documents` | `packages/branded-documents/src/fonts/` + templates | **SHIPPED** | V2-DOCS-01 React-PDF templates. |
| `@henryco/email` | `packages/email/{send,sender-identity,providers/{brevo,resend}}.ts` | **SHIPPED** | Purpose-aware sender resolver — Brevo + Resend with email rail separation (V2-PNH-03B). 12 purposes. |
| `@henryco/i18n` | `packages/i18n/src/{deepl,…}.ts` | **SHIPPED** | 11 locales + DeepL runtime translation. |
| `@henryco/seo` | `packages/seo/src/analytics/HenryCoAnalytics.tsx` + utilities | **SHIPPED** | JSON-LD + OG + manifest + analytics. |
| `@henryco/trust`, `@henryco/lifecycle`, `@henryco/intelligence`, `@henryco/pricing`, `@henryco/payment-surface`, `@henryco/config`, `@henryco/ui`, `@henryco/brand`, `@henryco/newsletter`, `@henryco/notifications` | `packages/{trust,lifecycle,intelligence,pricing,payment-surface,config,ui,brand,newsletter,notifications}/` | **SHIPPED** | Foundation packages — used everywhere. |

**Implication for the conductor:** Wave A1 is *not* a rebuild — it is **(a)** a coverage audit (every portal app consumes the shipped primitives), **(b)** the broader rollout of `@henryco/notifications-ui` and `@henryco/search-ui` onto the six remaining portal shells, **(c)** the `/messages` and `/calendar` cross-portal aggregator pages, **(d)** any residual shell composition gaps surfaced by Wave B reviews.

### 2.2 Cross-division Supabase infrastructure — already shipped

| Asset | Migration | Notes |
|---|---|---|
| `public.is_staff_in(division_key, role_key)` SQL predicate | `apps/hub/supabase/migrations/20260502120000_staff_notifications_audience.sql:67-160` | Canonical staff-membership oracle. RLS-safe `security definer set search_path = public`. |
| `customer_notifications` + signal-foundation columns | `20260501120000_notification_signal_foundation_extensions.sql` (V2-NOT-01-A) | Added `actor_user_id, email_dispatched_at, email_provider, publisher, request_id` + email-fallback indexes. RLS: `auth.uid() = user_id`. |
| `customer_preferences` quiet hours + muted lists | same migration | `email_fallback_enabled`, `email_fallback_delay_hours` (1/4/12/24/48), `quiet_hours_timezone` (IANA), `muted_event_types[]`, `muted_divisions[]`. |
| `staff_notifications` + `staff_notification_states` | `20260502120000_staff_notifications_audience.sql` (V2-NOT-02-A) | Targeting via `recipient_user_id` / `recipient_role` / `recipient_division`. RLS via `is_staff_in()`. |
| Realtime publication | `20260501130000_notification_realtime_publication.sql` (customer) + tail of audience migration (staff) | All three tables on `supabase_realtime`. RLS applies to subscription stream. |
| `notification_delivery_log` + `purged_at` | `20260419150000_notification_delivery_log.sql` + V2-NOT-02-A purge cols | Cross-division delivery audit + 30-day soft-delete. |
| `notification_signal_preferences` | `20260420160000_notification_signal_preferences.sql` | Read with signal client. |
| `function_search_path_lockdown` (in-flight) | `apps/hub/supabase/migrations/20260514110000_function_search_path_lockdown.sql` (UNCOMMITTED in current tree — another session's WIP) | Hardens existing function definitions; Wave A1 should reconcile post-merge. |

The signal feed function (`public.get_signal_feed(viewer_id, limit_count)`) was a DASH-1 deliverable. Verify presence via `pnpm dlx supabase migrations list` — if absent, Wave A1 adds it. Most likely it has shipped given `packages/data/src/signal-feed.ts` exists.

### 2.3 What is genuinely NEW in this cycle

Per the conductor prompt, exactly two new shared deliverables and one operational pattern:

1. **`packages/rooms`** — does not exist in `origin/main` at audit time. Wave A2 ships it. See §4 below for the contract.
2. **Worktree-isolated parallel rebuilds** — six Wave B agents working concurrently on six portal apps, plus one Wave C agent on Jobs. Each in its own git worktree per the conductor's spawn protocol. No prior pass operated with this concurrency model.
3. **Per-portal editorial rebuild bar** — the recent account-rebuild commits (`c5072b22 tasks`, `3c2d0f99 invoices`, `6d02d6d1 notifications`, `0030555f security`, `a816fe79 verification`, `32166aab wallet`, `7f5a6ab9 logistics`) and the in-flight property work (`PropertyHero.tsx`, `SavedPropertiesGallery.tsx` on `rebuild/account-property-module`) set the visual + interaction standard every Wave B portal must hit.

Everything else is *consumption*, *coverage*, or *cleanup* of already-shipped primitives.

---

## 3. Design tokens — canonical source, no inventions allowed

### 3.1 Single source of truth

The token system is **already canonicalised at PASS 19/20**. The audit's job is to point at the source paths and forbid invention.

| Layer | Path | Authority |
|---|---|---|
| Doc (semantic spec) | `docs/design-tokens.md:1-308` | Authoritative spec — typography scale, color tokens, theme parity rules, approved patterns, hierarchy/density discipline, accessibility, elevation, motion + easing, interaction states |
| CSS custom properties (light + dark) | `packages/ui/src/styles/globals.css` | `--hc-*` runtime tokens — every dashboard surface reads from here |
| Typed mirrors for shell primitives | `packages/dashboard-shell/src/tokens/{color,type,spacing,focus,motion,elevation,interaction}.ts` | Used internally by `@henryco/dashboard-shell` components |
| Per-app overrides | `apps/<x>/app/globals.css` (e.g. `apps/account/app/globals.css`, `apps/staff/app/globals.css`) | Map division-local tokens (`--acct-gold`, `--staff-gold`) onto canonical `--hc-*` names — division-flavoured surfaces inherit the language |

### 3.2 Rules enforced for every Wave B/C agent

1. **No new hex literals in surface code.** `bg-[#0c0e14]`, `text-zinc-900`, `style={{ color: "#1F8B4C" }}` — all forbidden in any dashboard surface that ships to a public route. Cite `docs/design-tokens.md:185-191`.
2. **No new tokens invented.** If a Wave-B agent needs a token that doesn't exist (e.g. a new status family), they propose it via PR to `docs/design-tokens.md` and `packages/ui/src/styles/globals.css` **before** consuming it. Reviewer rejects PRs that ship inline.
3. **Typography ≤ three weights per page** (regular, semibold, bold), **≤ three heading levels per viewport**, body ≤ 16px, reading line-length ≤ 65ch. Cite `docs/design-tokens.md:30-37, 168-174`.
4. **Premium accent reserved for primary action.** One `--hc-accent` per surface. Status uses status tokens — never accent for status, never accent for body text.
5. **Motion language locked.** Durations 120/180/260ms, ease curves locked to `--hc-ease-{standard,in-out,emphasized,linear}`. Emphasized is celebration-only (success-lock, payment-land). No bouncing, no parallax, no scroll-jacking, no auto-play video. `prefers-reduced-motion: reduce` respected universally. Cite `docs/design-tokens.md:210-258`.
6. **All six interaction states designed** for every interactive element (default, hover, pressed, focus-visible, disabled, loading). Cite `docs/design-tokens.md:259-305`.
7. **Brand-fixed panels** that intentionally lock to a single theme must declare a complete self-contained palette including text colors. They must **not** borrow `--hc-text-primary` from parent. Cite `docs/design-tokens.md:114-120`.

### 3.3 Owner's "premium" bar (memory: feedback_no_giant_hero_text)

The recent account rebuild commits (`c5072b22 tasks`, `3c2d0f99 invoices`, `6d02d6d1 notifications`, `0030555f security`, `a816fe79 verification`) establish the editorial premium bar:

- Hero = capability evidence (live numbers, current state, next action), **not** headline size. Giant landing heroes that fill the viewport are rejected.
- Above the fold is dense, not sparse. Information-first.
- Card walls of 12+ identical tiles are an anti-pattern — fewer, denser, opinionated cards.
- Editorial typography (Source Serif 4) only where it earns its place (display headers, occasional accent). Sans (Inter) for everything else. Mono for IDs, code, transcripts, tabular numbers.
- Cited in-flight reference: `apps/account/components/property/PropertyHero.tsx` + `apps/account/components/property/SavedPropertiesGallery.tsx` on branch `rebuild/account-property-module` (active work, do not touch).

---

## 4. Wave A2 — Rooms infrastructure contract (greenfield)

`packages/rooms` does not exist. This is the only true greenfield deliverable in the entire cycle. Wave A2 ships it standalone, on `rebuild/dashboard-rooms`.

### 4.1 What Rooms owns

A single provider-abstracted real-time room engine that every portal consumes for live audiovisual + collaborative sessions:

- Care: virtual consultation / pickup coordination room
- Marketplace: dispute video evidence + seller↔buyer voice room (optional, deferred-able)
- Studio: collab project review room
- Academy (Learn): live class room (low-latency video + chat + screen share)
- Logistics: live tracking voice + driver↔customer text bridge
- Property: virtual viewing tour room
- Jobs: **interview room** — Wave C's hardest deliverable. WebRTC video + collab code editor pane + interviewer-only scorecard sidebar + recording-consent flow

One stack. Zero per-portal video stack duplication. The anti-pattern "two agents building their own video/realtime stack" is auto-reject.

### 4.2 Provider abstraction

The package exposes a typed React hook + server actions abstracted over a provider driver. The conductor mandates `Daily.co primary, Jitsi fallback` per `docs/rebuild-prompts/README.md:194-196` (Jobs default). Wave A2 implements:

- `packages/rooms/src/providers/daily.ts` — Daily.co driver (account creation handled server-side, no candidate sign-up required)
- `packages/rooms/src/providers/jitsi.ts` — Jitsi driver (no-account fallback)
- `packages/rooms/src/provider-selector.ts` — env-driven selection: `ROOMS_PROVIDER=daily|jitsi`; if Daily creds absent, fall back to Jitsi gracefully (degrade to 200, not 500)

Mux is reserved for the Academy live-class case if recording + playback at low latency is needed; Mux as the room provider is **out of scope** for Wave A2 — the room engine just speaks Daily/Jitsi and any future Mux integration is a follow-up.

### 4.3 Required primitives shipped by Wave A2

- `<RoomShell />` — typed wrapper around provider video; receives `{ roomId, role, scorecardEnabled, recordingConsent, collabEditor }`
- `<PresencePane />` — live participant list with hand-raise + mute states
- `<RecordingConsent />` — server-side gate that records consent in `room_recordings_consent` (new table — see §6) before recording starts
- `<ScreenSharePane />` — abstracted screen-share starter
- `<CollabEditorPane />` — Yjs-backed shared code editor (used by Jobs interview room) with language + linter selection
- `<ScorecardSidebar />` — interviewer-only sidebar reading from `room_scorecards` (new table)
- `useRoomLifecycle(roomId)` — typed hook for join/leave/recording-state, swapping providers without consumer rewrite
- Server actions: `createRoom`, `joinRoom`, `recordConsent`, `stopRecording`, `getRoomTranscript`

### 4.4 Schema (Wave A2 ships)

New migrations under `apps/hub/supabase/migrations/<TS>_rooms_*.sql` (hub-canonical schema location):

- `rooms_sessions` — id, kind (`care_consult | marketplace_dispute | studio_review | academy_class | logistics_call | property_tour | jobs_interview`), provider, scheduled_at, joined_at, ended_at, status, owner_user_id
- `rooms_participants` — session_id, user_id, role, joined_at, left_at, hand_raised
- `rooms_recordings_consent` — session_id, user_id, granted_at, withdrew_at, consent_text_version
- `rooms_recordings` — session_id, provider_recording_id, url, expires_at, transcript_url
- `rooms_scorecards` — session_id, reviewer_user_id, dimensions (jsonb), notes_md, submitted_at
- `rooms_messages` — session_id, sender_user_id, body_md, attachments (jsonb), sent_at — for the in-room chat stream

RLS: every table gated by participant membership (`exists (select 1 from rooms_participants where session_id = … and user_id = auth.uid())`). Recording consent rows are user-self-only.

### 4.5 Acceptance gates

Wave A2 PR cannot merge until:

- R1. `pnpm -r build && pnpm -r typecheck && pnpm -r lint` clean.
- R2. A Playwright happy-path session: two test users join the same `rooms_sessions`, exchange chat, share screen, end. Provider = Daily (with env present) and Jitsi (env absent — verifies fallback).
- R3. Recording consent flow: starting recording with non-consent on one participant blocks, and the audit row in `rooms_recordings_consent` is created.
- R4. RLS: a third (non-participant) user is denied SELECT/INSERT on every rooms table.
- R5. Bundle audit: the room route JS payload < 250KB gz on the consumer test page.
- R6. axe-core: zero violations on the test room page (live region for join/leave; captions placeholder where supported).
- R7. Env-var canonical table updated with `DAILY_API_KEY, DAILY_DOMAIN, NEXT_PUBLIC_JITSI_DOMAIN` (or whichever provider envs Wave A2 lands on).

---

## 5. Shared primitive inventory — what Wave B/C must consume

Wave B and Wave C agents **must** consume the primitives below. Reimplementing them is auto-reject. The conductor reviews every Wave-B/C PR for these patterns and rejects rebuilds.

### 5.1 `@henryco/dashboard-shell` — components (already shipped)

Listed by file under `packages/dashboard-shell/src/components/`:

| Primitive | File | Purpose |
|---|---|---|
| `ActionButton` | `action-button.tsx` | Primary action with idle / pending / disabled / spinner / success-lock states. Closes click-twice bug class. |
| `Panel` | `panel.tsx` | Card / panel surface with HenryCo geometry. Replaces `bg-white rounded-lg shadow`. |
| `PageHeader` | `page-header.tsx` | Kicker + title + description. Renders against `--hc-accent-text` + `--hc-text-primary` + `--hc-text-secondary` capped at 65ch. |
| `Section` | `section.tsx` | Kicker + headline + description container for a content section. |
| `MetricCard` | `metric-card.tsx` | Required `comparison \| trend` prop — anti-pattern #18 (metrics-without-context) enforced at type level. |
| `SignalCard` | `signal-card.tsx` | Action-first signal row for the signal feed. |
| `QuickLink` | `quick-link.tsx` | Lightweight nav row for sub-modules. |
| `Chip`, `Badge`, `SlaChip` | `chip.tsx`, `badge.tsx`, `sla-chip.tsx` | Status + label tokens. |
| `EmptyState` | `empty-state.tsx` | Kicker + headline + single action. No cartoons, no "Coming soon" decor. |
| `LoadingSkeleton` | `loading-skeleton.tsx` | Matches final layout dimensions. Zero CLS. |
| `ErrorBoundary` | `error-boundary.tsx` | Retry primitive — wired into Sentry via `@henryco/observability`. |
| `DivisionImage` | `division-image.tsx` | Cloudinary-aware Next/Image wrapper. **Use everywhere** — kills raw `<img>` anti-pattern (prior audit §B.marketplace-7, §B.property-7). |
| `TypeaheadGrid` | `typeahead-grid.tsx` | Replaces long-scroll pickers (anti-pattern #1 — prior audit §B.care-7, §B.studio-7). |
| `BottomSheet`, `Drawer`, `FocusRing` | `bottom-sheet.tsx`, `drawer.tsx`, `focus-ring.tsx` | Mobile chrome + focus management. |
| `QueueTable` | `queue-table.tsx` | Dense operator-side table for staff workspaces. |
| `AdvancedFilterBar`, `BulkActionBar`, `BulkExportButton` | `advanced-filter-bar.tsx`, `bulk-action-bar.tsx`, `bulk-export-button.tsx` | Operator-side bulk action surface (Wave C may extend for Jobs recruiter pipeline). |

### 5.2 `@henryco/dashboard-shell` — shell composition (already shipped)

Listed by file under `packages/dashboard-shell/src/shell/`:

| Composition primitive | File |
|---|---|
| `IdentityBar` | `identity-bar.tsx` |
| `WorkspaceRail` | `workspace-rail.tsx` |
| `WorkspaceSlot` | `workspace-slot.tsx` |
| `ContextDrawer` | `context-drawer.tsx` |
| `BottomActionBar` | `bottom-action-bar.tsx` |
| `StaffShell` | `staff-shell.tsx` |
| `SupabaseRealtimeProvider` | `supabase-realtime-provider.tsx` |
| Realtime hooks/types/rules/data | `realtime-{hooks,types,rules,data-source}.ts` |
| Mobile shell CSS | `mobile-shell-css.ts` |

Wave A1 residual work is mostly: wire `IdentityBar`'s search trigger to `@henryco/search-ui` palette, ensure `ContextDrawer` reads from `@henryco/notifications-ui`, and add a calendar slot if one doesn't exist.

### 5.3 `@henryco/workspace-shell` — authenticated chrome (already shipped)

| File | Role |
|---|---|
| `shell.tsx` | Top-level authenticated layout wrapper |
| `sidebar.tsx` | Desktop sidebar |
| `mobile-header.tsx` | Mobile header |
| `bottom-nav.tsx` | Mobile bottom navigation |
| `primitives.tsx` | Local primitive set |
| `skeletons.tsx` | Loading skeleton variants |
| `error-boundary.tsx` | Error boundary |
| `types.ts` | Type defs |

### 5.4 Module registry (already shipped)

`@henryco/dashboard-shell/register` exposes the `DashboardModule` contract. Each portal MUST register through this contract — never hard-code module composition in shell surfaces:

```ts
type DashboardModule = {
  slug: string;                    // e.g. "care"
  displayName: string;             // from COMPANY.divisions[slug]
  icon: ReactNode;
  accent: string;                  // from COMPANY.divisions[slug]
  getHomeWidgets(viewer): Widget[];
  getCommandPaletteEntries(viewer): PaletteEntry[];
  getNotificationCategories(): Category[];
  getEmptyTeaching(): TeachingContent;
  getDeepLinkTemplate(eventType): string;
  getRoleGate(viewer): "allowed" | "hidden" | { redirect: string };
};
```

Owner + staff variants live in `owner-register.ts` / `staff-register.ts`. Wave B6 (Property) and Wave C (Jobs) extend `dashboard-modules-property` (new) and `dashboard-modules-jobs` (new) packages — register them, don't hard-wire. Mirrors `dashboard-modules-marketplace`'s shape.

### 5.5 Cross-portal primitive consumption matrix (HARD requirement)

| Surface | Required primitive | Source |
|---|---|---|
| Any clickable primary action | `ActionButton` | `@henryco/dashboard-shell/components` |
| Any image | `DivisionImage` | `@henryco/dashboard-shell/components` |
| Any list > 50 rows | `QueueTable` (paginated) or virtualised consumer-side list | `@henryco/dashboard-shell/components` |
| Any messaging surface | `@henryco/chat-composer` + `@henryco/messaging-thread` | `packages/chat-composer/`, `packages/messaging-thread/` |
| Any address-bearing surface | `@henryco/address-selector` (`<AddressSelector>` + `<AddressForm>`) | `packages/address-selector/` |
| Any cart-bearing widget | `@henryco/cart-saved-items` (`SaveForLaterButton`, `SavedBadge`, `SavedItemCard`) | `packages/cart-saved-items/` |
| Any download CTA (invoice, receipt, certificate, KYC summary, support export) | `@henryco/branded-documents` + `DownloadDocumentButton` pattern in `apps/account/components/branded-documents/` | `packages/branded-documents/` |
| Notification bell / popover / toast viewport | `@henryco/notifications-ui` | `packages/notifications-ui/` |
| Cmd/Ctrl+K palette + cross-division search | `@henryco/search-ui` + `@henryco/search-core` | `packages/search-{ui,core}/` |
| Login redirect / role switcher | `apps/account/lib/post-auth-routing.ts` (`resolveUserDashboard`, `decideDashboardResolution`, `DASHBOARD_PREFERENCE_COOKIE`) | V2-AUTH-RT-01 |
| Lifecycle continue panel | `@henryco/lifecycle` (`collectAndPersistLifecycleSnapshot`) | `packages/lifecycle/` |
| Email send | `@henryco/email`'s `sendEmail(purpose, ...)` | `packages/email/` |
| Realtime subscription | `SupabaseRealtimeProvider` at shell root, fan-out via React context | `@henryco/dashboard-shell/shell/supabase-realtime-provider` |
| Auth check | `requireUnifiedViewer` / `getViewerRoles` | `@henryco/auth/server` |
| Observability | `@henryco/observability` (`logger`, Sentry config, event-taxonomy emitter, audit-log) | `packages/observability/` |
| Pricing breakdown | `@henryco/pricing` + governance tables | `packages/pricing/` |
| Trust scoring | `@henryco/trust` | `packages/trust/` |

Reimplementation of any of the above on a Wave-B PR is **auto-reject**.

---

## 6. Env-var canonical inventory

Walked the entire repo. The conductor's "no parallel providers" rule is enforced here: a Wave-B agent who needs an integration must consume from this table before adding any new env var. If they need a new var, it's a PR to this table **before** the consuming code lands.

Methodology: `Grep "process\.env\.([A-Z][A-Z0-9_]+)" apps/** packages/**` → 443 occurrences across 166 files; deduplicated by name and bucketed by purpose. Cross-referenced with `docs/env-vars.md` (Super App), `packages/config/integrations.ts` (web canonical integrations layer), and the 8 V3 PASS 21 division rebuild prompts.

### 6.1 Canonical table

Columns: **Var** · **Required (prod / preview / dev)** · **Purpose** · **Used in** · **Owner wave**.

Conventions:
- `R` = required for the surface to function
- `O` = optional, surface degrades gracefully when absent
- `S` = server-only (must never ship in client bundles)
- `C` = client-safe (`NEXT_PUBLIC_*` or `EXPO_PUBLIC_*`)

#### 6.1.1 Supabase + auth (foundation — already wired)

| Var | Prod | Preview | Dev | Purpose | Used in | Owner |
|---|---|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` (C) | R | R | R | Browser + server Supabase client URL | every web app's `proxy.ts`, `lib/supabase/*.ts`, `packages/auth/`, `packages/data/` | already wired |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` (C) | R | R | R | Supabase anon key (RLS-bound) | same as above | already wired |
| `SUPABASE_SERVICE_ROLE_KEY` (S) | R | O | O | Server-only admin client for cron, owner aggregation, signal feed function, scripts | `apps/*/lib/supabase/admin.ts`, `packages/data/src/client.ts`, `packages/auth/src/_internal/admin-supabase.ts` | already wired |
| `EXPO_PUBLIC_SUPABASE_URL` (C) | R | n/a | R | Mobile Supabase | `apps/super-app/src/platform/adapters/supabase/` | mobile-only |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` (C) | R | n/a | R | same | same | mobile-only |
| `EXPO_PUBLIC_LIVE_SERVICES_APPROVED` (C) | R | n/a | O | Gates production live adapters in super-app | `apps/super-app/src/platform/runtime.ts` | mobile-only |
| `NEXT_PUBLIC_BASE_DOMAIN` (C) | R | R | O (defaults `henrycogroup.com`) | Cross-app deep-link base | `packages/config/company.ts`, `apps/*/app/layout.tsx`, `apps/*/scripts/`, every `proxy.ts` | already wired |

#### 6.1.2 Cloudinary (image / media — canonical provider)

| Var | Prod | Preview | Dev | Purpose | Used in | Owner |
|---|---|---|---|---|---|---|
| `CLOUDINARY_CLOUD_NAME` (S) | R | R | O | Server-side upload signing | `apps/account/lib/cloudinary.ts`, `apps/care/lib/cloudinary.ts`, `apps/jobs/lib/cloudinary.ts`, `apps/marketplace/lib/cloudinary.ts` | already wired |
| `CLOUDINARY_API_KEY` (S) | R | R | O | Same | same | already wired |
| `CLOUDINARY_API_SECRET` (S) | R | R | O | Same | same | already wired |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` (C) | R | R | R | Browser-side image URL builder | `apps/*/components/**`, `@henryco/dashboard-shell/components/division-image.tsx` | already wired |
| `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME` (C) | R | n/a | O | Mobile | `apps/super-app/.env.example:20` | mobile-only |
| `EXPO_PUBLIC_CLOUDINARY_BASE_PATH` (C) | O | n/a | O | Folder prefix for delivery URLs | super-app | mobile-only |

**Hard rule:** Every Wave-B agent uses `<DivisionImage>` (which wraps Next/Image + Cloudinary). Raw `<img>` is forbidden — closes prior audit §B.marketplace-7 (9 occurrences) + §B.property-7 (5 occurrences inc. `PropertyImageGallery`).

#### 6.1.3 Email (Brevo + Resend rail separation — already shipped)

| Var | Prod | Preview | Dev | Purpose | Used in | Owner |
|---|---|---|---|---|---|---|
| `EMAIL_PROVIDER` (S) | O | O | O | Default provider preference (`brevo` \| `resend`) | `packages/email/send.ts` | already wired |
| `EMAIL_FALLBACK_PROVIDER` (S) | O | O | O | Fallback provider | same | already wired |
| `BREVO_API_KEY` (S) | R | R | O | Brevo provider key | `packages/email/providers/brevo.ts` | already wired |
| `BREVO_SENDER_EMAIL` (S) | O | O | O | Brevo default from | same | already wired |
| `BREVO_SENDER_NAME` (S) | O | O | O | Brevo default from name | same | already wired |
| `RESEND_API_KEY` (S) | R | R | O | Resend provider key — required for `auth` + `support` purposes | `packages/email/providers/resend.ts` | already wired |
| `RESEND_FROM_EMAIL` / `RESEND_FROM` (S) | O | O | O | Resend default from | same | already wired |

Plus 12 purpose-scoped sender envs handled by `packages/email/sender-identity.ts:111-113` (`auth, support, care, studio, marketplace, jobs, learn, property, logistics, newsletter, security, generic`). Each purpose has its own env-var lookup with branded-fallback name. **No Wave-B agent introduces a new email purpose without updating `sender-identity.ts`.**

#### 6.1.4 WhatsApp webhooks (Care + Property + Studio + Logistics + Learn)

| Var | Prod | Preview | Dev | Purpose | Used in | Owner |
|---|---|---|---|---|---|---|
| `WHATSAPP_APP_SECRET` (S) | R (care, property, studio) | R | O | HMAC signature verification on inbound webhooks | `packages/config/whatsapp-webhook.ts`, `apps/care/lib/support/whatsapp.ts`, `apps/property/app/api/webhooks/whatsapp/route.ts`, `apps/studio/lib/studio/whatsapp.ts`, `apps/studio/app/api/webhooks/whatsapp/route.ts` | Wave B1/B3/B4/B5/B6 verify HMAC enforced (V5-3 §12 hold) |
| `WHATSAPP_PHONE_ID`, `WHATSAPP_BUSINESS_ID`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_ACCESS_TOKEN` (S) | R per portal | R | O | Per-portal WhatsApp send | same files | per-portal Wave |
| `apps/care/lib/support/whatsapp-health.ts` consumers (9 distinct env hits) | R | R | O | Health-check envs | same | Wave B1 |

#### 6.1.5 Search (Typesense — canonical search core)

| Var | Prod | Preview | Dev | Purpose | Used in | Owner |
|---|---|---|---|---|---|---|
| `NEXT_PUBLIC_TYPESENSE_HOST` (C) | R | O | O | Browser-side search node | `packages/config/integrations.ts` | already wired |
| `NEXT_PUBLIC_TYPESENSE_PROTOCOL`, `NEXT_PUBLIC_TYPESENSE_PORT`, `NEXT_PUBLIC_TYPESENSE_NODES` (C) | O | O | O | Multi-node + override | same | already wired |
| `NEXT_PUBLIC_TYPESENSE_SEARCH_API_KEY` (C) | R | O | O | Scoped search key (read-only, RLS-aware) | `packages/search-core/src/client.ts`, `packages/search-ui/` | already wired |
| `TYPESENSE_ADMIN_API_KEY` (S) | R | O | O | Server-only admin key for indexing + scoped-key issuance | `packages/search-core/src/{client,collections,outbox}.ts`, `apps/hub/app/api/cron/search-index-worker/route.ts` | already wired |

**Rule:** if the env is absent, search degrades to 200 empty — never 500. Per V3 PASS 21 pre-flight #3 (`docs/rebuild-prompts/README.md:121`).

#### 6.1.6 Maps (Mapbox primary; Google Places for address autocomplete)

| Var | Prod | Preview | Dev | Purpose | Used in | Owner |
|---|---|---|---|---|---|---|
| `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` / `NEXT_PUBLIC_MAPBOX_TOKEN` (C) | R (logistics, property) | O | O | Mapbox map render | `packages/config/integrations.ts`, `apps/logistics/lib/logistics/map-provider.ts` | Wave B3 (logistics tracking) + B6 (property map) |
| `GOOGLE_PLACES_SERVER_KEY` (S) | R (where address-selector is used) | O | O | Address autocomplete server-side proxy | `packages/address-selector/server/geocode.ts`, `apps/account/app/api/addresses/places/{autocomplete,details}/route.ts` | already wired |

#### 6.1.7 Payments (Stripe — public surface only today)

| Var | Prod | Preview | Dev | Purpose | Used in | Owner |
|---|---|---|---|---|---|---|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (C) | O | O | O | Stripe publishable for client-side (currently no live PSP — see V5-CLEAR Bug A) | `packages/config/integrations.ts` | deferred — V3 follow-up if owner picks PSP path |

The marketplace checkout is currently wallet / bank-transfer-proof / COD only (V5-CLEAR §P2.1). PSP integration is **out of V3 scope** unless owner authorizes in this cycle. Wave B2 polishes the deferred-state copy; PSP integration is a separate pass.

`@henryco/pricing` and `@henryco/payment-surface` shipped — multi-currency foundation is solid (memory `project_henryco_currency.md`, `project_henryco_pricing.md`).

#### 6.1.8 Observability (Sentry — recently wired in `packages/observability`)

| Var | Prod | Preview | Dev | Purpose | Used in | Owner |
|---|---|---|---|---|---|---|
| `SENTRY_DSN` (S) | R (account, hub, staff) | R | O | Server Sentry DSN | `packages/observability/src/sentry/server.ts`, `apps/*/instrumentation.ts` | already wired |
| `NEXT_PUBLIC_SENTRY_DSN` (C) | R | R | O | Browser Sentry DSN | `packages/observability/src/sentry/client.ts`, `packages/config/integrations.ts` | already wired |
| `SENTRY_ENVIRONMENT` / `NEXT_PUBLIC_SENTRY_ENVIRONMENT` (S/C) | O | O | O | Environment label | same | already wired |
| `VERCEL_GIT_COMMIT_SHA` / `NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA` (S/C) | auto | auto | n/a | Sentry release identifier (Vercel-injected) | same | Vercel-managed |
| `NEXT_RUNTIME` (S) | auto | auto | auto | Next.js runtime branch (`nodejs` \| `edge`) | `apps/*/instrumentation.ts`, `packages/observability/src/sentry/instrumentation.ts` | Next-managed |
| `EXPO_PUBLIC_SENTRY_DSN` (C) | R | n/a | O | Mobile Sentry | `apps/super-app/.env.example:16` | mobile-only |

Wave A1 residual: ensure every portal web app has `instrumentation.ts` calling `@henryco/observability/sentry/server` (verify per-app — account, hub, staff confirmed; others to audit).

#### 6.1.9 Analytics (Vercel + GA — opt-in)

| Var | Prod | Preview | Dev | Purpose | Used in | Owner |
|---|---|---|---|---|---|---|
| `NEXT_PUBLIC_VERCEL_ANALYTICS` (C) | O (default on) | O | O | Disable Vercel analytics if set to `0` | `packages/seo/src/analytics/HenryCoAnalytics.tsx` | already wired |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` (C) | O | O | O | Google Analytics 4 measurement ID | same | already wired |

#### 6.1.10 Push notifications (OneSignal — web push)

| Var | Prod | Preview | Dev | Purpose | Used in | Owner |
|---|---|---|---|---|---|---|
| `NEXT_PUBLIC_ONESIGNAL_APP_ID` (C) | O | O | O | OneSignal web-push app ID | `packages/config/integrations.ts` | optional, gated |
| `NEXT_PUBLIC_ONESIGNAL_SAFARI_WEB_ID` (C) | O | O | O | Safari web ID | same | optional |

Mobile push uses `expo-notifications` + super-app adapter — separate path.

#### 6.1.11 i18n / translation runtime (DeepL fallback)

| Var | Prod | Preview | Dev | Purpose | Used in | Owner |
|---|---|---|---|---|---|---|
| `DEEPL_API_KEY` (S) | O | O | O | Runtime auto-translate fallback (V3 I18N-PASS-18) | `packages/i18n/src/deepl.ts` | already wired |

#### 6.1.12 Trust / fingerprinting

| Var | Prod | Preview | Dev | Purpose | Used in | Owner |
|---|---|---|---|---|---|---|
| `NEXT_PUBLIC_FINGERPRINTJS_API_KEY` (C) | O | O | O | FingerprintJS device signal | `packages/config/integrations.ts` | already wired |
| `NEXT_PUBLIC_FINGERPRINTJS_REGION` (C) | O | O | O | FPJS region | same | already wired |

#### 6.1.13 Calendar integration (Google Calendar — Wave A1 calendar deliverable consumes)

| Var | Prod | Preview | Dev | Purpose | Used in | Owner |
|---|---|---|---|---|---|---|
| `NEXT_PUBLIC_GOOGLE_CALENDAR_API_KEY` (C) | O (Wave A1 calendar deliverable) | O | O | Optional read-only public calendar view | `packages/config/integrations.ts` | Wave A1 if calendar page consumes |

The cross-portal `/calendar` aggregator (Wave A1) primarily reads from Supabase (portal bookings, room sessions, interviews, viewings, learn classes). External calendar sync is an optional V3 follow-up — out of A1 scope unless owner names it.

#### 6.1.14 Rooms (Wave A2 ships)

| Var | Prod | Preview | Dev | Purpose | Used in | Owner |
|---|---|---|---|---|---|---|
| `DAILY_API_KEY` (S) | R | R | O | Daily.co provider — server-side room creation | `packages/rooms/src/providers/daily.ts` | **Wave A2** |
| `DAILY_DOMAIN` (S) | R | R | O | Daily.co subdomain | same | **Wave A2** |
| `NEXT_PUBLIC_DAILY_DOMAIN` (C) | R | R | O | Browser-side embed config | same | **Wave A2** |
| `NEXT_PUBLIC_JITSI_DOMAIN` (C) | O (fallback) | O | O | Jitsi self-hosted or public instance | `packages/rooms/src/providers/jitsi.ts` | **Wave A2** |
| `ROOMS_PROVIDER` (S) | O (defaults to daily if creds present, else jitsi) | O | O | Provider override | `packages/rooms/src/provider-selector.ts` | **Wave A2** |

`UNVERIFIED — REQUIRES OWNER CONFIRMATION`: Daily.co vs Jitsi default per `docs/rebuild-prompts/README.md:194-196` is `Daily.co primary, Jitsi fallback`. Owner can override at Wave A2 spawn time.

#### 6.1.15 E-signature (Studio + Jobs offers/proposals)

| Var | Prod | Preview | Dev | Purpose | Used in | Owner |
|---|---|---|---|---|---|---|
| `DOCUSIGN_INTEGRATION_KEY` (S) | O | O | O | DocuSign primary | new — Wave B4 (Studio) and Wave C (Jobs offers) | Wave B4 + C |
| `DOCUSIGN_USER_ID`, `DOCUSIGN_ACCOUNT_ID`, `DOCUSIGN_PRIVATE_KEY` (S) | O | O | O | DocuSign auth | same | Wave B4 + C |

`UNVERIFIED — REQUIRES OWNER CONFIRMATION`: default is "DocuSign if env set, typed-name fallback otherwise" per `docs/rebuild-prompts/README.md:196`. Wave B4 + C use typed-name with audit_log row if env absent.

#### 6.1.16 Video (Learn — Mux primary, Cloudinary fallback)

| Var | Prod | Preview | Dev | Purpose | Used in | Owner |
|---|---|---|---|---|---|---|
| `MUX_TOKEN_ID` (S) | R for Academy live-class (Wave B5) | O | O | Mux Live Streaming + Playback | new — Wave B5 (Academy) | Wave B5 |
| `MUX_TOKEN_SECRET` (S) | R | O | O | same | same | Wave B5 |
| `NEXT_PUBLIC_MUX_DATA_ENV_KEY` (C) | O | O | O | Mux Data analytics | same | Wave B5 |

If Mux env absent, Academy live-class falls back to Cloudinary playback URLs for pre-recorded content (live class disabled gracefully).

#### 6.1.17 Cron / job scheduling

| Var | Prod | Preview | Dev | Purpose | Used in | Owner |
|---|---|---|---|---|---|---|
| `CRON_SECRET` (S) | R | R | O | Authorization header for Vercel cron routes | every `apps/*/app/api/cron/*/route.ts` | already wired |

Existing cron schedules (per `apps/*/vercel.json`): account (notification-email-fallback every 15min, notification-purge daily 03:00), care (care-automation daily 08:15), hub (owner-reports daily 07:05, owner-reporting weekly + monthly).

#### 6.1.18 Feature flags

`@henryco/intelligence` ships feature-flag parsing. Per V3 PASS 21 README §6 and §7, the following flags govern:

| Flag | Default | Use |
|---|---|---|
| `dashboard_v3_<wave>` | off | Per-wave feature gates for safe rollout |
| `intelligence_recommendations` | configurable | Smart recommendations in account home |
| `owner_workspace_ai` | off | Owner workspace AI surfaces (V3 W7 #2 — gated) |
| Per-flag overrides | env-driven | See `apps/super-app/.env.example` for examples |

EXPO_PUBLIC_FEATURE_* (super-app-only): `PAYMENTS, ANALYTICS, LIVE_PUSH, LIVE_MONITORING, REMOTE_DATABASE, MEDIA_UPLOAD, PAYMENTS_DEMO, RUNTIME_DIAGNOSTICS` per `docs/env-vars.md:18-25`.

#### 6.1.19 Dev / smoke / Vercel runtime

| Var | Purpose | Source |
|---|---|---|
| `NODE_ENV` | Build environment | universal |
| `VERCEL_URL` | Per-deployment preview URL | Vercel-injected |
| `JOBS_SMOKE_URL` | Jobs smoke test target | `apps/jobs/scripts/smoke-jobs.mjs` |
| `NEXT_PUBLIC_JOBS_URL` | Cross-app jobs deep-link override | `apps/jobs/scripts/backfill-jobs-shared-links.ts` |
| `EXPO_PUBLIC_HENRYCO_ENV`, `EXPO_PUBLIC_APP_ENV`, `EXPO_PUBLIC_WEB_ORIGIN` | Mobile runtime mode | `apps/super-app/src/platform/runtime.ts`, env-vars.md |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Script-only (seed, reset-staging) | `apps/super-app/scripts/seed.mjs`, `apps/super-app/scripts/reset-staging.mjs` |

### 6.2 Hard rule for sub-agents

> **Before adding a new env var or new SaaS provider, a Wave-B/C agent MUST update this table and link the update in the PR body. Reviewer rejects PRs that introduce parallel providers when an existing one already covers the surface.**

### 6.3 Preview-deploy degradation contract (memory: `project_henryco_vercel_preview_env_gap.md`)

Production-scoped envs (Supabase URL/anon-key + service role) are not present on Vercel preview deploys. Every shell + portal page that depends on them must **degrade to a 200-with-degraded-state**, never 500. Wave A1 verifies this contract on the unified shell; each Wave-B agent verifies it on their portal index in V12 (no 4xx/5xx in network).

---

## 7. Schema map + gap list

### 7.1 Migrations per app

| App | Migrations | Purpose | Schema owner |
|---|---:|---|---|
| `apps/hub` | **34** | **Canonical cross-cutting schema** — customer_*, staff_*, notification_*, audit_log, owner_*, workspace_*, search_*, function definitions. **All shared schema lives here.** Wave A2 rooms migrations land here. | Hub |
| `apps/studio` | 12 | studio_projects, studio_proposals, studio_briefs, studio_role_memberships, studio_invoices | Studio (Wave B4) |
| `apps/marketplace` | 7 | marketplace_products, marketplace_orders, marketplace_order_groups, marketplace_applications, marketplace_disputes, marketplace_payouts, marketplace_seller_tiers, marketplace_deals_curation | Marketplace (Wave B2) |
| `apps/learn` | 4 | learn_courses, learn_paths, learn_enrollments, learn_certificates, learn_assignments, learn_teacher_applications, learn_role_memberships, learn_unlock_policy | Academy (Wave B5) |
| `apps/property` | 3 | property_listings, property_role_memberships, property_policies (RLS) | Property (Wave B6) |
| `apps/jobs` | 1 | jobs minimal local | Jobs (Wave C) — likely adds memberships migration |
| `apps/account` | 0 | uses Hub schema only | n/a |
| `apps/care` | 0 | uses Hub schema only | Care (Wave B1) — likely adds care-local migration |
| `apps/logistics` | 0 | uses Hub schema only | Logistics (Wave B3) |
| `apps/staff` | 0 | uses Hub schema only | n/a |

### 7.2 Role-membership table gap

Per prior audit §A.6 / §B.jobs-4 / §B.logistics-5 and `apps/hub/supabase/migrations/20260502120000_staff_notifications_audience.sql:39-44`:

| Division | Membership table | Status |
|---|---|---|
| Care | none — uses `profiles.role` | Wave B1 may add `care_role_memberships` for finer ladder (owner/manager/rider/support) |
| Marketplace | `marketplace_role_memberships` | exists |
| Studio | `studio_role_memberships` | exists |
| Property | `property_role_memberships` | exists |
| Learn | `learn_role_memberships` | exists |
| Jobs | none — uses `profiles.role` | Wave C adds `jobs_role_memberships` (candidate / employer / recruiter / admin / moderator / owner) — closes prior audit §A.6, addresses V5-3 §12 hold D7 conversation membership |
| Logistics | none — uses `profiles.role` | Wave B3 may add `logistics_role_memberships` for rider role |

`public.is_staff_in(division_key, role_key)` (`apps/hub/supabase/migrations/20260502120000_staff_notifications_audience.sql:67-160`) is updated whenever a new memberships table lands.

### 7.3 Schema additions per wave

**Wave A2 (Rooms):** `rooms_sessions`, `rooms_participants`, `rooms_recordings_consent`, `rooms_recordings`, `rooms_scorecards`, `rooms_messages`. Migration files under `apps/hub/supabase/migrations/<TS>_rooms_*.sql`. RLS gated by participant membership.

**Wave B (per-portal additions, owner-decision dependent):**
- Care: `care_role_memberships` (if owner approves finer ladder); WhatsApp HMAC verification path documented
- Marketplace: deals curation extensions if needed; review-safety helpers via `@henryco/trust` (V3 PASS 21 §marketplace.md)
- Property: inspection rules engine tables (`property_inspection_rules`, `property_inspection_assignments`) per `docs/property-inspection-eligibility-rules.md`
- Studio: chat-composer + messaging-thread already integrated; e-signature audit_log columns
- Academy: live-class session tables (`learn_live_sessions`) if Mux pre-flight env approved; quiz engine schema extensions
- Logistics: (minimal) — possibly `logistics_dispatch_events` for live tracking signal stream
- Jobs (Wave C): `jobs_role_memberships`, `jobs_interview_sessions` (FK to `rooms_sessions`), `jobs_interview_scorecards` (FK to `rooms_scorecards`)

**Wave D:** no schema additions — integration smoke only.

### 7.4 RLS verification gate

Every wave PR runs V3 (RLS verification): a non-privileged user attempts cross-tenant SELECT/UPDATE/DELETE on every table the wave touches, against a real Postgres preview branch (not a mock). Confirms 0 rows returned + 0 mutations applied.

`UNVERIFIED — REQUIRES OWNER CONFIRMATION`: Supabase preview branch quota — V3 PASS 21 pre-flight #7 (`docs/rebuild-prompts/README.md:132`) flags that each division executor creates one preview branch. With 6 parallel Wave-B agents that's 6 simultaneous branches. Confirm at spawn time.

---

## 8. Route map — keep / replace / delete per portal

For each portal, the table below classifies every top-level app-router segment present in `apps/<portal>/app/`. **K** = keep as-is, **R** = replace (rebuild surface, same route), **D** = delete (route is dead / artefact / redirect-loop).

### 8.1 Wave A1 — apps/account (`account.henrycogroup.com`)

| Route | Class | Notes |
|---|---|---|
| `(account)/page.tsx` | R | Current home renders 8 metric cards + lifecycle + division services (4 of 7). Rebuild composes via module registry instead of hard-coded grid. |
| `(account)/layout.tsx` | R | Mount `@henryco/dashboard-shell/shell` chrome (IdentityBar + WorkspaceRail + WorkspaceSlot + ContextDrawer + BottomActionBar + SupabaseRealtimeProvider). |
| `(account)/{messages,notifications,calendar,search,tasks,wallet,security,verification,subscriptions,settings,referrals,activity,verify}/**` | K | Recent rebuild commits set the bar (`c5072b22 tasks`, `3c2d0f99 invoices`, `6d02d6d1 notifications`, `0030555f security`, `a816fe79 verification`, `32166aab wallet`). Touch-ups only if Wave A1 review flags inconsistencies. |
| `(account)/{care,marketplace,jobs,studio,learn,logistics,property}/**` | R | Per-division mirror surfaces inside account dashboard. Wave-B agent for the corresponding portal collaborates with Wave A1 on the mirror page; the mirror reads from the cross-division `@henryco/data` helpers, not from the portal's own data layer. |
| `(account)/property/page.tsx` (in flight on `rebuild/account-property-module`) | R (in flight) | Wave B6 must coordinate with that branch — do not overwrite. Conductor merges the in-flight branch first, then Wave B6 builds on top. |
| `dashboard/` | D | The `apps/account/app/dashboard/` directory becomes a permanent 308 → `/` (per master orchestration). |
| `auth/`, `login/`, `signup/`, `forgot-password/`, `reset-password/` | K | Already premium per recent passes. |
| `api/**` | K | API surface stays as-is — UI rebuild only (anti-pattern #11). |

### 8.2 Wave A2 — packages/rooms (no app routes)

Wave A2 ships a package only. Consumers (Wave B/C) add routes inside their own apps.

### 8.3 Wave B1 — apps/care (`care.henrycogroup.com`)

| Route | Class | Notes |
|---|---|---|
| `(public)/{page,services,pricing,book,track,review,contact,about,unsubscribe}` | K | Public surface is solid post-V2-COPY-01. Polish only. |
| `(public)/book/**` cloth/category picker | R | Prior audit §B.care-7: long-scroll picker. Replace with `<TypeaheadGrid>`. |
| `admin/page.tsx` | R | Prior audit §B.care-3: 5 decorative tiles. Wire each tile to a real surface or remove. |
| `app/` (route group `app/`) | R | Verify and consolidate — Care has a `app/app/(staff)/` double-nested path that prior audit flagged as artefact. Wave B1 cleans this. |
| `(staff)/layout.tsx` | D | 6-line redirect to `staffhq.${baseDomain}/care` (prior audit §A.17). Dead since the staffhq host is broken (prior audit §A.4-1). Wave B1 removes the redirect, deletes orphan staff routes inside apps/care, and confirms operator-side care UI is served by `apps/staff(workspace)/care` (the working baseline per prior audit §A.16). |
| `app/app/(staff)/{manager,owner}/page.tsx` | D | Path artefact — duplicate `/app/app/` segment. Delete in Wave B1. |
| `workspace/access/**` | K | Staff sign-in entry — keep, verify shared-cookie writer. |
| `app/(authenticated)/page.tsx` (new) | R (new) | Wave B1 introduces the customer-side care dashboard inside the customer's authenticated shell at `apps/account/(account)/care/page.tsx` mirror — care portal's authenticated surface delegates there. |
| `api/**` | K | API surface stays. WhatsApp webhook HMAC verification required (V5-3 §12 hold). |

### 8.4 Wave B2 — apps/marketplace (`marketplace.henrycogroup.com`)

| Route | Class | Notes |
|---|---|---|
| `(public)/{page,cart,checkout,search,deals,sell,sell/pricing,trust,help}` + dynamic `(public)/{brand,category,collections,policies,product,store,track}/[slug]` | R | Image surfaces (product/category/brand pages) MUST migrate from raw `<img>` (9 occurrences prior audit §B.marketplace-7) to `<DivisionImage>`. Mobile workspace nav was improved in recent commits — verify in `apps/marketplace/components/marketplace/shell.tsx`. |
| `account/{page,addresses,disputes,following,notifications,orders/[orderNo],payments,reviews,seller-application/*,wishlist}` | R | Empty-state polish per V5-CLEAR Bug E (following page no-data). Use `<EmptyState>` primitive; distinguish empty from broken. |
| `vendor/{page,analytics,disputes,onboarding,orders/[groupId],payouts,products/{[id],new,page},settings,store}` | R | Vendor surfaces — apply `<ActionButton>`, `<DivisionImage>`, dense card patterns. Pricing breakdown uses `@henryco/pricing`. |
| `admin/[resource]`, `finance/[resource]`, `moderation/[resource]`, `operations/[resource]`, `owner/[resource]`, `support/[resource]` | K | Generic resource explorers — operator side, kept as-is unless Wave-B2 audit flags consistency gaps. |
| Checkout page | R | V5-CLEAR Bug A polish: deferred-state copy in HenryCo voice (wallet / bank transfer / COD paths). No PSP integration in this cycle. |
| `api/**` | K | API stays. |

### 8.5 Wave B3 — apps/logistics (`logistics.henrycogroup.com`)

| Route | Class | Notes |
|---|---|---|
| `page.tsx`, `business`, `book`, `track`, `quote`, `pricing`, `services`, `coverage`, `customer` | K (polish) | Logistics is the thinnest division app (11 routes) — public flows already solid. Polish to editorial bar (use Hero composition pattern from recent account rebuild commits). |
| `customer/page.tsx` (authenticated customer dashboard) | R | Promote to delegate to `apps/account/(account)/logistics/page.tsx` mirror via the account-side `logistics-module.ts` aggregation (already in place — prior audit §B.account-4). |
| Live tracking on `track/**` | R | Add live-map (Mapbox) + driver↔customer text bridge via Rooms (Wave A2) if owner enables real-time dispatch. Otherwise Supabase polling + tracking events table. |
| `pay/**` | K | Payment receipt surface. |
| `[...slug]` catch-all | K | Verify the catch-all doesn't swallow nested routes. |
| `support`, `login` | K | Standard. |
| `api/**` | K | API stays. |

### 8.6 Wave B4 — apps/studio (`studio.henrycogroup.com`)

| Route | Class | Notes |
|---|---|---|
| `(public)/{page,services/{[slug],page},pricing,process,work/{[slug],page},teams/{[slug],page},pick,faq,trust,contact}` | K (polish) | Public surface. |
| `(public)/pick/page.tsx` request picker | R | Prior audit §B.studio-7: "long unpremium request selector". Replace with `<TypeaheadGrid>`. Recent commit `33e7f44` already redesigned `/request` to three calm paths (copilot/custom/templates) — Wave B4 verifies parity and extends to `/pick` if pattern leaks. |
| `request/page.tsx` | K (polish) | Three calm paths already shipped. Wave B4 polishes copilot first-token latency (< 800ms target per V5-CLEAR Bug C). |
| `client/{page,files,projects,proposals,reviews}` | R | Client portal — premium rebuild with `<Panel>`, `<MetricCard>`, `<DivisionImage>`. Project pages = entity detail (RSC, deep-linkable). |
| `pm/{page,projects,revisions}`, `sales/{page,leads,match,proposals}`, `delivery/{page,assets}`, `finance/{page,invoices,payments}`, `owner/page` | R | Operator surfaces — apply dense table pattern via `<QueueTable>`. |
| `project/[projectId]`, `proposals/[proposalId]` | R | Entity detail pages — server-rendered, shareable URLs. Add room consumer for collab review (Wave A2). |
| `support/{page,[threadId]}` | K | Chat-composer already wired (V2-COMPOSER-01). |
| `checkout`, `pay/{paymentId}`, `payment` | K (polish) | `/pay/[paymentId]` perf fixed in V5-CLEAR Bug B (parallel fetches, route revalidate). |
| `api/**` | K | API stays. WhatsApp HMAC required (V5-3 §12 hold). |

### 8.7 Wave B5 — apps/learn (Academy) (`learn.henrycogroup.com`)

| Route | Class | Notes |
|---|---|---|
| `(public)/{page,academy,categories/[slug],certifications/{verify/[code],page},courses/{[slug],page},help,instructors/[slug],paths/[slug],teach,trust}` | K (polish) | Public catalog + certificate verification — solid. |
| `learner/{page,certificates,courses/[courseId],notifications,payments,progress,saved,settings}` | R | Learner dashboard — dense progress bars, `<MetricCard>` for course progress (with comparison/trend — pre-test scores, completion %). |
| `instructor/page.tsx` | R | Instructor surface — rebuild to operator-grade `<QueueTable>` for student progress. |
| `owner/{page,analytics,assignments,certificates,courses,instructors,learners,paths,settings}` | R | Academy admin — owner workspace surface. Apply density rules per anti-pattern #19 (owner = density-first). |
| `admin`, `analytics`, `content`, `support` | K (polish) | Staff surfaces — kept; align primitives. |
| Live class room consumer (new) | R (new) | Mount Rooms (Wave A2) inside course player for live sessions. Mux env-gate for video. |
| `auth/{login,signup}` | K | Standard. |
| `api/**` | K | API stays. WhatsApp HMAC required (V5-3 §12 hold). |

### 8.8 Wave B6 — apps/property (`property.henrycogroup.com`)

| Route | Class | Notes |
|---|---|---|
| `(public)/{page,search,area/[slug],property/[slug],submit,managed,trust,faq,login,auth/callback}` | R | Listing detail must migrate from raw `<img>` (5 occurrences prior audit §B.property-7 inc. `PropertyImageGallery`) to `<DivisionImage>`. Layout-shift fix (Next/Image dimensioning). |
| `account/{page,inquiries,listings,saved,viewings}` | R | Customer dashboard — aligns with the in-flight `apps/account/(account)/property/{PropertyHero,SavedPropertiesGallery}` work on `rebuild/account-property-module`. **Wave B6 inherits from that branch.** Conductor merges that branch first, then Wave B6 ports the patterns to the property portal app. |
| Property listing inquiry / viewing scheduling | R | Add `<ActionButton>` with success-lock for inquiry submit. Mount Rooms (Wave A2) for virtual viewing tours. |
| `admin/{listings,page}`, `agent/page`, `moderation/page`, `operations/page`, `owner/page`, `support/page` | K (polish) | Staff surfaces — kept; align primitives. Inspection rules engine (`docs/property-inspection-eligibility-rules.md`) gets wired into operations surface. |
| `api/**` | K | API stays. WhatsApp HMAC required (V5-3 §12 hold). |

### 8.9 Wave C — apps/jobs (`jobs.henrycogroup.com`)

Wave C is the heaviest single piece. Two-role detection (candidate / employer + recruiter overlay) + interview room consumer.

| Route | Class | Notes |
|---|---|---|
| `(public)/{page,jobs/{[slug],page},categories/[slug],careers,employers/[slug],hire,talent,trust,help}` | R | Public surface — premium card patterns (candidate workspace was flagged "cheap and templated" in V5-CLEAR Bug F; Wave C does the full rebuild not the V5-CLEAR interim polish). |
| `candidate/{page,alerts,applications,conversations/[conversationId],files,interviews,profile,saved-jobs,settings}` | R | Candidate workspace — entity detail pages (RSC, deep-linkable). Conversations use `@henryco/chat-composer`. |
| `employer/{page,analytics,applicants/[id],company,hiring/[pipelineId]/[applicationId],jobs/{[id],new,page},settings}` | R | Employer workspace — pipeline view as `<QueueTable>`. |
| `recruiter/*` (implicit per prior audit §B.jobs) | R | Recruiter pipeline + candidate detail. Bulk-action surface using `<BulkActionBar>` for shortlist / reject / advance. |
| `admin`, `analytics`, `moderation`, `owner` | K (polish) | Staff surfaces. |
| **Interview room route** (new) | R (new) | `apps/jobs/app/{candidate,employer,recruiter}/interviews/[sessionId]/room/page.tsx` — mounts `<RoomShell>` (Wave A2) with: WebRTC video, screen share, `<CollabEditorPane>` (technical interviews), interviewer-only `<ScorecardSidebar>`, `<RecordingConsent>` flow. |
| `api/**` | K | API stays. |
| `auth/{login,signup,callback}` | K | Standard. |

### 8.10 Wave D — closure (no new routes; integration only)

Wave D integration smoke per master §A.4 + §A.15. The conductor confirms:

- Command-K finds entities in every portal (Wave A1 search palette + Wave B/C registration)
- `/messages` aggregates every portal thread
- `/calendar` aggregates every portal event (bookings, viewings, interviews, classes, room sessions)
- `/notifications` shows unread per portal with correct deep-links

---

## 9. Per-portal current state — one paragraph each (audit §B summary)

Authoritative source: `docs/dashboard/DASHBOARD-AUDIT-REPORT.md` §B (45k tokens of citation-dense per-division audit). The summaries below distill that section into one paragraph per portal for the conductor's working context. Each Wave-B/C agent reads its corresponding §B section in full at spawn time.

**Care (Wave B1).** Public booking flow + admin shell + retired `(staff)` group. Admin tiles are decorative (5 cards labeled "Ready for live wiring" — prior audit §B.care-3). Cloth/category picker on `/book` is long-scroll (§B.care-7) — replace with `<TypeaheadGrid>`. Operator-side care has TWO non-functional surfaces (`(staff)` layout redirects to broken staffhq, `app/app/(staff)/` is a path artefact). The working operator surface is `apps/staff/(workspace)/care/page.tsx`. WhatsApp HMAC verification gap (V5-3 §12). Chat composer wired for support thread. ~42k LOC division. Wave B1 cleans dead routes, polishes editorial, fixes picker, verifies HMAC.

**Marketplace (Wave B2).** Multi-vendor commerce — largest cross-cutting V3 backlog. Heavy raw `<img>` usage (9 occurrences in shell, cart, gallery, header, product cards — §B.marketplace-7). Missing button states (idle/pending/disabled/spinner/success-lock) on primary actions. Vendor surfaces (analytics, products, orders, payouts, disputes, settings, store) plus customer (orders, disputes, following empty, payments, reviews, seller application). Staff resource explorers per role family. Recent commits improved mobile workspace nav. Checkout is currently wallet + bank-transfer-proof + COD — no PSP (V5-CLEAR Bug A — keep design, polish copy). ~23k LOC. Wave B2 migrates to `<DivisionImage>` + `<ActionButton>`, polishes deferred-state copy, fixes following empty state.

**Logistics (Wave B3).** Thinnest division (~6.4k LOC, 11 routes total). Customer surfaces (quote, book, track) public; authenticated `customer/page.tsx` is the consumer dashboard. **No operator routes inside apps/logistics** — operator side lives in `apps/staff/(workspace)/logistics/page.tsx`. No `logistics_role_memberships` table — staff identity resolves via `profiles.role`. Largest greenfield piece is the operator dispatch surface (likely a V3 follow-up). The customer migration into `apps/account/(account)/logistics/page.tsx` via `apps/account/lib/logistics-module.ts` is already partially in place. Wave B3 polishes public flows, wires live tracking (Mapbox + Rooms if owner authorises real-time dispatch).

**Studio (Wave B4).** Premium product studio — agency-shaped (broadest persona: client / sales / PM / delivery / finance / owner). Recent commit `33e7f44` already redesigned `/request` to three calm paths. `/pay/[paymentId]` perf fixed in V5-CLEAR Bug B. Long unpremium request picker (`/pick`) remains a gap (§B.studio-7). 12 migrations — most schema after hub. Studio uses `@henryco/messaging-thread` + chat-composer end-to-end. WhatsApp HMAC verification gap (V5-3 §12). ~21k LOC. Wave B4 mounts Rooms for collab review, applies `<TypeaheadGrid>` to picker, wires e-signature for proposals (DocuSign or typed-name fallback), polishes copilot latency.

**Academy / Learn (Wave B5).** Courses + certifications + paths + cohorts. Verified-certificate flow already shipped. Learner / instructor / academy admin (owner) ladders. 4 migrations — courses, paths, enrollments, certificates, role memberships, unlock policy. Per V3 PASS 21 hand-off, video provider defaults to Mux primary / Cloudinary fallback. Live class room consumer is new — mounts Wave A2 Rooms. ~15.7k LOC. Wave B5 builds the live-class surface, premium-polishes learner workspace, applies dense `<MetricCard>` to progress tracking (with `comparison` showing pre-test → current).

**Property (Wave B6).** Premium rentals + managed property + owner-submission + inspection rules. Heavy raw `<img>` usage (5 occurrences inc. `PropertyImageGallery` — §B.property-7). Layout shift from un-dimensioned images. Inspection rules engine documented (`docs/property-inspection-eligibility-rules.md`) but not yet wired to operations surface. 3 migrations. WhatsApp HMAC verification gap (V5-3 §12). ~14.5k LOC. **In-flight reference work** on `rebuild/account-property-module` (PropertyHero, SavedPropertiesGallery) sets the editorial bar — Wave B6 inherits these patterns into the property portal app. Virtual viewing tours via Wave A2 Rooms.

**Jobs (Wave C — solo, heaviest).** Hiring — widest persona surface (candidate / employer / recruiter). No `jobs_role_memberships` table — Wave C adds it. Conversation membership IDOR risk (V5-3 §12 holds D7 + B3). Interview room is the biggest single new surface in the entire cycle (WebRTC video + collab code editor + scorecard sidebar + recording consent). E-signature for offer letters (DocuSign primary, typed-name fallback). ~16.2k LOC. Wave C runs alone after all of B merges, on `rebuild/dashboard-jobs`.

---

## 10. Wave ordering + dependencies + acceptance gates

### 10.1 Wave dependency graph

```
PHASE 0 (this audit) ─ DONE
        ↓
WAVE A (parallel pair) — A1 Shell + Cross-cutting │ A2 Rooms infrastructure
        ↓                                          ↓
        └──────── both must merge ────────────────┘
                          ↓
WAVE B (parallel sextet)
  B1 Care │ B2 Marketplace │ B3 Logistics │ B4 Studio │ B5 Academy │ B6 Property
                          ↓
                  all 6 must merge
                          ↓
WAVE C (solo)
  C1 Jobs (interview room consumer — heaviest)
                          ↓
WAVE D (conductor solo) — integration smoke + closure
```

### 10.2 Spawn protocol (operational reminder)

- **Wave A:** one message, two Agent tool calls in parallel. Both `subagent_type: general-purpose`, `isolation: "worktree"`, branch `rebuild/dashboard-shell` (A1) and `rebuild/dashboard-rooms` (A2).
- **Wave B:** one message, six Agent tool calls in parallel. All `isolation: "worktree"`. Branches `rebuild/dashboard-{care,marketplace,logistics,studio,learn,property}`.
- **Wave C:** one message, one Agent tool call. Branch `rebuild/dashboard-jobs`.
- **Wave D:** conductor only — no spawns.

Every Agent call prompt embeds:
1. The conductor's North Star (premium, editorial, second-to-none).
2. The agent's wave + scope verbatim from §8 above.
3. Link to this audit.
4. The env-var table reference (§6).
5. Shared-primitive consumption matrix (§5.5).
6. Per-portal route map (§8.x).
7. Anti-patterns short list (§11).
8. Acceptance gates (§10.3).
9. "Open PR against `main` when done, do not merge yourself, report PR URL + any PARTIAL items."

The conductor reviews each PR, merges in defined order (A1 → A2 → B1 → B2 → … → B6 → C1), then Wave D.

### 10.3 Acceptance gates per wave

The gates extend the master orchestration's V1–V13 (`docs/dashboard/DASHBOARD-REBUILD-PROMPT-V2-FINAL.md:78-99`) with two Rooms-specific R-gates. A wave PR cannot merge until every applicable gate is PASS (N/A allowed with explicit justification).

**V1.** `pnpm -r typecheck && pnpm -r lint && pnpm -r build` clean on the touched workspaces, zero new warnings.
**V2.** Auth-continuity Playwright matrix passes — customer / owner / staff sign-in hops across subdomains without re-auth. Cookie writes verified via shared `.henrycogroup.com` domain.
**V3.** RLS verification — non-privileged user denied cross-tenant SELECT/UPDATE/DELETE on every touched table. Run on a real Postgres preview branch.
**V4.** Realtime smoke — `customer_notifications` + `staff_notifications` injection received within 2 s; reconnect within 5 s after WiFi cycle.
**V5.** Mobile parity — visual regression at 320 / 375 / 390 / 430 / 768 / 1024 px on every changed page. Zero clipped CTAs, zero unreachable thumb-zone actions, CLS < 0.1.
**V6.** Lighthouse + CWV — per route ≥ 90 Performance, ≥ 95 Accessibility, ≥ 95 Best Practices, ≥ 95 SEO. LCP < 2.5 s (target ≤ 2.0 s for portal indexes), CLS < 0.1, INP < 200 ms. Mobile, throttled, Vercel preview not localhost.
**V7.** WCAG AA — `axe-core` reports 0 violations on shell chrome + ≥ 3 modules per wave. Shell chrome targets AAA on focus rings + contrast.
**V8.** Sender identity — `grep "new Brevo\|new Resend" apps/` outside documented receiver (`apps/care/lib/resend-server.ts`) returns 0 hits.
**V9.** CTA reality — every clickable on touched pages classified LIVE with `file:line` of the destination. Zero DEAD, zero DECORATIVE.
**V10.** Empty / loading / error / success — every widget has each of the four states, tested by Playwright. Success-lock prevents double-submit.
**V11.** Zero console errors / hydration warnings on the happy-path walkthrough across all role × division permutations.
**V12.** Zero 4xx/5xx in network on the same walkthrough (expected 404s allowlisted explicitly).
**V13.** Role × division coverage — the seeded matrix in prior audit §D.2 (customer-only / customer-active / customer-problem / owner / 5 staff variants) fully exercised on touched surfaces.

**Rooms-specific gates (Wave A2 only):**
**R1.** Provider abstraction works — happy-path with Daily.co (env present) and Jitsi (env absent — fallback).
**R2.** Recording-consent flow blocks recording if any participant has not consented; `rooms_recordings_consent` audit row created.

**Per-wave JS bundle budgets:**
- Wave A1 shell index: < 180 KB gz client JS
- Wave B portal indexes: < 180 KB gz
- Wave A2 / Wave C room routes: < 250 KB gz
- No duplicate provider libs (one video stack repo-wide)

### 10.4 Wave-level gates

**Wave A gate** — both A1 and A2 merged. `packages/rooms` importable. Shell chrome composable with primitives from §5. Lighthouse on `apps/account` shell index hits LCP < 2.0 s, INP < 200 ms, CLS < 0.05.

**Wave B gate** — all 6 PRs reviewed, all green, all per-portal V1–V13 PASS. No shell primitive reimplemented in any portal. Merge order alphabetical (care → learn → logistics → marketplace → property → studio) to keep history readable.

**Wave C gate** — interview room E2E functional with both Daily + Jitsi providers; two-role detection (candidate / employer) wired with `jobs_role_memberships`; Lighthouse on `/dashboard/jobs` (account-side mirror) LCP < 2.0 s; room route JS < 250 KB gz.

**Wave D gate** — cross-portal integration smoke (command-K finds entities everywhere; `/messages` aggregates; `/calendar` aggregates; `/notifications` deep-links correctly). Per-portal Playwright happy-path passes in CI. axe-core zero violations on every portal index. Bundle audit: no duplicate provider libs. Env-var canonical table updated. Closure doc at `docs/closure/dashboard-rebuild-closure.md`.

---

## 11. Anti-patterns — auto-reject on sight

(Extended from master orchestration §4.1–4.2 with V3 cycle additions.)

### 11.1 Code anti-patterns

1. Long-scroll picker — use `<TypeaheadGrid>` (prior audit §B.care-7, §B.studio-7).
2. Raw `<img>` — use `<DivisionImage>` (prior audit §B.marketplace-7, §B.property-7).
3. Buttons without idle / pending / disabled / spinner / success-lock — use `<ActionButton>`.
4. Decorative tiles "ready for live wiring" — every CTA LIVE (prior audit §B.care-3).
5. Workspace redirect-loop pattern (App Router parallel routes, not host-rewrite + page-level redirects — prior audit §A.4-1).
6. Hard-coded division services row — modules register via `getEligibleModules(viewer)`.
7. Reimplemented role helpers in TypeScript — extend `@henryco/auth` wrapping the SQL `is_staff_in()` predicate; source of truth stays in Postgres.
8. Direct Brevo / Resend instantiation outside `@henryco/email`'s `sendEmail` (sole exception: receiver at `apps/care/lib/resend-server.ts` per prior audit §C.6-1).
9. Per-widget Supabase Realtime subscription — single subscription at shell via `SupabaseRealtimeProvider`, fan-out via React context.
10. Treating staff as "later" — staff role on day 1; `apps/staff` is the proven baseline.
11. Migrating state-changing endpoints — UI rebuild only, `apps/*/app/api/*` stays as-is.
12. V3 features in V2 scope — no new divisions beyond `COMPANY.divisions`, no AI agents in the shell, no marketplace category expansion, no new auth flows (passkeys, MFA flagged FALSE/STALE prior audit §A.5), no new payment rails.
13. **Two agents building their own video / realtime stack** — Rooms is one package (Wave A2 ships, all others consume).
14. **Inventing new env vars** when an existing one covers the surface — update §6 before adding.
15. **Inventing new design tokens** when existing ones cover the need — PR to `docs/design-tokens.md` first.

### 11.2 Visual / copy anti-patterns (the owner's "childish")

16. Emoji-as-icon — use icon set from `@henryco/notifications-ui` / `@henryco/dashboard-shell`.
17. Default Tailwind / shadcn cards with no design opinion — use `<Panel>`.
18. Primary color = blue — primary is HenryCo black / gold / cream per `packages/config/company.ts` + `@henryco/brand`.
19. Friendly cartoon empty-state illustrations — typographic minimalism via `<EmptyState>`.
20. "Welcome to your dashboard!" patronising copy — content-first leads ("3 unread signals · last booking 2 days ago"). Final copy is V2-COPY-01 scope (deferred); placeholder copy with `// TODO V2-COPY-01: review`.
21. Metrics without context — every metric ships with `comparison` or `trend` (`<MetricCard>` type-enforces).
22. Role-agnostic UI — consumer = clarity (4–6 cards, large tap targets), owner = density (12+ tiles, table-first, keyboard-driven, sub-200 ms).
23. Copy not in HenryCo voice — calm, declarative, premium. No "Awesome!", "Oops!", "Got it!", "Yay!".
24. Mobile = desktop scaled down — bottom action bar (Home / Modules / Inbox / More), `<BottomSheet>` + `<Drawer>` mandatory on mobile.
25. **Giant landing hero text** filling the viewport — capability evidence above the fold, not headline size (memory: `feedback_no_giant_hero_text.md`).
26. **Card wall of 12+ identical tiles** — fewer, denser, opinionated cards.

### 11.3 Process anti-patterns

27. Skipping the audit phase (Phase 0) — **THIS audit must be merged before any agent spawns**.
28. Comments narrating "added for the rebuild" — belongs in the PR body.
29. Re-running an Agent call after a partial result — re-spawn a follow-up for the PARTIAL item only; never amend a sub-agent's commits.
30. `--no-verify`, `--force` to main, destructive git on shared branches — never.
31. **Touching another wave's territory without commenting in the owner's PR first.**

---

## 12. Operational notes for the conductor

### 12.1 Shared working tree, parallel sessions (memory: `project_henryco_parallel_sessions.md`)

The owner runs many parallel Claude / Codex sessions sharing this working tree. Branches and stashes may appear mid-session. The conductor re-checks repo state before any destructive op. At audit time the visible cross-session signals were:

- `rebuild/account-property-module` branch with uncommitted PropertyHero / SavedPropertiesGallery / helpers / styles (active reference shape for editorial premium portal hero — Wave B6 inherits).
- `apps/hub/supabase/migrations/20260514110000_function_search_path_lockdown.sql` untracked (security hardening — likely PR-ready, Wave A reconciles post-merge).

**Hard rule for the conductor:** do not stash, do not delete, do not overwrite work from other sessions. If a Wave-B agent's branch conflicts with an unrelated session's branch, the conductor coordinates by pinging the affected owner-PR rather than amending.

### 12.2 Worktree isolation is non-optional

Six parallel Wave-B agents without `isolation: "worktree"` will stomp on the shared working tree within minutes. Every Agent call this cycle uses `isolation: "worktree"`. The conductor verifies this on every spawn.

### 12.3 Cross-wave changes

If a Wave-B agent needs a change in `packages/dashboard-shell` (e.g. a missing primitive variant), they:
1. Comment on Wave A1's PR (or open a follow-up to Wave A1's branch via re-spawn) — do not amend A1's commits.
2. Wait for the primitive to land in main before consuming.
3. Wave D verifies no Wave-B PR introduces a primitive that should have been in Wave A.

### 12.4 Conductor's no-code rule

The conductor (this session) does not write portal code. The conductor's job is:
- Read repo and existing docs.
- Spawn waves.
- Wait for results.
- Review PRs.
- Merge in order.
- Re-spawn for PARTIAL items.
- Write Phase 0 audit (this doc) and Wave D closure report.

If the conductor finds itself editing `apps/<portal>/...` files directly, halt — drift off-script. The exception is the audit doc itself (this file) and the closure doc.

---

## 13. Reconciliation with prior rebuild docs

This audit does not invalidate prior planning. The relationship is layered:

| Doc | Layer | Role in this cycle |
|---|---|---|
| `docs/dashboard/DASHBOARD-AUDIT-REPORT.md` | §-anchored code-truth ground truth (45k tokens) | Per-portal §B.* sections are the source the conductor cites when spawning Wave B/C. Every Wave-B agent's prompt embeds a link to its specific §B subsection. |
| `docs/dashboard/DASHBOARD-REBUILD-PROMPT-V2-FINAL.md` | V2 master orchestration (V1–V13 gates + anti-patterns) | The V1–V13 gates are inherited verbatim; this audit adds R1/R2 for Rooms. The 8 DASH-* phase prompts are subsumed into the conductor's 4-wave shape (Wave A1 ≈ DASH-1 residual; Wave A2 is net-new; Wave B/C ≈ DASH-2..7 + V3 PASS 21 per-portal prompts). |
| `docs/dashboard/DASH-1..9-*.md` | Per-phase forged prompts | Reference material for Wave-B/C agents — they read the matching DASH file at spawn time for surface-level detail. DASH-8 (owner Track B) and DASH-9 (staff Track C) are not in scope this cycle (they're separate tracks per master §2). |
| `docs/rebuild-prompts/{care,marketplace,logistics,studio,learn,property,jobs,hub}.md` | V3 PASS 21 per-division forged prompts (NOT_STARTED at audit time) | These are the **canonical per-portal rebuild specs**. Each Wave-B/C agent's prompt embeds the corresponding `docs/rebuild-prompts/<division>.md` as its primary brief. The conductor's 4-wave shape **executes** the V3 PASS 21 prompts — it does not replace them. |
| `docs/closure/V5-CLEAR-pre-dashboard-clean-sweep.md` | Pre-dashboard operational clean-sweep | Already done / in-flight. Several items it surfaces (Bug A copy polish, Bug B perf fix, Bug C copilot latency, Bug D success-lock, Bug E empty states, Bug F jobs polish, Bug G mid-range Android perf) inform Wave-B scope. |
| `docs/env-vars.md` | Existing env-var doc (super-app + minimal Next.js) | This audit §6 supersedes — it's the full repo env walk. Update `docs/env-vars.md` after Wave A merges if owner prefers one doc. |
| `docs/design-tokens.md` (PASS 19/20) | Canonical token spec | Authoritative; this audit §3 just cites + locks rules. |
| `docs/vercel-project-map.md` | Per-app Vercel project map | Confirmed accurate at audit time. |

### 13.1 What this audit changes about the V3 PASS 21 plan

V3 PASS 21 README (`docs/rebuild-prompts/README.md`) recommends executing the 8 division prompts in sequence (Logistics → Care → Property → Jobs → Learn → Marketplace → Studio → Hub). The conductor's plan **parallelises** them via worktree isolation (six in parallel + Jobs solo). Hub is **not** in this cycle — Hub corresponds to the owner Track B (DASH-8) which is out of scope until consumer side is in production stable per master §2.

The 8th division ("Hub") in the V3 PASS 21 README becomes Wave A1 (cross-cutting shell shared by every app) + a future owner Track B pass.

### 13.2 What the conductor's plan adds that wasn't in prior plans

1. **Rooms as first-class infrastructure** — prior plans treated video / realtime as per-division concerns; Wave A2 ships one shared `packages/rooms` package.
2. **Jobs interview room as a dedicated heavy lift** — prior plans didn't isolate Jobs; the conductor runs it as Wave C solo for full attention to interview-room complexity.
3. **Worktree-isolated parallel rebuild** — operational pattern not used in prior cycles.

---

## 14. Single hard blocker (carried forward from prior audit §D.1-1)

**Brevo Auth SMTP proof received by ops.** Without it, customer signup / auth email rail risk recurs (V2-PNH-03B production-signup outage history). The conductor confirms with ops at Wave A spawn time. `UNVERIFIED — REQUIRES OWNER CONFIRMATION`.

Other pre-flight items resolved or operationally tracked (not blocking this audit's merge):

- `staffhq.henrycogroup.com` redirect-loop — separate cleanup; the rebuild does not depend on its resolution.
- Vercel preview build budget — ~25 preview deploys across Waves A/B/C/D (2 + 6 + 1 + 0 + reserves). Confirm at spawn time.
- Supabase preview branch quota — ~6 simultaneous during Wave B.
- Typesense env (search degrades gracefully if absent — V3 PASS 21 pre-flight #3).
- Google Places / Mapbox env (address-selector + maps degrade gracefully).

---

## 15. Out of scope this cycle

The following are explicitly **not** in the conductor's 4-wave plan:

- Owner dashboard Track B (DASH-8) — separate product, separate canonical surface (`hq.henrycogroup.com/owner`). The conductor's plan keeps `apps/hub/owner/*` untouched.
- Staff workspace Track C (DASH-9) — `apps/staff` is functional today; not rebuilt this cycle.
- Marketplace PSP integration — wallet / bank-transfer-proof / COD remains; PSP is a separate V3 pass if owner authorises.
- New divisions beyond `COMPANY.divisions` — `building` and `hotel` register hidden as the extensibility proof; flipping them visible is a follow-up.
- MFA / TOTP / passkeys — flagged FALSE/STALE in prior audit §A.5; not in this cycle.
- AI agents / chatbots / generative widgets in any shell — out of V3 scope.
- Owner workspace AI surfaces (`/owner/(command)/ai/*`) — feature-flagged off, owner authorises before live (per `docs/rebuild-prompts/README.md:194-195`).
- Apex CSP tightening (Hub `unsafe-inline` / `unsafe-eval` for Three.js + framer-motion) — separate pass.

---

## 16. Success definition (conductor's North Star)

When the owner walks the live dashboard surfaces after Wave D, they cannot name a competitor anywhere on Earth doing the equivalent surface better than HenryCo. The shell feels like one product. Each portal feels like its category's gold standard. Rooms feel like a native capability, not a bolted-on iframe. Env vars are all consumed from the canonical table — no parallel providers. Anything less is not done.

Concretely:

- Every portal's authenticated landing renders in < 2.0 s LCP on a 4G-throttled mobile preview.
- Every interactive element designs all six states. No double-submit bugs class repo-wide.
- Every clickable on every shell surface is LIVE — zero DECORATIVE survives Wave D's review.
- Every list > 50 rows paginates or virtualises.
- Cmd/Ctrl+K finds entities across every portal.
- Notifications, messages, calendar aggregate every portal's activity.
- Interview room works end-to-end with both Daily and Jitsi providers.
- Bundle audit shows one video stack, one realtime stack, one search stack, one auth library, one observability library.

— end of audit —
