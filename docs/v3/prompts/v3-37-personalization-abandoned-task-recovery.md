# V3-37 — Personalization & Predictive: Abandoned-Task Recovery

**Pass ID:** V3-37  ·  **Phase:** E (Personalization & Predictive)  ·  **Pillar:** P3 (Personalization Engine), P5 (Automation & Workflow)
**Dependencies:** V3-34 (Per-User Home)  ·  **Effort:** M  ·  **Parallel-safe:** Y
**Owner gate:** none  ·  **Risk class:** —

---

## Role

You are the V3 recovery engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass extends recovery **beyond the cart** to every half-finished journey on the platform — incomplete bookings, half-filled forms, paused KYC, abandoned studio proposals — detecting them, persisting them, and gently bringing the user back with a cadence of in-app, email, and push nudges plus a one-click "continue" surface. The line you must not cross: recovery is **consent-respecting** (opt-out is honored on every channel, quiet hours enforced) and **never re-charges or re-submits anything** — it restores the user to the exact next step; the actual money/identity action still runs through the behavior-locked payment and KYC surfaces with their own idempotency.

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/37-personalization-abandoned-task-recovery` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary

The pieces to extend already exist; the unified detector + recovery engine does not.

- **Draft preservation** shipped in V3-01 and lives in `@henryco/lifecycle/drafts` — `use-form-draft.ts`, `draft-storage.ts`, `draft-panel.tsx`. Half-filled forms are already tracked client-side; this pass promotes that signal to a server-side recoverable task.
- `@henryco/lifecycle` owns the stage model (`customer_lifecycle_snapshots`, selectors, `LIFECYCLE_EVENT_NAMES` → `henry.lifecycle.*`). Abandonment is a lifecycle signal; the `LifecycleContinuePanel` component (`apps/account/components/lifecycle/LifecycleContinuePanel.tsx`) is the existing "continue where you left off" precedent to absorb/extend.
- `@henryco/cart-saved-items` is the V2 cart-recovery package (shell on `main`); the cart-abandonment pattern (V2-CART-01) is the precedent this pass generalizes. The account already has a `saved-items` route.
- V3-34 established the per-user home; the recovery surface is a home module + a dedicated `/continue` page.
- The send rails are downstream: **V3-43** unifies cron + outbox + retry + idempotency, and **V3-48** authors follow-up campaign copy. This pass DEFINES the recovery cadence and emits the dispatch intents; it must hand the actual multi-channel send to those passes via a clean interface (and run a minimal self-contained in-app + email nudge until V3-43/V3-48 land, behind a feature flag).

**The gap this pass closes:** today only cart abandonment is recoverable; incomplete bookings, paused KYC, half-filled forms, and abandoned proposals silently die. V3-37 ships the `abandoned_tasks` model, four detectors, a recovery cadence, and a one-click `/continue` surface.

## Mandatory scope

### S1 — `abandoned_tasks` schema + RLS

New migration `supabase/migrations/<ts>_v3_37_abandoned_tasks.sql`:

```sql
CREATE TABLE public.abandoned_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  task_type TEXT NOT NULL
    CHECK (task_type IN ('form_draft','booking','kyc','proposal','cart')),
  task_ref TEXT NOT NULL,            -- stable ref to the underlying record/draft
  division TEXT,                     -- division slug for routing + telemetry
  continue_url TEXT NOT NULL,        -- deep link built via @henryco/config helpers
  state JSONB NOT NULL DEFAULT '{}'::jsonb,   -- restorable snapshot (no secrets, no PANs)
  last_progress_at TIMESTAMPTZ NOT NULL,
  reminder_count INT NOT NULL DEFAULT 0,
  last_reminder_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','recovered','expired','dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, task_type, task_ref)
);
CREATE INDEX abandoned_tasks_pending_idx
  ON public.abandoned_tasks (status, last_progress_at)
  WHERE status = 'pending';

