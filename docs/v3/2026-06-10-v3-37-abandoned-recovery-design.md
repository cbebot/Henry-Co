# V3-37 — Abandoned-Journey Recovery + Toast Regulation (grounded design)

**Date:** 2026-06-10 · **Branch:** `v3/37-abandoned-task-recovery` · **Supersedes/grounds:** `docs/v3/prompts/v3-37-personalization-abandoned-task-recovery.md`

This document is the *codebase-grounded* design for V3-37, plus a second, owner-requested
increment — **dashboard toast regulation** — folded into the same pass. The original V3-37
prompt is the contract; this doc resolves it against what is actually merged on `origin/main`
and records the three product decisions the owner made on 2026-06-10.

## Owner decisions (2026-06-10)
1. **Scope:** Full V3-37 *including* the day-1/3/7/14 reminder cadence (in-app + email
   self-contained now behind a flag; push as a dispatch intent; clean seam to V3-43/45/48).
2. **Toast pacing:** Keep `VISIBLE_LIMIT = 2`, but reveal **one-at-a-time** with a timed drip
   gap + minimum dwell so two never pop simultaneously and a backlog trickles in calmly.
3. **Anonymous capture:** *Only once identified.* Pure-anonymous progress stays in
   `localStorage`; a server-side recoverable row is written only when the visitor gives an
   email/phone or is signed in, then **claimed on login by contact match** (the existing
   Care-booking reconciliation pattern). No Supabase anonymous auth.

## Grounding — what already exists (do NOT rebuild)
- **Server lifecycle engine** — `apps/account/lib/lifecycle/collector.ts`
  (`collectAndPersistLifecycleSnapshot`) fans out ~20 reads on every dashboard render, derives
  per-pillar `LifecycleSnapshotEntry`, ranks `actionables`, upserts `customer_lifecycle_snapshots`.
  UI = `apps/account/components/lifecycle/LifecycleContinuePanel.tsx` (cohorts:
  *Needs attention* / *Continue where you left off* / *reengage*) via `AttentionPanel` → `SmartHome`.
  An entry becomes an `actionable` only with BOTH `nextActionLabel` AND `nextActionUrl`.
- **Client draft engine** — `@henryco/lifecycle/drafts` (`use-form-draft.ts`, `draft-storage.ts`,
  `draft-panel.tsx`): `localStorage` (`henryco.draft.<key>`) + sessionStorage mirror, 24h stale.
  **Per-origin → cannot cross subdomains.**
- **Identity / cross-subdomain** — one Supabase auth user; cookie scoped to `.henryonyx.com`
  (`packages/config/company.ts:getSharedCookieDomain`, `packages/config/supabase-cookies.ts`).
  Authed users are known on every subdomain server-side. No anonymous auth.
- **Anon→authed reconciliation pattern** — `apps/account/lib/care-sync.ts`
  (`findMatchedCareBookings`, email-ilike + phone variants) invoked from
  `apps/account/app/auth/callback/route.ts` via `after()`. **Reuse this.**
- **Engagement substrate** — `user_engagement_events` (`cart_abandoned`, `kyc_incomplete_after_signup`,
  `checkout_resumed`), `cart_recovery_state`, `saved_items`; hourly cron at
  `apps/account/app/api/cron/engagement-sweep/route.ts` (CRON_SECRET-gated). New cadence cron
  rides this pattern.
- **Toast** — `packages/dashboard-shell/src/components/notifications/notifications-toast-viewport.tsx`
  (`VISIBLE_LIMIT=2`, `MAX_QUEUE=6`, `EXIT_MS=240`), `toast-selection.ts` (`reduceToastBaseline`,
  PR254 stop-repeats — first-login flood already prevented), `shell/toast-bus.ts` (imperative
  `shellToast.*`, PR255). **Gap: no pacing** — a freed slot promotes the next toast instantly.

## Hard invariants (bound every change)
- New notification type ⇒ **lock-step** `packages/notifications/event-types.ts` entry **+** a
  `customer_notifications` category/priority **CHECK-widen migration** (omitting this caused a prod outage).
- New table/columns ⇒ commit migration under **`apps/hub/supabase/migrations/`** *and* regenerate
  `packages/data/src/database.types.ts` (`pnpm supabase:types`) so `scripts/ci/schema-drift-check.mjs` stays green.
