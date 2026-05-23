# Supabase Realtime — Connection-loop Diagnostic (2026-05-23)

**Pass:** REALTIME-01
**Branch:** `fix/realtime-connection-stability`
**Owner directive (verbatim):** "Fix supabase realtime connection, it always shows connecting, reconnecting, so that it will fix it if that is a bug. … production ready, no shallow or fake data or fake work."

---

## 1. Verdict

The owner-reported "always connecting/reconnecting" UI state has TWO independent root causes layered on top of each other. Either alone would produce the loop; both are live in production today.

| # | Root cause | Evidence | Severity |
|---|------------|----------|----------|
| **A** | `customer_notifications` is missing from the live `supabase_realtime` publication. The client subscribes to it on every authenticated page; the broker rejects every channel with `CHANNEL_ERROR`; the provider's watchdog times out at 10s and retries with exponential backoff. The UI never reaches `subscribed`. | Live SQL: `select tablename from pg_publication_tables where pubname='supabase_realtime'` returns 18 tables, none of them `customer_notifications` (also missing: `rooms_messages`, `rooms_participants`). Source migration `apps/hub/supabase/migrations/20260501130000_notification_realtime_publication.sql` exists on disk but is **not in `supabase.list_migrations`** — never applied to prod. | **Critical** — every authenticated viewer sees the loop. |
| **B** | The Realtime client is never told to rotate its JWT when the Supabase auth session refreshes. The provider creates the browser client once, subscribes, and assumes the auth token attached at subscribe-time stays valid for the life of the session. When the access token expires (~1h cadence with `@supabase/ssr`'s default), Realtime keeps using the stale token; the broker eventually closes the socket; the provider reconnects with the same stale token; loop. | `git grep onAuthStateChange` returns **zero hits in any realtime provider**. `git grep "realtime.setAuth\|setAuth("` returns one hit (`apps/super-app/src/platform/adapters/supabase/auth.supabase.ts`) — unrelated to the dashboard-shell spine. | High — loop kicks in after first token refresh (~60min). |

Cause A alone explains the report ("always shows connecting") for a fresh tab. Cause B alone explains it for a long-lived tab. Together they form the full picture.

The fix:

1. Add `customer_notifications`, `rooms_messages`, `rooms_participants` to the `supabase_realtime` publication via a new migration. **Owner-gated** — proposed dry-run included below; no production apply without approval.
2. Wire `supabase.auth.onAuthStateChange` to `supabase.realtime.setAuth(newToken)` inside `SupabaseRealtimeProvider` so JWT rotation no longer requires a channel teardown.
3. Emit four `henry.realtime.connection.*` telemetry events on every state transition so future regressions show up in `henry_events` instead of owner-reported anecdotes.
4. Document the manual smoke procedure.

---

## 2. State machine — as-built

`SupabaseRealtimeProvider` exposes two `ChannelStatus` values (`customerChannelStatus`, `staffChannelStatus`). Each follows the same finite state machine:

```
            ┌──────────────────────────────┐
            │             idle             │  (initial, until first effect)
            └──────────────┬───────────────┘
                           │ effect mounts + factory present
                           ▼
            ┌──────────────────────────────┐
            │          connecting          │  watchdog (10s) armed
            └─┬──────────┬─────────────────┘
              │          │
              │          │  Supabase broker returns SUBSCRIBED
              │          ▼
              │  ┌──────────────────────────┐
              │  │        subscribed        │  backoff reset to 1s
              │  └──────────────────────────┘
              │
              │  CHANNEL_ERROR | TIMED_OUT | watchdog fires
              ▼
            ┌──────────────────────────────┐
            │            error             │  teardown, schedule retry
            └──────────────┬───────────────┘
                           │  setTimeout(backoff)
                           │  backoff = min(backoff * 2, 30s)
                           ▼
                       (back to connecting)

            ┌──────────────────────────────┐
            │            closed            │  broker CLOSED (transient)
            └──────────────────────────────┘   same retry loop

            ┌──────────────────────────────┐
            │           disabled           │  viewer null OR factory null
            └──────────────────────────────┘   terminal (no retries)
```

Source: `packages/dashboard-shell/src/shell/supabase-realtime-provider.tsx` lines 469–549 (customer channel) and 597–714 (staff channels).

### The looping transition

With root cause A live in production:

```
connecting --(10s watchdog OR immediate CHANNEL_ERROR)--> error
error --(setTimeout(backoff))--> connecting
connecting --(10s watchdog OR immediate CHANNEL_ERROR)--> error
... forever, backoff growing 1s → 2s → 4s → 8s → 16s → 30s (capped)
```

The UI consumer (`NotificationsBell`) renders `customerChannelStatus === "connecting" || customerChannelStatus === "error"` as the "connecting / reconnecting" pill the owner sees.

The watchdog (lines 489–497, 631–634) is correctly authored — without it the broker's silent drop would pin the UI to `connecting` forever instead of cycling. It is doing its job; the trigger upstream (publication membership) is the bug.

---

## 3. Evidence trail

### 3.1 Production publication does not include `customer_notifications`

```sql
-- Query (run via Supabase MCP at 2026-05-23T??:??Z)
select schemaname, tablename
from pg_publication_tables
where pubname = 'supabase_realtime'
order by schemaname, tablename;

-- Result (18 rows; relevant rows highlighted by absence):
--   company_divisions, company_faqs, company_pages, company_people,
--   company_settings,
--   hq_internal_comm_attachments, hq_internal_comm_messages, hq_internal_comm_presence,
--   staff_notification_states,            -- present
--   staff_notifications,                  -- present
--   studio_invoices, studio_message_reactions, studio_message_read_receipts,
--   studio_project_messages, studio_project_updates, studio_typing_indicators,
--   support_messages,                     -- present (added by V3-03)
--   support_threads                       -- present (added by V3-03)
--
-- Notably absent:
--   customer_notifications  ← subscribed unconditionally in supabase-realtime-provider.tsx:511
--   rooms_messages          ← subscribed in packages/rooms/src/realtime/rooms-realtime.tsx:368
--   rooms_participants      ← subscribed in packages/rooms/src/realtime/rooms-realtime.tsx:338
```

### 3.2 Migration history

`mcp__claude_ai_Supabase__list_migrations` returns 60 versions. The notification publication migration (`20260501130000_notification_realtime_publication.sql`) and the staff audience migration (`20260502120000_staff_notifications_audience.sql`) are NOT in the list — they exist on disk but were never applied.

`staff_notifications` is in the publication anyway (presumably added via Supabase dashboard ad-hoc click). `customer_notifications` and the rooms tables are not.

### 3.3 Client subscribes to a table not in the publication

`packages/dashboard-shell/src/shell/supabase-realtime-provider.tsx`:

```ts
// lines 505–525
channel = supabase
  .channel(`customer_notifications:user:${userId}`)
  .on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "customer_notifications",   // ← not in supabase_realtime
      filter,
    },
    () => debouncedRefresh(),
  )
  .on(
    "postgres_changes",
    {
      event: "UPDATE",
      schema: "public",
      table: "customer_notifications",   // ← not in supabase_realtime
      filter,
    },
    handleUpdate,
  )
  .subscribe(...)
```

`packages/rooms/src/realtime/rooms-realtime.tsx` does the same for `rooms_participants` + `rooms_messages`.

### 3.4 No auth-token rotation wired to Realtime

`git grep` across the entire monorepo:

```
$ git grep onAuthStateChange
apps/super-app/src/platform/adapters/supabase/auth.supabase.ts
```

```
$ git grep "TOKEN_REFRESHED\|realtime\.setAuth\|setAuth("
apps/super-app/src/platform/adapters/supabase/auth.supabase.ts
```

Zero hits inside `packages/dashboard-shell`, `packages/rooms`, or any host bridge. The shell never tells the Realtime client when the JWT rotates. Once the access token expires, the persistent socket carries a stale token; Supabase Realtime eventually closes it; the provider reconnects with the SAME stale token (because the cached `supabaseRef.current` is reused); loop B.

### 3.5 Provider mounts are not duplicated (vector #6 cleared)

| App | Bridge | Mount site |
|-----|--------|------------|
| account | `RealtimeBrowserBridge` | `apps/account/app/(account)/layout.tsx:164` (single) |
| hub (owner) | `OwnerRealtimeBridge` | `apps/hub/app/owner/(command)/layout.tsx:50` (single) |
| studio | `StudioRealtimeBridge` | `apps/studio/app/client/layout.tsx:74` (single) |
| jobs | `JobsRealtimeBridge` | `apps/jobs/components/workspace-shell.tsx:153` (single, mounted by shared shell) |

Each app mounts `SupabaseRealtimeProvider` exactly once at its layout root. No nested re-mounts found. Vector #6 is not the bug.

### 3.6 Channel-name collision (vector #3) cleared

Customer channel name: `customer_notifications:user:<userId>` (line 506).
Staff content channel: `staff_notifications:user:<userId>` (line 644).
Staff state channel: `staff_notification_states:user:<userId>` (line 676).
Rooms channel: `rooms:<sessionId>` (rooms-realtime.tsx:332).

All channel names are user- or session-scoped. Multi-tab collisions would only matter if the same user opened two tabs of the same workspace; Supabase Realtime supports multiple subs to the same channel name without rejection. Not the bug.

### 3.7 Heartbeat / WS fallback (vectors #4–#5) cleared

The browser supabase client uses `@supabase/ssr`'s `createBrowserClient` with no realtime config overrides. Default heartbeat is 30s — fine. Default transport is WS with native long-polling fallback — fine. Not the bug.

### 3.8 iOS Page Visibility (vector #7) cleared as cause but kept as future hardening

The provider listens for `visibilitychange` only inside the polling-fallback effect (lines 743–750), not for the realtime channel. Mobile Safari aggressively pauses WebSockets on background; on resume the channel will look broken until the existing watchdog fires (up to 10s). That's a UX rough edge, not the looping bug, and it's already mitigated by the watchdog → retry loop reaching `subscribed` again once the publication is healthy.

---

## 4. Why the loop is so visible

The owner sees "always connecting/reconnecting" because:

- **Initial mount:** root cause A makes the broker reject the channel within ~milliseconds of subscribe. The watchdog times out at 10s; the provider transitions through `error` → `connecting` with backoff. Even backed off to 30s, the UI ping-pongs every ~30–40s.
- **Long-lived tab:** root cause B kicks in around ~60min after the last token refresh. Independent of A, the JWT rotates and the channel is closed; the provider reconnects but with the same stale cached client; the loop continues.

The bell, drawer, toast viewport — all 4 surfaces consume `customerChannelStatus` via `useRealtime()`. Each surface that renders the status pill shows the loop. That's why the report is "always."

---

## 5. Proposed fix

### 5.1 Database — publication membership (owner-gated)

New migration file (idempotent, mirrors the pattern of the two existing-but-never-applied publication migrations):

`apps/hub/supabase/migrations/20260523190000_realtime_publication_backfill.sql`

```sql
-- REALTIME-01: backfill customer_notifications + rooms tables into
-- supabase_realtime publication. The disk-only migrations 20260501130000
-- and 20260515100600 were never applied to production; ship them under
-- one idempotent migration so the prod publication matches what the
-- shell + rooms providers subscribe to.

do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public'
      and tablename = 'customer_notifications'
  ) then
    execute 'alter publication supabase_realtime add table public.customer_notifications';
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public'
      and tablename = 'rooms_messages'
  ) then
    execute 'alter publication supabase_realtime add table public.rooms_messages';
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public'
      and tablename = 'rooms_participants'
  ) then
    execute 'alter publication supabase_realtime add table public.rooms_participants';
  end if;
end
$$;
```

**Owner approval required before `mcp__claude_ai_Supabase__apply_migration`.** The migration is purely additive — adds three table memberships to a publication, no schema change, no data touch — but the spec rule "NO migrations applied to production without owner approval" applies regardless. PR landing instructions document the dry-run command.

### 5.2 Client — token-refresh wiring

Inside `SupabaseRealtimeProvider`:

1. Extend the `SupabaseLike` shape to admit `auth.onAuthStateChange` + `realtime.setAuth`. Both already exist in `@supabase/supabase-js`; the package adds them to its loose type for structural conformance.
2. On mount, after the first `factory()` call, attach a single `onAuthStateChange` handler that:
   - On `TOKEN_REFRESHED`: call `supabase.realtime.setAuth(session.access_token)`. The client docs guarantee this rotates the JWT on all open channels without re-subscribing.
   - On `SIGNED_OUT`: tear down + transition to `disabled`.
3. Emit `henry.realtime.connection.reconnecting` with `reason: "token_refresh"` so the owner-workspace tile can chart the cadence.

The fix is minimal — ~15 LOC inside the provider + a 5-line addition to `SupabaseLike` — and does not alter the state machine. Existing channels stay subscribed; only their auth token rotates.

### 5.3 Observability — 4 canonical events

Add to `packages/observability/src/events.ts`:

```ts
| "henry.realtime.connection.connecting"
| "henry.realtime.connection.live"
| "henry.realtime.connection.reconnecting"
| "henry.realtime.connection.failed"
```

Provider emits on every transition with payload `{ channel: "customer" | "staff" | "rooms", attempt?, reason?, error_class? }`.

### 5.4 Tests

`packages/dashboard-shell/src/__tests__/realtime-state-machine.test.ts` — snapshots the state machine transitions on a stubbed Supabase factory. Covers:

- cold start → `subscribed`
- `CHANNEL_ERROR` → `error` → retry with backoff growth (1s, 2s, 4s)
- watchdog timeout → `error`
- `TOKEN_REFRESHED` → `setAuth` invoked, no teardown, status stays `subscribed`
- `SIGNED_OUT` → `disabled`

---

## 6. Manual smoke procedure

After the migration applies + the client patch deploys:

1. **Cold-load (account):** sign in to `app.henrycogroup.com/account`. Open DevTools → Application → Cookies; note the access-token TTL. Open the bell's status pill. **Expected:** transitions to "live" within 3s and stays there. Run for 10 minutes. Pill stays "live."

2. **Token refresh:** wait ~50min (or shorten `JWT expiry` in Supabase auth settings to 5min for a smoke build). Pill **does not** flicker through "reconnecting"; `henry.realtime.connection.reconnecting` fires with `reason: "token_refresh"` in `henry_events`.

3. **Visibility flap:** background the tab for 30s, foreground. Pill stays "live" (or "reconnecting" → "live" within 2s if iOS Safari paused the WS).

4. **Network throttle:** Chrome DevTools → Network → Offline for 5s. Pill goes "error" → "reconnecting" → "live" after the network restores. Verify `henry.realtime.connection.failed` (with `error_class: "channel_error"`) then `henry.realtime.connection.live` in henry_events.

5. **Real INSERT smoke:** trigger a notification (e.g., POST `/api/notifications/test` or submit a marketplace order). Bell badge increments within ~1s.

6. **Owner workspace:** repeat 1–5 on `hq.henrycogroup.com/owner/*`. Bell consumes the staff audience; both customer + staff statuses should reach "live."

7. **Studio /client:** repeat 1–5 on `studio.henrycogroup.com/client/*` for the third bridge consumer.

8. **Jobs workspace:** repeat 1–5 on `jobs.henrycogroup.com/candidate/*` for the fourth bridge consumer.

---

## 7. Anti-patterns honoured

- **No retry forever.** The provider already caps backoff at 30s; existing degraded path (V3-10 pattern) surfaces `customerChannelStatus === "error"` to the UI so a stuck loop is visible, not hidden.
- **No silent auth swallow.** `onAuthStateChange` errors flow into the same emitter chain; `henry.realtime.connection.failed` carries `error_class: "auth"` for `setAuth` failures.
- **No `packages/search-ui/` touched.**
- **No prod migration without owner approval.** Migration drafted; apply step is gated in the PR description.

---

## 8. Files this pass will touch

| File | Change |
|------|--------|
| `apps/hub/supabase/migrations/20260523190000_realtime_publication_backfill.sql` | NEW — idempotent publication backfill |
| `packages/dashboard-shell/src/shell/supabase-realtime-provider.tsx` | EDIT — extend SupabaseLike with auth/realtime, add onAuthStateChange wiring, emit telemetry |
| `packages/dashboard-shell/src/shell/realtime-types.ts` | EDIT — none (or add a `lastTokenRefreshAt` field if useful) |
| `packages/dashboard-shell/package.json` | EDIT — add `@henryco/observability` devDependency |
| `packages/observability/src/events.ts` | EDIT — 4 new HenryEventName union entries |
| `packages/dashboard-shell/src/__tests__/realtime-state-machine.test.ts` | NEW — unit test |
| `docs/v3/realtime-diagnostic-2026-05-23.md` | NEW — this document |
| `.codex-temp/fix-supabase-realtime-stability/report.md` | NEW — owner-facing summary |

No host-app bridge edits required — the package change is binary-compatible because the new `auth`/`realtime` keys on `SupabaseLike` are structurally optional (added as `?` so existing hosts continue to satisfy the shape).