ALTER TABLE public.abandoned_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY abandoned_tasks_select_own ON public.abandoned_tasks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY abandoned_tasks_update_own ON public.abandoned_tasks
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- Inserts + reminder bumps via service-role (detectors/cron); users dismiss/recover their own.
```

`state` stores a **restorable, secret-free** snapshot — never card numbers, never KYC document bytes, never raw tokens. `UNIQUE (user_id, task_type, task_ref)` makes detection idempotent. Regenerate types with `pnpm supabase:types`.

### S2 — Detectors

A `packages/lifecycle/src/recovery/detectors.ts` (or `@henryco/intelligence` if better placed) with one detector per type, each idempotently upserting an `abandoned_task`:
- **Form draft:** promote a stale `@henryco/lifecycle/drafts` draft (no progress > a config threshold) to a recoverable task.
- **Booking:** a booking record left in an incomplete/unconfirmed state (cart pattern extended to bookings).
- **KYC:** a KYC submission in `in_progress` for > 24h (forward-compatible with the V3-24 KYC tables; until those ship, detect against the current verification draft state).
- **Proposal:** a studio proposal viewed but not signed past a threshold.
Detectors run idempotently (re-running never duplicates rows; progress resets `reminder_count` and clears `expired`). Each detector is unit-tested with fixtures.

### S3 — Recovery cadence

A scheduled job (the `@henryco/observability` cron pattern today; migrating to the **V3-43 workflow engine** when it lands) that walks `pending` tasks and emits dispatch intents on this default cadence:
- **Day 1:** in-app reminder (home module + notification).
- **Day 3:** email reminder with a deep link to continue.
- **Day 7:** final reminder + bonus offer where applicable (a V3-35 deal, if eligible).
- **Day 14:** mark `expired`.
Quiet hours + per-channel opt-out are enforced before any send. The cadence emits **dispatch intents** through an interface that V3-45 (auto-remind) / V3-48 (campaigns) implement for real multi-channel send; a minimal self-contained in-app + transactional-email path ships behind a flag so recovery works the day this pass merges. `reminder_count` + `last_reminder_at` bump on each send; recovery (user returns and completes) flips `status='recovered'`.

### S4 — `/continue` recovery surface

- New `apps/account/app/(account)/continue/page.tsx` listing all `pending` tasks grouped by type, each with a one-click **Continue** that deep-links via `continue_url` to the exact next step and rehydrates `state`.
- Absorb/extend the existing `LifecycleContinuePanel` into a home module (registered via `@henryco/dashboard-shell` `getHomeWidgets`) that surfaces the top 1–3 pending tasks on the V3-34 home.
- A **Dismiss** affordance per task (`status='dismissed'`, no further nudges).

### S5 — Telemetry + owner observability

Emit via `@henryco/intelligence`:
- `henry.task.abandoned`
- `henry.task.recovery_sent`
- `henry.task.recovered`
- `henry.task.expired`

Owner tiles: abandoned tasks by type/division, recovery rate by type and by reminder step, recovered revenue/actions attributable to recovery, opt-out impact.

## Out of scope

- The unified **workflow engine** (cron + outbox + retry) — V3-43 (this pass consumes/anticipates it).
- **Auto-remind** multi-channel orchestration at depth — V3-45.
- **Campaign copy** authoring + A/B follow-ups — V3-48.
- **Funnel analytics** at depth (data lake) — V3-90.
- The **KYC** tables/flow themselves — V3-24 (this pass detects against whatever verification state exists).

## Dependencies

Depends on V3-34 (home module slot). **Blocks V3-45** (auto-remind orchestrates the dispatch intents this pass emits) and **V3-48** (follow-up campaigns author the recovery copy). Detectors are forward-compatible with V3-24 KYC tables.

## Inheritance

- `@henryco/lifecycle` — `drafts` (`use-form-draft`, `draft-storage`), stage selectors, `LIFECYCLE_EVENT_NAMES`, `LifecycleContinuePanel`.
- `@henryco/cart-saved-items` — V2 cart-recovery pattern (the precedent generalized here).
- `@henryco/intelligence` (telemetry envelope), `@henryco/observability` (cron + audit log), `@henryco/email` (transactional send), `@henryco/notifications` (in-app).
- `@henryco/dashboard-shell` (home-widget), `@henryco/config`, `@henryco/i18n`, `@henryco/ui`.
- Forward: V3-43 workflow engine, V3-45 auto-remind, V3-48 campaigns, V3-24 KYC.

## Implementation requirements

### Files
- `supabase/migrations/<ts>_v3_37_abandoned_tasks.sql` (new)
- `packages/lifecycle/src/recovery/{detectors,cadence,index}.ts` (new) + `__tests__/`
- `packages/data/src/abandoned-tasks.ts` (typed reads/writes) + export from index
- `apps/account/app/(account)/continue/page.tsx` (new) + recovery home module + `Dismiss`/`Continue` actions
- Recovery cadence cron handler (new) + Hub owner observability tiles (new)

### Trust / safety / compliance
RLS owner-only on `abandoned_tasks`. `state` JSONB is **secret-free** — never store card data, KYC document bytes, or raw tokens (enforce in the detector writers; add a test asserting forbidden keys are stripped). Per-channel opt-out + quiet hours enforced before send (read existing notification preferences). Recovery **never re-charges or re-submits** — `Continue` only restores the user to the step; the money/identity action runs through the behavior-locked payment/KYC surfaces with their own idempotency. Audit log (`@henryco/observability/audit-log`) on recovery-sent and status transitions.

### Mobile + desktop parity
`/continue` + recovery home module responsive. Push reminders target the Expo super-app (OneSignal, wired in V3-87/V3-88) — emit the push dispatch intent now; native delivery is the mobile pass's concern. Web: in-app + email cover the day-one cadence.

### i18n
Add typed copy module `packages/i18n/src/recovery-copy.ts` (namespace `surface:recovery`): per-task-type titles + descriptions, "Continue", "Dismiss", reminder subject/body templates per step, expired/recovered states, opt-out confirmation. Dynamic task labels fall back through `translateSurfaceLabel`. Reminder emails localized to the user's preferred locale. Zero hardcoded strings.

### Brand & design system
`/continue` + home module use `@henryco/dashboard-shell` + `@henryco/ui` tokens (no ad-hoc hex), per-division accent from `company.ts`. Reminder emails use the branded `@henryco/email` templates; legal entity in any receipt-adjacent copy = "Henry Onyx Limited" from `@henryco/config`. All `continue_url`/deep links via `getAccountUrl()` / `henryWebRoot()` — zero hardcoded domains. Light + dark, mobile + desktop, CLS ≈ 0, `pnpm a11y:contrast` not regressed.

## Validation gates
1. `pnpm typecheck && pnpm lint && pnpm test && pnpm build` green.
2. RLS verification: a user cannot read/update another user's `abandoned_tasks` row.
3. Detection smoke for each task type (form draft, booking, KYC partial, proposal) — detector idempotent (re-run produces no duplicates; progress clears reminders).
4. Cadence test: day-1 in-app → day-3 email → day-7 final → day-14 expired, with quiet hours + opt-out honored (no send when opted out).
5. Continue-flow e2e: clicking Continue restores `state` and lands on the exact next step; completing flips `status='recovered'`.
6. Secret-free test: detector writers strip forbidden keys from `state`.
7. Real-browser check on `/continue` + home module: light + dark, mobile + desktop, CLS ≈ 0, contrast pass.
8. Telemetry: all 4 events validate against `henryEventNameSchema`.

## Deployment gate
All gates green; owner reviews the cadence, the opt-out/quiet-hours behavior, and the `/continue` UX. Ship behind a kill switch (recovery module + cadence independently disableable). 14-day soak monitoring recovery rate, opt-out rate, and any duplicate-send incidents before declaring stable.

## Final report contract
`.codex-temp/v3-37-personalization-abandoned-task-recovery/report.md` with the standard 9 sections: exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion.

## Self-verification
- [ ] `abandoned_tasks` migration applied; RLS owner-only proven; `state` secret-free (test enforces forbidden keys stripped).
- [ ] Four idempotent detectors (form draft, booking, KYC partial, proposal) shipped + unit-tested.
- [ ] Recovery cadence (day 1/3/7/14) emits dispatch intents; quiet hours + opt-out honored; minimal self-contained in-app+email path behind a flag.
- [ ] `/continue` surface + recovery home module; Continue restores exact next step without re-charging/re-submitting; Dismiss stops nudges.
- [ ] 4 telemetry events + owner recovery-rate tiles live.
- [ ] All copy via `surface:recovery`; reminder emails localized + branded; brand/legal via `@henryco/config`; zero hardcoded domains/strings; light+dark, mobile+desktop, CLS ≈ 0.
- [ ] Kill switch wired; clean hand-off interface to V3-43/V3-45/V3-48; report written.