- `abandoned_tasks.state` is **secret-free** (test-enforced: no card/PAN/KYC bytes/raw tokens).
- Recovery **never re-charges/re-submits** — `Continue` only restores the step.
- All copy via i18n (`surface:recovery`, 12 locales, EN-merge); zero hardcoded strings (`i18n:check:strict`).
- All UI on `--acct-*`/`--hc-*` tokens + dark-mode hero rebinds; URLs/brand via `@henryco/config`.
- Owner RLS on `abandoned_tasks`; kill switch (`recovery` + `cadence` independently disableable).

## Architecture — two capture layers + one regulated surface
- **Layer A (broad, server-recorded):** extend `collector.ts` to flag abandoned-but-resumable rows
  it already reads (wallet `pending`, KYC `pending`, `logistics_quotes` unconverted, care `awaiting_*`,
  learn `awaiting_payment`, marketplace vendor draft, jobs interview `awaiting_*`) → `stage:'in_progress'`
  + deep-link. Thresholds in `packages/lifecycle/src/rules.ts`. A detector upserts these into
  `abandoned_tasks` for the cadence.
- **Layer B (client-only / anonymous):** `packages/lifecycle/src/recovery/detectors.ts` (form_draft,
  booking, kyc, proposal) + a reusable public-flow capture server action. Exemplar wiring of the three
  highest-value anon flows with no server persistence today: **studio `/request`, care `/book`,
  logistics `/quote`.**
- **Claim bridge:** `?next=…&claim=<token>` through sign-in + contact-match reconciler in `auth/callback`.
- **Cadence:** cron walks `pending` → day 1 in-app/notification → day 3 email → day 7 final(+offer) →
  day 14 expired; quiet-hours + per-channel opt-out before every send; dispatch-intent interface for
  V3-45/48; self-contained in-app+email behind a flag; push intent emitted (native deferred).
- **Surfaces:** `apps/account/app/(account)/continue/page.tsx` (grouped pending, Continue + Dismiss) +
  extend `LifecycleContinuePanel` into the home (widget if V3-34 `getHomeWidgets` exists, else inline).
- **Toast regulation:** drip/promotion gate in the viewport (promote next only when
  `now − lastShownAt ≥ DRIP_GAP_MS`, else schedule) + min-dwell floor; **first-login resume nudge** =
  one `shellToast.info(... href:'/continue')` after hydration settles, once-per-session, quiet-hours/opt-out gated.
- **Telemetry:** `henry.task.{abandoned,recovery_sent,recovered,expired}` + Hub owner tiles.

## Build sequence (slices — each independently green + committed)
- **S0** — env baseline (`pnpm install`, baseline typecheck/test), spec + progress tracker. *(this commit)*
- **S1** — `abandoned_tasks` migration + RLS (`apps/hub/supabase/migrations/`) + `pnpm supabase:types` +
  `packages/data/src/abandoned-tasks.ts` typed reads/writes. Schema-drift green.
- **S2** — `packages/lifecycle/src/recovery/{detectors,cadence,index}.ts` + `__tests__` (TDD). Secret-free test.
- **S3** — Layer A: `collector.ts` abandoned-but-resumable detection + `rules.ts` thresholds.
- **S4** — claim bridge: recovery reconciler (care-sync pattern) + `auth/callback` hook + `?claim=` threading.
- **S5** — i18n `packages/i18n/src/recovery-copy.ts` (12 locales) + notification event-type + CHECK-widen migration.
- **S6** — `/continue` page + home panel extension (tokens, light/dark, mobile).
- **S7** — toast regulation (drip gate + min-dwell, unit-tested) + first-login resume nudge.
- **S8** — cadence cron handler (self-contained in-app+email behind flag) + telemetry + Hub owner tiles.
- **S9** — full gates (typecheck/lint/test/build), RLS proof on real PG, Continue e2e, real-browser proof, report, PR.

## Open items to confirm during build (non-blocking)
- V3-34 `getHomeWidgets` home-widget API — exists? If not, mount the panel inline in `SmartHome`/`AttentionPanel`.
- Exact collector touch-points per division (reference_type/reference_id for precise deep-links).
- Whether the table migration is applied to prod now or committed-NOT-applied behind the deploy gate
  (follows the repo's FL2 convention for money/identity-adjacent migrations).

## Out of scope (clean seams)
V3-43 workflow engine · V3-45 auto-remind orchestration · V3-48 campaign copy/A-B · V3-24 KYC tables ·
V3-90 funnel data-lake.
