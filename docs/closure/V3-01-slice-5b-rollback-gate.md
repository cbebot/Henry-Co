# V3-01 Slice 5b — A4 Rollback Gate Runbook

**Status:** active soak (24h post-migration apply)
**Squash commit:** `1caf3897` — *V3-01 — Foundation: Session Persistence (#129)*
**Owner action surface:** `apps/hub/components/owner/SessionHealthTile.tsx`
**Migration:** `apps/hub/supabase/migrations/20260522103000_v3_01_henry_events.sql`

This runbook is the procedure for the 24-hour soak that follows the
slice 5b migration apply. It exists because Addendum A4 (rollback
gate) was the explicit owner-managed checkpoint for shipping V3-01 to
production. The gate fires on a single rolling-window metric.

---

## 1. What the gate measures

The metric is the **rolling 7-day refresh-failure rate**:

```
failure_rate = refresh_failed / (refreshed + refresh_failed)
```

over the last 7 calendar days of `public.henry_events` rows.

The gate **breaches** when `failure_rate > 0.01` (i.e., 1%). Equivalently:
the owner tile's *Refresh success (7d)* metric drops **below 99%**.

Why this metric specifically:
- Both events are written **server-side** from
  `verify-supabase-session` (proxy middleware) — no client/script
  reachability concerns.
- `refresh_failed` is the only signal that a real user was *forcibly*
  bounced to `/auth/reauth`. If this rate is high, the session-
  persistence promise is broken at scale and we should not be live.
- The denominator (`refreshed + refresh_failed`) excludes anonymous
  pageviews, so the ratio is per-actor-meaningful.

---

## 2. Querying the gate

Run from the Supabase SQL editor (project `rzkbgwuznmdxnnhmjazy`) or via
any service-role client.

### 2.1 Headline query — the gate itself

```sql
with recent as (
  select name, count(*) as n
  from public.henry_events
  where created_at >= now() - interval '7 days'
    and name in (
      'henry.auth.session.refreshed',
      'henry.auth.session.refresh_failed'
    )
  group by name
)
select
  coalesce(sum(n) filter (where name = 'henry.auth.session.refreshed'),       0) as refreshed_7d,
  coalesce(sum(n) filter (where name = 'henry.auth.session.refresh_failed'), 0) as refresh_failed_7d,
  case
    when coalesce(sum(n), 0) = 0 then null
    else round(
      sum(n) filter (where name = 'henry.auth.session.refresh_failed')::numeric
      / nullif(sum(n), 0) * 100,
      3
    )
  end as failure_rate_pct,
  case
    when coalesce(sum(n), 0) = 0 then 'empty-state'
    when sum(n) filter (where name = 'henry.auth.session.refresh_failed')::numeric
         / nullif(sum(n), 0) > 0.01
      then 'BREACH (>1%)'
    else 'within-gate'
  end as gate_status
from recent;
```

Run this every 1–2 hours during the 24h soak. Owner tile shows the
same numbers in real time via `getSessionHealthMetrics()` at
`apps/hub/lib/owner-session-health.ts`.

### 2.2 Hourly bucket — see *when* failures cluster

```sql
select
  date_trunc('hour', created_at) as bucket,
  count(*) filter (where name = 'henry.auth.session.refresh_failed') as failed,
  count(*) filter (where name = 'henry.auth.session.refreshed')      as ok
from public.henry_events
where created_at >= now() - interval '7 days'
  and name in (
    'henry.auth.session.refreshed',
    'henry.auth.session.refresh_failed'
  )
group by bucket
order by bucket desc;
```

### 2.3 Reasons for failure — clusters that warrant root cause

```sql
select
  payload ->> 'reason' as reason,
  count(*)             as n
from public.henry_events
where name = 'henry.auth.session.refresh_failed'
  and created_at >= now() - interval '7 days'
group by 1
order by n desc;
```

Expected reasons (from `verify-supabase-session.ts`):
- `supabase_auth_error` — Supabase rejected the token (recoverable)
- `supabase_auth_exception` — `getUser()` threw (recoverable)
- `user_absent_after_verify` — cookies present but no user resolved

A heavy skew toward `user_absent_after_verify` typically means cookie
domain / chunking drift — investigate `@henryco/config/supabase-cookies`
before flipping the gate.

---

## 3. Empty-state interpretation

If the headline query returns `gate_status = 'empty-state'`, **the gate
is undefined** — no events have flowed yet. Confirm before declaring
"within-gate":

- The migration applied successfully (see §5).
- At least one user has hit a session-bearing route through the proxy
  middleware (any web app — account/marketplace/jobs/etc.) since the
  migration applied.
- `persistEvent` is not silently failing — check Sentry / Vercel logs
  for `persistEvent rejected` debug lines.

The soak clock starts when the first **real** row lands, not when the
migration applies.

---

## 4. Breach response

If `gate_status = 'BREACH (>1%)'` and the breach persists across two
consecutive hourly buckets (not a single transient spike):

### 4.1 Code revert

```bash
# from main
git revert 1caf3897
git push origin main
```

`1caf3897` is a single squash merge — `git revert` produces one clean
revert commit. Vercel will redeploy on push. No follow-up reverts are
needed (this was verified by inspecting the squash commit's file set:
all V3-01 slices A1–A10 are inside it).

### 4.2 Database — `henry_events` retention

The migration adds:
- `public.henry_events` table
- two indexes
- two RLS policies
- two GRANTs

You do **not** need to drop the table on revert. The code revert
removes the producers (proxy middleware persistEvent sites, ReauthClient
persistEvent site); existing rows become read-only telemetry that the
next slice 5b retry will append to. Dropping the table loses history.

If you *do* want a clean slate (e.g., before a slice 5b re-ship), run
this **only when no producers are deployed**:

```sql
-- destructive — confirm no app is writing first
drop table if exists public.henry_events cascade;
```

### 4.3 Communication

Update the owner-workspace tile reads to surface "rollback in progress"
copy via the existing `OwnerNotice` warning tone. The tile already
handles the gate-breach case (`isAboveRollbackGate`); no UI change is
needed during the revert — it lights up automatically.

---

## 5. Migration apply — owner action

The migration has **not** been applied to the production Supabase
project as of this writing. Apply it via your normal flow:

```bash
# from the repo root
pnpm supabase db push --project-ref rzkbgwuznmdxnnhmjazy
```

…or via the Supabase Studio SQL editor by pasting the contents of
`apps/hub/supabase/migrations/20260522103000_v3_01_henry_events.sql`
directly. The migration is **idempotent**:
- `create table if not exists`
- `create index if not exists`
- `do $$ … pg_policies … $$` blocks gate the policy creates

So a re-apply is safe if the first attempt fails partway. (Note: the
original migration used `create policy if not exists`, which Postgres
does NOT support — the `do $$` wrap is the standard workaround and
matches PG 17's actual syntax surface.)

### 5.1 Apply verification

```sql
-- table exists with the expected shape
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'henry_events'
order by ordinal_position;

-- indexes
select indexname from pg_indexes
where schemaname = 'public' and tablename = 'henry_events';

-- RLS policies
select policyname, cmd, roles
from pg_policies
where schemaname = 'public' and tablename = 'henry_events';
```

Expected:
- 5 columns: `id, name, actor_id, payload, created_at`
- 2 indexes: `henry_events_name_created_at_idx`, `henry_events_actor_id_idx`
- 2 policies: `henry_events_insert_own` (authenticated, insert),
  `henry_events_select_service_role` (service_role, select)

---

## 6. Known gaps (do not block the gate)

- **`draft_restored`** is not yet `persistEvent`-bridged from the
  client. The owner tile's *Drafts restored today* metric stays at 0
  until a follow-up slice wires `useFormDraft` to a browser supabase
  client. This does **not** affect the A4 gate (which only depends on
  `refreshed` / `refresh_failed`).
- **`multitab_broadcast`** is intentionally emitEvent-only. The tile
  does not surface it; it lives in Sentry breadcrumbs.

---

## 7. CI gate

The 3 Playwright session-persistence specs (T1/T2/T3) are gated by
`.github/workflows/v3-01-session-persistence-e2e.yml`. T1 and T2 will
fail-loudly if `henry_events` is missing or persistEvent stops writing
— either signal is a pre-prod canary for the same A4 condition. T3
remains `test.fixme()`d until the `AccountDropdown` data-testids land.

---

*Last updated:* slice 5b finalize PR — `feat/v3-01-slice-5b-finalize`
