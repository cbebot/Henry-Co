# Account Systemic V3-10 Fallback — Root-Cause Analysis

**Incident:** DIAG-ACCOUNT-01
**Date:** 2026-05-23
**Engineer:** V3 senior engineer (Opus 4.7, 1M context)
**Status:** Root cause identified; production schema convergence applied; code-side hardening landed under draft PR for owner cross-device verify.

---

## TL;DR

`apps/account/app/(account)/error.tsx` (the V3-10 fallback) was firing across the customer dashboard for two distinct reasons that both trace to the same underlying gap:

1. **Primary, production-only root cause — Postgres `42703 undefined_column` on `/api/notifications/preferences`.** The `customer_preferences` table in production was missing nine columns the route handler explicitly selected. Every dashboard render emitted a `[henryco/account-api] notifications/preferences ...` 500. Over the last six hours alone, ~50 logged 500s. The realtime provider silently degraded on the 500, but a downstream consumer (the deferred `ensureAccountProfileRecords` insert + every PATCH attempt + any code path that read a missing column off a non-merged response) became fragile under load.
2. **Secondary, contributing root cause — double-throw inside `(account)/error.tsx`.** The inner error boundary itself called `useHenryCoLocale()`, the throwing variant of the i18n hook. If the inner boundary ever fired above the `LocaleProvider` mount (the canonical hydration-mismatch class of bugs, which iOS Safari encounters more often than other browsers) the boundary rethrew, the parent (outer) boundary caught the rethrow, and the user saw V3-10’s fallback even for surfaces that should have caught locally with a calmer in-shell error.

Production schema convergence migration was applied via Supabase MCP (idempotent `add column if not exists`); the matching local migration file ships under `apps/hub/supabase/migrations/20260523103000_diag_account_01_customer_preferences_missing_columns.sql` so the source tree and the database agree. Three architectural defences land in code so this class of bug cannot manifest the same way again:

- Route handler uses `select("*")` + merge-over-defaults, and treats `42703 undefined_column` / `42P01 undefined_table` as serve-defaults instead of `500`.
- Profile-seed insert falls back to a minimal `user_id`-only row on schema drift so first-login users always get a row.
- Inner error boundary uses `useOptionalHenryCoLocale()` (non-throwing) + `HenryCoErrorFallback` shared primitive, with reporter wrapped in try/catch so logger / Sentry outages cannot recurse the boundary.

A last-resort `apps/account/app/global-error.tsx` (and a matching `apps/hub/app/global-error.tsx`) lands so even a double-throw above the root error boundary still surfaces a branded, English-only inline-styled panel with the digest — not a stark "Application error" white page.

---

## Evidence

### Production runtime logs (last 6 h, account project)

```
| Time     | Method | Path                            | Status | Message                            |
|----------|--------|---------------------------------|--------|------------------------------------|
| 10:09:15 | GET    | /api/notifications/preferences  | 500    | [henryco/account-api] notif...     |
| 10:05:01 | GET    | /api/notifications/preferences  | 500    | [henryco/account-api] notif...     |
| 10:04:49 | GET    | /api/notifications/preferences  | 500    | [henryco/account-api] notif...     |
... (50+ identical lines in last 6 h)
```

Project `prj_oADXXXOhrio50OSFw0utEJF7vYpB`, deployment `dpl_HdbnmY8hB9B9cDByNuSeXJh2MpMn` (commit `c838f394`). No 500s on any page route — only on `/api/notifications/preferences`. The page-render itself was fine; the client-side toast-viewport / drawer / settings consumers of the 500 fanned the failure out into the V3-10 surface.

### Schema diff

The route handler `apps/account/app/api/notifications/preferences/route.ts` selected nineteen columns. The production `customer_preferences` table exposed **only ten** of them. The nine missing columns:

| Column                              | Migration of record (local)                                 | Status before fix |
|-------------------------------------|-------------------------------------------------------------|-------------------|
| `in_app_toast_enabled`              | `20260420160000_notification_signal_preferences.sql`        | Missing in prod   |
| `notification_sound_enabled`        | `20260420160000_notification_signal_preferences.sql`        | Missing in prod   |
| `notification_vibration_enabled`    | `20260420160000_notification_signal_preferences.sql`        | Missing in prod   |
| `high_priority_only`                | `20260420160000_notification_signal_preferences.sql`        | Missing in prod   |
| `quiet_hours_enabled`               | `20260420160000_notification_signal_preferences.sql`        | Missing in prod   |
| `quiet_hours_start`                 | `20260420160000_notification_signal_preferences.sql`        | Missing in prod   |
| `quiet_hours_end`                   | `20260420160000_notification_signal_preferences.sql`        | Missing in prod   |
| `notification_referrals`            | `20260403183000_account_integration_hardening.sql`          | Missing in prod   |
| `withdrawal_pin_hash`               | `20260406140000_wallet_withdrawals.sql`                     | Missing in prod   |

Migration history table (`supabase_migrations.schema_migrations`) shows only the foundation-extensions migration (`20260508105640_notification_signal_foundation_extensions`) was applied; the three predecessors that own the column shape lost in a historical reset.

### Code call sites that hit the missing columns

- `apps/account/app/api/notifications/preferences/route.ts` — explicit GET column list (the 500 source)
- `apps/account/app/api/notifications/preferences/route.ts` — explicit PATCH readback column list (latent 500 source)
- `apps/account/lib/account-profile.ts` — `defaultPreferences()` mentions every column, INSERT fails silently inside Next.js `after()`
- `apps/account/app/api/wallet/withdrawal/{pin,request}/route.ts` — selects `withdrawal_pin_hash`
- `packages/dashboard-shell/src/shell/realtime-types.ts` — DEFAULT_REALTIME_PREFERENCES safe (defaults already applied client-side)
- `packages/dashboard-shell/src/components/notifications/quiet-hours-panel.tsx` — reads `quiet_hours_enabled` / `quiet_hours_start` / `quiet_hours_end` (covered by default fallback)
- `packages/dashboard-shell/src/components/notifications/preferences-panel.tsx` — reads `in_app_toast_enabled`, `high_priority_only`, `notification_sound_enabled`, `notification_vibration_enabled`

### Why every gate missed it

- **Typecheck** — `select("*")` and explicit list both typecheck identically because supabase-js types `data` as a structural shape from the migration set; the type system has no awareness of which migrations actually landed in any given environment.
- **i18n strict gate (V3-07)** — only inspects hardcoded copy in JSX, has no view of SQL.
- **Lint** — same.
- **Tests** — `pnpm test` runs against ephemeral / local Supabase; the local migration set IS complete, so all schema queries pass. Prod-only schema drift is invisible to the test suite.
- **Build** — purely static analysis, doesn't introspect the live DB.
- **Runtime probe** — there is no synthetic production probe for `/api/notifications/preferences`; the 500s only show up post-deploy in the runtime logs.

The architectural gap is the **lack of a deploy-time schema parity check**. A future hardening pass (out of scope for DIAG-ACCOUNT-01) should diff `code-referenced columns` ∩ `live-prod columns` and fail the deploy if a column the code reads is missing.

---

## Architecture of the fix

### Layer 1 — Convergence migration

`apps/hub/supabase/migrations/20260523103000_diag_account_01_customer_preferences_missing_columns.sql` adds the nine missing columns with the exact shape / default declared in the source-of-truth migrations. All `ADD COLUMN IF NOT EXISTS` so re-runs are no-ops. Applied to production via Supabase MCP at 2026-05-23T10:50Z; file mirrors that state so a future `pnpm run db:apply` lands a no-op.

### Layer 2 — Route-handler defense

`apps/account/app/api/notifications/preferences/route.ts` shifts from `select("19 explicit columns")` to `select("*")` + merge-over-defaults. Postgres error codes `42703 undefined_column` and `42P01 undefined_table` now serve the canonical defaults instead of returning 500, so a future drift can be observed in logs without taking the dashboard down.

The PATCH handler treats schema drift on upsert as a `validation_failed` 400 (so the optimistic-update client rolls back cleanly) rather than a 500 (which would surface as a generic "Save failed" toast even when the legal subset of fields would have persisted).

### Layer 3 — Profile-seed defense

`apps/account/lib/account-profile.ts` `ensureAccountProfileRecords` first attempts the full-shape insert (so a healthy schema accepts every default). On `42703` it falls back to a minimal `{ user_id }` insert — the table / trigger defaults fill the rest. First-login users now always get a row regardless of which migration tier the prod DB is on; a drifted row missing 2-3 booleans is strictly better than no row at all.

### Layer 4 — Error-boundary defense (inner)

`apps/account/app/(account)/error.tsx` rebuilt to use:

- `useOptionalHenryCoLocale()` (the non-throwing variant) with explicit `DEFAULT_LOCALE` fallback. Previously called `useHenryCoLocale()` which itself throws when called above the `LocaleProvider` — guaranteeing a rethrow whenever the inner boundary fires before the provider tree hydrates.
- `HenryCoErrorFallback` from `@henryco/ui/public-shell` — the same primitive `apps/account/app/error.tsx` (root V3-10) uses, so the inner and root boundaries share one branded UI surface; a double-throw is invisible to the user instead of paint-flashing.
- `onErrorReport` mirrors the V3-10 pattern: structured `logger.error` + `Sentry.captureException` + best-effort `fetch /api/runtime-error`, every reporter call wrapped in `try/catch` so a logger / Sentry / network outage cannot recurse the boundary.

### Layer 5 — Layout defense

`apps/account/app/(account)/layout.tsx` `ShellChromeRoot` shifts from `Promise.all` to `Promise.allSettled` for the three layout-level fetchers. Only `buildUnifiedViewer` is mandatory (no viewer = no shell, V3-10 fires by design). The two optional fetchers (`loadDashboardOptions`, `getPreferences`) degrade silently — a transient Supabase auth-RLS flake mid-deploy no longer collapses every authenticated route into the V3-10 fallback.

### Layer 6 — Global-error last-resort

`apps/account/app/global-error.tsx` (and `apps/hub/app/global-error.tsx`) handles the case where the root `app/error.tsx` itself throws — the classic double-throw trap. Renders its own `<html>` + `<body>`, imports zero context-dependent hooks, inline-styled (no CSS imports), self-contained `fetch /api/runtime-error` reporter. The visual matches the calm V3-10 fallback shape so a user who triple-throws still sees a branded panel with their digest, not the default Next.js "Application error" white page.

### Layer 7 — iOS scroll-lock defense (SupportAssist)

`packages/ui/src/support/SupportAssist.tsx` body-scroll-lock rewritten to mirror the canonical `BottomSheet` primitive: lock `html` AND pin `body` via the negative-top trick. All `style` writes wrapped in try/catch so cross-origin / sandboxed iframe contexts cannot throw inside the effect. This closes the same class of iOS Safari sticky-positioning bug fixed in FIX-CHROME-01 for the marketplace public header.

---

## Cross-device verify checklist (owner runs after merge)

- [ ] iPhone Safari — sign in → dashboard renders → root home + /care + /wallet + /messages all open
- [ ] iPhone Safari — open notification preferences (settings/notifications) → toggle a switch → no V3-10 surface
- [ ] iPhone Safari — open SupportAssist drawer mid-scroll → drawer renders in viewport, header stays sticky, close restores scroll position
- [ ] Android Chrome — sign in → dashboard renders → all module landings open
- [ ] Android Chrome — preferences toggle → no V3-10 surface
- [ ] Desktop Chrome — sign in → dashboard renders → preferences toggle → no V3-10 surface
- [ ] Desktop Safari — sign in → dashboard renders → preferences toggle → no V3-10 surface
- [ ] Runtime logs (`account.henrycogroup.com`, last 30 min) — zero `[henryco/account-api] notif...` 500 entries

---

## Out-of-scope (tracked separately)

- `customer_wallet_funding_requests`, `customer_payout_methods`, `customer_referral_profiles`, `customer_referrals`, `customer_referral_rewards`, `customer_trust_profiles`, `customer_wallet_withdrawal_requests`, `jobs_interview_sessions`, `jobs_interview_participants`, `jobs_interview_events` — entire tables missing from prod because `20260403183000_account_integration_hardening.sql` and `20260406140000_wallet_withdrawals.sql` never landed. Routes that touch these (account referrals, wallet, jobs interview rooms) currently degrade to "no data". A dedicated ops pass should backfill these tables under owner supervision since the migrations include data migrations + RLS that need a manual review against the live state.
- Deploy-time schema parity check — should diff code-referenced columns vs. live-prod columns and fail-deploy on a missing column. Tracked separately.

---

## Files touched

| File                                                                                          | Change                                                                  |
|-----------------------------------------------------------------------------------------------|-------------------------------------------------------------------------|
| `apps/hub/supabase/migrations/20260523103000_diag_account_01_customer_preferences_missing_columns.sql` | NEW — convergence migration                                       |
| `apps/account/app/api/notifications/preferences/route.ts`                                     | `select("*")` + merge-defaults + 42703/42P01 schema-drift fallback      |
| `apps/account/lib/account-profile.ts`                                                         | Profile-seed insert fallback on 42703                                   |
| `apps/account/app/(account)/error.tsx`                                                        | Rebuilt on `useOptionalHenryCoLocale` + shared `HenryCoErrorFallback`   |
| `apps/account/app/(account)/layout.tsx`                                                       | `Promise.all` → `Promise.allSettled` for layout fetchers                |
| `apps/account/app/global-error.tsx`                                                           | NEW — last-resort double-throw fallback                                 |
| `apps/hub/app/global-error.tsx`                                                               | NEW — symmetric last-resort double-throw fallback                       |
| `apps/hub/app/error.tsx`                                                                      | Adds runtime-error phone-home (symmetric with account)                  |
| `apps/hub/app/api/runtime-error/route.ts`                                                     | NEW — runtime-error logging endpoint (mirror of account)                |
| `packages/ui/src/support/SupportAssist.tsx`                                                   | iOS scroll-lock rewrite (BottomSheet pattern) + try/catch around writes |
